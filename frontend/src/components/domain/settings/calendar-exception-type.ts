import type { StatusTone } from "@/components/ui/status-badge";
import type { CalendarExceptionType } from "./types";

interface CalendarExceptionTypeMeta {
  translationKey: string;
  tone: StatusTone;
  /** `true` = effective availability is always closed, `intervals` always empty. `false` = an "open" type, `intervals` always required. Never a separately-settable flag (see `CabinetCalendarException`'s own doc comment). */
  isClosed: boolean;
}

/**
 * Central exception-type → label/tone/closed-ness registry (UI-AGENDA-X),
 * mirroring `CABINET_SPECIALTY_MAP`/`PERMISSION_SENSITIVITY_MAP`'s
 * established map pattern — never hardcoded in a component (task §5).
 */
export const CALENDAR_EXCEPTION_TYPE_MAP: Record<CalendarExceptionType, CalendarExceptionTypeMeta> = {
  public_holiday: { translationKey: "parametres.horaires.exceptions.type.publicHoliday", tone: "info", isClosed: true },
  exceptional_closure: { translationKey: "parametres.horaires.exceptions.type.exceptionalClosure", tone: "danger", isClosed: true },
  rest_day: { translationKey: "parametres.horaires.exceptions.type.restDay", tone: "neutral", isClosed: true },
  modified_hours: { translationKey: "parametres.horaires.exceptions.type.modifiedHours", tone: "warning", isClosed: false },
  exceptional_opening: { translationKey: "parametres.horaires.exceptions.type.exceptionalOpening", tone: "success", isClosed: false },
};

export const CALENDAR_EXCEPTION_TYPE_ORDER: CalendarExceptionType[] = [
  "public_holiday",
  "exceptional_closure",
  "rest_day",
  "modified_hours",
  "exceptional_opening",
];
