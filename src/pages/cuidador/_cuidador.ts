import { getUsuarioSesion } from '../../services/crypto';

interface PacienteCuidador { rut: string; nombre: string; apellido: string; fono: string; notificaciones: number; }
interface Alerta { paciente: string; tipo: string; descripcion: string; hora: string; }

export function initCuidador(): void {
  let pacienteBandejaActual: { nombre: string; rut: string } = { nombre: '', rut: '' };

  const pacientesCuidador: PacienteCuidador[] = [
    { rut: '21.799.988-k', nombre: 'Luis', apellido: 'Jofré Aguirre', fono: '993499568', notificaciones: 3 },
    { rut: '19.432.105-8', nombre: 'Valentina', apellido: 'Morales Castro', fono: '987452136', notificaciones: 0 },
    { rut: '15.890.334-2', nombre: 'Andrés', apellido: 'Sepúlveda Rojas', fono: '965412387', notificaciones: 1 },
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioSesion();
    const el = document.getElementById('caregiver-name-sidebar');
    if (el && usuario) el.innerText = `Cuidador: ${usuario.nombre} ${usuario.apellidoPaterno}`;
    else if (!usuario) window.location.href = '/Login/';
    inicializarTablaPacientes();
    renderizarCanalAlertas();
  });

  function inicializarTablaPacientes(): void {
    const tbody = document.getElementById('tabla-pacientes-cuidador') as HTMLTableSectionElement;
    tbody.innerHTML = '';
    pacientesCuidador.forEach((p) => {
      const badge = p.notificaciones > 0 ? `<span class="badge-notificacion">${p.notificaciones}</span>` : '';
      const nc = `${p.nombre} ${p.apellido}`;
      tbody.insertAdjacentHTML('beforeend', `<tr>
        <td>${p.rut}</td><td>${p.nombre}</td><td>${p.apellido}</td><td>${p.fono}</td>
        <td><div style="display:flex;gap:10px;">
          <button class="btn-action outline" style="display:flex;align-items:center;padding:8px 12px;" onclick="window.abrirBandejaMensajes('${nc}','${p.rut}',${p.notificaciones})"><i class="fa-solid fa-envelope" style="margin-right:5px;"></i> Mensajes ${badge}</button>
          <button class="btn-action outline" style="border-color:#10b981;color:#10b981;display:flex;align-items:center;padding:8px 12px;" onclick="window.abrirChatPaciente('${nc}','${p.rut}')"><i class="fa-brands fa-whatsapp" style="font-size:15px;margin-right:5px;"></i> Chat</button>
        </div></td></tr>`);
    });
  }

  (window as any).abrirBandejaMensajes = function (nombre: string, rut: string, cant: number): void {
    pacienteBandejaActual = { nombre, rut };
    showHide('vista-principal-cuidador', false);
    showHide('vista-chat-paciente', false);
    showHide('vista-bandeja-mensajes', true);
    setText('bandeja-nombre-paciente', `Mensajes Institucionales: ${nombre}`);
    setText('bandeja-rut-paciente', `RUN: ${rut}`);

    const cont = document.getElementById('contenedor-mensajes') as HTMLElement;
    if (cant === 0) { cont.innerHTML = '<p style="text-align:center;color:#94a3b8;margin-top:50px;">No hay mensajes nuevos.</p>'; return; }

    let html = `<div class="mensaje-card"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:11px;font-weight:700;color:#2563eb;"><i class="fa-solid fa-user-doctor"></i> DEPARTAMENTO MÉDICO</span><span style="font-size:11px;color:#64748b;">Hoy, 09:30 AM</span></div><strong style="color:#0f172a;font-size:14px;display:block;margin-bottom:5px;">Receta Médica Visada y Disponible</strong><p style="margin:0;font-size:13px;color:#334155;">La receta emitida para este paciente ya ha sido aprobada por el Autorizador.</p></div>`;
    if (cant > 1) html += `<div class="mensaje-card critico"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:11px;font-weight:700;color:#ef4444;"><i class="fa-solid fa-robot"></i> SOPORTE TÉCNICO HYDRA</span><span style="font-size:11px;color:#64748b;">Ayer, 18:45 PM</span></div><strong style="color:#0f172a;font-size:14px;display:block;margin-bottom:5px;">Alerta de Telemetría Biónica</strong><p style="margin:0;font-size:13px;color:#334155;">El dispositivo reportó un sobrecalentamiento del servomotor.</p></div>`;
    cont.innerHTML = html;
    const idx = pacientesCuidador.findIndex(p => p.rut === rut);
    if (idx !== -1) pacientesCuidador[idx].notificaciones = 0;
  };

  (window as any).abrirChatPaciente = function (nombre: string, rut: string): void {
    pacienteBandejaActual = { nombre, rut };
    showHide('vista-principal-cuidador', false);
    showHide('vista-bandeja-mensajes', false);
    setText('chat-nombre-paciente', nombre);
    showHide('vista-chat-paciente', true);
  };

  (window as any).volverAlDirectorioCuidador = function (): void {
    showHide('vista-bandeja-mensajes', false);
    showHide('vista-chat-paciente', false);
    showHide('vista-principal-cuidador', true);
    inicializarTablaPacientes();
  };

  (window as any).emitirAlertaClinica = function (): void {
    const paciente = (document.getElementById('alerta-paciente') as HTMLSelectElement).value;
    const tipo = (document.getElementById('alerta-tipo') as HTMLSelectElement).value;
    const desc = (document.getElementById('alerta-descripcion') as HTMLTextAreaElement).value.trim();
    if (!desc) { alert('Describa la situación.'); return; }

    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const alerts: Alerta[] = JSON.parse(localStorage.getItem('bufferAlertasClinica') || '[]');
    alerts.unshift({ paciente, tipo, descripcion: desc, hora });
    localStorage.setItem('bufferAlertasClinica', JSON.stringify(alerts));
    alert(tipo === 'Ambulancia' ? '🚨 ALERTA CRÍTICA DESPACHADA 🚨' : '✉️ COMUNICACIÓN ENVIADA');
    (document.getElementById('alerta-descripcion') as HTMLTextAreaElement).value = '';
    renderizarCanalAlertas();
  };

  function renderizarCanalAlertas(): void {
    const cont = document.getElementById('historial-alertas-cuidador') as HTMLElement;
    const pacSel = (document.getElementById('alerta-paciente') as HTMLSelectElement).value;
    const todas: Alerta[] = JSON.parse(localStorage.getItem('bufferAlertasClinica') || '[]');
    const filtradas = todas.filter(a => a.paciente === pacSel);

    if (filtradas.length === 0) { cont.innerHTML = `<p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:80px;">No se registran despachos para ${pacSel}.</p>`; return; }

    cont.innerHTML = filtradas.map(a => {
      let estilo = 'background:#e0e7ff;color:#2563eb;';
      let titulo = '<i class="fa-solid fa-info-circle"></i> Solicitud Información';
      if (a.tipo === 'Ambulancia') { estilo = 'background:#fee2e2;color:#ef4444;border:1px solid #fca5a5;'; titulo = '🚨 CÓDIGO ROJO: DESPACHO AMBULANCIA'; }
      else if (a.tipo === 'Emergencia') { estilo = 'background:#fef3c7;color:#d97706;'; titulo = '⚠️ ALERTA MÉDICA: REVISIÓN DE TURNO'; }
      return `<div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:12px;box-shadow:0 2px 4px rgba(0,0,0,0.01);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;${estilo}">${titulo}</span><span style="font-size:11px;color:#94a3b8;font-weight:600;"><i class="fa-regular fa-clock"></i> ${a.hora}</span></div><strong style="font-size:13px;color:#1e293b;display:block;margin-bottom:2px;">Pac: ${a.paciente}</strong><p style="margin:0;font-size:12px;color:#64748b;font-style:italic;line-height:1.4;">"${a.descripcion}"</p></div>`;
    }).join('');
  }

  (window as any).abrirModalAmbulancia = function (): void {
    setText('nombre-modal-amb', pacienteBandejaActual.nombre);
    showHide('modal-ambulancia', true);
  };

  (window as any).cerrarModalAmbulancia = function (): void { showHide('modal-ambulancia', false); };

  (window as any).confirmarAmbulancia = function (): void {
    const hora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const alerts: Alerta[] = JSON.parse(localStorage.getItem('bufferAlertasClinica') || '[]');
    alerts.unshift({ paciente: pacienteBandejaActual.nombre, tipo: 'Ambulancia', descripcion: '🚨 BOTÓN DE PÁNICO ACCIONADO 🚨', hora });
    localStorage.setItem('bufferAlertasClinica', JSON.stringify(alerts));
    showHide('modal-ambulancia', false);
    alert(`¡UNIDAD MÉDICA DESPACHADA!\nAmbulancia enviada a ${pacienteBandejaActual.nombre}.`);
  };

  function setText(id: string, t: string): void { const e = document.getElementById(id); if (e) e.innerText = t; }
  function showHide(id: string, show: boolean): void { const e = document.getElementById(id); if (e) e.style.display = show ? 'flex' : 'none'; }
}
