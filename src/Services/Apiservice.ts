export interface Paciente {
  run: string;
  nombre: string;
  [key: string]: unknown;
}

export interface Pais {
  id: number;
  nombre: string;
  [key: string]: unknown;
}

const URL = import.meta.env.PUBLIC_API_URL as string ?? "https://hydra-arm-crud.onrender.com/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPacientes(): Promise<Paciente[]> {
  return request<Paciente[]>(`${URL}/pacientes`);
}

export async function getPaciente(run: string): Promise<Paciente> {
  return request<Paciente>(`${URL}/pacientes/${run}`);
}

export async function postPacientes(data: Partial<Paciente>): Promise<Paciente> {
  return request<Paciente>(`${URL}/pacientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePaciente(run: string, data: Partial<Paciente>): Promise<Paciente> {
  return request<Paciente>(`${URL}/pacientes/${run}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePaciente(run: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${URL}/pacientes/${run}`, {
      method: "DELETE",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPaises(): Promise<Pais[]> {
  return request<Pais[]>(`${URL}/pais`);
}

export async function getPais(id: number): Promise<Pais> {
  return request<Pais>(`${URL}/pais/${id}`);
}

export async function postPais(data: Partial<Pais>): Promise<Pais> {
  return request<Pais>(`${URL}/pais`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePais(id: number, data: Partial<Pais>): Promise<Pais> {
  return request<Pais>(`${URL}/pais/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePais(id: number): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${URL}/pais/${id}`, {
      method: "DELETE",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}
