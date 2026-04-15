'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  operatorApi,
  type Bus,
  type BusClass,
  type BusStatus,
} from '@/lib/operator-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const CLASSES: ReadonlyArray<BusClass> = ['standard', 'vip', 'sleeper'];
const STATUSES: ReadonlyArray<BusStatus> = ['active', 'maintenance', 'retired'];

export default function FleetPage() {
  const { accessToken } = useAuth();
  const [buses, setBuses] = useState<ReadonlyArray<Bus>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // create form state
  const [licensePlate, setLicensePlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [busClass, setBusClass] = useState<BusClass>('standard');
  const [amenities, setAmenities] = useState('ac');

  async function reload(token: string): Promise<void> {
    try {
      const r = await operatorApi.listBuses(token);
      setBuses(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    void reload(accessToken);
  }, [accessToken]);

  async function add(): Promise<void> {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      await operatorApi.createBus(accessToken, {
        license_plate: licensePlate.trim(),
        model: model.trim(),
        capacity,
        class: busClass,
        amenities: amenities
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0),
      });
      setLicensePlate('');
      setModel('');
      setCapacity(50);
      setBusClass('standard');
      setAmenities('ac');
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function patchStatus(b: Bus, status: BusStatus): Promise<void> {
    if (!accessToken) return;
    try {
      await operatorApi.updateBus(accessToken, b.id, { status });
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  async function remove(b: Bus): Promise<void> {
    if (!accessToken) return;
    if (!confirm(`Supprimer ${b.license_plate} ?`)) return;
    try {
      await operatorApi.deleteBus(accessToken, b.id);
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-md border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Ajouter un bus</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Immatriculation"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            required
          />
          <Input
            label="Modèle"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
          <Input
            label="Capacité"
            type="number"
            min={1}
            max={80}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[var(--text-small)] font-medium">Classe</label>
            <select
              value={busClass}
              onChange={(e) => setBusClass(e.target.value as BusClass)}
              className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-transparent px-3"
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Équipements (séparés par virgules)"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
            placeholder="ac, wifi, usb"
          />
        </div>
        {error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div>
          <Button onClick={add} disabled={submitting || licensePlate === '' || model === ''}>
            {submitting ? 'Ajout…' : 'Ajouter le bus'}
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold">Flotte ({buses.length})</h2>
      {buses.length === 0 ? (
        <p className="rounded bg-black/5 p-4 text-center">Aucun bus enregistré.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--color-text-muted)]">
                <th className="px-2 py-2">Immat.</th>
                <th className="px-2 py-2">Modèle</th>
                <th className="px-2 py-2">Capacité</th>
                <th className="px-2 py-2">Classe</th>
                <th className="px-2 py-2">Statut</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {buses.map((b) => (
                <tr key={b.id} className="border-t border-black/5">
                  <td className="px-2 py-2 font-mono">{b.license_plate}</td>
                  <td className="px-2 py-2">{b.model}</td>
                  <td className="px-2 py-2">{b.capacity}</td>
                  <td className="px-2 py-2 uppercase">{b.class}</td>
                  <td className="px-2 py-2">
                    <select
                      value={b.status}
                      onChange={(e) => patchStatus(b, e.target.value as BusStatus)}
                      className="h-8 rounded border border-black/10 bg-transparent px-2 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Button size="sm" variant="destructive" onClick={() => remove(b)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
