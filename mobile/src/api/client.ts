import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'neuroad_token';
const USER_KEY = 'neuroad_user';
const TIMEOUT_MS = 10000;

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: 'therapist' | 'patient';
  therapist_id: number | null;
};

export type Tip = {
  id: number;
  patient_id: number;
  title: string;
  body: string;
  position: number;
};

export type IdOut = { id: number };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const OFFLINE_MESSAGE = 'No hay conexión. Lo intentaremos de nuevo.';
export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Ocurrió un error. Intenta de nuevo.';

// In-memory copy so each request does not hit secure-store.
let token: string | null = null;
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export async function loadSession(): Promise<User | null> {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return token && raw ? (JSON.parse(raw) as User) : null;
}

export async function saveSession(newToken: string, user: User) {
  token = newToken;
  await SecureStore.setItemAsync(TOKEN_KEY, newToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  token = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const sentToken = token;
  if (sentToken) headers.set('Authorization', `Bearer ${sentToken}`);

  // Without a timeout, an unreachable LAN IP keeps the button spinning for a long time.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(BASE_URL + path, { ...init, headers, signal: controller.signal });
  } catch {
    throw new ApiError(0, OFFLINE_MESSAGE);
  } finally {
    clearTimeout(timer);
  }

  // Expired/invalid session: drop it and go back to login (the login's own 401 has no token).
  if (res.status === 401 && sentToken) {
    await clearSession();
    onUnauthorized();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === 'string' ? body.detail : 'Ocurrió un error. Intenta de nuevo.';
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
