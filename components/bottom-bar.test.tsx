import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BottomBar } from "@/components/BottomBar";
import { createFakeRecorder } from "@/tests/test-utils/fake-speech-recognizer";
import { createHeaderVoiceApiFixture } from "@/tests/test-utils/header-voice-api";
import { voiceCopy } from "@/lib/voice-copy";

const boundary = vi.hoisted(() => ({
  recorder: null as ReturnType<typeof createFakeRecorder> | null,
  push: vi.fn(),
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => boundary.pathname,
  useRouter: () => ({ push: boundary.push }),
}));

vi.mock("@/lib/voice/browser-speech-recognizer", () => ({
  browserRecognizerFactory: (...args: Parameters<ReturnType<typeof createFakeRecorder>["factory"]>) =>
    boundary.recorder!.factory(...args),
  isSpeechRecognitionSupported: () => true,
}));

let api: ReturnType<typeof createHeaderVoiceApiFixture>;

async function flushDetection() {
  await act(async () => {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  });
}

beforeEach(() => {
  boundary.recorder = createFakeRecorder();
  boundary.push.mockClear();
  boundary.pathname = "/";
  HTMLFormElement.prototype.requestSubmit = function () {
    this.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BottomBarClient — mobile dock with centered search popup and voice", () => {
  it("renders 5 items with Search centered between Trips and Make Trip", () => {
    render(<BottomBar locale="en" />);
    const nav = screen.getByRole("navigation", { name: "Mobile shortcuts" });
    const items = within(nav).getAllByRole("link");
    const searchBtn = within(nav).getByRole("button", { name: /search/i });

    expect(items).toHaveLength(4); // Home, Trips, Make Trip, Offers
    expect(searchBtn).toBeInTheDocument();

    // Verify ordering inside the navigation bar:
    const children = Array.from(nav.children);
    // Home, Trips, Search, Make Trip, Offers
    expect(children[0]).toHaveAttribute("href", "/");
    expect(children[1]).toHaveAttribute("href", "/trips");
    expect(children[2]).toBe(searchBtn);
    expect(children[3]).toHaveAttribute("href", "/make-your-trip");
    expect(children[4]).toHaveAttribute("href", "/trips?main=special-offers");
  });

  it("toggles search popup on Search button click and renders input and voice mic", async () => {
    render(<BottomBar locale="en" />);
    const searchBtn = screen.getByRole("button", { name: /search/i });

    // Initially popup is closed
    expect(screen.queryByRole("dialog", { name: /search/i })).not.toBeInTheDocument();

    // Click search
    fireEvent.click(searchBtn);
    await flushDetection();

    const popup = screen.getByRole("dialog", { name: /search/i });
    expect(popup).toBeInTheDocument();
    expect(searchBtn).toHaveClass("is-active");

    // Check search input is present
    const input = within(popup).getByRole("searchbox");
    expect(input).toBeInTheDocument();

    // Check voice search button is inside the popup
    const mic = within(popup).getByRole("button", { name: voiceCopy("en").voiceSearch });
    expect(mic).toBeInTheDocument();

    // Typing in input updates value
    fireEvent.change(input, { target: { value: "Luxor" } });
    expect(input).toHaveValue("Luxor");

    // Form submit navigates to /trips?title=Luxor
    fireEvent.submit(within(popup).getByRole("searchbox").closest("form")!);
    expect(boundary.push).toHaveBeenCalledWith("/trips?title=Luxor");
    expect(screen.queryByRole("dialog", { name: /search/i })).not.toBeInTheDocument();
  });

  it("closes popup on Escape key", () => {
    render(<BottomBar locale="en" />);
    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchBtn);

    expect(screen.getByRole("dialog", { name: /search/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /search/i })).not.toBeInTheDocument();
  });

  it("closes popup on close button click", () => {
    render(<BottomBar locale="en" />);
    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchBtn);

    const popup = screen.getByRole("dialog", { name: /search/i });
    const closeBtn = within(popup).getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog", { name: /search/i })).not.toBeInTheDocument();
  });

  it("allows voice recognition to transcribe and submit search query", async () => {
    render(<BottomBar locale="fr" />);
    const searchBtn = screen.getByRole("button", { name: /rechercher/i });
    fireEvent.click(searchBtn);
    await flushDetection();

    const popup = screen.getByRole("dialog", { name: /rechercher/i });
    const mic = within(popup).getByRole("button", { name: voiceCopy("fr").voiceSearch });

    fireEvent.click(mic);
    await act(async () => {
      boundary.recorder!.emitStart();
      boundary.recorder!.emitResult({ transcript: "Louxor", isFinal: true });
    });
    fireEvent.click(within(popup).getByRole("button", { name: voiceCopy("fr").stopListening }));
    await act(async () => {
      boundary.recorder!.emitEnd();
    });

    await waitFor(() => {
      expect(boundary.push).toHaveBeenCalledWith(expect.stringContaining("Louxor"));
    });
  });
});
