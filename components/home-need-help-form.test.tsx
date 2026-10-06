import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { apiGet, apiPost } from "@/lib/client-api";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/client-api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

beforeEach(() => {
  vi.mocked(apiGet).mockResolvedValue({ data: [{ id: 65, name: "Egypt", code: "EG", phone_code: "+20", length: 10 }] });
  vi.mocked(apiPost).mockResolvedValue({});
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Country lookup unavailable")));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

async function submitHelpForm() {
  const ui = render(<HomeNeedHelpForm />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Country calling code: Egypt +20" })).toBeEnabled());
  fireEvent.change(ui.container.querySelector('input[name="name"]')!, {
    target: { value: "Hatem Sunpyramids" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Nationality" }), {
    target: { value: "Egypt" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), {
    target: { value: "1012345678" },
  });
  fireEvent.submit(ui.container.querySelector("form")!);
}

it("opens the personalized thank-you page after a successful help request", async () => {
  await submitHelpForm();

  await waitFor(() => expect(apiPost).toHaveBeenCalledWith(
    "contact-requests",
    expect.objectContaining({ name: "Hatem Sunpyramids", phone: "+201012345678", country: "Egypt" }),
    "en",
  ));
  expect(push).toHaveBeenCalledWith("/thankful?name=Hatem%20Sunpyramids");
});

it("stays on the form when the API rejects the request", async () => {
  vi.mocked(apiPost).mockRejectedValue(new Error("Request rejected"));
  await submitHelpForm();

  expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  expect(push).not.toHaveBeenCalled();
});
