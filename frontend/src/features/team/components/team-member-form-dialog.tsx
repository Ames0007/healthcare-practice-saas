"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import type { TeamMemberFormValues, TeamMemberStatus, TeamRole } from "@/components/domain/team/types";
import { isValidEmail, isValidMoroccanPhone } from "@/features/team/team-member-form-validation";

export interface TeamMemberFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TeamMemberFormValues) => void;
  mode: "create" | "edit";
  initialValues?: Partial<TeamMemberFormValues>;
  /** Read-only display context during edit — the reference itself is immutable (mirrors `patientNumber`, UI-003B §27). */
  employeeNumber?: string;
}

const EMPTY_VALUES: TeamMemberFormValues = {
  firstName: "",
  lastName: "",
  role: "receptionist",
  professionalTitle: "",
  phone: "",
  email: "",
  startDate: "",
  status: "active",
};

const ROLE_OPTIONS: TeamRole[] = ["practitioner", "receptionist", "assistant", "manager", "other"];

/**
 * Bounded create/edit team member prototype surface (UI-007A §6/§9). No
 * duplicate detection, no contract/schedule/payroll/document fields — those
 * belong to UI-007B through UI-007F. Mirrors `PatientFormDialog`'s
 * drawer/validate/submit shape; the parent remounts this with a fresh `key`
 * per open, so initial values only need to be read once.
 */
export function TeamMemberFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialValues,
  employeeNumber,
}: TeamMemberFormDialogProps) {
  const { t } = useLocale();
  const values = { ...EMPTY_VALUES, ...initialValues };

  const [firstName, setFirstName] = useState(values.firstName);
  const [lastName, setLastName] = useState(values.lastName);
  const [role, setRole] = useState<TeamRole>(values.role);
  const [professionalTitle, setProfessionalTitle] = useState(values.professionalTitle);
  const [phone, setPhone] = useState(values.phone);
  const [email, setEmail] = useState(values.email);
  const [startDate, setStartDate] = useState(values.startDate);
  const [status, setStatus] = useState<TeamMemberStatus>(values.status);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function buildValues(): TeamMemberFormValues {
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      professionalTitle: professionalTitle.trim(),
      phone: phone.trim(),
      email: email.trim(),
      startDate,
      status,
    };
  }

  function validate(): Record<string, string> {
    const required = t("team.form.requiredError");
    const nextErrors: Record<string, string> = {};

    if (!firstName.trim()) nextErrors.firstName = required;
    if (!lastName.trim()) nextErrors.lastName = required;
    if (phone.trim() && !isValidMoroccanPhone(phone)) {
      nextErrors.phone = t("team.form.phoneError");
    }
    if (email.trim() && !isValidEmail(email)) {
      nextErrors.email = t("team.form.emailError");
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

    onSubmit(buildValues());
  }

  const title = mode === "create" ? t("team.form.createTitle") : t("team.form.editTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("team.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {mode === "edit" && employeeNumber && (
            <p className="mt-1 text-sm text-text-muted" dir="ltr">
              {t("team.form.employeeNumberLabel", { number: employeeNumber })}
            </p>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <Input
            label={t("team.form.firstNameLabel")}
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={errors.firstName}
          />
          <Input
            label={t("team.form.lastNameLabel")}
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={errors.lastName}
          />
          <Select
            label={t("team.form.roleLabel")}
            required
            value={role}
            onChange={(event) => setRole(event.target.value as TeamRole)}
            options={ROLE_OPTIONS.map((option) => ({ value: option, label: t(TEAM_ROLE_MAP[option].translationKey) }))}
          />
          <Input
            label={t("team.form.professionalTitleLabel")}
            helperText={t("team.form.professionalTitleHelp")}
            value={professionalTitle}
            onChange={(event) => setProfessionalTitle(event.target.value)}
          />
          <Input
            type="tel"
            label={t("team.form.phoneLabel")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors.phone}
          />
          <Input
            type="email"
            label={t("team.form.emailLabel")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <Input
            type="date"
            label={t("team.form.startDateLabel")}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <Select
            label={t("team.form.statusLabel")}
            required
            value={status}
            onChange={(event) => setStatus(event.target.value as TeamMemberStatus)}
            options={[
              { value: "active", label: t("team.status.active") },
              { value: "inactive", label: t("team.status.inactive") },
            ]}
          />
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("team.form.cancel")}
          </Button>
          <Button type="submit">{mode === "create" ? t("team.form.submitCreate") : t("team.form.submitEdit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
