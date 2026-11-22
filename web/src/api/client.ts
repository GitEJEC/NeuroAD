const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'neuroad_token';

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: 'therapist' | 'patient';
  therapist_id: number | null;
};

export type PatientItem = {
  id: number;
  full_name: string;
  email: string;
  last_paralysis_at: string | null;
  unseen_count: number;
};

export type Notification = {
  id: number;
  patient_id: number;
  patient_name: string;
  pressed_at: string;
  description: string | null;
};

export type Paralysis = {
  id: number;
  patient_id: number;
  pressed_at: string;
  description: string | null;
  seen_by_therapist: boolean;
};

// Fired after marking reports as seen, so the bell refreshes without waiting for the next poll.
export const NOTIFICATIONS_CHANGED = 'neuroad:notifications';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(BASE_URL + path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Intenta de nuevo.');
  }

  // Expired/invalid session: drop the token and go back to login (the login's own 401 has no token).
  if (res.status === 401 && token) {
    clearToken();
    window.location.assign('/login');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === 'string' ? body.detail : 'Ocurrió un error. Intenta de nuevo.';
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const dateTimeFormat = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  dateStyle: 'short',
  timeStyle: 'short',
});

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
