"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
export function ConfirmDialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-2xl overflow-auto rounded-2xl bg-[var(--surface)] p-5 text-[var(--text)] shadow-xl backdrop:bg-black/40 sm:p-6"
    >
      <h2 id={titleId} className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>,
    document.body,
  );
}
