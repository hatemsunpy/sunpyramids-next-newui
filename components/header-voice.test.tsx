import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Header } from "@/components/Header";

// Header-level integration for Basic Voice Search: the real Header markup
// with BOTH search surfaces (desktop form always mounted, mobile form inside
// the drawer), the REAL browser adapter, and a stubbed window.SpeechRecognition
// constructor — no microphone, no permissions, no network.
//
// This proves: desktop/mobile wiring, cross-instance isolation, drawer-close
// abort safety, manual typed flow preservation, and runtime detection.

type EmitEvent = { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string }; length: number }[] };

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: (() => void) | null = null;
  onresult: ((event: EmitEvent) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  startCalls = 0;
  stopCalls = 0;
  abortCalls = 0;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
  }

  stop() {
    this.stopCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
  }

  emitInterim(text: string) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: text }, length: 1 }] });
  }

  emitStart() {
    this.onstart?.();
  }

  emitFinal(text: string) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: text }, length: 1 }] });
  }

  emitError(code: string) {
    this.onerror?.({ error: code });
  }

  emitEnd() {
    this.onend?.();
  }
}

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => {
    const { createElement } = require("react") as typeof import("react");
    return createElement("a", { ...rest, href }, children);
  },
}));

async function flushDetection() {
  await act(async () => {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  });
}

function forms() {
  const desktop = document.querySelector("form.header-search") as HTMLFormElement;
  const mobile = document.querySelector("form.mobile-drawer-search") as HTMLFormElement | null;
  return { desktop, mobile };
}

function stubSubmit(form: HTMLFormElement) {
  const submit = vi.fn();
  form.requestSubmit = submit;
  return submit;
}

beforeEach(() => {
  FakeRecognition.instances = [];
  Object.defineProperty(window, "SpeechRecognition", {
    value: FakeRecognition,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
});

describe("Header Basic Voice Search — desktop wiring", () => {
  it("desktop mic click → final transcript fills desktop input and submits its form exactly once", async () => {
    render(<Header locale="en" />);
    await flushDetection();

    const { desktop } = forms();
    expect(desktop).toBeTruthy();
    const submit = stubSubmit(desktop);
    const input = within(desktop).getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("name", "title");

    fireEvent.click(within(desktop).getByRole("button", { name: /search by voice/i }));
    expect(FakeRecognition.instances).toHaveLength(1);
    expect(FakeRecognition.instances[0].lang).toBe("en-US");

    act(() => FakeRecognition.instances[0].emitFinal("nile cruise"));
    expect(input.value).toBe("nile cruise");
    expect(submit).toHaveBeenCalledTimes(1);

    act(() => FakeRecognition.instances[0].emitEnd());
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("existing typed flow intact: desktop form action and title field behavior unchanged", async () => {
    render(<Header locale="en" />);
    await flushDetection();

    const { desktop } = forms();
    expect(desktop.getAttribute("action")).toBe("/trips");

    let submitted = "";
    desktop.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = new FormData(desktop).get("title") as string;
    });
    const input = within(desktop).getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "cairo" } });
    fireEvent.submit(desktop);
    expect(submitted).toBe("cairo");
  });
});

describe("Header Basic Voice Search — mobile drawer wiring", () => {
  function openDrawer() {
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const { mobile } = forms();
    if (!mobile) throw new Error("mobile drawer search form did not render");
    return mobile;
  }

  it("mobile mic click → final transcript fills mobile input and submits mobile form exactly once", async () => {
    render(<Header locale="en" />);
    await flushDetection();
    const mobile = openDrawer();
    await flushDetection();

    const submit = stubSubmit(mobile);
    const mobileInput = within(mobile).getByRole("textbox") as HTMLInputElement;
    fireEvent.click(within(mobile).getByRole("button", { name: /search by voice/i }));

    expect(FakeRecognition.instances).toHaveLength(1);
    act(() => FakeRecognition.instances[0].emitFinal("luxor"));
    expect(mobileInput.value).toBe("luxor");
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("mobile session never touches the desktop form/input (and vice versa)", async () => {
    render(<Header locale="en" />);
    await flushDetection();
    const { desktop } = forms();
    const desktopSubmit = stubSubmit(desktop);
    const desktopInput = within(desktop).getByRole("textbox") as HTMLInputElement;

    const mobile = openDrawer();
    await flushDetection();
    const mobileSubmit = stubSubmit(mobile);

    // Mobile session.
    fireEvent.click(within(mobile).getByRole("button", { name: /search by voice/i }));
    act(() => FakeRecognition.instances[0].emitFinal("aswan"));
    expect(mobileSubmit).toHaveBeenCalledTimes(1);
    expect(desktopSubmit).not.toHaveBeenCalled();
    expect(desktopInput.value).toBe("");

    // Desktop session.
    fireEvent.click(within(desktop).getByRole("button", { name: /search by voice/i }));
    act(() => FakeRecognition.instances[1].emitFinal("cairo"));
    expect(desktopSubmit).toHaveBeenCalledTimes(1);
    expect(desktopInput.value).toBe("cairo");
    expect(mobileSubmit).toHaveBeenCalledTimes(1);
  });

  it("closing the drawer mid-session aborts recognition; late final never submits", async () => {
    render(<Header locale="en" />);
    await flushDetection();
    const mobile = openDrawer();
    await flushDetection();
    const submit = stubSubmit(mobile);

    fireEvent.click(within(mobile).getByRole("button", { name: /search by voice/i }));
    act(() => FakeRecognition.instances[0].emitStart());
    expect(FakeRecognition.instances[0].abortCalls).toBe(0);

    // Close the drawer → unmounts mic + form → must abort.
    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    expect(FakeRecognition.instances[0].abortCalls).toBe(1);

    // Late voice callbacks from the stale session are ignored.
    expect(() => {
      act(() => FakeRecognition.instances[0].emitFinal("stale result"));
      act(() => FakeRecognition.instances[0].emitEnd());
    }).not.toThrow();
    expect(submit).not.toHaveBeenCalled();
  });

  it("Escape on a listening mobile mic cancels without closing the drawer", async () => {
    render(<Header locale="en" />);
    await flushDetection();
    const mobile = openDrawer();
    await flushDetection();

    const micButton = within(mobile).getByRole("button", { name: /search by voice/i });
    fireEvent.click(micButton);
    act(() => FakeRecognition.instances[0].emitStart());

    fireEvent.keyDown(micButton, { key: "Escape" });
    expect(FakeRecognition.instances[0].abortCalls).toBe(1);
    // The drawer stays open: mic + form still present.
    expect(document.querySelector("form.mobile-drawer-search")).toBeTruthy();
  });
});

describe("Header Basic Voice Search — unsupported runtime", () => {
  it("without SpeechRecognition: no mic buttons; both search forms fully functional", async () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    render(<Header locale="en" />);
    await flushDetection();

    expect(screen.queryByRole("button", { name: /search by voice|stop listening/i })).toBeNull();

    const { desktop } = forms();
    expect(desktop).toBeTruthy();
    expect(desktop.getAttribute("action")).toBe("/trips");
    expect(within(desktop).getByRole("textbox")).toHaveAttribute("name", "title");

    // Mobile drawer search still works typed.
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    const { mobile } = forms();
    expect(mobile).toBeTruthy();
    expect(within(mobile as HTMLFormElement).queryByRole("button", { name: /voice/i })).toBeNull();
  });
});