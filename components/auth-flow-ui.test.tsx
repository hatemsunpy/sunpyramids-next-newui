import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AuthFlow } from "@/components/CustomerFlows";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

const apiCalls: { method: string; endpoint: string; body: any }[] = [];

function installFetch() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const endpoint = url.pathname.replace(/^\/api\//, "");
    const method = (init?.method || "GET") as string;
    let body: any = undefined;
    if (typeof init?.body === "string") {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    apiCalls.push({ method, endpoint, body });
    return new Response(JSON.stringify({ status: true, data: [], message: "OK" }), { status: 200 });
  }));
}

function authCalls(): { method: string; endpoint: string }[] {
  return apiCalls.filter((call) => call.endpoint.startsWith("auth/"));
}

beforeEach(() => {
  push.mockClear();
  apiCalls.length = 0;
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
  installFetch();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

function fillSignUp({ password, confirmation }: { password: string; confirmation: string }) {
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Nour Test" } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "traveler@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: confirmation } });
  fireEvent.click(screen.getByLabelText(/agree to the terms and conditions/i));
}

async function submitAuthForm() {
  const form = document.querySelector("form.auth-form")!;
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);
}

describe("auth flow UI contract", () => {
  it("keeps the label contract the guarded tests rely on", () => {
    render(<AuthFlow mode="create-password" />);
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const confirm = screen.getByLabelText("Confirm Password") as HTMLInputElement;
    const email = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const code = screen.getByLabelText(/Confirmation code/i) as HTMLInputElement;
    expect(password).not.toBe(confirm);
    expect(email.type).toBe("email");
    expect(password.type).toBe("password");
    expect(confirm.type).toBe("password");
    expect(screen.getByLabelText("Password")).toBeInstanceOf(HTMLInputElement);
  });

  it("shows the helper text and localized social divider on sign-up", () => {
    render(<AuthFlow mode="sign-up" />);
    expect(screen.getByText("Minimum 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("or continue with email")).toBeInTheDocument();
    expect(screen.getByText("Minimum 8 characters.").id).toBe("auth-password-hint");
  });

  it("toggles password visibility with accessible state, per field", () => {
    render(<AuthFlow mode="sign-up" />);
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const confirm = screen.getByLabelText("Confirm Password") as HTMLInputElement;

    const [passwordToggle, confirmToggle] = screen.getAllByRole("button", { name: "Show password" });
    expect(passwordToggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(passwordToggle);
    expect(password.type).toBe("text");
    expect(confirm.type).toBe("password");
    expect(screen.getAllByRole("button", { name: "Hide password" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Hide password" })[0]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(confirm.type).toBe("text");
    expect(password.type).toBe("text");
    expect(screen.getAllByRole("button", { name: "Hide password" })).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Hide password" })[0]);
    expect(password.type).toBe("password");
    expect(confirm.type).toBe("text");
  });

  it("blocks a mismatched confirmation client-side and never reaches the API", async () => {
    render(<AuthFlow mode="sign-up" />);
    fillSignUp({ password: "abcdefgh", confirmation: "abcdefghx" });
    await submitAuthForm();

    expect(authCalls()).toHaveLength(0);
    const confirm = screen.getByLabelText("Confirm Password") as HTMLInputElement;
    expect(confirm).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Passwords do not match.")).toHaveAttribute("role", "alert");
    await waitFor(() => expect(document.activeElement).toBe(confirm));
  });

  it("recovers from the mismatch: matching passwords proceed to the API", async () => {
    render(<AuthFlow mode="sign-up" />);
    fillSignUp({ password: "abcdefgh", confirmation: "abcdefgh" });
    await submitAuthForm();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/sign-in"));
    expect(authCalls()).toContainEqual(expect.objectContaining({ endpoint: "auth/register" }));
    expect(screen.getByLabelText("Confirm Password")).not.toHaveAttribute("aria-invalid");
  });

  it("keeps the forget-password prompt inline on sign-in without repeating it below", () => {
    render(<AuthFlow mode="sign-in" />);
    expect(screen.getByRole("link", { name: "Did you forget your password?" })).toBeInTheDocument();

    const crossLinks = screen.getByRole("navigation", { name: "Account access" });
    expect(within(crossLinks).getByRole("link", { name: "Create an Account" })).toBeInTheDocument();
    expect(within(crossLinks).queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(within(crossLinks).queryByRole("link", { name: "Did you forget your password?" })).not.toBeInTheDocument();
  });

  it("lists the sibling modes as cross-links without the current one", () => {
    render(<AuthFlow mode="forget-password" />);
    const crossLinks = screen.getByRole("navigation", { name: "Account access" });
    expect(within(crossLinks).getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(within(crossLinks).getByRole("link", { name: "Create an Account" })).toBeInTheDocument();
    expect(within(crossLinks).queryByRole("link", { name: "Did you forget your password?" })).not.toBeInTheDocument();
  });
});
