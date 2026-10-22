import { describe, expect, it } from "vitest";
import { suggestionsFor } from "./agent";

describe("guide suggestions", () => {
  it("match the page with or without the static export's trailing slash", () => {
    expect(suggestionsFor("/match")).toContain("Why is my top role ranked first?");
    expect(suggestionsFor("/match/")).toEqual(suggestionsFor("/match"));
    expect(suggestionsFor("/career-centre/")).toEqual(suggestionsFor("/career-centre"));
    expect(suggestionsFor("/")).toEqual(["Where does this data come from?", "How sure is this?"]);
  });
});
