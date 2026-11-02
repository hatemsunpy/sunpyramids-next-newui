import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomeCardStack } from "@/components/HomeCardStack";

const labels = { previousLabel: "Previous photo", nextLabel: "Next photo", cardLabel: "Guest photos" };
const photos = ["https://cdn.sunpyramidstours.com/test/cms-first.webp", "https://cdn.sunpyramidstours.com/test/cms-second.webp"];

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("backend guest photos", () => {
  it("uses the supplied URLs in dashboard order and wraps navigation", () => {
    const { container } = render(<HomeCardStack {...labels} photos={photos} />);
    expect(screen.getByRole("img", { name: "Guest photos 1" })).toHaveAttribute("data-image-source", photos[0]);

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("img", { name: "Guest photos 2" })).toHaveAttribute("data-image-source", photos[1]);
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("img", { name: "Guest photos 1" })).toHaveAttribute("data-image-source", photos[0]);
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByRole("img", { name: "Guest photos 2" })).toHaveAttribute("data-image-source", photos[1]);
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("handles dashboard deletions down to one photo while viewing a later photo", () => {
    const { container, rerender } = render(<HomeCardStack {...labels} photos={photos} />);
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    rerender(<HomeCardStack {...labels} photos={[photos[0]]} />);

    expect(screen.getByRole("img", { name: "Guest photos 1" })).toHaveAttribute("data-image-source", photos[0]);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Guest photos 1 / 1")).toBeInTheDocument();
  });

  it("removes the gallery when the backend supplies no photos, without local fallback records", () => {
    const { rerender } = render(<HomeCardStack {...labels} photos={photos} />);
    rerender(<HomeCardStack {...labels} photos={[]} />);
    expect(screen.queryByRole("region", { name: "Guest photos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
