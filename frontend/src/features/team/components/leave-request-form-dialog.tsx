"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import type { LeaveRequestFormValues, LeaveType } from "@/components/domain/team/types";
import { isValidLeaveDateRange } from "@/features/team/leave";

export interface LeaveRequestFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveRequestFormValues) => void;
}

const LEAVE_TYPE_OPTIONS: LeaveType[] = ["annual", "sick", "unpaid", "other"];

const EMPTY_VALUES: LeaveRequestFormValues = { leaveType: "annual", startDate: "", endDate: "", reason: "" };

/** Bounded leave-request prototype form (UI-007CDEF §31) — create-only, no draft/attachment workflow. */
export function LeaveRequestFormDialog({ open, onClose, onSubmit }: LeaveRequestFormDialogProps) {
  const { t } = useLocale();
  const [leaveType, setLeaveType] = useState<LeaveType>(EMPTY_VALUES.leaveType);
  const [startDate, setStartDate] = useState(EMPTY_VALUES.startDate);
  const [endDate, setEndDate] = useState(EMPTY_VALUES.endDate);
  const [reason, setReason] = useState(EMPTY_VALUES.reason);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): Record<string, string> {
    const required = t("team.form.requiredError");
    const nextErrors: Record<string, string> = {};

    if (!startDate) nextErrors.startDate = required;
    if (!endDate) nextErrors.endDate = required;
    if (startDate && endDate && !isValidLeaveDateRange(startDate, endDate)) {
      nextErrors.endDate = t("teamDetail.leave.form.dateRangeError");
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

    onSubmit({ leaveType, startDate, endDate, reason: reason.trim() });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="drawer"
      label={t("teamDetail.leave.form.title")}
      closeLabel={t("team.form.close")}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{t("teamDetail.leave.form.title")}</h2>

        <section className="flex flex-col gap-4">
          <Select
            label={t("teamDetail.leave.typeLabel")}
            required
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value as LeaveType)}
            options={LEAVE_TYPE_OPTIONS.map((option) => ({ value: option, label: t(LEAVE_TYPE_MAP[option].translationKey) }))}
          />
          <Input
            type="date"
            label={t("teamDetail.leave.startDateLabel")}
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            error={errors.startDate}
          />
          <Input
            type="date"
            label={t("teamDetail.leave.endDateLabel")}
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            error={errors.endDate}
          />
          <Textarea
            label={t("teamDetail.leave.reasonLabel")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("team.form.cancel")}
          </Button>
          <Button type="submit">{t("teamDetail.leave.form.submit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
