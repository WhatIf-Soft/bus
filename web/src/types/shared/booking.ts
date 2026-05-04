export enum BookingStatus {
  PENDING_SEAT = "PENDING_SEAT",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  PARTIALLY_CANCELLED = "PARTIALLY_CANCELLED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  EXPIRED = "EXPIRED",
  USED = "USED",
  FAILED = "FAILED",
  DISPUTED = "DISPUTED",
}

export type PassengerCategory = "adult" | "child" | "senior" | "student";

export interface BookingPassenger {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly category: PassengerCategory;
  readonly seatId: string;
  readonly unitPrice: number;
  readonly baggageKg: number;
  readonly baggageFee: number;
}

export interface Booking {
  readonly id: string;
  readonly userId?: string;
  readonly tripId: string;
  readonly passengers: readonly BookingPassenger[];
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: BookingStatus;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt?: string;
}
