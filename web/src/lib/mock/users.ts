export interface DemoUser {
  readonly email: string;
  readonly password: string;
  readonly role: 'voyageur' | 'operateur' | 'admin';
  readonly displayName: string;
  readonly phone: string;
  readonly hint: string;
}

export const DEMO_USERS: ReadonlyArray<DemoUser> = [
  {
    email: 'demo@busexpress.africa',
    password: 'demo1234',
    role: 'voyageur',
    displayName: 'Zégué Kurt',
    phone: '+225 07 XX XX 23',
    hint: 'Démo voyageur — 6 réservations, 2 passagers, notifications.',
  },
  {
    email: 'operateur@busexpress.africa',
    password: 'operateur1234',
    role: 'operateur',
    displayName: 'Sahel Express Admin',
    phone: '+226 70 XX XX 12',
    hint: 'Démo opérateur — lignes, horaires, manifestes, embarquement.',
  },
  {
    email: 'admin@busexpress.africa',
    password: 'admin1234',
    role: 'admin',
    displayName: 'Back-office BusExpress',
    phone: '+225 05 XX XX 01',
    hint: 'Démo admin — approbations, paiements, fraude, analytics.',
  },
];

export interface AdminUserRow {
  readonly id: string;
  readonly email: string;
  readonly phone: string | null;
  readonly role: string;
  readonly status: 'active' | 'suspended' | 'deleted';
  readonly created_at: string;
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

export const MOCK_ADMIN_USERS: ReadonlyArray<AdminUserRow> = [
  { id: 'u-0001', email: 'demo@busexpress.africa', phone: '+225 07 00 00 23', role: 'voyageur', status: 'active', created_at: daysAgo(120) },
  { id: 'u-0002', email: 'operateur@busexpress.africa', phone: '+226 70 00 00 12', role: 'operateur', status: 'active', created_at: daysAgo(200) },
  { id: 'u-0003', email: 'admin@busexpress.africa', phone: '+225 05 00 00 01', role: 'admin', status: 'active', created_at: daysAgo(365) },
  { id: 'u-0004', email: 'fatou.diaby@gmail.com', phone: '+221 77 XX XX 12', role: 'voyageur', status: 'active', created_at: daysAgo(42) },
  { id: 'u-0005', email: 'kwame.mensah@outlook.com', phone: '+233 24 XX XX 89', role: 'voyageur', status: 'active', created_at: daysAgo(87) },
  { id: 'u-0006', email: 'aisa.barry@yahoo.fr', phone: '+224 62 XX XX 03', role: 'voyageur', status: 'suspended', created_at: daysAgo(200) },
  { id: 'u-0007', email: 'support1@busexpress.africa', phone: null, role: 'agent_support', status: 'active', created_at: daysAgo(180) },
  { id: 'u-0008', email: 'ops@stc.gh', phone: '+233 30 XX XX 99', role: 'operateur', status: 'active', created_at: daysAgo(430) },
  { id: 'u-0009', email: 'anonymous_47@tempmail.org', phone: null, role: 'voyageur', status: 'suspended', created_at: daysAgo(3) },
  { id: 'u-0010', email: 'marie.ouedraogo@edu.bf', phone: '+226 76 XX XX 71', role: 'voyageur', status: 'active', created_at: daysAgo(16) },
];
