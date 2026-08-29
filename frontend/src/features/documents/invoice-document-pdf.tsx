"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles } from "./pdf-styles";
import { DocumentPdfFooter, DocumentPdfHeader } from "./pdf-shell";
import type { InvoiceDocumentModel } from "./invoice-document";

export interface InvoiceDocumentPdfProps {
  model: InvoiceDocumentModel;
}

/** Renders an `InvoiceDocumentModel` (task §16) — never recomputes any amount, only lays out values already resolved by `buildInvoiceDocument`. */
export function InvoiceDocumentPdf({ model }: InvoiceDocumentPdfProps) {
  const styles = buildPdfStyles(model.locale);

  return (
    <Document title={`${model.title} ${model.reference}`} language={model.locale}>
      <Page size="A4" style={styles.page}>
        <DocumentPdfHeader
          styles={styles}
          cabinet={model.cabinet}
          title={model.title}
          reference={model.reference}
          dateLabel={model.dateLabel}
          dateValue={model.dateValue}
          headerNote={model.headerNote}
        />

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.label}>{model.patientLabel}</Text>
            <Text style={styles.value}>{model.patientName}</Text>
            <Text style={styles.label}>{model.patientNumberLabel}</Text>
            <Text style={styles.value}>{model.patientNumber}</Text>
          </View>
          <View>
            <Text style={styles.label}>{model.practitionerLabel}</Text>
            <Text style={styles.value}>{model.practitionerName}</Text>
            <Text style={styles.label}>{model.statusLabel}</Text>
            <Text style={styles.value}>{model.statusValueLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>{model.descriptionHeader}</Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>{model.quantityHeader}</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>{model.amountHeader}</Text>
          </View>
          {model.lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>{line.label}</Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>{line.quantity}</Text>
              <Text style={[styles.tableCell, styles.colAmount]}>{line.totalAmountLabel}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.paidLabel}</Text>
            <Text style={styles.value}>{model.paidAmountLabel}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.remainingLabel}</Text>
            <Text style={styles.value}>{model.remainingAmountLabel}</Text>
          </View>
          <View style={styles.totalsRowStrong}>
            <Text style={styles.valueStrong}>{model.totalLabel}</Text>
            <Text style={styles.valueStrong}>{model.totalAmountLabel}</Text>
          </View>
        </View>

        <DocumentPdfFooter styles={styles} footerText={model.footerText} prototypeNotice={model.prototypeNotice} />
      </Page>
    </Document>
  );
}
