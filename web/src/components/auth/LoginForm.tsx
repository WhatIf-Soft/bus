'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginSchema, type LoginInput } from '@/lib/schemas';
import { useAuth, TwoFactorRequiredError } from '@/hooks/useAuth';

interface LoginFormProps {
  readonly onRequires2FA?: (email: string, password: string) => void;
}

export function LoginForm({ onRequires2FA }: LoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Demo-fill: listen for events from DemoHintBanner to pre-fill the form.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ email: string; password: string }>).detail;
      if (!detail) return;
      form.setValue('email', detail.email);
      form.setValue('password', detail.password);
    };
    window.addEventListener('bex-demo-fill', handler);
    return () => window.removeEventListener('bex-demo-fill', handler);
  }, [form]);

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      await login(values);
      router.push('/account');
    } catch (error: unknown) {
      if (error instanceof TwoFactorRequiredError) {
        onRequires2FA?.(values.email, values.password);
        return;
      }
      setServerError(error instanceof Error ? error.message : t('errorGeneric'));
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Input
        label={t('email')}
        type="email"
        autoComplete="email"
        {...form.register('email')}
        error={form.formState.errors.email?.message}
      />
      <Input
        label={t('password')}
        type="password"
        autoComplete="current-password"
        {...form.register('password')}
        error={form.formState.errors.password?.message}
      />

      {serverError && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('loggingIn') : t('login')}
      </Button>
    </form>
  );
}
