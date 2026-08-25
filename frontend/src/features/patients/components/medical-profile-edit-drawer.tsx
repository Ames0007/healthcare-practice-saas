"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { EntryChip } from "@/components/domain/clinical/entry-chip";
import type { ClinicalCategory, MedicalProfile, MedicalProfileEntry } from "@/components/domain/clinical/types";
import { PATIENTS_TODAY_DATE } from "@/features/patients/mock-data";
import { getClinicalMasterData, getMasterDataLabel, normalizeSearchText } from "@/features/clinical/master-data";

type SectionKey = "allergies" | "history" | "medications";

const SECTION_CATEGORY: Record<SectionKey, ClinicalCategory> = {
  allergies: "allergy",
  history: "history",
  medications: "medication",
};

const SECTIONS: { key: SectionKey; titleKey: string }[] = [
  { key: "allergies", titleKey: "patientDetail.health.allergiesTitle" },
  { key: "history", titleKey: "patientDetail.health.historyTitle" },
  { key: "medications", titleKey: "patientDetail.health.medicationsTitle" },
];

export interface MedicalProfileEditDrawerProps {
  profile: MedicalProfile | null;
  patientId: string;
  practitionerName: string;
  open: boolean;
  onClose: () => void;
  onSave: (updated: MedicalProfile) => void;
}

/**
 * Dossier Santé edit drawer (Spec #9 Screen 19, UI-005A §25-32). Reuses the
 * shared `Dialog` drawer unmodified — no second modal system. Each
 * category is a `Combobox` whose own committed `value` always stays
 * `null`: a selection is immediately appended to this component's local
 * chip list and the field clears for the next search, rather than the
 * combobox holding a single committed value — this reuses `Combobox`
 * entirely as-is (only its `onCreate` signature gained the current query
 * text, a small backward-compatible extension) instead of building a
 * second, separate multi-select autocomplete system (§27). Already-
 * selected master-data items are filtered out of the next search's
 * suggestions, which is what prevents duplicate predefined selection
 * (§50) without any extra bookkeeping.
 */
export function MedicalProfileEditDrawer({ profile, patientId, practitionerName, open, onClose, onSave }: MedicalProfileEditDrawerProps) {
  const { t, locale } = useLocale();
  const masterData = getClinicalMasterData();
  const nextCustomIdRef = useRef(0);

  const [entriesBySection, setEntriesBySection] = useState<Record<SectionKey, MedicalProfileEntry[]>>(() => ({
    allergies: profile?.allergies ?? [],
    history: profile?.medicalHistory ?? [],
    medications: profile?.currentMedications ?? [],
  }));
  const [notes, setNotes] = useState(() => (profile?.importantNotes ?? []).join("\n"));

  function addPredefined(section: SectionKey, itemId: string) {
    const item = masterData.find((candidate) => candidate.id === itemId && candidate.category === SECTION_CATEGORY[section]);
    if (!item) {
      return;
    }
    const entry: MedicalProfileEntry = {
      id: `entry-${item.id}`,
      masterDataId: item.id,
      label: getMasterDataLabel(item, locale),
      custom: false,
    };
    setEntriesBySection((current) => ({ ...current, [section]: [...current[section], entry] }));
  }

  function addCustom(section: SectionKey, query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const normalizedTrimmed = normalizeSearchText(trimmed);
    const category = SECTION_CATEGORY[section];

    // An exact (case/accent-insensitive) match against master data resolves to that
    // predefined item instead of creating a shadow custom duplicate (§11/§15).
    const matched = masterData.find(
      (item) => item.category === category && normalizeSearchText(getMasterDataLabel(item, locale)) === normalizedTrimmed,
    );
    if (matched) {
      addPredefined(section, matched.id);
      return;
    }

    const alreadySelected = entriesBySection[section].some((entry) => normalizeSearchText(entry.label) === normalizedTrimmed);
    if (alreadySelected) {
      return;
    }

    nextCustomIdRef.current += 1;
    const entry: MedicalProfileEntry = { id: `entry-custom-${section}-${nextCustomIdRef.current}`, label: trimmed, custom: true };
    setEntriesBySection((current) => ({ ...current, [section]: [...current[section], entry] }));
  }

  function removeEntry(section: SectionKey, entryId: string) {
    setEntriesBySection((current) => ({ ...current, [section]: current[section].filter((entry) => entry.id !== entryId) }));
  }

  function handleSave() {
    const updated: MedicalProfile = {
      patientId,
      allergies: entriesBySection.allergies,
      medicalHistory: entriesBySection.history,
      currentMedications: entriesBySection.medications,
      importantNotes: notes
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      lastUpdatedAt: PATIENTS_TODAY_DATE,
      lastUpdatedBy: practitionerName,
    };
    onSave(updated);
  }

  const title = t("patientDetail.health.editTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        {SECTIONS.map((section) => {
          const selected = entriesBySection[section.key];
          const availableItems = masterData
            .filter((item) => item.category === SECTION_CATEGORY[section.key])
            .filter((item) => !selected.some((entry) => entry.masterDataId === item.id))
            .map((item) => ({ id: item.id, label: getMasterDataLabel(item, locale) }));

          return (
            <div key={section.key}>
              <Combobox
                label={t(section.titleKey)}
                placeholder={t("patientDetail.health.form.searchPlaceholder")}
                items={availableItems}
                value={null}
                onChange={(itemId) => addPredefined(section.key, itemId)}
                onCreate={(query) => addCustom(section.key, query)}
                createLabel={t("patientDetail.health.form.addCustomEntry")}
                emptyMessage={t("patientDetail.health.form.noSuggestions")}
              />
              {selected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.map((entry) => (
                    <EntryChip key={entry.id} label={entry.label} onRemove={() => removeEntry(section.key, entry.id)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <Textarea
          label={t("patientDetail.health.form.notesLabel")}
          placeholder={t("patientDetail.health.form.notesPlaceholder")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t("patientDetail.health.form.cancel")}
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            {t("patientDetail.health.form.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
