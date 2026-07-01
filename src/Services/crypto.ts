import { getAuthHeaders } from './auth';

const SECURITY_URL = 'https://api.hydra.cl/api/user/cripto';

export async function desencriptarDato(hash: string | null | undefined): Promise<string | null> {
  if (!hash || hash === 'null' || hash.length < 15) return hash || 'Sin registro';
  try {
    const url = `${SECURITY_URL}/decrypt?codigo=${encodeURIComponent(hash)}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) return 'Error descifrado';
    const texto = await res.text();
    return texto.replace(/"/g, '').trim();
  } catch {
    return 'Error API';
  }
}

export async function encriptarDato(textoLimpio: string): Promise<string | null> {
  if (!textoLimpio) return null;
  try {
    const url = `${SECURITY_URL}/encrypt?texto=${encodeURIComponent(textoLimpio)}`;
    const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error encriptación: ${res.status}`);
    return await res.text();
  } catch (e) {
    console.error('Fallo de seguridad al encriptar:', e);
    throw new Error('Motor de encriptación apagado o fallando.');
  }
}

export interface UsuarioStorage {
  run?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correo?: string | null;
  password?: string | null;
  rolIdRol?: number;
  sucursalIdSucursal?: number;
}

export function getUsuarioSesion(): UsuarioStorage | null {
  const data = localStorage.getItem('hydraUser');
  return data ? JSON.parse(data) : null;
}

export function getNombreMedico(): string {
  const user = getUsuarioSesion();
  if (user) {
    return `Dr. ${user.nombre} ${user.apellidoPaterno}`;
  }
  return 'Cargando Médico...';
}
