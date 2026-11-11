"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, MoreVertical } from "lucide-react";
export type Choice = {
  value: string;
  label: string;
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
};
export function ChoiceMenu({
  options,
  value,
  onChoose,
  label,
  placeholder = "Select option",
  kind = "listbox",
  disabled = false,
  className = "",
  iconOnly = false,
}: {
  options: Choice[];
  value?: string;
  onChoose: (value: string) => void;
  label?: string;
  placeholder?: string;
  kind?: "listbox" | "menu";
  disabled?: boolean;
  className?: string;
  iconOnly?: boolean;
}) {
  const id = useId(),
    trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
  });
  const selected = options.find((o) => o.value === value);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const width = Math.min(
        Math.max(rect.width, kind === "menu" ? 190 : 0),
        window.innerWidth - 16,
      );
      const below = window.innerHeight - rect.bottom - 12;
      const height = Math.min(280, Math.max(below, rect.top - 12));
      const above = below < 180 && rect.top > below;
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: above
          ? Math.max(
              8,
              rect.top -
                Math.min(panel.current?.scrollHeight || 280, height) -
                4,
            )
          : rect.bottom + 4,
        width,
        maxHeight: Math.max(88, height),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, kind]);
  useEffect(() => {
    if (!open) return;
    const chosen = panel.current?.querySelector<HTMLButtonElement>(
      '[aria-selected="true"]',
    );
    (
      chosen ||
      panel.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")
    )?.focus();
    const outside = (e: PointerEvent) => {
      if (
        !trigger.current?.contains(e.target as Node) &&
        !panel.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs text-[var(--text-2)]"
        >
          {label}
        </label>
      )}
      <button
        id={id}
        ref={trigger}
        type="button"
        data-field={kind === "listbox" || undefined}
        disabled={disabled}
        aria-label={label || (kind === "menu" ? placeholder : undefined)}
        aria-haspopup={kind}
        aria-expanded={open}
        aria-controls={open ? `${id}-choices` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={
          iconOnly
            ? "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--chip)] text-[var(--text-2)] hover:bg-[var(--card)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            : "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--outline)] bg-[var(--surface)] px-3.5 text-left text-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        }
      >
        {iconOnly ? (
          <MoreVertical size={16} aria-hidden="true" />
        ) : (
          <>
            <span className="truncate">
              {kind === "listbox"
                ? selected?.label || placeholder
                : placeholder}
            </span>
            <ChevronDown size={16} className="shrink-0" />
          </>
        )}
      </button>
      {open &&
        createPortal(
          <div
            id={`${id}-choices`}
            ref={panel}
            role={kind}
            aria-label={label || placeholder}
            className="fixed z-[250] overflow-y-auto rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-1 shadow-lg"
            style={position}
            onKeyDown={(e) => {
              const items = Array.from(
                panel.current!.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ),
              );
              const current = items.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
              }
              if (e.key === "Tab") {
                close();
              }
              if (
                ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) &&
                items.length
              ) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? items.length - 1
                      : (current +
                          (e.key === "ArrowDown" ? 1 : -1) +
                          items.length) %
                        items.length;
                items[next]?.focus();
              }
            }}
          >
            {options.length ? (
              options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  role={kind === "menu" ? "menuitem" : "option"}
                  aria-selected={
                    kind === "listbox" ? o.value === value : undefined
                  }
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--card)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-[-2px] disabled:opacity-50 ${o.destructive ? "mt-1 border-t border-[var(--outline)] text-red-700" : "text-[var(--text)]"}`}
                  onClick={() => {
                    close();
                    onChoose(o.value);
                  }}
                >
                  <span>
                    {o.label}
                    {o.description && (
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        {o.description}
                      </span>
                    )}
                  </span>
                  {kind === "listbox" && o.value === value && (
                    <Check size={16} aria-hidden="true" />
                  )}
                </button>
              ))
            ) : (
              <p className="p-3 text-sm">No options available</p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
