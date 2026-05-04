export interface MockPassenger {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dob: string;
  readonly category: 'adult' | 'child' | 'senior' | 'student';
  readonly idType: 'cni' | 'passport' | 'student_card' | 'none';
  readonly idNumber?: string;
  readonly nationality: string;
}

export const MOCK_PASSENGERS: ReadonlyArray<MockPassenger> = [
  { id: 'p-1', firstName: 'Zégué', lastName: 'Kurt', dob: '1995-03-14', category: 'adult', idType: 'cni', idNumber: 'CI001234567', nationality: 'Côte d\'Ivoire' },
  { id: 'p-2', firstName: 'Aminata', lastName: 'Diallo', dob: '1990-07-22', category: 'adult', idType: 'passport', idNumber: 'SN8902341', nationality: 'Sénégal' },
  { id: 'p-3', firstName: 'Koffi', lastName: 'Kurt', dob: '2018-11-02', category: 'child', idType: 'none', nationality: 'Côte d\'Ivoire' },
  { id: 'p-4', firstName: 'Kofi', lastName: 'Mensah', dob: '1956-04-08', category: 'senior', idType: 'passport', idNumber: 'G4787812', nationality: 'Ghana' },
  { id: 'p-5', firstName: 'Marie', lastName: 'Ouédraogo', dob: '2003-02-19', category: 'student', idType: 'student_card', idNumber: 'ETU-BF-2409', nationality: 'Burkina Faso' },
];
