'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { operatorApi, type OperatorProfile } from '@/lib/operator-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function OperatorProfilePage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    operatorApi
      .getProfile(accessToken, 'Mon entreprise')
      .then((p) => {
        setProfile(p);
        setName(p.name);
        setEmail(p.contact_email ?? '');
        setPhone(p.contact_phone ?? '');
        setAddress(p.address ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'));
  }, [accessToken]);

  async function save(): Promise<void> {
    if (!accessToken) return;
    setError(null);
    setSaved(false);
    try {
      const p = await operatorApi.updateProfile(accessToken, {
        name,
        contact_email: email || undefined,
        contact_phone: phone || undefined,
        address: address || undefined,
      });
      setProfile(p);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  if (!profile) return <p>Chargement…</p>;

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-xl font-semibold">Profil de l’entreprise</h2>
      <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="Email de contact"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Téléphone (E.164)"
        value={phone}
        placeholder="+22501020304"
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        label="Adresse"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-800">
          Profil enregistré.
        </p>
      )}
      <div>
        <Button onClick={save}>Enregistrer</Button>
      </div>
    </section>
  );
}
