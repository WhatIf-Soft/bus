export interface AdminOperatorRow {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly contact: string;
  readonly status: 'pending' | 'approved' | 'suspended' | 'rejected';
  readonly fleetSize: number;
  readonly routesCount: number;
  readonly bookings30d: number;
  readonly rating: number;
  readonly submittedAt: string;
  readonly kyb: {
    readonly business_license: 'verified' | 'pending' | 'missing';
    readonly insurance: 'verified' | 'pending' | 'missing';
    readonly bank_account: 'verified' | 'pending' | 'missing';
  };
}

export const MOCK_ADMIN_OPERATORS: ReadonlyArray<AdminOperatorRow> = [
  { id: 'aop-1', name: 'Sahel Express', country: 'Burkina Faso', contact: 'direction@sahel-express.bf', status: 'pending', fleetSize: 12, routesCount: 8, bookings30d: 0, rating: 0, submittedAt: '2026-04-16', kyb: { business_license: 'verified', insurance: 'pending', bank_account: 'pending' } },
  { id: 'aop-2', name: 'STC Ghana', country: 'Ghana', contact: 'ops@stc.gh', status: 'approved', fleetSize: 45, routesCount: 27, bookings30d: 3821, rating: 4.5, submittedAt: '2025-11-02', kyb: { business_license: 'verified', insurance: 'verified', bank_account: 'verified' } },
  { id: 'aop-3', name: 'UTB Bénin', country: 'Bénin', contact: 'contact@utb.bj', status: 'approved', fleetSize: 23, routesCount: 14, bookings30d: 1452, rating: 4.2, submittedAt: '2025-12-14', kyb: { business_license: 'verified', insurance: 'verified', bank_account: 'verified' } },
  { id: 'aop-4', name: 'Trans Africa', country: 'Sénégal', contact: 'ops@transafrica.sn', status: 'suspended', fleetSize: 18, routesCount: 11, bookings30d: 0, rating: 3.1, submittedAt: '2025-09-23', kyb: { business_license: 'verified', insurance: 'missing', bank_account: 'verified' } },
  { id: 'aop-5', name: 'VVT Burkina', country: 'Burkina Faso', contact: 'ops@vvt.bf', status: 'pending', fleetSize: 7, routesCount: 4, bookings30d: 0, rating: 0, submittedAt: '2026-04-11', kyb: { business_license: 'pending', insurance: 'missing', bank_account: 'pending' } },
  { id: 'aop-6', name: 'Royal Voyages', country: 'Mali', contact: 'info@royal-voyages.ml', status: 'rejected', fleetSize: 3, routesCount: 0, bookings30d: 0, rating: 0, submittedAt: '2026-03-28', kyb: { business_license: 'missing', insurance: 'missing', bank_account: 'missing' } },
];

export interface AdminFraudAlert {
  readonly id: string;
  readonly bookingRef: string;
  readonly mlScore: number;
  readonly userEmail: string;
  readonly reasons: ReadonlyArray<string>;
  readonly amountXof: number;
  readonly openedAt: string;
  readonly slaMinLeft: number;
  readonly status: 'open' | 'review' | 'resolved_legit' | 'resolved_fraud';
}

export const MOCK_FRAUD_ALERTS: ReadonlyArray<AdminFraudAlert> = [
  { id: 'fa-1', bookingRef: 'BEX-2026-9Q4X5P', mlScore: 0.94, userEmail: 'f***ou@gmail.com', reasons: ['Appareil nouveau (1re utilisation)', '4 tentatives CB en 2 min', 'IP différente de l\'appareil', 'Montant inhabituel (+310%)'], amountXof: 124000, openedAt: '08:27', slaMinLeft: 48, status: 'open' },
  { id: 'fa-2', bookingRef: 'BEX-2026-2H6K3W', mlScore: 0.88, userEmail: 'an***14@protonmail.com', reasons: ['Email créé il y a 2 h', 'VPN détecté', '3 comptes créés sur la même CB'], amountXof: 88000, openedAt: '07:58', slaMinLeft: 16, status: 'review' },
  { id: 'fa-3', bookingRef: 'BEX-2026-5M8T2L', mlScore: 0.71, userEmail: 'k***mensah@outlook.com', reasons: ['Réservation inhabituelle (nuit 03:12)', 'Appareil neuf'], amountXof: 46000, openedAt: '06:14', slaMinLeft: 180, status: 'open' },
];

export const MOCK_FRAUD_KPIS = {
  openAlerts: 3,
  avgScore: 0.84,
  autoBlocked24h: 12,
  modelAccuracy: 94.2,
};

export interface AnalyticsSeriesPoint {
  readonly day: string;
  readonly value: number;
}

export const MOCK_REVENUE_SERIES: ReadonlyArray<AnalyticsSeriesPoint> = [
  { day: 'Lun', value: 22000 },
  { day: 'Mar', value: 28000 },
  { day: 'Mer', value: 24000 },
  { day: 'Jeu', value: 34000 },
  { day: 'Ven', value: 42000 },
  { day: 'Sam', value: 38000 },
  { day: 'Dim', value: 26000 },
];

export const MOCK_BOOKINGS_SERIES: ReadonlyArray<AnalyticsSeriesPoint> = [
  { day: 'Lun', value: 140 },
  { day: 'Mar', value: 182 },
  { day: 'Mer', value: 165 },
  { day: 'Jeu', value: 210 },
  { day: 'Ven', value: 268 },
  { day: 'Sam', value: 240 },
  { day: 'Dim', value: 172 },
];

export const MOCK_TOP_ROUTES = [
  { route: 'Abidjan → Ouagadougou', bookings: 318, revenue: 6980000 },
  { route: 'Abidjan → Yamoussoukro', bookings: 271, revenue: 1680000 },
  { route: 'Abidjan → Accra', bookings: 198, revenue: 2970000 },
  { route: 'Lomé → Cotonou', bookings: 162, revenue: 891000 },
  { route: 'Dakar → Bamako', bookings: 145, revenue: 2175000 },
];

export const MOCK_CHANNEL_SHARE = [
  { channel: 'Mobile Money', pct: 58, color: '#FF6600' },
  { channel: 'Carte bancaire', pct: 31, color: '#635BFF' },
  { channel: 'Wave', pct: 8, color: '#1BC5EB' },
  { channel: 'Espèces (agence)', pct: 3, color: '#1F2A68' },
];
