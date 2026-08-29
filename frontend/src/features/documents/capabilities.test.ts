import { describe, expect, it } from "vitest";
import { isDocumentLanguageSupported } from "./capabilities";

describe("isDocumentLanguageSupported (UI-DOCS-X §31 STOP condition, ADR-016)", () => {
  it("supports French document generation", () => {
    expect(isDocumentLanguageSupported("fr")).toBe(true);
  });

  it("does not support Arabic document generation — real visual QA found glyph corruption", () => {
    expect(isDocumentLanguageSupported("ar")).toBe(false);
  });
});
