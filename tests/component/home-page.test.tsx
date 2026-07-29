import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { profile } from "@/data/profile";
import { getWorkItems } from "@/lib/content";

describe("the homepage", () => {
  it("leaves main to the layout and descends from h1 to h3 without a skipped level", async () => {
    const { container } = render(await Home());

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const levels = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
      (heading) => Number(heading.tagName[1]),
    );
    expect(levels).toContain(2);
    expect(levels).toContain(3);
    expect(
      levels.every((level, index) => index === 0 || level <= levels[index - 1] + 1),
    ).toBe(true);
  });

  it("renders the final headline with its closing phrase emphasized", async () => {
    render(await Home());

    const headline = screen.getByRole("heading", { level: 1 });
    expect(headline.textContent).toBe(
      "I find the bet worth making, then earn the right to finish it.",
    );
    expect(headline.querySelector("em")?.textContent).toBe("finish it");
  });

  it("renders the final lede and strengthens the current platform", async () => {
    const { container } = render(await Home());

    const lede = container.querySelector("[data-testid='lede']");
    expect(lede?.textContent).toBe(
      "Ten years building 0→1 products and platforms in vertical SaaS and fintech. Mostly that means research, collaboration, and working out when a bet is actually worth making — then shipping proof along the way that earns the next step. Currently building an AI agent platform at Evernest.",
    );
    expect(lede?.querySelector("strong")?.textContent).toBe(
      "an AI agent platform",
    );
  });

  it("links the two calls to action to the profile contact paths", async () => {
    render(await Home());

    expect(screen.getByRole("link", { name: "Email me" }).getAttribute("href")).toBe(
      `mailto:${profile.email}`,
    );
    expect(
      screen.getByRole("link", { name: "LinkedIn ↗" }).getAttribute("href"),
    ).toBe(profile.links.linkedin);
  });

  it("provides the work and track-record rail targets", async () => {
    const { container } = render(await Home());

    expect(container.querySelector("#work")).not.toBeNull();
    expect(container.querySelector("#track")).not.toBeNull();
  });

  it("renders the four selected outcomes", async () => {
    render(await Home());

    expect(screen.getAllByTestId("metric")).toHaveLength(4);
  });

  it("renders one case row per published work item", async () => {
    const items = await getWorkItems();
    const { container } = render(await Home());

    expect(container.querySelectorAll("#work + ul > li")).toHaveLength(
      items.length,
    );
  });

  it("renders all seven roles in the track record", async () => {
    const { container } = render(await Home());

    expect(container.querySelectorAll("#track + ul > li")).toHaveLength(7);
  });
});
