import { describe, expect, it } from "vitest";
import type { Prescription } from "@/components/domain/clinical/types";
import {
  generatePrescriptionNumber,
  getPrescriptionsForPatient,
  isPrescriptionFormValid,
  isPrescriptionItemValid,
  sortPrescriptionsDesc,
} from "./prescriptions";

function makePrescription(overrides: Partial<Prescription> = {}): Prescription {
  return {
    id: "presc-x",
    prescriptionNumber: "ORD-2026-9999",
    patientId: "pat-1",
    practitionerId: "pr-1",
    practitionerName: "Dr. Test",
    issuedAt: "2026-08-10",
    status: "issued",
    items: [{ id: "presc-x-item-1", medication: "Paracétamol", dosage: "500 mg", frequency: "3x/jour" }],
    ...overrides,
  };
}

describe("getPrescriptionsForPatient", () => {
  it("filters by patientId only", () => {
    const prescriptions = [makePrescription({ id: "a", patientId: "pat-1" }), makePrescription({ id: "b", patientId: "pat-2" })];
    expect(getPrescriptionsForPatient(prescriptions, "pat-1").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("sortPrescriptionsDesc", () => {
  it("orders newest issuedAt first, independent of insertion order", () => {
    const prescriptions = [
      makePrescription({ id: "old", issuedAt: "2026-07-01" }),
      makePrescription({ id: "new", issuedAt: "2026-08-20" }),
    ];
    expect(sortPrescriptionsDesc(prescriptions).map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("does not mutate the input array", () => {
    const prescriptions = [makePrescription({ id: "a", issuedAt: "2026-08-01" }), makePrescription({ id: "b", issuedAt: "2026-08-20" })];
    sortPrescriptionsDesc(prescriptions);
    expect(prescriptions.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("generatePrescriptionNumber", () => {
  it("pads sequentially with the ORD-2026- prefix", () => {
    expect(generatePrescriptionNumber(0)).toBe("ORD-2026-0001");
    expect(generatePrescriptionNumber(17)).toBe("ORD-2026-0018");
  });
});

describe("isPrescriptionItemValid", () => {
  it("requires medication, dosage and frequency", () => {
    expect(isPrescriptionItemValid({ medication: "Paracétamol", dosage: "500 mg", frequency: "3x/jour" })).toBe(true);
    expect(isPrescriptionItemValid({ medication: "", dosage: "500 mg", frequency: "3x/jour" })).toBe(false);
    expect(isPrescriptionItemValid({ medication: "Paracétamol", dosage: "", frequency: "3x/jour" })).toBe(false);
    expect(isPrescriptionItemValid({ medication: "Paracétamol", dosage: "500 mg", frequency: "" })).toBe(false);
  });

  it("does not require duration or instructions", () => {
    expect(isPrescriptionItemValid({ medication: "Paracétamol", dosage: "500 mg", frequency: "3x/jour" })).toBe(true);
  });

  it("rejects whitespace-only values", () => {
    expect(isPrescriptionItemValid({ medication: "   ", dosage: "500 mg", frequency: "3x/jour" })).toBe(false);
  });
});

describe("isPrescriptionFormValid", () => {
  it("is invalid with zero items", () => {
    expect(isPrescriptionFormValid([])).toBe(false);
  });

  it("is invalid when any item is incomplete", () => {
    expect(
      isPrescriptionFormValid([
        { medication: "Paracétamol", dosage: "500 mg", frequency: "3x/jour" },
        { medication: "", dosage: "200 mg", frequency: "2x/jour" },
      ]),
    ).toBe(false);
  });

  it("is valid when every item is complete", () => {
    expect(
      isPrescriptionFormValid([
        { medication: "Paracétamol", dosage: "500 mg", frequency: "3x/jour" },
        { medication: "Ibuprofène", dosage: "200 mg", frequency: "2x/jour" },
      ]),
    ).toBe(true);
  });
});
