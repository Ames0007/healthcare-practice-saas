import { Font } from "@react-pdf/renderer";

/**
 * Arabic-script font (UI-DOCS-X §31/§6) — jsPDF's built-in fonts have no
 * Arabic glyph-shaping engine and render disconnected letterforms, which
 * the task explicitly forbids shipping. Noto Naskh Arabic ships full
 * initial/medial/final/isolated contextual forms and mark positioning that
 * `@react-pdf/renderer`'s fontkit-based text layer can shape correctly, and
 * covers basic Latin/digits too (mixed Arabic/Latin identifiers, §31).
 * SIL Open Font License — safe to embed. French/Latin documents use the
 * PDF standard Helvetica font (WinAnsi-encoded, no embedding needed, covers
 * all French accented characters) and never load this font.
 */
export const ARABIC_FONT_FAMILY = "NotoNaskhArabic";

let registered = false;

export function ensureDocumentFontsRegistered(): void {
  if (registered) {
    return;
  }
  registered = true;

  Font.register({
    family: ARABIC_FONT_FAMILY,
    fonts: [
      { src: "/fonts/NotoNaskhArabic-Regular.ttf", fontWeight: "normal" },
      { src: "/fonts/NotoNaskhArabic-Bold.ttf", fontWeight: "bold" },
    ],
  });
}
