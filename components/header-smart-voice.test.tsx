import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Header } from "@/components/Header";
import { createFakeRecorder } from "@/tests/test-utils/fake-speech-recognizer";
import { createHeaderVoiceApiFixture } from "@/tests/test-utils/header-voice-api";
import { voiceCopy } from "@/lib/voice-copy";
import type { Locale } from "@/types/api";

const boundary = vi.hoisted(() => ({ recorder: null as ReturnType<typeof createFakeRecorder> | null, push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: boundary.push }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/voice/browser-speech-recognizer", () => ({
  browserRecognizerFactory: (...args: Parameters<ReturnType<typeof createFakeRecorder>["factory"]>) => boundary.recorder!.factory(...args),
  isSpeechRecognitionSupported: () => true,
}));

let api: ReturnType<typeof createHeaderVoiceApiFixture>;
beforeEach(() => { boundary.recorder = createFakeRecorder(); boundary.push.mockClear(); api = createHeaderVoiceApiFixture(); vi.stubGlobal("fetch", vi.fn(api.fetch)); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function flushDetection() { await act(async () => { await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())); }); }
async function setup(locale: Locale = "en") {
  render(<Header locale={locale} />); await flushDetection();
  const desktop = document.querySelector<HTMLFormElement>(".header-search")!;
  const input = within(desktop).getByRole("textbox") as HTMLInputElement;
  const submit = vi.fn(); desktop.requestSubmit = submit;
  return { desktop, input, submit };
}
async function say(form: HTMLFormElement, transcript: string) {
  fireEvent.click(within(form).getByRole("button", { name: /search by voice/i }));
  await act(async () => { boundary.recorder!.emitStart(); boundary.recorder!.emitResult({ transcript, isFinal: true }); boundary.recorder!.emitEnd(); });
}
function lastFilters() { return Object.fromEntries(new URL(boundary.push.mock.calls.at(-1)![0], "https://fixture.test").searchParams); }

describe("Header Smart Voice — reported structured search defect", () => {
  it.each([
    ["5 days Cairo", { days: "5", destination: "cairo" }],
    ["Cairo 5 days", { days: "5", destination: "cairo" }],
    ["5 day Nile cruise to Aswan", { days: "5", destination: "aswan", main: "nile-cruises" }],
    ["3 day trip to Luxor", { days: "3", destination: "luxor" }],
    ["Nile cruise to Aswan for 5 days", { days: "5", destination: "aswan", main: "nile-cruises" }],
    ["private 3 day trip to Cairo for two people", { days: "3", destination: "cairo" }],
  ])("Voice '%s' navigates with applicable filters and never title", async (transcript, expected) => {
    const ui = await setup(); expect(api.applicationRequests).toHaveLength(0); expect(api.upstreamRequests).toHaveLength(0);
    await say(ui.desktop, transcript);
    await waitFor(() => expect(boundary.push).toHaveBeenCalledOnce());
    expect(lastFilters()).toEqual(expected); expect(ui.submit).not.toHaveBeenCalled(); expect(ui.input.value).toBe("");
    expect(api.applicationRequests).toHaveLength(1); expect(api.upstreamRequests).toHaveLength(3);
    for (const request of api.upstreamRequests) {
      expect(request.options?.cache).toBe("force-cache"); expect(request.options?.next?.revalidate).toBe(300);
      expect(request.options?.body).toBeUndefined(); expect(request.url).not.toContain(transcript);
    }
  });

  it("an explicit no-structured-intent response permits ordinary title fallback", async () => {
    const ui = await setup(); await say(ui.desktop, "Egypt adventure");
    await waitFor(() => expect(ui.submit).toHaveBeenCalledOnce());
    expect(ui.input.value).toBe("Egypt adventure"); expect(boundary.push).not.toHaveBeenCalled();
    expect(Object.fromEntries(new FormData(ui.desktop))).toEqual({ title: "Egypt adventure" });
  });

  it.each([
    ["around one week in Cairo", "7 Days", { destination: "cairo", days: "7" }],
    ["5 days or 7 days Cairo", "7 Days", { destination: "cairo", days: "7" }],
    ["Luxor Aswan cruise", "Aswan", { main: "nile-cruises", destination: "aswan" }],
    ["Nile cruise for 7 nights to Aswan", "8 Days", { destination: "aswan", main: "nile-cruises", days: "8" }],
    ["Nile cruise for 5 nights or 7 nights to Aswan", "8 Days", { destination: "aswan", main: "nile-cruises", days: "8" }],
    ["5 days to Luxr", "Luxor", { days: "5", destination: "luxor" }],
  ])("'%s' waits for an explicit choice before navigation", async (transcript, choice, expected) => {
    const ui = await setup(); await say(ui.desktop, transcript);
    const review = await within(ui.desktop).findByRole("group", { name: voiceCopy("en").headerVoiceReview });
    expect(boundary.push).not.toHaveBeenCalled(); expect(ui.submit).not.toHaveBeenCalled();
    if (transcript.includes("days or")) expect(within(review).getByRole("button", { name: "5 Days", exact: true })).toBeInTheDocument();
    if (transcript.includes("nights or")) {
      expect(within(review).getByRole("button", { name: "6 Days", exact: true })).toBeInTheDocument();
      expect(review.querySelectorAll("fieldset")).toHaveLength(1);
    }
    if (transcript.includes("Luxor Aswan")) expect(within(review).getByRole("button", { name: "Luxor", exact: true })).toBeInTheDocument();
    fireEvent.click(within(review).getByRole("button", { name: choice, exact: true }));
    expect(lastFilters()).toEqual(expected); expect(ui.submit).not.toHaveBeenCalled();
    expect(api.applicationRequests).toHaveLength(1);
  });

  it("two unresolved fields require both choices before auto-navigation", async () => {
    const ui = await setup(); await say(ui.desktop, "around one week to Luxr");
    const review = await screen.findByRole("group", { name: voiceCopy("en").headerVoiceReview });
    fireEvent.click(within(review).getByRole("button", { name: "Luxor", exact: true }));
    expect(boundary.push).not.toHaveBeenCalled();
    fireEvent.click(within(review).getByRole("button", { name: "7 Days", exact: true }));
    expect(lastFilters()).toEqual({ destination: "luxor", days: "7" });
  });

  it("an unresolved destination cannot silently broaden an otherwise applicable duration search", async () => {
    const ui = await setup(); await say(ui.desktop, "5 days to Paris");
    const review = await screen.findByRole("group", { name: voiceCopy("en").headerVoiceReview });
    expect(boundary.push).not.toHaveBeenCalled();
    fireEvent.click(within(review).getByRole("button", { name: voiceCopy("en").ignoreVoiceFilter }));
    expect(lastFilters()).toEqual({ days: "5" });
  });

  it("resolver failure retains editable transcript and never automatically title-submits", async () => {
    api.setUnavailable(); const ui = await setup(); await say(ui.desktop, "5 days Cairo");
    await screen.findByText(voiceCopy("en").resolverUnavailable);
    expect(ui.input.value).toBe("5 days Cairo"); expect(boundary.push).not.toHaveBeenCalled(); expect(ui.submit).not.toHaveBeenCalled();
    let submitted = "";
    ui.desktop.addEventListener("submit", (event) => { event.preventDefault(); submitted = String(new FormData(ui.desktop).get("title")); });
    fireEvent.submit(ui.desktop); expect(submitted).toBe("5 days Cairo");
  });

  it("typed '5 days Cairo' retains the native GET title search without any resolver call", async () => {
    const ui = await setup(); let submitted = "";
    ui.desktop.addEventListener("submit", (event) => { event.preventDefault(); submitted = String(new FormData(ui.desktop).get("title")); });
    fireEvent.input(ui.input, { target: { value: "5 days Cairo" } }); fireEvent.submit(ui.desktop);
    expect(ui.desktop.getAttribute("action")).toBe("/trips"); expect(submitted).toBe("5 days Cairo");
    expect(boundary.push).not.toHaveBeenCalled(); expect(api.applicationRequests).toHaveLength(0); expect(api.upstreamRequests).toHaveLength(0);
  });

  it("mobile confirmation is isolated from desktop and closes the initiating drawer on success", async () => {
    const ui = await setup(); fireEvent.click(screen.getByRole("button", { name: "Open menu" })); await flushDetection();
    const mobile = document.querySelector<HTMLFormElement>(".mobile-drawer-search")!;
    const mobileSubmit = vi.fn(); mobile.requestSubmit = mobileSubmit;
    await say(mobile, "around one week in Cairo");
    const review = await within(mobile).findByRole("group", { name: voiceCopy("en").headerVoiceReview });
    expect(within(ui.desktop).queryByRole("group")).not.toBeInTheDocument(); expect(ui.input.value).toBe("");
    fireEvent.click(within(review).getByRole("button", { name: "7 Days", exact: true }));
    expect(lastFilters()).toEqual({ destination: "cairo", days: "7" });
    expect(document.querySelector(".mobile-drawer-search")).not.toBeInTheDocument();
    expect(ui.submit).not.toHaveBeenCalled(); expect(mobileSubmit).not.toHaveBeenCalled();
  });

  it("French Voice preserves localized routing and the explicit speech language", async () => {
    const ui = await setup("fr");
    fireEvent.click(within(ui.desktop).getByRole("button", { name: voiceCopy("fr").voiceSearch }));
    await act(async () => { boundary.recorder!.emitResult({ transcript: "5 jours Le Caire", isFinal: true }); boundary.recorder!.emitEnd(); });
    await waitFor(() => expect(boundary.push).toHaveBeenCalledOnce());
    expect(new URL(boundary.push.mock.calls[0][0], "https://fixture.test").pathname).toBe("/fr/trips");
    expect(lastFilters()).toEqual({ days: "5", destination: "cairo" });
    expect(boundary.recorder!.lastSession()!.lang).toBe("fr-FR");
  });

  it("manual input during a pending resolution cancels it and stale response cannot navigate", async () => {
    const ui = await setup(); let complete!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { complete = resolve; })));
    await say(ui.desktop, "5 days Cairo");
    fireEvent.input(ui.input, { target: { value: "my typed search" } });
    await act(async () => complete(Response.json({ mode: "structured", applicable: { days: "5", destination: "cairo" }, decisions: [] })));
    expect(boundary.push).not.toHaveBeenCalled(); expect(ui.input.value).toBe("my typed search"); expect(ui.submit).not.toHaveBeenCalled();
  });

  it("dismiss and Escape close confirmation without submitting or closing the mobile drawer", async () => {
    await setup(); fireEvent.click(screen.getByRole("button", { name: "Open menu" })); await flushDetection();
    const mobile = document.querySelector<HTMLFormElement>(".mobile-drawer-search")!;
    await say(mobile, "around one week in Cairo");
    const review = await screen.findByRole("group", { name: voiceCopy("en").headerVoiceReview });
    fireEvent.keyDown(within(review).getByRole("button", { name: "7 Days", exact: true }), { key: "Escape" });
    expect(document.querySelector(".mobile-drawer-search")).toBeInTheDocument(); expect(boundary.push).not.toHaveBeenCalled();
    await say(mobile, "around one week in Cairo");
    fireEvent.click(await screen.findByRole("button", { name: voiceCopy("en").dismissVoiceReview }));
    expect(screen.queryByRole("group", { name: voiceCopy("en").headerVoiceReview })).not.toBeInTheDocument();
    expect(boundary.push).not.toHaveBeenCalled();
  });
});
