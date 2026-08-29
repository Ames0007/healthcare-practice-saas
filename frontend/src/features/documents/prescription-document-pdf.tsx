"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles } from "./pdf-styles";
import { DocumentPdfFooter, DocumentPdfHeader } from "./pdf-shell";
import type { PrescriptionDocumentModel } from "./prescription-document";

export interface PrescriptionDocumentPdfProps {
  model: PrescriptionDocumentModel;
}

export function PrescriptionDocumentPdf({ model }: PrescriptionDocumentPdfProps) {
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 6 }]}>{model.medicationsHeading}</Text>
          {model.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.medication}</Text>
              <Text style={styles.itemDetail}>
                {item.dosageLabel} : {item.dosage}
              </Text>
              <Text style={styles.itemDetail}>
                {item.frequencyLabel} : {item.frequency}
              </Text>
              {item.duration && (
                <Text style={styles.itemDetail}>
                  {item.durationLabel} : {item.duration}
                </Text>
              )}
              {item.instructions && <Text style={styles.itemDetail}>{item.instructions}</Text>}
            </View>
          ))}
        </View>

        {model.generalInstructions && (
          <View style={styles.section}>
            <Text style={styles.label}>{model.instructionsLabel}</Text>
            <Text style={styles.value}>{model.generalInstructions}</Text>
          </View>
        )}

        <DocumentPdfFooter styles={styles} footerText={model.footerText} prototypeNotice={model.prototypeNotice} />
      </Page>
    </Document>
  );
}
