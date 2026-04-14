'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { twoFactorSchema, type TwoFactorInput } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';

interface TwoFactorFormProps {
  readonly email: string;
  readonly password: string;
}

export function TwoFactorForm({ email, password }: TwoFactorFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login2FA } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TwoFactorInput>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: TwoFactorInput) {
    setServerError(null);
    try {
      await login2FA({ email, password, code: values.code });
      router.push('/account');
    } catch (error: unknown) {
      setServerError(error instanceof Error ? error.message : t('errorGeneric'));
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <p className="text-sm text-[var(--color-text-muted)]">
        {t('twoFactorHelp')}
      </p>
      <Input
        label={t('twoFactorCode')}
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        {...form.register('code')}
        error={form.formState.errors.code?.message}
      />

      {serverError && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('verifying') : t('verify')}
      </Button>
    </form>
  );
}
