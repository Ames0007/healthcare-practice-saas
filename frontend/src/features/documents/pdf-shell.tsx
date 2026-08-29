"use client";

import { Text, View } from "@react-pdf/renderer";
import type { DocumentCabinetIdentity } from "./types";
import type { PdfStyles } from "./pdf-styles";

export interface DocumentPdfHeaderProps {
  styles: PdfStyles;
  cabinet: DocumentCabinetIdentity;
  title: string;
  reference: string;
  dateLabel: string;
  dateValue: string;
  headerNote?: string;
}

/**
 * Shared cabinet-identity + title/reference block (task §13, §4's
 * "GeneratedDocument" shape) — every generated document type renders this
 * exact block, never a per-feature reimplementation.
 */
export function DocumentPdfHeader({ styles, cabinet, title, reference, dateLabel, dateValue, headerNote }: DocumentPdfHeaderProps) {
  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.cabinetBlock}>
          <Text style={styles.cabinetName}>{cabinet.name}</Text>
          {cabinet.address && <Text style={styles.cabinetLine}>{cabinet.address}</Text>}
          {cabinet.city && <Text style={styles.cabinetLine}>{cabinet.city}</Text>}
          <Text style={styles.cabinetLine}>{cabinet.phone}</Text>
          {cabinet.email && <Text style={styles.cabinetLine}>{cabinet.email}</Text>}
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.referenceText}>{reference}</Text>
          <Text style={styles.cabinetLine}>
            {dateLabel} : {dateValue}
          </Text>
        </View>
      </View>
      {headerNote && <Text style={styles.headerNote}>{headerNote}</Text>}
    </>
  );
}

export interface DocumentPdfFooterProps {
  styles: PdfStyles;
  footerText: string;
  prototypeNotice: string;
}

export function DocumentPdfFooter({ styles, footerText, prototypeNotice }: DocumentPdfFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{footerText}</Text>
      <Text style={styles.footerNotice}>{prototypeNotice}</Text>
    </View>
  );
}
