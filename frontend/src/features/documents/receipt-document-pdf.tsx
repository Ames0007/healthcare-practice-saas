"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles } from "./pdf-styles";
import { DocumentPdfFooter, DocumentPdfHeader } from "./pdf-shell";
import type { ReceiptDocumentModel } from "./receipt-document";

export interface ReceiptDocumentPdfProps {
  model: ReceiptDocumentModel;
}

export function ReceiptDocumentPdf({ model }: ReceiptDocumentPdfProps) {
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
            <Text style={styles.label}>{model.methodLabel}</Text>
            <Text style={styles.value}>{model.methodValueLabel}</Text>
            {model.invoiceLabel && (
              <>
                <Text style={styles.label}>{model.invoiceLabel}</Text>
                <Text style={styles.value}>{model.invoiceValueLabel}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRowStrong}>
            <Text style={styles.valueStrong}>{model.amountLabel}</Text>
            <Text style={styles.valueStrong}>{model.amountValueLabel}</Text>
          </View>
        </View>

        <DocumentPdfFooter styles={styles} footerText={model.footerText} prototypeNotice={model.prototypeNotice} />
      </Page>
    </Document>
  );
}
