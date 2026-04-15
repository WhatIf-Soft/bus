'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  operatorApi,
  type Driver,
  type DriverStatus,
} from '@/lib/operator-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const STATUSES: ReadonlyArray<DriverStatus> = ['active', 'on_leave', 'suspended', 'former'];

export default function DriversPage() {
  const { accessToken } = useAuth();
  const [drivers, setDrivers] = useState<ReadonlyArray<Driver>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState(
    new Date(Date.now() + 365 * 24 * 3_600_000).toISOString().slice(0, 10),
  );

  async function reload(token: string): Promise<void> {
    try {
      const r = await operatorApi.listDrivers(token);
      setDrivers(r.items);
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
      await operatorApi.createDriver(accessToken, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        license_number: licenseNumber.trim(),
        phone: phone.trim() || undefined,
        license_expires_at: licenseExpiresAt,
      });
      setFirstName('');
      setLastName('');
      setLicenseNumber('');
      setPhone('');
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function patchStatus(d: Driver, status: DriverStatus): Promise<void> {
    if (!accessToken) return;
    try {
      await operatorApi.updateDriver(accessToken, d.id, { status });
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  async function remove(d: Driver): Promise<void> {
    if (!accessToken) return;
    if (!confirm(`Supprimer ${d.first_name} ${d.last_name} ?`)) return;
    try {
      await operatorApi.deleteDriver(accessToken, d.id);
      await reload(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-md border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Ajouter un conducteur</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <Input
            label="N° de permis"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
          />
          <Input
            label="Téléphone (E.164)"
            value={phone}
            placeholder="+22501020304"
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Permis valable jusqu’au"
            type="date"
            value={licenseExpiresAt}
            onChange={(e) => setLicenseExpiresAt(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div>
          <Button
            onClick={add}
            disabled={submitting || firstName === '' || lastName === '' || licenseNumber === ''}
          >
            {submitting ? 'Ajout…' : 'Ajouter le conducteur'}
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold">Conducteurs ({drivers.length})</h2>
      {drivers.length === 0 ? (
        <p className="rounded bg-black/5 p-4 text-center">Aucun conducteur enregistré.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--color-text-muted)]">
                <th className="px-2 py-2">Nom</th>
                <th className="px-2 py-2">Permis</th>
                <th className="px-2 py-2">Expire</th>
                <th className="px-2 py-2">Statut</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-t border-black/5">
                  <td className="px-2 py-2">
                    {d.first_name} {d.last_name}
                  </td>
                  <td className="px-2 py-2 font-mono">{d.license_number}</td>
                  <td className="px-2 py-2">{d.license_expires_at}</td>
                  <td className="px-2 py-2">
                    <select
                      value={d.status}
                      onChange={(e) => patchStatus(d, e.target.value as DriverStatus)}
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
                    <Button size="sm" variant="destructive" onClick={() => remove(d)}>
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
