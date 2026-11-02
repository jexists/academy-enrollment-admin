const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4200';

/** 백엔드 오류 응답 형식 (AllExceptionsFilter) */
export interface ErrorBody {
  statusCode: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  token?: string | null;
}

/** 백엔드 호출은 모두 여기를 거친다. 로그인 토큰을 붙이고 오류 형식을 하나로 맞춘다. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, API_URL);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해 주세요.');
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data ?? {}) as Partial<ErrorBody>;
    throw new ApiError(
      response.status,
      error.message ?? '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.',
      error.fieldErrors,
    );
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.';
}
