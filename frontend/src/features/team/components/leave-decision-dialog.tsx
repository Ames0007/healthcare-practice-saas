"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import type { LeaveRequest } from "@/components/domain/team/types";

export interface LeaveDecisionDialogProps {
  request: LeaveRequest | null;
  decision: "approved" | "rejected";
  onClose: () => void;
  onConfirm: (reviewNote?: string) => void;
}

/**
 * Bounded Approve/Reject prototype action (UI-007CDEF §32) — wraps the
 * existing `ConfirmDialog` primitive (mirrors `CloseConfirmDialog`,
 * UI-006E) rather than a bespoke dialog. A rejection reason is required
 * (mirrors `CashCountDialog`'s "reason required only when it matters"
 * pattern); an approval needs none.
 */
export function LeaveDecisionDialog({ request, decision, onClose, onConfirm }: LeaveDecisionDialogProps) {
  const { t } = useLocale();
  const [reviewNote, setReviewNote] = useState("");

  if (!request) return null;

  const isRejection = decision === "rejected";
  const typeLabel = t(LEAVE_TYPE_MAP[request.leaveType].translationKey);

  return (
    <ConfirmDialog
      open={Boolean(request)}
      onClose={onClose}
      onConfirm={() => onConfirm(isRejection ? reviewNote.trim() : undefined)}
      title={isRejection ? t("teamDetail.leave.rejectConfirmTitle") : t("teamDetail.leave.approveConfirmTitle")}
      description={t("teamDetail.leave.confirmDescription", { type: typeLabel, start: request.startDate, end: request.endDate })}
      cancelLabel={t("team.form.cancel")}
      confirmLabel={isRejection ? t("teamDetail.leave.reject") : t("teamDetail.leave.approve")}
      tone={isRejection ? "danger" : "primary"}
      confirmDisabled={isRejection && reviewNote.trim() === ""}
    >
      {isRejection && (
        <Textarea
          label={t("teamDetail.leave.reviewNoteLabel")}
          required
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
        />
      )}
    </ConfirmDialog>
  );
}
