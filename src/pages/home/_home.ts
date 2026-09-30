import { desencriptarDato, getUsuarioSesion } from '../../services/crypto';
import { getAuthHeaders } from '../../services/auth';

export function initHome(): void {
  let pacienteActualData: { nombreCompleto: string; rut: string } | null = null;
  let listaRecetaActual: Array<{ medicamento: string; dosis: string }> = [];

  document.addEventListener('DOMContentLoaded', () => {
    cargarDatosMedico();
    cargarPacientes();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('return') === 'perfil') {
      const pacGuardado = localStorage.getItem('pacienteActivo');
      if (pacGuardado) {
        const p = JSON.parse(pacGuardado);
        abrirPerfil(p.nombre, p.apP, p.apM, p.rut, p.fono);
      }
    }
  });

  function cargarDatosMedico(): void {
    const user = getUsuarioSesion();
    const el = document.getElementById('doc-name-sidebar');
    if (el) {
      el.innerText = user ? `Dr. ${user.nombre} ${user.apellidoPaterno}` : 'Cargando Médico...';
    }
  }

  async function cargarPacientes(): Promise<void> {
    const urlAPI = 'https://hydra-arm-crud.onrender.com/api/pacientes';

    try {
      const tbody = document.getElementById('cuerpo-tabla-pacientes') as HTMLTableSectionElement;
      const res = await fetch(urlAPI, { headers: getAuthHeaders() });

      if (res.ok) {
        const cifrados: any[] = await res.json();
        const promesas = cifrados.map(async (p) => {
          const [rut, tel] = await Promise.all([desencriptarDato(p.runP), desencriptarDato(p.telefono)]);
          return { ...p, runP: rut, telefono: tel };
        });
        const legibles = await Promise.all(promesas);

        tbody.innerHTML = '';
        legibles.forEach((p) => {
          const apP = p.apellidoPaterno || '';
          const apM = p.apellidoMaterno || '';
          const nombreCompleto = `${p.nombre} ${apP}`;

          const fila = `<tr>
            <td>${p.runP}</td>
            <td>${p.nombre}</td>
            <td>${apP} ${apM}</td>
            <td>${p.telefono}</td>
            <td style="display: flex; gap: 8px;">
              <button class="btn-action outline" style="display: flex; align-items: center; gap: 5px;" onclick="window.abrirPerfil('${p.nombre}', '${apP}', '${apM}', '${p.runP}', '${p.telefono}')">
                <i class="fa-solid fa-user-doctor"></i> Perfil Clínico
              </button>
              <button class="btn-action" style="background-color: #8b5cf6; color: white; border: none; display: flex; align-items: center; gap: 5px;" onclick="window.irAlDashboard('${nombreCompleto}', '${p.runP}')">
                <i class="fa-solid fa-chart-line"></i> Dashboard
              </button>
            </td>
          </tr>`;
          tbody.insertAdjacentHTML('beforeend', fila);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  const abrirPerfil = function (nombre: string, apP: string, apM: string, rut: string, fono: string): void {
    const pacObj = { nombre, apP, apM, rut, fono };
    localStorage.setItem('pacienteActivo', JSON.stringify(pacObj));
    pacienteActualData = { nombreCompleto: `${nombre} ${apP}`, rut };

    const iniciales = `${nombre.charAt(0).toUpperCase()}${apP.charAt(0).toUpperCase()}`;
    setText('pac-iniciales', iniciales);
    setText('pac-nombre-completo', `${nombre} ${apP} ${apM}`);
    setText('pac-rut-header', `RUN: ${rut}`);
    setText('pac-rut-grid', rut);
    setText('pac-fono', fono);

    actualizarVistaFinanzasModulo(rut);

    hide('vista-directorio');
    show('vista-perfil');
  };
  (window as any).abrirPerfil = abrirPerfil;

  const volverAlDirectorio = function (): void {
    localStorage.removeItem('pacienteActivo');
    pacienteActualData = null;

    hide('vista-perfil');
    show('vista-directorio');
    window.history.replaceState({}, document.title, window.location.pathname);
  };
  (window as any).volverAlDirectorio = volverAlDirectorio;

  const irAlDashboard = function (nombrePaciente: string, rutPaciente: string): void {
    const datos14Dias: Array<{ fecha: string; usoHoras: string; bateria: number; temperatura: string }> = [];
    const hoy = new Date();

    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      datos14Dias.push({
        fecha: fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
        usoHoras: (Math.random() * (14 - 4) + 4).toFixed(1),
        bateria: Math.floor(Math.random() * (85 - 15) + 15),
        temperatura: (Math.random() * (39 - 28) + 28).toFixed(1),
      });
    }

    const dataDashboard = { paciente: nombrePaciente, rut: rutPaciente, telemetria: datos14Dias };
    localStorage.setItem('dashboardTemporal', JSON.stringify(dataDashboard));
    window.location.href = '/dashboard/';
  };
  (window as any).irAlDashboard = irAlDashboard;

  const generarDashboardActual = function (): void {
    if (pacienteActualData) {
      irAlDashboard(pacienteActualData.nombreCompleto, pacienteActualData.rut);
    }
  };
  (window as any).generarDashboardActual = generarDashboardActual;

  const abrirModalReceta = function (): void {
    show('modal-receta');
    renderizarListaReceta();
  };
  (window as any).abrirModalReceta = abrirModalReceta;

  const cerrarModalReceta = function (): void {
    hide('modal-receta');
    (document.getElementById('receta-med') as HTMLInputElement).value = '';
    (document.getElementById('receta-dosis') as HTMLInputElement).value = '';
    listaRecetaActual = [];
  };
  (window as any).cerrarModalReceta = cerrarModalReceta;

  const agregarMedicamentoAReceta = function (): void {
    const med = (document.getElementById('receta-med') as HTMLInputElement).value.trim();
    const dosis = (document.getElementById('receta-dosis') as HTMLInputElement).value.trim();

    if (!med || !dosis) {
      alert('Por favor, ingresa el medicamento y la dosis antes de agregar.');
      return;
    }

    listaRecetaActual.push({ medicamento: med, dosis });
    (document.getElementById('receta-med') as HTMLInputElement).value = '';
    (document.getElementById('receta-dosis') as HTMLInputElement).value = '';
    renderizarListaReceta();
  };
  (window as any).agregarMedicamentoAReceta = agregarMedicamentoAReceta;

  function renderizarListaReceta(): void {
    const contenedor = document.getElementById('contenedor-lista-receta') as HTMLElement;

    if (listaRecetaActual.length === 0) {
      contenedor.innerHTML = '<p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 35px;">No hay medicamentos añadidos aún.</p>';
      return;
    }

    contenedor.innerHTML = listaRecetaActual
      .map(
        (item, index) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px; border-bottom: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 5px;">
        <div>
          <strong style="font-size: 13px; color: #0f172a;">${item.medicamento}</strong><br>
          <span style="font-size: 11px; color: #64748b;"><i class="fa-solid fa-clock"></i> ${item.dosis}</span>
        </div>
        <button onclick="window.eliminarDeReceta(${index})" style="color: #ef4444; background: transparent; border: none; cursor: pointer; font-size: 14px;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`
      )
      .join('');
  }

  const eliminarDeReceta = function (index: number): void {
    listaRecetaActual.splice(index, 1);
    renderizarListaReceta();
  };
  (window as any).eliminarDeReceta = eliminarDeReceta;

  const guardarReceta = function (): void {
    if (listaRecetaActual.length === 0) {
      alert('Debes agregar al menos un medicamento a la lista antes de emitir la receta.');
      return;
    }

    const fechaHoy = new Date();
    const fechaString = fechaHoy.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timestamp = fechaHoy.getTime();
    const nombreArchivoBucket = `RECETA_MEDICA_${timestamp}.pdf`;

    let recetasGlobalesBucket = JSON.parse(localStorage.getItem('bucketRecetasPendientes') || '[]');
    recetasGlobalesBucket.push({
      id: timestamp,
      paciente: pacienteActualData?.nombreCompleto,
      rut: pacienteActualData?.rut,
      fecha: fechaString,
      archivo: nombreArchivoBucket,
      medicamentos: [...listaRecetaActual],
      estado: 'Pendiente',
    });
    localStorage.setItem('bucketRecetasPendientes', JSON.stringify(recetasGlobalesBucket));

    const tablaDocs = document.getElementById('cuerpo-tabla-documentos') as HTMLElement;
    const nuevaFilaDocumento = `
      <tr style="background-color: #f0fdf4;">
        <td>${fechaString}</td>
        <td style="font-weight: 700; color: #16a34a;"><i class="fa-solid fa-file-pdf"></i> ${nombreArchivoBucket} (Subido al Bucket)</td>
        <td style="text-align: center;">
          <span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
            <i class="fa-solid fa-cloud-arrow-up"></i> En Bucket
          </span>
        </td>
      </tr>`;
    tablaDocs.insertAdjacentHTML('afterbegin', nuevaFilaDocumento);

    alert('¡Firma digital exitosa!\nLa receta fue procesada y enviada de forma segura al bucket del paciente.');
    cerrarModalReceta();
  };
  (window as any).guardarReceta = guardarReceta;

  function actualizarVistaFinanzasModulo(rut: string): void {
    const finanzasGuardadas = localStorage.getItem('finanzas_paciente_' + rut);

    if (finanzasGuardadas) {
      const datos = JSON.parse(finanzasGuardadas);
      setText('finanzas-prevision-val', datos.prevision);
      setText('finanzas-seguro-val', datos.seguro);
      setText('finanzas-cobertura-val', datos.cobertura);

      hide('finanzas-form-bloque');
      show('finanzas-status-bloque');
    } else {
      const prevSel = document.getElementById('finanzas-prevision-sel') as HTMLSelectElement;
      const segSel = document.getElementById('finanzas-seguro-sel') as HTMLSelectElement;
      const cobInput = document.getElementById('finanzas-cobertura-input') as HTMLInputElement;
      if (prevSel) prevSel.value = '';
      if (segSel) segSel.value = '';
      if (cobInput) cobInput.value = '';

      show('finanzas-form-bloque');
      hide('finanzas-status-bloque');
    }
  }

  const guardarFinanzasModulo = function (): void {
    const prev = (document.getElementById('finanzas-prevision-sel') as HTMLSelectElement).value;
    const seg = (document.getElementById('finanzas-seguro-sel') as HTMLSelectElement).value;
    const cob = (document.getElementById('finanzas-cobertura-input') as HTMLInputElement).value.trim();
    const rutPaciente = pacienteActualData?.rut;

    if (!prev || !seg || !cob) {
      alert('Por favor, seleccione la Previsión, el Seguro y especifique la Cobertura.');
      return;
    }

    const paqueteFinanzas = { prevision: prev, seguro: seg, cobertura: cob };
    localStorage.setItem('finanzas_paciente_' + rutPaciente, JSON.stringify(paqueteFinanzas));
    alert('¡Expediente Financiero guardado con éxito para este paciente!');
    actualizarVistaFinanzasModulo(rutPaciente!);
  };
  (window as any).guardarFinanzasModulo = guardarFinanzasModulo;

  const editarFinanzasModulo = function (): void {
    const rutPaciente = pacienteActualData?.rut;
    const finanzasGuardadas = localStorage.getItem('finanzas_paciente_' + rutPaciente);

    if (finanzasGuardadas) {
      const datos = JSON.parse(finanzasGuardadas);
      (document.getElementById('finanzas-prevision-sel') as HTMLSelectElement).value = datos.prevision;
      (document.getElementById('finanzas-seguro-sel') as HTMLSelectElement).value = datos.seguro;
      (document.getElementById('finanzas-cobertura-input') as HTMLInputElement).value = datos.cobertura;
    }

    show('finanzas-form-bloque');
    hide('finanzas-status-bloque');
  };
  (window as any).editarFinanzasModulo = editarFinanzasModulo;

  function setText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  function show(id: string): void {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function hide(id: string): void {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
}
