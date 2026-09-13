import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useRef } from "react";
import { VoiceSearchButton } from "@/components/voice/VoiceSearchButton";
import { createFakeRecorder, type FakeRecorder } from "@/tests/test-utils/fake-speech-recognizer";
import type { Locale } from "@/types/api";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
// Lifecycle tests exercise the internal resolver's explicit title-fallback response.
// Full parser/taxonomy integration is covered in header-smart-voice.test.tsx.
beforeEach(() => vi.stubGlobal("fetch", vi.fn(async () => Response.json({ mode: "title" }))));

// Component tests for Basic Voice Search micro behavior. Every voice event
// comes from the fake recognizer — no microphone, no permissions, no network.

// Flush the requestAnimationFrame used for post-mount capability detection.
async function flushDetection() {
  await act(async () => {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  });
}

function Harness({
  recorder,
  supported,
  locale = "en",
}: {
  recorder: FakeRecorder;
  supported: boolean;
  locale?: Locale;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action="/trips">
      <input ref={inputRef} name="title" defaultValue="" aria-label="Search" />
      <VoiceSearchButton
        locale={locale}
        inputRef={inputRef}
        formRef={formRef}
        factory={recorder.factory}
        isSupported={() => supported}
      />
    </form>
  );
}

function setup(supported = true, locale: Locale = "en") {
  const recorder = createFakeRecorder();
  const ui = render(<Harness recorder={recorder} supported={supported} locale={locale} />);
  const form = ui.container.querySelector("form") as HTMLFormElement;
  const input = ui.container.querySelector("input") as HTMLInputElement;
  const requestSubmit = vi.fn();
  form.requestSubmit = requestSubmit;
  return { ...ui, form, input, requestSubmit, recorder };
}

function mic(container: HTMLElement, name = /search by voice/i) {
  return within(container).getByRole("button", { name });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VoiceSearchButton — render/support", () => {
  it("supported → mic available with localized idle label, not pressed", async () => {
    const { container } = setup(true);
    await flushDetection();
    const button = mic(container);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("type", "button");
  });

  it("unsupported → no mic rendered, typed search markup untouched", async () => {
    const { container } = setup(false);
    await flushDetection();
    expect(within(container).queryByRole("button")).toBeNull();
    expect(container.querySelector('input[name="title"]')).toBeTruthy();
    expect(container.querySelector("form")?.getAttribute("action")).toBe("/trips");
  });
});

describe("VoiceSearchButton — final-result flow", () => {
  it("mic click → start; final result → input updated; form submitted exactly once", async () => {
    const { container, form, input, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.click(mic(container));
    expect(recorder.startAttempts()).toBe(1);

    act(() => recorder.emitStart());
    await act(async () => recorder.emitResult({ transcript: "nile cruise", isFinal: true }));

    expect(input.value).toBe("nile cruise");
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("transcript replaces existing typed input (no append)", async () => {
    const { container, input, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.change(input, { target: { value: "old text" } });
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    await act(async () => recorder.emitResult({ transcript: "new query", isFinal: true }));
    expect(input.value).toBe("new query");
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("interim sequence produces 0 submits; final produces exactly 1 with the final text", async () => {
    const { container, input, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    act(() => recorder.emitResult({ transcript: "Nile", isFinal: false }));
    act(() => recorder.emitResult({ transcript: "Nile cruise", isFinal: false }));
    expect(requestSubmit).not.toHaveBeenCalled();
    expect(input.value).toBe("");

    await act(async () => recorder.emitResult({ transcript: "Nile cruise Egypt", isFinal: true }));
    expect(input.value).toBe("Nile cruise Egypt");
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("repeated renders + onEnd after one final → still exactly one submit", async () => {
    const ui = setup();
    const { container, requestSubmit, recorder } = ui;
    await flushDetection();
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    await act(async () => recorder.emitResult({ transcript: "cairo", isFinal: true }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);

    ui.rerender(
      <Harness recorder={recorder} supported locale="en" />,
    );
    act(() => recorder.emitEnd());
    ui.rerender(
      <Harness recorder={recorder} supported locale="en" />,
    );
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("identical transcript in two separate sessions submits twice (session-based, not text-based)", async () => {
    const { container, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    await act(async () => recorder.emitResult({ transcript: "Egypt tours", isFinal: true }));
    act(() => recorder.emitEnd());
    expect(requestSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    await act(async () => recorder.emitResult({ transcript: "Egypt tours", isFinal: true }));
    expect(requestSubmit).toHaveBeenCalledTimes(2);
  });

  it("recognizer receives the mapped BCP-47 language for the locale", async () => {
    const { container, recorder } = setup(true, "fr");
    await flushDetection();
    fireEvent.click(within(container).getByRole("button"));
    expect(recorder.lastSession()?.lang).toBe("fr-FR");
  });
});

describe("VoiceSearchButton — stop/cancel", () => {
  it("listening mic click → stop called; then final → exactly one submit", async () => {
    const { container, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());

    fireEvent.click(within(container).getByRole("button", { name: /stop listening/i }));
    expect(recorder.stopCalls()).toBe(1);

    await act(async () => recorder.emitResult({ transcript: "aswan", isFinal: true }));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("Escape on the mic cancels: abort called, no submit, quiet idle state", async () => {
    const { container, requestSubmit, recorder } = setup();
    await flushDetection();
    const button = mic(container);
    fireEvent.click(button);
    act(() => recorder.emitStart());

    fireEvent.keyDown(button, { key: "Escape" });
    expect(recorder.abortCalls()).toBe(1);

    act(() => recorder.emitError("aborted"));
    act(() => recorder.emitEnd());
    expect(requestSubmit).not.toHaveBeenCalled();
    // Quiet: back to idle mic label, no error bubble.
    expect(mic(container)).toBeTruthy();
    expect(within(container).queryByRole("status")).toBeNull();
  });

  it("unmount aborts; late final from stale session is ignored (no submit)", async () => {
    const { container, requestSubmit, recorder, unmount } = setup();
    await flushDetection();
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    const stale = recorder.lastSession();
    unmount();
    expect(recorder.abortCalls()).toBe(1);

    expect(() => {
      act(() => recorder.emitResult({ transcript: "late result", isFinal: true }, stale));
      act(() => recorder.emitEnd(stale));
    }).not.toThrow();
    expect(requestSubmit).not.toHaveBeenCalled();
    expect(container.querySelector("form")).toBeNull();
  });
});

describe("VoiceSearchButton — errors never submit, input preserved, retry works", () => {
  const cases: [string, "permission" | "no-speech" | "network" | "language-unavailable" | "unknown", RegExp][] = [
    ["permission", "permission", /microphone permission was denied/i],
    ["no-speech", "no-speech", /no speech detected/i],
    ["network", "network", /recognition failed/i],
    ["language", "language-unavailable", /not available in this browser/i],
    ["unknown", "unknown", /recognition failed/i],
  ];

  it.each(cases)("%s denial/failure → visible message, typed input kept, retry starts a new session", async (_label, code, message) => {
    const { container, input, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.change(input, { target: { value: "typed text" } });
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());
    act(() => recorder.emitError(code));

    expect(requestSubmit).not.toHaveBeenCalled();
    expect(input.value).toBe("typed text");
    expect(screen.getByRole("status").textContent).toMatch(message);

    // Retry via the Try-again button starts a fresh session.
    const attempts = recorder.startAttempts();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(recorder.startAttempts()).toBe(attempts + 1);
  });
});

describe("VoiceSearchButton — cross-instance isolation", () => {
  it("session on form A submits only form A; form B untouched — and vice versa", async () => {
    const recA = createFakeRecorder();
    const recB = createFakeRecorder();
    const { container } = render(
      <>
        <div data-testid="slot-a">
          <Harness recorder={recA} supported />
        </div>
        <div data-testid="slot-b">
          <Harness recorder={recB} supported />
        </div>
      </>,
    );
    await flushDetection();

    const slotA = screen.getByTestId("slot-a");
    const slotB = screen.getByTestId("slot-b");
    const formA = slotA.querySelector("form") as HTMLFormElement;
    const formB = slotB.querySelector("form") as HTMLFormElement;
    const inputA = slotA.querySelector("input") as HTMLInputElement;
    const inputB = slotB.querySelector("input") as HTMLInputElement;
    const submitA = vi.fn();
    const submitB = vi.fn();
    formA.requestSubmit = submitA;
    formB.requestSubmit = submitB;

    fireEvent.click(within(slotA).getByRole("button", { name: /search by voice/i }));
    act(() => recA.emitStart());
    await act(async () => recA.emitResult({ transcript: "giza", isFinal: true }));

    expect(inputA.value).toBe("giza");
    expect(submitA).toHaveBeenCalledTimes(1);
    expect(inputB.value).toBe("");
    expect(submitB).not.toHaveBeenCalled();

    // Reverse direction.
    fireEvent.click(within(slotB).getByRole("button", { name: /search by voice/i }));
    act(() => recB.emitStart());
    await act(async () => recB.emitResult({ transcript: "luxor", isFinal: true }));

    expect(inputB.value).toBe("luxor");
    expect(submitB).toHaveBeenCalledTimes(1);
    expect(submitA).toHaveBeenCalledTimes(1);
  });
});

describe("VoiceSearchButton — manual submit invalidates pending voice session", () => {
  it("manual form submit during recognition cancels voice; late final never submits", async () => {
    const { container, form, input, requestSubmit, recorder } = setup();
    await flushDetection();
    fireEvent.click(mic(container));
    act(() => recorder.emitStart());

    let manualSubmits = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      manualSubmits += 1;
    });
    fireEvent.submit(form);

    expect(manualSubmits).toBe(1);
    expect(recorder.abortCalls()).toBe(1);

    // Late voice result after the manual submission must not submit again.
    await act(async () => recorder.emitResult({ transcript: "late voice", isFinal: true }));
    act(() => recorder.emitEnd());
    expect(manualSubmits).toBe(1);
    expect(requestSubmit).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });
});

describe("VoiceSearchButton — accessibility semantics", () => {
  it("idle: Search-by-voice label, not pressed; listening: Stop-listening label, pressed", async () => {
    const { container, recorder } = setup();
    await flushDetection();
    expect(mic(container)).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(mic(container));
    act(() => recorder.emitStart());

    const listening = within(container).getByRole("button", { name: /stop listening/i });
    expect(listening).toHaveAttribute("aria-pressed", "true");
  });

  it("mic is a non-submit button inside the form", async () => {
    const { container } = setup();
    await flushDetection();
    expect(mic(container).getAttribute("type")).toBe("button");
  });
});
