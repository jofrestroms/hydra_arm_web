import { getUsuarioSesion } from '../../services/crypto';

interface Receta { id: number; paciente: string; rut: string; fecha: string; archivo: string; medicamentos: Array<{ medicamento: string; dosis: string }>; estado: string; }
interface SolicitudProtesis { rut: string; modelo: string; justificacion: string; costo: string; }
interface FinanzasPaciente { prevision: string; seguro: string; cobertura: string; }

export function initAutorizador(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioSesion();
    const el = document.getElementById('auth-name-sidebar');
    if (el && usuario) el.innerText = `Autorizador: ${usuario.nombre} ${usuario.apellidoPaterno}`;
    renderizarRecetasDelBucket();
    renderizarSolicitudesProtesis();
  });

  function renderizarRecetasDelBucket(): void {
    const tbody = document.getElementById('lista-recetas-pendientes') as HTMLTableSectionElement;
    const recetas: Receta[] = JSON.parse(localStorage.getItem('bucketRecetasPendientes') || '[]');
    if (recetas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No hay recetas pendientes en el bucket actualmente.</td></tr>';
      return;
    }
    tbody.innerHTML = recetas.map((r, i) => `<tr>
      <td><strong>${r.paciente}</strong><br><span style="font-size:11px;color:#64748b;">${r.rut}</span></td>
      <td>${r.fecha}</td>
      <td style="color:#2563eb;font-family:monospace;font-size:12px;"><i class="fa-solid fa-file-invoice"></i> ${r.archivo}</td>
      <td style="font-size:12px;line-height:1.4;">${r.medicamentos.map(m => `${m.medicamento} (${m.dosis})`).join('<br>')}</td>
      <td style="display:flex;gap:8px;">
        <button class="btn-action" style="background-color:#10b981;color:white;border:none;padding:6px 12px;font-size:12px;" onclick="window.visarReceta(${i},true)">Visar</button>
        <button class="btn-action outline" style="color:#ef4444;border-color:#ef4444;padding:6px 12px;font-size:12px;" onclick="window.visarReceta(${i},false)">Rechazar</button>
      </td></tr>`).join('');
  }

  (window as any).visarReceta = function (index: number, aprobado: boolean): void {
    const recetas: Receta[] = JSON.parse(localStorage.getItem('bucketRecetasPendientes') || '[]');
    alert(aprobado ? `La receta ${recetas[index].archivo} fue visada con éxito.` : `La receta ${recetas[index].archivo} fue rechazada.`);
    recetas.splice(index, 1);
    localStorage.setItem('bucketRecetasPendientes', JSON.stringify(recetas));
    renderizarRecetasDelBucket();
  };

  function renderizarSolicitudesProtesis(): void {
    const tbody = document.getElementById('lista-solicitudes-pendientes') as HTMLTableSectionElement;
    const solicitudes: SolicitudProtesis[] = JSON.parse(localStorage.getItem('bucketSolicitudesPendientes') || '[]');
    if (solicitudes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;">No hay órdenes de prótesis pendientes.</td></tr>';
      return;
    }
    tbody.innerHTML = solicitudes.map((s, i) => `<tr>
      <td><strong>${s.rut}</strong></td>
      <td><strong style="color:#0f172a;">${s.modelo}</strong></td>
      <td style="font-size:12px;color:#475569;max-width:250px;">${s.justificacion}</td>
      <td style="color:#16a34a;font-weight:600;">${s.costo} CLP</td>
      <td style="display:flex;gap:8px;">
        <button class="btn-action" style="background-color:#10b981;color:white;border:none;padding:6px 12px;font-size:12px;" onclick="window.gestionarProtesis(${i},true)">Aprobar</button>
        <button class="btn-action outline" style="color:#ef4444;border-color:#ef4444;padding:6px 12px;font-size:12px;" onclick="window.gestionarProtesis(${i},false)">Rechazar</button>
      </td></tr>`).join('');
  }

  (window as any).gestionarProtesis = function (index: number, aprobado: boolean): void {
    const solicitudes: SolicitudProtesis[] = JSON.parse(localStorage.getItem('bucketSolicitudesPendientes') || '[]');
    const modelo = solicitudes[index].modelo;
    alert(aprobado ? `¡Orden Aprobada! Manufactura de ${modelo} iniciada.` : `Orden Rechazada. Solicitud de ${modelo} devuelta.`);
    solicitudes.splice(index, 1);
    localStorage.setItem('bucketSolicitudesPendientes', JSON.stringify(solicitudes));
    renderizarSolicitudesProtesis();
  };

  (window as any).mostrarFinanzasPaciente = function (): void {
    const rut = (document.getElementById('auth-paciente-select') as HTMLSelectElement).value;
    const prevEl = document.getElementById('auth-val-prev-seg') as HTMLElement;
    const cobEl = document.getElementById('auth-val-cob') as HTMLElement;

    if (!rut) { prevEl.innerText = '---'; cobEl.innerHTML = '---'; cobEl.style.color = '#16a34a'; return; }

    const data = localStorage.getItem('finanzas_paciente_' + rut);
    if (data) {
      const d: FinanzasPaciente = JSON.parse(data);
      prevEl.innerText = `${d.prevision} + ${d.seguro}`;
      cobEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Cobertura asignada: ${d.cobertura}`;
      cobEl.style.color = '#16a34a';
    } else {
      prevEl.innerText = 'Sin expediente financiero';
      cobEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Datos no registrados por el médico';
      cobEl.style.color = '#ef4444';
    }
  };
}
