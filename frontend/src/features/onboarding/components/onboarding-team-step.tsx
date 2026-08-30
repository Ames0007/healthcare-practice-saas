"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TeamRole } from "@/components/domain/team/types";
import { isValidEmail, isValidMoroccanPhone } from "@/features/patients/patient-form-validation";
import { generateDraftTeamMemberId, type OnboardingDraftTeamMember } from "../onboarding-state";

const ROLE_ORDER: TeamRole[] = ["practitioner", "receptionist", "assistant", "manager", "other"];

interface DraftFormValues {
  firstName: string;
  lastName: string;
  professionalTitle: string;
  role: TeamRole;
  phone: string;
  email: string;
}

const EMPTY_DRAFT: DraftFormValues = { firstName: "", lastName: "", professionalTitle: "", role: "practitioner", phone: "", email: "" };

export interface OnboardingTeamStepProps {
  members: OnboardingDraftTeamMember[];
  onChange: (members: OnboardingDraftTeamMember[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Step 4 — Équipe (task §22/§23) — explicitly OPTIONAL and non-blocking,
 * matching Spec #2 §6.6's own framing ("Add receptionist/staff... Optional
 * staff/integrations do not block first use") since no wireframe defines a
 * dedicated mandatory Team screen (grep-confirmed). Captures only
 * `OnboardingDraftTeamMember`'s bounded field list — never a
 * `TeamMemberFormValues` reused wholesale (that type carries
 * `startDate`/`status`/etc. this draft has no honest value for yet), and
 * never creates a `UserAccount`/login credential (task §22-23). Reuses
 * `isValidEmail`/`isValidMoroccanPhone` outright — the same two validators
 * `TeamMemberFormDialog` itself uses (task §33), applied only when a
 * value is actually entered (both fields stay optional).
 */
export function OnboardingTeamStep({ members, onChange, onContinue, onBack }: OnboardingTeamStepProps) {
  const { t } = useLocale();
  const [draft, setDraft] = useState<DraftFormValues>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!draft.firstName.trim()) nextErrors.firstName = t("onboarding.team.requiredError");
    if (!draft.lastName.trim()) nextErrors.lastName = t("onboarding.team.requiredError");
    if (draft.phone.trim() && !isValidMoroccanPhone(draft.phone)) nextErrors.phone = t("onboarding.team.invalidPhoneError");
    if (draft.email.trim() && !isValidEmail(draft.email)) nextErrors.email = t("onboarding.team.invalidEmailError");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const created: OnboardingDraftTeamMember = {
      id: generateDraftTeamMemberId(members.length + 1),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      professionalTitle: draft.professionalTitle.trim(),
      role: draft.role,
      phone: draft.phone.trim(),
      email: draft.email.trim(),
    };
    onChange([...members, created]);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  }

  function handleRemove(id: string) {
    onChange(members.filter((member) => member.id !== id));
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text">{t("onboarding.team.heading")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("onboarding.team.description")}</p>

      {members.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{t("onboarding.team.emptyNotice")}</p>
      ) : (
        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase text-text-muted">{t("onboarding.team.addedListTitle")}</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-text">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t(`team.role.${member.role}`)}
                    {member.professionalTitle && ` · ${member.professionalTitle}`}
                  </p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => handleRemove(member.id)}>
                  {t("onboarding.team.removeAction")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleAdd} noValidate className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("onboarding.team.firstNameLabel")}
            required
            value={draft.firstName}
            onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
            error={errors.firstName}
          />
          <Input
            label={t("onboarding.team.lastNameLabel")}
            required
            value={draft.lastName}
            onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
            error={errors.lastName}
          />
          <Input
            label={t("onboarding.team.professionalTitleLabel")}
            value={draft.professionalTitle}
            onChange={(event) => setDraft((current) => ({ ...current, professionalTitle: event.target.value }))}
          />
          <Select
            label={t("onboarding.team.roleLabel")}
            required
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as TeamRole }))}
            options={ROLE_ORDER.map((role) => ({ value: role, label: t(`team.role.${role}`) }))}
          />
          <Input
            label={t("onboarding.team.phoneLabel")}
            value={draft.phone}
            onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
            error={errors.phone}
          />
          <Input
            type="email"
            label={t("onboarding.team.emailLabel")}
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            error={errors.email}
          />
        </div>
        <div>
          <Button type="submit" variant="outline" size="sm">
            {t("onboarding.team.addButton")}
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 mt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("onboarding.nav.back")}
        </Button>
        <Button type="button" onClick={onContinue}>
          {t("onboarding.nav.continue")}
        </Button>
      </div>
    </Card>
  );
}
