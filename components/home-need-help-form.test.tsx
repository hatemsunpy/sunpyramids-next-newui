import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { apiPost } from "@/lib/client-api";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/client-api", () => ({ apiPost: vi.fn() }));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

beforeEach(() => {
  vi.mocked(apiPost).mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function submitHelpForm() {
  const ui = render(<HomeNeedHelpForm />);
  fireEvent.change(ui.container.querySelector('input[name="name"]')!, {
    target: { value: "Hatem Sunpyramids" },
  });
  fireEvent.change(ui.container.querySelector('input[name="country"]')!, {
    target: { value: "Egypt" },
  });
  fireEvent.change(ui.container.querySelector('input[name="phone"]')!, {
    target: { value: "01012345678" },
  });
  fireEvent.submit(ui.container.querySelector("form")!);
}

it("opens the personalized thank-you page after a successful help request", async () => {
  submitHelpForm();

  await waitFor(() => expect(apiPost).toHaveBeenCalledWith(
    "contact-requests",
    expect.objectContaining({ name: "Hatem Sunpyramids" }),
    "en",
  ));
  expect(push).toHaveBeenCalledWith("/thankful?name=Hatem%20Sunpyramids");
});

it("stays on the form when the API rejects the request", async () => {
  vi.mocked(apiPost).mockRejectedValue(new Error("Request rejected"));
  submitHelpForm();

  expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  expect(push).not.toHaveBeenCalled();
});
