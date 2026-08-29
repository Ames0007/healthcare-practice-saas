"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles } from "./pdf-styles";
import { DocumentPdfFooter, DocumentPdfHeader } from "./pdf-shell";
import type { PayslipDocumentModel } from "./payslip-document";

export interface PayslipDocumentPdfProps {
  model: PayslipDocumentModel;
}

export function PayslipDocumentPdf({ model }: PayslipDocumentPdfProps) {
  const styles = buildPdfStyles(model.locale);

  return (
    <Document title={`${model.title} ${model.reference}`} language={model.locale}>
      <Page size="A4" style={styles.page}>
        <DocumentPdfHeader
          styles={styles}
          cabinet={model.cabinet}
          title={model.title}
          reference={model.reference}
          dateLabel={model.periodLabel}
          dateValue={model.periodValue}
          headerNote={model.headerNote}
        />

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.label}>{model.employeeLabel}</Text>
            <Text style={styles.value}>{model.employeeName}</Text>
            <Text style={styles.label}>{model.employeeNumberLabel}</Text>
            <Text style={styles.value}>{model.employeeNumber}</Text>
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.baseLabel}</Text>
            <Text style={styles.value}>{model.baseAmountLabel}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.overtimeLabel}</Text>
            <Text style={styles.value}>{model.overtimeValueLabel}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.bonusesLabel}</Text>
            <Text style={styles.value}>{model.bonusesTotalLabel}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.commissionLabel}</Text>
            <Text style={styles.value}>{model.commissionAmountLabel}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.value}>{model.deductionsLabel}</Text>
            <Text style={styles.value}>-{model.deductionsTotalLabel}</Text>
          </View>
          <View style={styles.totalsRowStrong}>
            <Text style={styles.valueStrong}>{model.netLabel}</Text>
            <Text style={styles.valueStrong}>{model.netAmountLabel}</Text>
          </View>
        </View>

        {(model.bonuses.length > 0 || model.deductions.length > 0) && (
          <View style={styles.section}>
            {model.bonuses.map((bonus) => (
              <View key={bonus.id} style={styles.totalsRow}>
                <Text style={styles.itemDetail}>{bonus.label}</Text>
                <Text style={styles.itemDetail}>{bonus.amountLabel}</Text>
              </View>
            ))}
            {model.deductions.map((deduction) => (
              <View key={deduction.id} style={styles.totalsRow}>
                <Text style={styles.itemDetail}>{deduction.label}</Text>
                <Text style={styles.itemDetail}>-{deduction.amountLabel}</Text>
              </View>
            ))}
          </View>
        )}

        <DocumentPdfFooter styles={styles} footerText={model.footerText} prototypeNotice={model.prototypeNotice} />
      </Page>
    </Document>
  );
}
