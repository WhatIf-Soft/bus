import type { Stop } from '@/lib/search-api';

export const MOCK_CITIES: ReadonlyArray<Stop> = [
  { id: 'c-abj', name: 'Gare routière d\'Adjamé', city: 'Abidjan', country: 'CI', latitude: 5.359, longitude: -4.008 },
  { id: 'c-yam', name: 'Gare routière de Yamoussoukro', city: 'Yamoussoukro', country: 'CI', latitude: 6.827, longitude: -5.289 },
  { id: 'c-bou', name: 'Gare routière de Bouaké', city: 'Bouaké', country: 'CI', latitude: 7.691, longitude: -5.032 },
  { id: 'c-fer', name: 'Gare de Ferkessédougou', city: 'Ferkessédougou', country: 'CI', latitude: 9.594, longitude: -5.197 },
  { id: 'c-abo', name: 'Gare d\'Aboisso', city: 'Aboisso', country: 'CI', latitude: 5.468, longitude: -3.204 },
  { id: 'c-oua', name: 'Gare OA Tampouy', city: 'Ouagadougou', country: 'BF', latitude: 12.371, longitude: -1.520 },
  { id: 'c-bob', name: 'Gare de Bobo-Dioulasso', city: 'Bobo-Dioulasso', country: 'BF', latitude: 11.178, longitude: -4.298 },
  { id: 'c-acc', name: 'Accra Mallam Terminal', city: 'Accra', country: 'GH', latitude: 5.603, longitude: -0.187 },
  { id: 'c-kum', name: 'Kumasi Central', city: 'Kumasi', country: 'GH', latitude: 6.692, longitude: -1.620 },
  { id: 'c-tem', name: 'Tema Community', city: 'Tema', country: 'GH', latitude: 5.669, longitude: -0.017 },
  { id: 'c-lom', name: 'Agoè Assiyéyé', city: 'Lomé', country: 'TG', latitude: 6.173, longitude: 1.222 },
  { id: 'c-cot', name: 'Gare de Cotonou', city: 'Cotonou', country: 'BJ', latitude: 6.370, longitude: 2.391 },
  { id: 'c-por', name: 'Gare de Porto-Novo', city: 'Porto-Novo', country: 'BJ', latitude: 6.497, longitude: 2.605 },
  { id: 'c-dak', name: 'Gare des Baux Maraîchers', city: 'Dakar', country: 'SN', latitude: 14.716, longitude: -17.467 },
  { id: 'c-thi', name: 'Gare de Thiès', city: 'Thiès', country: 'SN', latitude: 14.788, longitude: -16.935 },
  { id: 'c-stl', name: 'Gare de Saint-Louis', city: 'Saint-Louis', country: 'SN', latitude: 16.017, longitude: -16.489 },
  { id: 'c-bam', name: 'Gare de Sogoniko', city: 'Bamako', country: 'ML', latitude: 12.639, longitude: -8.002 },
  { id: 'c-sik', name: 'Gare de Sikasso', city: 'Sikasso', country: 'ML', latitude: 11.320, longitude: -5.668 },
  { id: 'c-kay', name: 'Gare de Kayes', city: 'Kayes', country: 'ML', latitude: 14.444, longitude: -11.445 },
  { id: 'c-niam', name: 'Gare de Niamey', city: 'Niamey', country: 'NE', latitude: 13.512, longitude: 2.112 },
];

export function findCity(cityOrId: string): Stop | undefined {
  const q = cityOrId.toLowerCase().trim();
  return MOCK_CITIES.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.city.toLowerCase() === q ||
      c.city.toLowerCase().includes(q),
  );
}

export const POPULAR_CITIES = [
  'Abidjan', 'Yamoussoukro', 'Ouagadougou', 'Accra', 'Lomé', 'Cotonou',
  'Dakar', 'Bamako', 'Niamey', 'Kumasi',
];
