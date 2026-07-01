import { getAuthHeaders } from './auth';

export interface Paciente {
  runP?: string | null;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correo?: string | null;
  password?: string | null;
  genero?: string;
  edad?: number | null;
  altura?: number | null;
  peso?: number | null;
  telefono?: string | null;
}

export interface Empleado {
  run?: string | null;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correo?: string | null;
  password?: string | null;
  rolIdRol?: number;
  sucursalIdSucursal?: number;
}

const BASE_URL = 'https://api.hydra.cl/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers as Record<string, string>,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getPacientes(): Promise<Paciente[]> {
  return request<Paciente[]>(`${BASE_URL}/pacientes`);
}

export async function postPaciente(data: Partial<Paciente>): Promise<Paciente> {
  return request<Paciente>(`${BASE_URL}/pacientes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getEmpleados(): Promise<Empleado[]> {
  return request<Empleado[]>(`${BASE_URL}/empleados`);
}

export async function postEmpleado(data: Partial<Empleado>): Promise<Empleado> {
  return request<Empleado>(`${BASE_URL}/empleados`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
