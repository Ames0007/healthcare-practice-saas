import { describe, expect, it } from "vitest";
import { getClinicalMasterData, getMasterDataLabel, normalizeSearchText, searchClinicalMasterData } from "./master-data";

describe("searchClinicalMasterData", () => {
  const items = getClinicalMasterData();

  it("finds a predefined allergy by partial keyword", () => {
    const results = searchClinicalMasterData(items, "allergy", "Péni");
    expect(results.map((item) => item.labelFr)).toContain("Pénicilline");
  });

  it("finds a predefined history item by partial keyword", () => {
    const results = searchClinicalMasterData(items, "history", "Hyper");
    expect(results.map((item) => item.labelFr)).toContain("Hypertension artérielle");
  });

  it("finds a predefined medication by partial keyword", () => {
    const results = searchClinicalMasterData(items, "medication", "Amlo");
    expect(results.map((item) => item.labelFr)).toContain("Amlodipine");
  });

  it("is case-insensitive", () => {
    expect(searchClinicalMasterData(items, "allergy", "PÉNI").map((item) => item.labelFr)).toContain("Pénicilline");
    expect(searchClinicalMasterData(items, "allergy", "péni").map((item) => item.labelFr)).toContain("Pénicilline");
  });

  it("is accent-insensitive", () => {
    expect(searchClinicalMasterData(items, "allergy", "Penicilline").map((item) => item.labelFr)).toContain("Pénicilline");
    expect(searchClinicalMasterData(items, "history", "Hypertension arterielle").map((item) => item.labelFr)).toContain(
      "Hypertension artérielle",
    );
  });

  it("matches an extra search term such as a common abbreviation", () => {
    expect(searchClinicalMasterData(items, "history", "HTA").map((item) => item.labelFr)).toContain("Hypertension artérielle");
  });

  it("scopes results to the requested category only", () => {
    const results = searchClinicalMasterData(items, "medication", "Aspirine");
    expect(results.every((item) => item.category === "medication")).toBe(true);
    expect(results.map((item) => item.labelFr)).toContain("Aspirine");
  });

  it("returns every category item for an empty query", () => {
    expect(searchClinicalMasterData(items, "allergy", "").length).toBe(items.filter((item) => item.category === "allergy").length);
  });

  it("returns no results for an unmatched query", () => {
    expect(searchClinicalMasterData(items, "allergy", "xyznotfound")).toEqual([]);
  });
});

describe("getClinicalMasterData", () => {
  it("does not mutate across calls — nothing in this catalog can be written back to (§15)", () => {
    expect(getClinicalMasterData()).toEqual(getClinicalMasterData());
  });

  it("has at least the six required allergy/history/medication examples from UI-005A §12", () => {
    const items = getClinicalMasterData();
    const allergyLabels = items.filter((item) => item.category === "allergy").map((item) => item.labelFr);
    const historyLabels = items.filter((item) => item.category === "history").map((item) => item.labelFr);
    const medicationLabels = items.filter((item) => item.category === "medication").map((item) => item.labelFr);

    ["Pénicilline", "Amoxicilline", "Aspirine", "Latex", "Iode", "Arachides"].forEach((label) => expect(allergyLabels).toContain(label));
    ["Hypertension artérielle", "Diabète", "Asthme", "Maladie cardiaque", "Trouble thyroïdien", "Chirurgie antérieure"].forEach((label) =>
      expect(historyLabels).toContain(label),
    );
    ["Metformine", "Amlodipine", "Insuline", "Aspirine", "Levothyroxine"].forEach((label) => expect(medicationLabels).toContain(label));
  });

  it("every item has a unique id", () => {
    const ids = getClinicalMasterData().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getMasterDataLabel", () => {
  it("resolves the French label for the fr locale and the Arabic label for the ar locale", () => {
    const item = getClinicalMasterData().find((candidate) => candidate.id === "mdi-allergy-penicilline")!;
    expect(getMasterDataLabel(item, "fr")).toBe("Pénicilline");
    expect(getMasterDataLabel(item, "ar")).toBe("البنسلين");
  });
});

describe("normalizeSearchText", () => {
  it("strips accents and lowercases", () => {
    expect(normalizeSearchText("Hypertension artérielle")).toBe(normalizeSearchText("hypertension arterielle"));
  });
});
