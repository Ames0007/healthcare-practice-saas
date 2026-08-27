import type { CabinetService, CabinetServiceFormValues } from "@/components/domain/settings/types";

export function sortServicesByName(services: CabinetService[]): CabinetService[] {
  return [...services].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function buildInitialServiceFormValues(service?: CabinetService): CabinetServiceFormValues {
  if (!service) {
    return { name: "", durationMinutes: "", price: "", schedulingMode: "exact", active: true };
  }

  return {
    name: service.name,
    durationMinutes: String(service.durationMinutes),
    price: String(service.price),
    schedulingMode: service.schedulingMode,
    active: service.active,
  };
}

/** Name required; duration/price must be positive whole numbers (mirrors `ItemFormDialog`'s own numeric-field validation shape). */
export function validateServiceForm(
  values: CabinetServiceFormValues,
  messages: { required: string; invalidNumber: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) errors.name = messages.required;

  const duration = Number(values.durationMinutes);
  if (!values.durationMinutes.trim() || !Number.isFinite(duration) || duration <= 0) {
    errors.durationMinutes = messages.invalidNumber;
  }

  const price = Number(values.price);
  if (!values.price.trim() || !Number.isFinite(price) || price < 0) {
    errors.price = messages.invalidNumber;
  }

  return errors;
}

function generateNextServiceId(services: CabinetService[]): string {
  const highest = services.reduce((max, service) => {
    const match = /^svc-(\d+)$/.exec(service.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `svc-${highest + 1}`;
}

/** Builds a new or updated `CabinetService` from validated form values — `id` is preserved on edit, generated on create (mirrors `buildItemFromFormValues`). */
export function buildServiceFromFormValues(
  values: CabinetServiceFormValues,
  existing: CabinetService | undefined,
  services: CabinetService[],
): CabinetService {
  return {
    id: existing?.id ?? generateNextServiceId(services),
    name: values.name.trim(),
    durationMinutes: Number(values.durationMinutes),
    price: Number(values.price),
    schedulingMode: values.schedulingMode,
    active: values.active,
  };
}
