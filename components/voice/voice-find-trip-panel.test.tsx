import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import { createFakeRecorder } from "@/tests/test-utils/fake-speech-recognizer";
import { voiceCopy } from "@/lib/voice-copy";
import type { ApiPage, Locale } from "@/types/api";

const boundary = vi.hoisted(() => ({ recorder: null as ReturnType<typeof createFakeRecorder> | null, push: vi.fn(), supported: true }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: boundary.push }) }));
vi.mock("@/lib/voice/browser-speech-recognizer", () => ({
  browserRecognizerFactory: (...args: Parameters<ReturnType<typeof createFakeRecorder>["factory"]>) => boundary.recorder!.factory(...args),
  isSpeechRecognitionSupported: () => boundary.supported,
}));

const destinations: ApiPage[] = [{ id: 101, slug: "cairo", title: "Cairo" }, { id: 102, slug: "luxor", title: "Luxor" }, { id: 103, slug: "aswan", title: "Aswan" }];
const roots: ApiPage[] = [{ slug: "nile-cruises", title: "Live cruise label" }];

beforeEach(() => {
  boundary.recorder = createFakeRecorder(); boundary.push.mockClear(); boundary.supported = true;
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Smart Voice tests must remain offline"); }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function setup(options: { destinations?: ApiPage[]; roots?: ApiPage[]; locale?: Locale } = {}) {
  const locale = options.locale ?? "en";
  const ui = render(<HomeSearchShortcuts modeOnly="find" locale={locale} destinations={options.destinations ?? destinations} rootCategories={options.roots ?? roots} />);
  await act(async () => { await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())); });
  return { ...ui, form: ui.container.querySelector("form")!, place: ui.container.querySelector<HTMLSelectElement>('select[name="place"]')!, duration: ui.container.querySelector<HTMLSelectElement>('select[name="duration"]')!, locale };
}

async function say(transcript: string, locale: Locale = "en") {
  fireEvent.click(screen.getByRole("button", { name: voiceCopy(locale).findTripVoice }));
  await act(async () => {
    boundary.recorder!.emitStart();
    boundary.recorder!.emitResult({ transcript, isFinal: true });
    boundary.recorder!.emitEnd();
  });
  await screen.findByRole("region", { name: voiceCopy(locale).heard });
  await waitFor(() => expect(screen.getByText(voiceCopy(locale).reviewReady)).toBeInTheDocument());
}

function search(form: HTMLFormElement) { fireEvent.click(within(form).getByRole("button", { name: "Search", exact: true })); }
function filters() { return screen.getByRole("region", { name: voiceCopy("en").applied }); }

describe("Smart Voice integrates with the existing Find Trip", () => {
  it.each([
    ["Cairo 5 days", "cairo", "5", ""],
    ["5 day Nile cruise to Aswan", "aswan", "5", "nile-cruises"],
  ])("%s populates only applicable fields and waits for Search", async (transcript, place, duration, main) => {
    const ui = await setup();
    await say(transcript);
    expect(ui.place.value).toBe(place); expect(ui.duration.value).toBe(duration);
    expect(boundary.push).not.toHaveBeenCalled();
    search(ui.form);
    const url = new URL(boundary.push.mock.calls[0][0], "https://fixture.test");
    expect(url.pathname).toBe("/trips");
    expect(Object.fromEntries(url.searchParams)).toEqual({ days: duration, destination: place, ...(main ? { main } : {}) });
  });

  it("full query keeps origin and travelers informational and uses the live category label", async () => {
    const persist = vi.spyOn(Storage.prototype, "setItem");
    const ui = await setup();
    await say("5 day Nile cruise from Luxor to Aswan for two people");
    expect(filters()).toHaveTextContent("Category: Live cruise label");
    const recognized = screen.getByRole("region", { name: voiceCopy("en").recognized });
    expect(recognized).toHaveTextContent("From: Luxor"); expect(recognized).toHaveTextContent("Travelers: 2");
    search(ui.form);
    expect(boundary.push).toHaveBeenCalledWith("/trips?days=5&destination=aswan&main=nile-cruises");
    expect([...new FormData(ui.form).keys()]).toEqual(["place", "duration"]);
    expect(fetch).not.toHaveBeenCalled(); expect(persist).not.toHaveBeenCalled();
    expect(ui.container.querySelector('.voice-find-trip')).toHaveAttribute("data-hj-suppress");
  });

  it("category only preserves both required fields and native validation", async () => {
    const ui = await setup(); await say("Nile cruise");
    expect(ui.place.value).toBe(""); expect(ui.duration.value).toBe("");
    expect(ui.place.required).toBe(true); expect(ui.duration.required).toBe(true);
    search(ui.form); expect(boundary.push).not.toHaveBeenCalled();
    expect(ui.form.checkValidity()).toBe(false);
    expect(filters()).toHaveTextContent(voiceCopy("en").remainingRequired);
    fireEvent.change(ui.place, { target: { value: "aswan" } });
    search(ui.form); expect(boundary.push).not.toHaveBeenCalled();
    fireEvent.change(ui.duration, { target: { value: "5" } });
    search(ui.form); expect(boundary.push).toHaveBeenCalledOnce();
  });

  it("removing category removes main and manual select edits update the review truth", async () => {
    const ui = await setup(); await say("Nile cruise to Aswan for 5 days");
    fireEvent.click(screen.getByRole("button", { name: /Remove category/ }));
    fireEvent.change(ui.place, { target: { value: "cairo" } });
    fireEvent.change(ui.duration, { target: { value: "9" } });
    expect(filters()).toHaveTextContent("Destination: Cairo"); expect(filters()).not.toHaveTextContent("Aswan");
    expect(filters()).toHaveTextContent("Duration: 9 Days");
    search(ui.form); expect(boundary.push).toHaveBeenCalledWith("/trips?days=9&destination=cairo");
  });

  it.each([
    ["around one week", "7 Days", "7"],
    ["5 days or 7 days", "7 Days", "7"],
    ["Nile cruise for 7 nights", "8 Days", "8"],
  ])("%s needs explicit duration confirmation", async (transcript, choice, duration) => {
    const ui = await setup(); await say(transcript);
    expect(ui.duration.value).toBe(""); expect(boundary.push).not.toHaveBeenCalled();
    if (transcript.includes(" or ")) expect(screen.getByRole("button", { name: "5 Days", exact: true })).toBeInTheDocument();
    const button = screen.getByRole("button", { name: choice, exact: true });
    button.focus(); fireEvent.click(button);
    expect(ui.duration.value).toBe(duration); expect(button).toHaveAttribute("aria-pressed", "true");
    expect(document.activeElement).toBe(button);
    fireEvent.change(ui.duration, { target: { value: "2" } });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it.each([["3 nights", ""], ["3 nights 4 days", "4"]])("%s preserves nights as secondary information", async (transcript, duration) => {
    const ui = await setup(); await say(transcript);
    expect(ui.duration.value).toBe(duration);
    expect(screen.getByRole("region", { name: voiceCopy("en").recognized })).toHaveTextContent("3 nights");
    expect(screen.queryByRole("button", { name: "4 Days", exact: true })).not.toBeInTheDocument();
  });

  it.each([["Luxor Aswan cruise", "Aswan", "aswan"], ["to Luxr", "Luxor", "luxor"]])("%s does not prefill destination until a live candidate is chosen", async (transcript, choice, slug) => {
    const ui = await setup(); await say(transcript);
    expect(ui.place.value).toBe("");
    if (transcript.includes("Aswan")) expect(screen.getByRole("button", { name: "Luxor", exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: choice, exact: true }));
    expect(ui.place.value).toBe(slug); expect(boundary.push).not.toHaveBeenCalled();
  });

  it("month, travelers and privacy are visible without adding unsupported query parameters", async () => {
    const ui = await setup(); await say("private trip to Aswan in November for two people");
    const recognized = screen.getByRole("region", { name: voiceCopy("en").recognized });
    expect(recognized).toHaveTextContent("November"); expect(recognized).toHaveTextContent("Travelers: 2"); expect(recognized).toHaveTextContent("Private trip");
    fireEvent.change(ui.duration, { target: { value: "5" } }); search(ui.form);
    expect(boundary.push).toHaveBeenCalledWith("/trips?days=5&destination=aswan");
  });

  it("new sessions merge visible fields but clear stale category and previous information", async () => {
    const ui = await setup(); fireEvent.change(ui.place, { target: { value: "cairo" } });
    await say("5 days"); expect(ui.place.value).toBe("cairo");
    await say("Nile cruise to Aswan for 5 days for two people");
    fireEvent.click(screen.getByRole("button", { name: voiceCopy("en").findTripVoice }));
    expect(screen.queryByRole("region", { name: voiceCopy("en").recognized })).not.toBeInTheDocument();
    expect(ui.place.value).toBe("aswan"); expect(ui.duration.value).toBe("5");
    // Category remains visibly removable while recognition runs; a new final clears it.
    expect(screen.getByRole("button", { name: /Remove category/ })).toBeInTheDocument();
    await act(async () => { boundary.recorder!.emitResult({ transcript: "3 days", isFinal: true }); boundary.recorder!.emitEnd(); });
    await waitFor(() => expect(ui.duration.value).toBe("3"));
    expect(screen.queryByRole("button", { name: /Remove category/ })).not.toBeInTheDocument();
    expect(ui.place.value).toBe("aswan");
    search(ui.form); expect(boundary.push).toHaveBeenCalledWith("/trips?days=3&destination=aswan");
  });

  it.each(["permission", "no-speech", "network", "language-unavailable"] as const)("%s errors preserve selections and permit retry", async (error) => {
    const ui = await setup(); await say("Nile cruise to Aswan for 5 days");
    fireEvent.click(screen.getByRole("button", { name: voiceCopy("en").findTripVoice }));
    act(() => { boundary.recorder!.emitError(error); boundary.recorder!.emitEnd(); });
    expect(ui.place.value).toBe("aswan"); expect(ui.duration.value).toBe("5");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove category/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(boundary.recorder!.sessionCount()).toBe(3); expect(boundary.push).not.toHaveBeenCalled();
  });

  it.each([[[], destinations, "aswan", true], [roots, [], "", false], [[], [], "", false]])("partial taxonomy failure degrades by capability (%j)", async (rootCategories, places, destination, categoryUnavailable) => {
    const ui = await setup({ roots: rootCategories, destinations: places }); await say("5 day Nile cruise to Aswan");
    expect(ui.duration.value).toBe("5"); expect(ui.place.value).toBe(destination);
    expect(Boolean(screen.queryByRole("button", { name: /Remove category/ }))).toBe(rootCategories.length > 0);
    if (categoryUnavailable) expect(screen.getByRole("region", { name: voiceCopy("en").recognized })).toHaveTextContent("Not applied as a filter");
  });

  it("no useful fields shows the transcript without fabricating or submitting", async () => {
    const ui = await setup(); await say("hello sunshine");
    expect(screen.getByText(voiceCopy("en").noMatch)).toBeInTheDocument();
    expect(ui.place.value).toBe(""); expect(ui.duration.value).toBe(""); expect(boundary.push).not.toHaveBeenCalled();
  });

  it("Chinese bare destination uses the site speech locale and localized taxonomy label", async () => {
    const ui = await setup({ locale: "zh", destinations: [{ slug: "cairo", title: "开罗" }] });
    await say("开罗三天游", "zh");
    expect(boundary.recorder!.lastSession()!.lang).toBe("zh-CN");
    expect(ui.place.value).toBe("cairo"); expect(ui.duration.value).toBe("3");
    expect(screen.getByRole("region", { name: voiceCopy("zh").applied })).toHaveTextContent("目的地: 开罗");
  });

  it("interim results do not apply fields; Escape and stale callbacks cannot apply them", async () => {
    const ui = await setup(); const mic = screen.getByRole("button", { name: voiceCopy("en").findTripVoice });
    fireEvent.click(mic); const old = boundary.recorder!.lastSession();
    act(() => { boundary.recorder!.emitStart(); boundary.recorder!.emitResult({ transcript: "Cairo 5 days", isFinal: false }); });
    expect(mic).toHaveAttribute("aria-pressed", "true"); expect(ui.place.value).toBe("");
    fireEvent.keyDown(mic, { key: "Escape" });
    // Fake abort callbacks model the native recognizer ending before retry.
    act(() => { boundary.recorder!.emitError("aborted"); boundary.recorder!.emitEnd(); });
    fireEvent.click(mic);
    act(() => boundary.recorder!.emitResult({ transcript: "Cairo 5 days", isFinal: true }, old));
    expect(ui.place.value).toBe(""); expect(ui.duration.value).toBe("");
  });

  it("unsupported recognition preserves traditional manual Find Trip", async () => {
    boundary.supported = false; const ui = await setup();
    expect(screen.queryByRole("button", { name: voiceCopy("en").findTripVoice })).not.toBeInTheDocument();
    fireEvent.change(ui.place, { target: { value: "aswan" } }); fireEvent.change(ui.duration, { target: { value: "5" } });
    search(ui.form); expect(boundary.push).toHaveBeenCalledWith("/trips?days=5&destination=aswan");
  });

  it("a repeated transcript in a new session reapplies reviewed category", async () => {
    const ui = await setup(); await say("Nile cruise to Aswan for 5 days");
    fireEvent.click(screen.getByRole("button", { name: /Remove category/ }));
    await say("Nile cruise to Aswan for 5 days");
    expect(filters()).toHaveTextContent("Category: Live cruise label");
    expect(ui.place.value).toBe("aswan"); expect(boundary.push).not.toHaveBeenCalled();
  });

  it("leaving Find Trip aborts recognition and prevents late results from filling the form", async () => {
    const ui = render(<HomeSearchShortcuts destinations={destinations} rootCategories={roots} />);
    fireEvent.click(screen.getByRole("tab", { name: "Find Trip", exact: true }));
    await act(async () => { await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())); });
    fireEvent.click(screen.getByRole("button", { name: voiceCopy("en").findTripVoice }));
    const session = boundary.recorder!.lastSession();
    fireEvent.click(screen.getByRole("tab", { name: "Make Your Trip", exact: true }));
    expect(boundary.recorder!.abortCalls()).toBeGreaterThan(0);
    act(() => boundary.recorder!.emitResult({ transcript: "Nile cruise to Aswan for 5 days", isFinal: true }, session));
    fireEvent.click(screen.getByRole("tab", { name: "Find Trip", exact: true }));
    expect(ui.container.querySelector('select[name="place"]')).toHaveValue("");
    expect(ui.container.querySelector('select[name="duration"]')).toHaveValue("");
    expect(screen.queryByRole("button", { name: /Remove category/ })).not.toBeInTheDocument();
    expect(boundary.push).not.toHaveBeenCalled();
  });
});
