import { apiClient } from './api-client';

export interface Stop {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;
}

export interface Operator {
  readonly id: string;
  readonly name: string;
  readonly logo_url?: string | null;
  readonly rating: number;
  readonly on_time_rate: number;
}

export interface Trip {
  readonly id: string;
  readonly route_id: string;
  readonly departure_time: string;
  readonly arrival_time: string;
  readonly duration_minutes: number;
  readonly price_cents: number;
  readonly currency: string;
  readonly available_seats: number;
  readonly bus_class: string;
  readonly amenities: ReadonlyArray<string>;
  readonly operator: Operator;
  readonly origin: Stop;
  readonly destination: Stop;
}

export interface SearchTripsResult {
  readonly trips: ReadonlyArray<Trip>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface SearchTripsParams {
  readonly origin: string;
  readonly destination: string;
  readonly date: string;
  readonly passengers?: number;
  readonly sort?: 'recommended' | 'price' | 'duration' | 'departure';
  readonly maxPrice?: number;
  readonly busClass?: string;
  readonly limit?: number;
  readonly offset?: number;
}

function buildQuery(params: SearchTripsParams): string {
  const qs = new URLSearchParams();
  qs.set('origin', params.origin);
  qs.set('destination', params.destination);
  qs.set('date', params.date);
  if (params.passengers) qs.set('passengers', String(params.passengers));
  if (params.sort) qs.set('sort', params.sort);
  if (params.maxPrice !== undefined) qs.set('max_price', String(params.maxPrice));
  if (params.busClass) qs.set('class', params.busClass);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  return qs.toString();
}

export async function searchTrips(params: SearchTripsParams): Promise<SearchTripsResult> {
  const res = await apiClient<SearchTripsResult>(`/search/trips?${buildQuery(params)}`);
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'search failed');
  }
  return res.data;
}

export async function autocompleteStops(prefix: string): Promise<ReadonlyArray<Stop>> {
  if (prefix.trim().length < 2) return [];
  const res = await apiClient<{ suggestions: Stop[] }>(
    `/search/autocomplete?q=${encodeURIComponent(prefix)}`,
  );
  if (!res.success || !res.data) return [];
  return res.data.suggestions;
}

export async function getTrip(id: string): Promise<Trip> {
  const res = await apiClient<Trip>(`/search/trips/${id}`);
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'trip not found');
  }
  return res.data;
}
