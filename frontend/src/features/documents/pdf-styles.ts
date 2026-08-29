import { StyleSheet } from "@react-pdf/renderer";
import { ARABIC_FONT_FAMILY } from "./fonts";
import type { Locale } from "@/i18n/config";

/** Approved palette (Spec #10) — same hex values as `design-system/tokens.css`, never a separate PDF-only palette. */
const COLOR_PRIMARY = "#0f766e";
const COLOR_TEXT = "#0f172a";
const COLOR_TEXT_MUTED = "#64748b";
const COLOR_BORDER = "#e2e8f0";

/** Helvetica (PDF standard font, WinAnsi) covers French accents without embedding; Arabic documents use the embedded Noto Naskh Arabic font (§31). */
export function resolvePdfFontFamily(locale: Locale): string {
  return locale === "ar" ? ARABIC_FONT_FAMILY : "Helvetica";
}

export function buildPdfStyles(locale: Locale) {
  const rtl = locale === "ar";
  const fontFamily = resolvePdfFontFamily(locale);
  const start = rtl ? "right" : "left";
  const end = rtl ? "left" : "right";

  return StyleSheet.create({
    page: {
      direction: rtl ? "rtl" : "ltr",
      fontFamily,
      fontSize: 10,
      color: COLOR_TEXT,
      paddingTop: 40,
      paddingBottom: 48,
      paddingHorizontal: 40,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    cabinetBlock: {
      flexDirection: "column",
      maxWidth: "60%",
    },
    cabinetName: {
      fontSize: 14,
      fontWeight: "bold",
      color: COLOR_PRIMARY,
      marginBottom: 4,
    },
    cabinetLine: {
      fontSize: 9,
      color: COLOR_TEXT_MUTED,
      marginBottom: 1,
    },
    titleBlock: {
      flexDirection: "column",
      alignItems: rtl ? "flex-start" : "flex-end",
    },
    titleText: {
      fontSize: 18,
      fontWeight: "bold",
      color: COLOR_TEXT,
      marginBottom: 2,
    },
    referenceText: {
      fontSize: 11,
      color: COLOR_PRIMARY,
      marginBottom: 4,
    },
    headerNote: {
      fontSize: 9,
      color: COLOR_TEXT_MUTED,
      marginBottom: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    label: {
      fontSize: 8,
      color: COLOR_TEXT_MUTED,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    value: {
      fontSize: 10,
      color: COLOR_TEXT,
    },
    valueStrong: {
      fontSize: 11,
      color: COLOR_TEXT,
      fontWeight: "bold",
    },
    tableHeaderRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLOR_BORDER,
      paddingBottom: 4,
      marginBottom: 4,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLOR_BORDER,
      paddingVertical: 4,
    },
    tableHeaderCell: {
      fontSize: 8,
      color: COLOR_TEXT_MUTED,
      textTransform: "uppercase",
    },
    tableCell: {
      fontSize: 10,
      color: COLOR_TEXT,
    },
    colDescription: {
      flexGrow: 1,
    },
    colQuantity: {
      width: 60,
      textAlign: "center",
    },
    colAmount: {
      width: 90,
      textAlign: end as "left" | "right",
    },
    totalsBlock: {
      alignSelf: rtl ? "flex-start" : "flex-end",
      width: 220,
      marginTop: 12,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalsRowStrong: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderTopWidth: 1,
      borderTopColor: COLOR_BORDER,
      marginTop: 2,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: COLOR_BORDER,
      paddingTop: 8,
      textAlign: "center",
    },
    footerText: {
      fontSize: 8,
      color: COLOR_TEXT_MUTED,
      marginBottom: 2,
    },
    footerNotice: {
      fontSize: 7,
      color: COLOR_TEXT_MUTED,
    },
    itemCard: {
      borderWidth: 1,
      borderColor: COLOR_BORDER,
      borderRadius: 4,
      padding: 8,
      marginBottom: 8,
    },
    itemTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: COLOR_TEXT,
      marginBottom: 3,
    },
    itemDetail: {
      fontSize: 9,
      color: COLOR_TEXT_MUTED,
      marginBottom: 1,
    },
    start: { textAlign: start as "left" | "right" },
  });
}

export type PdfStyles = ReturnType<typeof buildPdfStyles>;
