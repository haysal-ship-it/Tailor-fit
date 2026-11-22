import { X } from 'lucide-react';

export function DialogCloseButton({ label, onClose, disabled = false }: {
  label: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClose}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-2)] transition-colors hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-40"
    >
      <X size={18} aria-hidden="true" />
    </button>
  );
}
