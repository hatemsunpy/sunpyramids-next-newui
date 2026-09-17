import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TourCard } from "@/components/TourCard";
import { TourWishlistButton } from "@/components/TourWishlistButton";
import type { Tour } from "@/types/api";

const mocks = vi.hoisted(() => ({
  toggleWishlist: vi.fn(),
}));

vi.mock("@/components/CustomerFlows", () => ({
  toggleWishlist: mocks.toggleWishlist,
}));

afterEach(() => {
  cleanup();
  mocks.toggleWishlist.mockReset();
});

const tour: Tour = { id: 42, title: "Cairo Day Tour", wishlisted_exists: false };

describe("TourWishlistButton", () => {
  it("renders the API-provided unsaved state on the shared tour card", () => {
    render(<TourCard tour={tour} locale="en" />);
    const button = screen.getByRole("button", { name: "Add to wishlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button.tagName).toBe("BUTTON");
  });

  it("renders the API-provided saved state", () => {
    render(
      <TourWishlistButton
        tour={{ ...tour, wishlisted_exists: true }}
        locale="en"
      />,
    );
    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the existing wishlist toggle and updates the active state after success", async () => {
    mocks.toggleWishlist.mockResolvedValueOnce({ status: true });
    render(<TourWishlistButton tour={tour} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Add to wishlist" }));

    expect(mocks.toggleWishlist).toHaveBeenCalledWith(42, "en");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("keeps the state unchanged and exposes existing auth feedback on failure", async () => {
    mocks.toggleWishlist.mockRejectedValueOnce(new Error("Please login to like the tour"));
    render(<TourWishlistButton tour={tour} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Add to wishlist" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Please login to like the tour");
    expect(screen.getByRole("button", { name: "Add to wishlist" })).toHaveAttribute("aria-pressed", "false");
  });
});
