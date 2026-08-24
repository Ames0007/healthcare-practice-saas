"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { getPatientFullName } from "@/features/patients/format";
import { isValidEmail, isValidMoroccanPhone, isBirthDateNotFuture, getTodayIso } from "@/features/patients/patient-form-validation";
import type { PatientDuplicateMatch, PatientFormValues } from "@/features/patients/types";

export interface PatientFormResult {
  ok: boolean;
  duplicates?: PatientDuplicateMatch[];
}

export interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PatientFormValues, options: { forceCreate: boolean }) => PatientFormResult;
  mode: "create" | "edit";
  initialValues?: Partial<PatientFormValues>;
  /** Read-only display context during edit — the reference itself is immutable (UI-003B §27). */
  patientNumber?: string;
  practitioners: { id: string; name: string }[];
}

const EMPTY_VALUES: PatientFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  responsiblePractitionerId: "",
  birthDate: "",
  email: "",
  city: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function hasComplementaryValue(values?: Partial<PatientFormValues>): boolean {
  if (!values) return false;
  return Boolean(
    values.birthDate || values.email || values.city || values.address || values.emergencyContactName || values.emergencyContactPhone,
  );
}

/**
 * Create/edit patient surface (UI-003B §9-13, §26-27, Spec #9 Screen 16).
 * Reused as-is for both modes — the parent remounts this with a fresh `key`
 * per open, so initial values only need to be read once (mirrors Agenda's
 * `AppointmentFormDialog`, UI-002). Duplicate detection (§18-21) happens in
 * the parent via `onSubmit`'s return value; the dialog stays open and
 * renders the warning inline rather than closing on a rejected submission.
 */
export function PatientFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialValues,
  patientNumber,
  practitioners,
}: PatientFormDialogProps) {
  const { t } = useLocale();
  const values = { ...EMPTY_VALUES, ...initialValues };

  const [firstName, setFirstName] = useState(values.firstName);
  const [lastName, setLastName] = useState(values.lastName);
  const [phone, setPhone] = useState(values.phone);
  const [responsiblePractitionerId, setResponsiblePractitionerId] = useState(
    values.responsiblePractitionerId || practitioners[0]?.id || "",
  );
  const [birthDate, setBirthDate] = useState(values.birthDate);
  const [email, setEmail] = useState(values.email);
  const [city, setCity] = useState(values.city);
  const [address, setAddress] = useState(values.address);
  const [emergencyContactName, setEmergencyContactName] = useState(values.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(values.emergencyContactPhone);
  const [showComplementary, setShowComplementary] = useState(() => hasComplementaryValue(initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<PatientDuplicateMatch[] | null>(null);

  function buildValues(): PatientFormValues {
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      responsiblePractitionerId,
      birthDate,
      email: email.trim(),
      city: city.trim(),
      address: address.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
    };
  }

  function validate(): Record<string, string> {
    const required = t("patients.form.requiredError");
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim()) nextErrors.firstName = required;
    if (!lastName.trim()) nextErrors.lastName = required;
    if (!phone.trim()) {
      nextErrors.phone = required;
    } else if (!isValidMoroccanPhone(phone)) {
      nextErrors.phone = t("patients.form.phoneError");
    }
    if (!responsiblePractitionerId) nextErrors.responsiblePractitionerId = required;
    if (email.trim() && !isValidEmail(email)) {
      nextErrors.email = t("patients.form.emailError");
    }
    if (birthDate && !isBirthDateNotFuture(birthDate, getTodayIso())) {
      nextErrors.birthDate = t("patients.form.birthDateError");
    }
    if (emergencyContactPhone.trim() && !isValidMoroccanPhone(emergencyContactPhone)) {
      nextErrors.emergencyContactPhone = t("patients.form.phoneError");
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = onSubmit(buildValues(), { forceCreate: false });
    setDuplicates(result.ok ? null : (result.duplicates ?? []));
  }

  function handleCreateAnyway() {
    const result = onSubmit(buildValues(), { forceCreate: true });
    if (result.ok) {
      setDuplicates(null);
    }
  }

  const title = mode === "create" ? t("patients.form.createTitle") : t("patients.form.editTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("patients.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {mode === "edit" && patientNumber && (
            <p className="mt-1 text-sm text-text-muted" dir="ltr">
              {t("patients.form.patientNumberLabel", { number: patientNumber })}
            </p>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("patients.form.mainInfoTitle")}
          </h3>

          <Input
            label={t("patients.form.firstNameLabel")}
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={errors.firstName}
          />
          <Input
            label={t("patients.form.lastNameLabel")}
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={errors.lastName}
          />
          <Input
            type="tel"
            label={t("patients.form.phoneLabel")}
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors.phone}
          />
          <Select
            label={t("patients.form.practitionerLabel")}
            required
            value={responsiblePractitionerId}
            onChange={(event) => setResponsiblePractitionerId(event.target.value)}
            error={errors.responsiblePractitionerId}
            options={practitioners.map((practitioner) => ({ value: practitioner.id, label: practitioner.name }))}
          />
        </section>

        <section className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowComplementary((current) => !current)}
            aria-expanded={showComplementary}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted hover:text-text"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", showComplementary && "rotate-180")} aria-hidden="true" />
            {t("patients.form.complementaryInfoTitle")}
          </button>

          {showComplementary && (
            <div className="flex flex-col gap-4">
              <Input
                type="date"
                label={t("patients.form.birthDateLabel")}
                value={birthDate}
                max={getTodayIso()}
                onChange={(event) => setBirthDate(event.target.value)}
                error={errors.birthDate}
              />
              <Input
                type="email"
                label={t("patients.form.emailLabel")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={errors.email}
              />
              <Input label={t("patients.form.cityLabel")} value={city} onChange={(event) => setCity(event.target.value)} />
              <Input
                label={t("patients.form.addressLabel")}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />

              <div className="flex flex-col gap-4 rounded-md border border-border p-4">
                <h4 className="text-xs font-medium text-text-muted">{t("patients.form.emergencyContactTitle")}</h4>
                <Input
                  label={t("patients.form.emergencyContactNameLabel")}
                  value={emergencyContactName}
                  onChange={(event) => setEmergencyContactName(event.target.value)}
                />
                <Input
                  type="tel"
                  label={t("patients.form.emergencyContactPhoneLabel")}
                  value={emergencyContactPhone}
                  onChange={(event) => setEmergencyContactPhone(event.target.value)}
                  error={errors.emergencyContactPhone}
                />
              </div>
            </div>
          )}
        </section>

        {duplicates && duplicates.length > 0 && (
          <div className="flex flex-col gap-3 rounded-md border border-warning bg-warning-soft p-3">
            <p className="text-sm font-medium text-warning">{t("patients.form.duplicateTitle")}</p>

            {duplicates.map((match) => (
              <div key={match.patient.id} className="rounded-md border border-border bg-surface p-3">
                <p className="font-medium text-text">{getPatientFullName(match.patient)}</p>
                <p className="text-xs text-text-muted" dir="ltr">
                  {match.patient.patientNumber}
                </p>
                <p className="text-sm text-text-secondary" dir="ltr">
                  {match.patient.phone}
                </p>
                <p className="text-sm text-text-secondary">{match.patient.responsiblePractitionerName}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {t(match.reason === "phone" ? "patients.form.duplicateReasonPhone" : "patients.form.duplicateReasonName")}
                </p>
                <Link
                  href={`/app/patients/${match.patient.id}`}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  {t("patients.form.openExisting")}
                </Link>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={handleCreateAnyway} className="self-start">
              {t("patients.form.createAnyway")}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("patients.form.cancel")}
          </Button>
          <Button type="submit">{mode === "create" ? t("patients.form.submitCreate") : t("patients.form.submitEdit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
