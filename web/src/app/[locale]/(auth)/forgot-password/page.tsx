'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // Demo mode: simulate sending
    await new Promise((r) => setTimeout(r, 650));
    setSent(true);
    setSubmitting(false);
    toast.success('Lien envoyé', {
      description: 'Consultez votre boîte de réception.',
    });
  }

  return (
    <section className="relative flex min-h-[75vh] items-center justify-center py-[var(--space-section)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 30% 30%, oklch(72% 0.17 70 / 0.08), transparent 60%), radial-gradient(ellipse 60% 50% at 70% 70%, oklch(35% 0.15 260 / 0.08), transparent 60%)',
        }}
      />

      <div className="mx-auto w-full max-w-md px-4">
        <div className="animate-scale-in rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-8 shadow-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-warm)]/15">
              {sent ? (
                <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" />
              ) : (
                <Mail className="h-7 w-7 text-[var(--color-accent-warm-ink)]" />
              )}
            </div>
            <div>
              <h1 className="display text-3xl font-medium tracking-tight">
                {sent ? 'Vérifiez votre email' : 'Mot de passe oublié ?'}
              </h1>
              <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
                {sent
                  ? `Un lien de réinitialisation a été envoyé à ${email}. Le lien expire dans 30 minutes.`
                  : 'Entrez votre email et nous vous enverrons un lien pour choisir un nouveau mot de passe.'}
              </p>
            </div>
          </div>

          {!sent && (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <Input
                type="email"
                label="Email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
              <Button type="submit" disabled={submitting || !email.trim()} className="w-full">
                {submitting ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
            </form>
          )}

          {sent && (
            <div className="mt-6 flex flex-col gap-2 text-center text-sm text-[var(--color-text-muted)]">
              <p>Rien reçu ? Vérifiez vos spams ou réessayez avec un autre email.</p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="font-medium text-[var(--color-accent-warm-ink)] hover:underline"
              >
                Réessayer avec un autre email
              </button>
            </div>
          )}

          <footer className="mt-6 flex items-center justify-center gap-1.5 border-t border-black/5 pt-6 text-sm text-[var(--color-text-muted)]">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-accent-warm-ink)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Link>
          </footer>
        </div>
      </div>
    </section>
  );
}
