import { z } from 'zod';

const E164 = /^\+[1-9]\d{1,14}$/;
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(STRONG_PASSWORD, 'password must contain upper, lower, and digit'),
    confirmPassword: z.string(),
    phone: z.string().regex(E164).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const twoFactorSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, '6 digits required'),
});
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export const profileUpdateSchema = z.object({
  phone: z.string().regex(E164).optional().or(z.literal('')),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const savedPassengerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  dateOfBirth: z.string().optional().or(z.literal('')),
  documentNumber: z.string().min(4).max(50).optional().or(z.literal('')),
});
export type SavedPassengerInput = z.infer<typeof savedPassengerSchema>;
