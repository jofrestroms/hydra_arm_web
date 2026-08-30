const AUTH_URL = 'https://hydra-arm-security.onrender.com/api/auth';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('hydra_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('hydra_refresh');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('hydra_token', accessToken);
  localStorage.setItem('hydra_refresh', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('hydra_token');
  localStorage.removeItem('hydra_refresh');
  localStorage.removeItem('hydraUser');
  localStorage.removeItem('hydra_sesion');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function login(
  email: string,
  password: string,
  rol: string = 'MEDICO',
  runP: string = ''
): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rol, runP })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login fallo');
  }

  const data: AuthTokens = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>)
  };

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await refresh();
    if (refreshed) {
      headers = { ...headers, ...getAuthHeaders() };
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = '/login/';
      throw new Error('Sesion expirada');
    }
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const CRUD_URL = 'https://hydra-crud.onrender.com/api';

export async function getPacientes(): Promise<any[]> {
  return request<any[]>(`${CRUD_URL}/pacientes`);
}

export async function postPaciente(data: any): Promise<any> {
  return request<any>(`${CRUD_URL}/pacientes`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getEmpleados(): Promise<any[]> {
  return request<any[]>(`${CRUD_URL}/empleados`);
}

export async function postEmpleado(data: any): Promise<any> {
  return request<any>(`${CRUD_URL}/empleados`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
