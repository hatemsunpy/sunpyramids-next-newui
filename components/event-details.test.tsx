import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EventDetails, EventHeroFacts } from "@/components/EventDetails";
import { siteContact } from "@/lib/site-contact";
import type { ApiPage } from "@/types/api";

afterEach(cleanup);

// Synthetic API payload shaped like the real event endpoint: date is an ISO
// UTC instant, status/location are plain strings, no website/email/phone
// fields exist in the contract.
function eventFixture(overrides: Record<string, unknown> = {}): ApiPage {
  return {
    title: "Cairo International Film Festival",
    date: "2026-11-18T18:00:00.000Z",
    status: "Active",
    location: "Cairo Opera House",
    ...overrides,
  } as ApiPage;
}

describe("EventDetails", () => {
  it("renders the event details box with date, status and location rows", () => {
    render(<EventDetails event={eventFixture()} />);

    expect(screen.getByRole("heading", { level: 3, name: "Event Details" })).toBeInTheDocument();

    expect(screen.getByText("Start Date")).toBeInTheDocument();
    expect(screen.getByText("18/11/2026")).toBeInTheDocument();

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();

    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Cairo Opera House")).toBeInTheDocument();
  });

  it("displays the date carried by the payload string without a timezone shift", () => {
    render(<EventDetails event={eventFixture({ date: "2027-01-01T23:30:00.000Z" })} />);
    expect(screen.getByText("01/01/2027")).toBeInTheDocument();
  });

  it("links the approved contact channels", () => {
    render(<EventDetails event={eventFixture()} />);

    const phone = screen.getByText(siteContact.phones[0].display);
    expect(phone.closest("a")).toHaveAttribute("href", siteContact.phones[0].href);

    const email = screen.getByText(siteContact.safeFallbackEmails[0]);
    expect(email.closest("a")).toHaveAttribute("href", `mailto:${siteContact.safeFallbackEmails[0]}`);

    const website = screen.getByText("https://sunpyramidstours.com");
    expect(website.closest("a")).toHaveAttribute("href", "https://sunpyramidstours.com");
  });

  it("only shows nonempty string API fields", () => {
    render(<EventDetails event={eventFixture({ status: "", location: "   " })} />);

    expect(screen.getByText("Start Date")).toBeInTheDocument();
    expect(screen.queryByText("Status")).toBeNull();
    expect(screen.queryByText("Location")).toBeNull();
  });

  it.each(["not-a-date", "", "2027-02-31T00:00:00Z"])("omits an absent or invalid calendar date: %s", (date) => {
    render(<EventDetails event={eventFixture({ date })} />);
    expect(screen.queryByText("Start Date")).toBeNull();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
  it("renders nothing when every API detail row is absent", () => {
    const { container } = render(
      <EventDetails event={eventFixture({ date: "", status: "", location: null })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a null event", () => {
    const { container } = render(<EventDetails event={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses valid dl row groups with dt/dd siblings", () => {
    const { container } = render(<EventDetails event={eventFixture()} />);

    const rows = [...container.querySelectorAll("dl > div")];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect([...row.children].map((child) => child.tagName)).toEqual(["DT", "DD"]);
    }
  });
});

describe("EventHeroFacts", () => {
  it("shows only the API date and location in the hero", () => {
    render(<EventHeroFacts event={eventFixture()} />);

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("18/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("Cairo Opera House")).toBeInTheDocument();

    expect(screen.queryByText("Start Date")).toBeNull();
    expect(screen.queryByText("Status")).toBeNull();
  });

  it("omits each fact independently when its API string is unusable", () => {
    render(<EventHeroFacts event={eventFixture({ location: "" })} />);

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.queryByText("Location")).toBeNull();
  });

  it("renders nothing without a usable date or location", () => {
    const { container } = render(
      <EventHeroFacts event={eventFixture({ date: "", location: "" })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
