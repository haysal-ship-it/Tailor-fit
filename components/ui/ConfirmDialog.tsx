"use client";
import { DialogCloseButton } from '@/components/ui/DialogCloseButton';
import {prepareWorkspaceDialog} from '@/lib/dialog-environment';
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
    const releaseEnvironment=prepareWorkspaceDialog(dialog);
    dialog.showModal();
    return () => {
      releaseEnvironment();
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
      className="workspace-dialog m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-2xl overflow-auto rounded-2xl bg-[var(--surface)] p-5 text-[var(--text)] shadow-xl backdrop:bg-black/40 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={titleId} className="min-w-0 text-lg font-semibold">{title}</h2>
        <DialogCloseButton label={`Close ${title.toLowerCase()}`} disabled={busy} onClose={onClose} />
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
