// Response envelope shape, exact per docs/05_API_Blueprint.md.

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors: string[];
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
