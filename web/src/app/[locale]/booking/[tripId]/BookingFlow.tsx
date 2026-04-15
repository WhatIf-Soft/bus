'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Trip } from '@/lib/search-api';
import {
  createBooking,
  type Booking,
  type PassengerInput,
} from '@/lib/booking-api';
import {
  initiatePayment,
  simulateWebhook,
  getPayment,
  type CardInput,
  type Payment,
  type PaymentMethod,
} from '@/lib/payment-api';
import { issueTickets } from '@/lib/ticket-api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { SeatMap } from '@/components/booking/SeatMap';
import { PassengerForm } from '@/components/booking/PassengerForm';
import { LockTimer } from '@/components/booking/LockTimer';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { PaymentMethodSelect } from '@/components/payment/PaymentMethodSelect';
import { CardForm } from '@/components/payment/CardForm';
import { MobileMoneyForm } from '@/components/payment/MobileMoneyForm';

interface BookingFlowProps {
  readonly trip: Trip;
  readonly locale: string;
}

type Step = 'select' | 'passengers' | 'pay' | 'wait_mm' | 'done';

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

const EMPTY_CARD: CardInput = {
  number: '',
  exp_month: 0,
  exp_year: 0,
  cvc: '',
  name: '',
};

export function BookingFlow({ trip, locale }: BookingFlowProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('select');
  const [seats, setSeats] = useState<ReadonlyArray<string>>([]);
  const [passengers, setPassengers] = useState<ReadonlyArray<PassengerInput>>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [card, setCard] = useState<CardInput>(EMPTY_CARD);
  const [msisdn, setMsisdn] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPassengers((prev) =>
      seats.map(
        (seat) =>
          prev.find((p) => p.seat_number === seat) ?? {
            seat_number: seat,
            first_name: '',
            last_name: '',
            category: 'adult',
          },
      ),
    );
  }, [seats]);

  useEffect(() => {
    if (!isAuthenticated) {
      const next = encodeURIComponent(`/${locale}/booking/${trip.id}`);
      router.replace(`/${locale}/login?next=${next}`);
    }
  }, [isAuthenticated, router, locale, trip.id]);

  // Poll Mobile Money payment status while waiting.
  useEffect(() => {
    if (step !== 'wait_mm' || !payment || !accessToken) return;
    const id = setInterval(async () => {
      try {
        const p = await getPayment(payment.id, accessToken);
        setPayment(p);
        if (p.status === 'succeeded') {
          clearInterval(id);
          try {
            await issueTickets(p.booking_id, accessToken);
          } catch {
            // tickets can be reissued from the booking detail page
          }
          setStep('done');
          router.push(`/${locale}/account/bookings/${p.booking_id}`);
        } else if (p.status === 'failed' || p.status === 'cancelled') {
          clearInterval(id);
          setError('Le paiement a échoué. Veuillez réessayer.');
          setStep('pay');
        }
      } catch {
        // ignore transient
      }
    }, 3000);
    return () => clearInterval(id);
  }, [step, payment, accessToken, router, locale]);

  const passengersComplete = useMemo(
    () =>
      passengers.length === seats.length &&
      passengers.every((p) => p.first_name.trim() !== '' && p.last_name.trim() !== ''),
    [passengers, seats],
  );

  async function holdSeats(): Promise<void> {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createBooking(
        { trip_id: trip.id, seats: passengers },
        accessToken,
        newIdempotencyKey(),
      );
      setBooking(result);
      setStep('pay');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }

  function isMobileMoney(m: PaymentMethod): boolean {
    return m !== 'card';
  }

  async function pay(): Promise<void> {
    if (!accessToken || !booking) return;
    setSubmitting(true);
    setError(null);
    try {
      const p = await initiatePayment(
        {
          booking_id: booking.id,
          method,
          card: method === 'card' ? card : undefined,
          msisdn: isMobileMoney(method) ? msisdn : undefined,
        },
        accessToken,
        newIdempotencyKey(),
      );
      setPayment(p);

      if (p.status === 'succeeded') {
        try {
          await issueTickets(booking.id, accessToken);
        } catch {
          // tickets can be reissued from the booking detail page
        }
        setStep('done');
        router.push(`/${locale}/account/bookings/${booking.id}`);
        return;
      }
      if (p.status === 'failed') {
        setError(p.failure_reason ?? 'Le paiement a échoué.');
        return;
      }
      // processing → mobile money waiting screen
      setStep('wait_mm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  }

  async function devSimulateConfirm(success: boolean): Promise<void> {
    if (!accessToken || !payment) return;
    setSubmitting(true);
    try {
      await simulateWebhook(payment.id, success, accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur webhook');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return <p>Redirection…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {step === 'select' && (
        <>
          <h2 className="text-xl font-semibold">1. Choisissez vos sièges</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Maximum 9 sièges par réservation.
          </p>
          <SeatMap
            tripId={trip.id}
            availableSeats={trip.available_seats}
            selected={seats}
            maxSelection={9}
            onChange={setSeats}
          />
          <div className="flex justify-end">
            <Button onClick={() => setStep('passengers')} disabled={seats.length === 0}>
              Continuer ({seats.length})
            </Button>
          </div>
        </>
      )}

      {step === 'passengers' && (
        <>
          <h2 className="text-xl font-semibold">2. Passagers</h2>
          <PassengerForm seats={seats} passengers={passengers} onChange={setPassengers} />
          {error && (
            <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('select')}>
              ← Sièges
            </Button>
            <Button onClick={holdSeats} disabled={!passengersComplete || submitting}>
              {submitting ? 'Réservation…' : 'Réserver les sièges'}
            </Button>
          </div>
        </>
      )}

      {step === 'pay' && booking && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">3. Paiement</h2>
            <LockTimer
              expiresAt={booking.lock_expires_at}
              onExpire={() => {
                setError('Votre réservation a expiré. Veuillez recommencer.');
                setStep('select');
                setBooking(null);
              }}
            />
          </div>

          <BookingSummary trip={trip} booking={booking} />

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Mode de paiement
            </h3>
            <PaymentMethodSelect value={method} onChange={setMethod} />
          </div>

          {method === 'card' ? (
            <CardForm value={card} onChange={setCard} />
          ) : (
            <MobileMoneyForm value={msisdn} onChange={setMsisdn} />
          )}

          {error && (
            <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep('passengers')}>
              ← Modifier
            </Button>
            <Button onClick={pay} disabled={submitting}>
              {submitting ? 'Paiement…' : 'Payer maintenant'}
            </Button>
          </div>
        </>
      )}

      {step === 'wait_mm' && payment && (
        <>
          <h2 className="text-xl font-semibold">Confirmation Mobile Money</h2>
          <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm">
            <p>
              Une demande de paiement a été envoyée au numéro{' '}
              <strong>{payment.msisdn}</strong>. Approuvez le débit depuis votre téléphone.
            </p>
            <p className="mt-2 text-xs text-amber-900">
              Statut actuel : <code>{payment.status}</code>. La page se mettra à jour
              automatiquement (toutes les 3 s).
            </p>
          </div>
          <div className="rounded border border-dashed border-black/20 p-3 text-xs">
            <p className="mb-2 font-medium">🧪 Mode dev — simuler la réponse opérateur :</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => devSimulateConfirm(true)} disabled={submitting}>
                Approuver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => devSimulateConfirm(false)}
                disabled={submitting}
              >
                Refuser
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
