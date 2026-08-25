"use client";

import { useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface ComboboxItem {
  id: string;
  label: string;
  description?: string;
}

export interface ComboboxProps {
  label: string;
  placeholder?: string;
  items: ComboboxItem[];
  value: string | null;
  onChange: (id: string) => void;
  emptyMessage: string;
  error?: string;
  required?: boolean;
  createLabel?: string;
  /** Receives the current search text so the caller can create a custom entry from it (UI-005A §15) — the existing quick-create-patient caller ignores the argument. */
  onCreate?: (query: string) => void;
}

/**
 * Searchable single-select combobox (Spec #8 §31) — used for Patient
 * selection in the appointment form. Keyboard-navigable (arrows/enter/
 * escape), with an optional trailing "create new" action.
 */
export function Combobox({
  label,
  placeholder,
  items,
  value,
  onChange,
  emptyMessage,
  error,
  required,
  createLabel,
  onCreate,
}: ComboboxProps) {
  const selected = items.find((item) => item.id === value) ?? null;
  /**
   * `null` = not actively editing: the input displays `selected.label`,
   * derived at render time rather than synced via an effect. Typing sets
   * this to the in-progress query; selecting/blurring resets it to `null`.
   */
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listboxId = useId();

  const displayValue = query ?? selected?.label ?? "";
  const filtered = items.filter((item) => item.label.toLowerCase().includes((query ?? "").toLowerCase()));
  const optionCount = filtered.length + (onCreate ? 1 : 0);

  function selectItem(item: ComboboxItem) {
    onChange(item.id);
    setQuery(null);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (containerRef.current?.contains(event.relatedTarget as Node)) {
      return;
    }
    setOpen(false);
    setQuery(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, optionCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        selectItem(filtered[activeIndex]);
      } else if (onCreate && activeIndex === filtered.length) {
        onCreate(query ?? "");
        setQuery(null);
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef} onBlur={handleBlur}>
      <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-invalid={!!error || undefined}
          autoComplete="off"
          value={displayValue}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-10 w-full rounded-md border bg-surface px-3 text-sm text-text",
            "placeholder:text-text-muted",
            error ? "border-danger" : "border-border-strong",
          )}
        />

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-ds-md"
          >
            {filtered.length === 0 && !onCreate && (
              <li className="px-3 py-2 text-sm text-text-muted">{emptyMessage}</li>
            )}

            {filtered.map((item, index) => (
              <li
                key={item.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={item.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectItem(item)}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm text-text",
                  index === activeIndex ? "bg-primary-soft text-primary" : "hover:bg-surface-subtle",
                )}
              >
                {item.label}
                {item.description && <span className="ms-2 text-xs text-text-muted">{item.description}</span>}
              </li>
            ))}

            {onCreate && createLabel && (
              <li
                id={`${listboxId}-${filtered.length}`}
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onCreate(query ?? "");
                  setQuery(null);
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                className={cn(
                  "cursor-pointer border-t border-border px-3 py-2 text-sm font-medium text-primary",
                  filtered.length === activeIndex ? "bg-primary-soft" : "hover:bg-surface-subtle",
                )}
              >
                {createLabel}
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
