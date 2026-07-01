import { getUsuarioSesion } from '../../services/crypto';

export function initProtesis(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioSesion();
    const el = document.getElementById('doc-name-sidebar');
    if (el && usuario) el.innerText = `Dr. ${usuario.nombre} ${usuario.apellidoPaterno}`;
    else if (!usuario) window.location.href = '/Login/';

    const pacGuardado = localStorage.getItem('pacienteActivo');
    if (pacGuardado) {
      const paciente = JSON.parse(pacGuardado);
      const inputRut = document.getElementById('solicitud-rut') as HTMLInputElement;
      if (inputRut) { inputRut.value = paciente.rut; inputRut.style.backgroundColor = '#f1f5f9'; inputRut.readOnly = true; }
    }
  });

  function validarRutChileno(rutCompleto: string): boolean {
    let valor = rutCompleto.replace(/\./g, '').replace(/-/g, '');
    if (valor.length < 8) return false;
    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1).toUpperCase();
    if (!cuerpo.match(/^[0-9]+$/)) return false;
    let suma = 0, mult = 2;
    for (let i = 1; i <= cuerpo.length; i++) {
      suma += mult * Number(valor.charAt(cuerpo.length - i));
      mult = mult < 7 ? mult + 1 : 2;
    }
    let dvE: number | string = 11 - (suma % 11);
    dvE = dvE === 11 ? 0 : dvE === 10 ? 'K' : dvE;
    return dvE.toString() === dv;
  }

  (window as any).abrirModalSolicitud = function (nombreModelo: string): void {
    setText('nombre-modelo-solicitud', nombreModelo);
    showHide('modal-solicitud', true);
    const err = document.getElementById('error-rut-solicitud');
    if (err) (err as HTMLElement).style.display = 'none';
  };

  (window as any).cerrarModalSolicitud = function (): void {
    showHide('modal-solicitud', false);
    const form = document.getElementById('form-solicitud') as HTMLFormElement;
    if (form) form.reset();
  };

  (window as any).enviarSolicitud = function (): void {
    const errEl = document.getElementById('error-rut-solicitud') as HTMLElement;
    if (errEl) errEl.style.display = 'none';

    const rut = (document.getElementById('solicitud-rut') as HTMLInputElement).value.trim();
    const obs = (document.getElementById('solicitud-obs') as HTMLTextAreaElement).value.trim();
    const modelo = (document.getElementById('nombre-modelo-solicitud') as HTMLElement).innerText;

    if (!rut || !obs) { alert('Complete todos los campos.'); return; }
    if (!validarRutChileno(rut)) { if (errEl) errEl.style.display = 'block'; return; }

    let costo = '$2.800.000';
    if (modelo.includes('RX-7')) costo = '$4.500.000';
    if (modelo.includes('Titan')) costo = '$5.200.000';

    const sols = JSON.parse(localStorage.getItem('bucketSolicitudesPendientes') || '[]');
    sols.push({ rut, modelo, justificacion: obs, costo });
    localStorage.setItem('bucketSolicitudesPendientes', JSON.stringify(sols));
    alert(`¡Orden enviada!\n${modelo} quedó Pendiente en el panel del Autorizador.`);
    (window as any).cerrarModalSolicitud();
  };

  function setText(id: string, t: string): void { const e = document.getElementById(id); if (e) e.innerText = t; }
  function showHide(id: string, s: boolean): void { const e = document.getElementById(id); if (e) e.style.display = s ? 'flex' : 'none'; }
}
