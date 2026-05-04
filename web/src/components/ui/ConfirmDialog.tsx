'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly onConfirm: () => void;
  readonly destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmer',
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  function handleConfirm() {
    onConfirm();
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/40',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[min(calc(100vw-2rem),28rem)] max-w-md',
            'rounded-xl bg-[var(--color-surface-elevated)] p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'focus:outline-none',
          )}
        >
          <Dialog.Title className="text-[length:var(--text-heading)] font-semibold text-[var(--color-text)]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-[length:var(--text-base)] leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </Dialog.Description>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              variant={destructive ? 'destructive' : 'primary'}
              size="sm"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
