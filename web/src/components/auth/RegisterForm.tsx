'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema, type RegisterInput } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';

export function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { register: registerUser, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const phoneValue = values.phone && values.phone.length > 0 ? values.phone : undefined;
      await registerUser({
        email: values.email,
        password: values.password,
        phone: phoneValue,
      });
      // Auto-login after successful registration
      await login({ email: values.email, password: values.password });
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
        autoComplete="new-password"
        {...form.register('password')}
        error={form.formState.errors.password?.message}
      />
      <Input
        label={t('confirmPassword')}
        type="password"
        autoComplete="new-password"
        {...form.register('confirmPassword')}
        error={form.formState.errors.confirmPassword?.message}
      />
      <Input
        label={t('phone')}
        type="tel"
        placeholder="+22990000000"
        autoComplete="tel"
        {...form.register('phone')}
        error={form.formState.errors.phone?.message}
      />

      {serverError && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('registering') : t('register')}
      </Button>
    </form>
  );
}
