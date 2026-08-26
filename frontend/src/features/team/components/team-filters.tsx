"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import type { TeamRole, TeamRoleFilter, TeamStatusFilter } from "@/components/domain/team/types";

export interface TeamFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: TeamRoleFilter;
  onRoleChange: (value: TeamRoleFilter) => void;
  /** Roles actually represented in the current data set (§21: never show an empty role option). */
  availableRoles: TeamRole[];
  status: TeamStatusFilter;
  onStatusChange: (value: TeamStatusFilter) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  resultCount: number;
}

/** Search + lightweight role/status filters (UI-007A §20-24), mirroring `PatientsFilters`. */
export function TeamFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  availableRoles,
  status,
  onStatusChange,
  hasActiveFilters,
  onClearFilters,
  resultCount,
}: TeamFiltersProps) {
  const { t } = useLocale();

  const statusOptions: { value: TeamStatusFilter; label: string }[] = [
    { value: "all", label: t("team.filters.allStatuses") },
    { value: "active", label: t("team.status.active") },
    { value: "inactive", label: t("team.status.inactive") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label={t("team.searchLabel")}
            placeholder={t("team.searchLabel")}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            aria-label={t("team.filters.roleLabel")}
            value={role}
            onChange={(event) => onRoleChange(event.target.value as TeamRoleFilter)}
            options={[
              { value: "all", label: t("team.filters.allRoles") },
              ...availableRoles.map((availableRole) => ({
                value: availableRole,
                label: t(TEAM_ROLE_MAP[availableRole].translationKey),
              })),
            ]}
            className="w-auto"
          />
          <Select
            aria-label={t("team.filters.statusLabel")}
            value={status}
            onChange={(event) => onStatusChange(event.target.value as TeamStatusFilter)}
            options={statusOptions}
            className="w-auto"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted" aria-live="polite">
          {t("team.resultCount", { count: resultCount })}
        </p>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            {t("team.filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
