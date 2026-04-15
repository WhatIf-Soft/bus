'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  operatorApi,
  type BaggagePolicy,
  type CancellationPolicy,
} from '@/lib/operator-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function PoliciesPage() {
  const { accessToken } = useAuth();
  const [cancel, setCancel] = useState<Omit<CancellationPolicy, 'updated_at'>>({
    refund_pct_24h: 100,
    refund_pct_2_to_24h: 50,
    refund_pct_under_2h: 0,
  });
  const [baggage, setBaggage] = useState<Omit<BaggagePolicy, 'updated_at'>>({
    free_kg: 20,
    extra_fee_per_kg_cents: 50000,
    max_kg_per_passenger: 50,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedCancel, setSavedCancel] = useState(false);
  const [savedBaggage, setSavedBaggage] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    operatorApi.getCancellationPolicy(accessToken).then((p) =>
      setCancel({
        refund_pct_24h: p.refund_pct_24h,
        refund_pct_2_to_24h: p.refund_pct_2_to_24h,
        refund_pct_under_2h: p.refund_pct_under_2h,
      }),
    );
    operatorApi.getBaggagePolicy(accessToken).then((p) =>
      setBaggage({
        free_kg: p.free_kg,
        extra_fee_per_kg_cents: p.extra_fee_per_kg_cents,
        max_kg_per_passenger: p.max_kg_per_passenger,
      }),
    );
  }, [accessToken]);

  async function saveCancel(): Promise<void> {
    if (!accessToken) return;
    setError(null);
    setSavedCancel(false);
    try {
      await operatorApi.updateCancellationPolicy(accessToken, cancel);
      setSavedCancel(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  async function saveBaggage(): Promise<void> {
    if (!accessToken) return;
    setError(null);
    setSavedBaggage(false);
    try {
      await operatorApi.updateBaggagePolicy(accessToken, baggage);
      setSavedBaggage(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-md border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Politique d’annulation</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Pourcentage de remboursement selon le délai avant le départ. Défauts spec : 100/50/0%.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Input
            label="Plus de 24 h avant (%)"
            type="number"
            min={0}
            max={100}
            value={cancel.refund_pct_24h}
            onChange={(e) => setCancel({ ...cancel, refund_pct_24h: Number(e.target.value) })}
          />
          <Input
            label="Entre 2 h et 24 h (%)"
            type="number"
            min={0}
            max={100}
            value={cancel.refund_pct_2_to_24h}
            onChange={(e) => setCancel({ ...cancel, refund_pct_2_to_24h: Number(e.target.value) })}
          />
          <Input
            label="Moins de 2 h (%)"
            type="number"
            min={0}
            max={100}
            value={cancel.refund_pct_under_2h}
            onChange={(e) => setCancel({ ...cancel, refund_pct_under_2h: Number(e.target.value) })}
          />
        </div>
        {savedCancel && (
          <p role="status" className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">
            Politique enregistrée.
          </p>
        )}
        <div className="mt-3">
          <Button onClick={saveCancel}>Enregistrer</Button>
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Politique bagages</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Franchise gratuite, surcoût par kg supplémentaire, plafond par passager.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Input
            label="Franchise gratuite (kg)"
            type="number"
            min={0}
            max={100}
            value={baggage.free_kg}
            onChange={(e) => setBaggage({ ...baggage, free_kg: Number(e.target.value) })}
          />
          <Input
            label="Surcoût par kg (cents)"
            type="number"
            min={0}
            value={baggage.extra_fee_per_kg_cents}
            onChange={(e) =>
              setBaggage({ ...baggage, extra_fee_per_kg_cents: Number(e.target.value) })
            }
          />
          <Input
            label="Maximum par passager (kg)"
            type="number"
            min={1}
            max={200}
            value={baggage.max_kg_per_passenger}
            onChange={(e) =>
              setBaggage({ ...baggage, max_kg_per_passenger: Number(e.target.value) })
            }
          />
        </div>
        {savedBaggage && (
          <p role="status" className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">
            Politique enregistrée.
          </p>
        )}
        <div className="mt-3">
          <Button onClick={saveBaggage}>Enregistrer</Button>
        </div>
      </div>
    </section>
  );
}
