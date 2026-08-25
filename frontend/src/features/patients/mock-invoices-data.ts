import type { Invoice } from "@/components/domain/finance/types";

/**
 * Centralized synthetic invoice/installment fixtures (UI-004D §13-14) — no
 * payment execution, no receipts, no caisse. Derived by patientId, never
 * scattered through JSX.
 *
 * pat-1/Ahmed carries three invoices demonstrating partial payment
 * (with the full six-installment staged schedule, exactly Spec #9 Screen
 * 29's own numbers), a second fully paid invoice, and a cancelled one —
 * their non-cancelled totals aggregate to exactly the 4 500 / 3 000 /
 * 1 500 MAD summary this task's own §17 wireframe shows. pat-4/Youssef is
 * fully paid (Patient B). pat-9/Mehdi has one overdue invoice/installment
 * (Patient D). pat-2/Sara deliberately has none at all (Patient C).
 */
export function getInvoicesMockData(): Invoice[] {
  return [
    {
      id: "inv-1",
      patientId: "pat-1",
      invoiceNumber: "FAC-2026-00142",
      issuedDate: "2026-08-01",
      status: "partially_paid",
      currency: "MAD",
      description: "Traitement de rééducation",
      practitionerName: "Dr. Benali",
      treatmentPlanId: "tp-1",
      totalAmount: 3000,
      paidAmount: 1500,
      remainingAmount: 1500,
      lines: [
        {
          id: "inv-1-l1",
          label: "Traitement de rééducation — 20 séances",
          quantity: 1,
          unitPriceAmount: 3000,
          totalAmount: 3000,
        },
      ],
      installments: [
        { id: "inv-1-i1", invoiceId: "inv-1", sequenceNumber: 1, dueDate: "2026-08-01", amount: 500, status: "paid", paidDate: "2026-08-01" },
        { id: "inv-1-i2", invoiceId: "inv-1", sequenceNumber: 2, dueDate: "2026-08-15", amount: 500, status: "paid", paidDate: "2026-08-15" },
        { id: "inv-1-i3", invoiceId: "inv-1", sequenceNumber: 3, dueDate: "2026-08-22", amount: 500, status: "paid", paidDate: "2026-08-22" },
        { id: "inv-1-i4", invoiceId: "inv-1", sequenceNumber: 4, dueDate: "2026-09-01", amount: 500, status: "due" },
        { id: "inv-1-i5", invoiceId: "inv-1", sequenceNumber: 5, dueDate: "2026-09-15", amount: 500, status: "future" },
        { id: "inv-1-i6", invoiceId: "inv-1", sequenceNumber: 6, dueDate: "2026-10-01", amount: 500, status: "future" },
      ],
    },
    {
      id: "inv-1b",
      patientId: "pat-1",
      invoiceNumber: "FAC-2026-00099",
      issuedDate: "2026-07-15",
      status: "paid",
      currency: "MAD",
      description: "Consultation initiale",
      practitionerName: "Dr. Benali",
      totalAmount: 1500,
      paidAmount: 1500,
      remainingAmount: 0,
      lines: [{ id: "inv-1b-l1", label: "Consultation initiale", quantity: 1, unitPriceAmount: 1500, totalAmount: 1500 }],
      installments: [],
    },
    {
      // Deliberate exception to the usual paidAmount + remainingAmount ===
      // totalAmount invariant (UI-004D §29): a cancelled/voided invoice
      // owes nothing regardless of its nominal total, so remainingAmount
      // is 0 here even though totalAmount is 400.
      id: "inv-1c",
      patientId: "pat-1",
      invoiceNumber: "FAC-2026-00075",
      issuedDate: "2026-06-10",
      status: "cancelled",
      currency: "MAD",
      description: "Consultation",
      practitionerName: "Dr. Benali",
      totalAmount: 400,
      paidAmount: 0,
      remainingAmount: 0,
      lines: [{ id: "inv-1c-l1", label: "Consultation", quantity: 1, unitPriceAmount: 400, totalAmount: 400 }],
      installments: [],
    },
    {
      id: "inv-2",
      patientId: "pat-4",
      invoiceNumber: "FAC-2026-00098",
      issuedDate: "2026-07-10",
      status: "paid",
      currency: "MAD",
      description: "Consultation",
      practitionerName: "Dr. Amal",
      totalAmount: 800,
      paidAmount: 800,
      remainingAmount: 0,
      lines: [{ id: "inv-2-l1", label: "Consultation", quantity: 1, unitPriceAmount: 800, totalAmount: 800 }],
      installments: [],
    },
    {
      id: "inv-3",
      patientId: "pat-9",
      invoiceNumber: "FAC-2026-00120",
      issuedDate: "2026-07-20",
      status: "overdue",
      currency: "MAD",
      description: "Traitement",
      practitionerName: "Dr. Amal",
      totalAmount: 2200,
      paidAmount: 0,
      remainingAmount: 2200,
      lines: [{ id: "inv-3-l1", label: "Traitement", quantity: 1, unitPriceAmount: 2200, totalAmount: 2200 }],
      installments: [
        { id: "inv-3-i1", invoiceId: "inv-3", sequenceNumber: 1, dueDate: "2026-08-05", amount: 2200, status: "overdue" },
      ],
    },
  ];
}

export function getEmptyInvoicesMockData(): Invoice[] {
  return [];
}
