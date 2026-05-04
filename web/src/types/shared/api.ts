export interface PaginationMeta {
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  readonly totalPages: number;
}

export type ApiError = {
  readonly code: string;
  readonly message: string;
};

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly meta?: PaginationMeta;
}
