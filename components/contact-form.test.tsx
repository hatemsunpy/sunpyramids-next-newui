import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContactForm } from "@/components/ContactForm";
import { apiGet, apiPost } from "@/lib/client-api";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/client-api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

beforeEach(() => {
  vi.mocked(apiGet).mockResolvedValue({
    data: [{ id: 65, name: "Egypt", code: "EG", phone_code: "+20", length: 10 }],
  });
  vi.mocked(apiPost).mockResolvedValue({});
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Country lookup unavailable")));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

it("submits a tour inquiry with Laravel dashboard fields and the full dialled phone number", async () => {
  const ui = render(
    <ContactForm tourId={19} tourTitle="Star Watching Adventure By Jeep Safari In Hurghada" />
  );
  await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled());

  fireEvent.change(screen.getByRole("textbox", { name: "Full Name" }), {
    target: { value: "Test Guest" },
  });
  fireEvent.pointerDown(screen.getByRole("button", { name: "Nationality" }), {
    button: 0,
    ctrlKey: false,
  });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Egypt" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), {
    target: { value: "1012345678" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
    target: { value: "guest@example.com" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Write Us...." }), {
    target: { value: "Please confirm availability." },
  });

  const form = ui.container.querySelector("form")!;
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);

  await waitFor(() =>
    expect(apiPost).toHaveBeenCalledWith(
      "contact-requests",
      expect.objectContaining({
        name: "Test Guest",
        email: "guest@example.com",
        phone: "+201012345678",
        country: "Egypt",
        subject: "Tour inquiry: Star Watching Adventure By Jeep Safari In Hurghada",
        message: "Please confirm availability.",
      }),
      "en"
    )
  );
  expect(push).toHaveBeenCalledWith("/thankful?name=Test%20Guest");
});
