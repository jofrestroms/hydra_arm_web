import { desencriptarDato, encriptarDato } from '../../services/crypto';
import { getPacientes, getEmpleados, postPaciente, postEmpleado } from '../../services/api';

export function initAdmin(): void {
  let listaEmpleadosOriginal: any[] = [];
  let listaPacientesOriginal: any[] = [];

  document.addEventListener('DOMContentLoaded', () => {
    cargarPacientesAdmin();
  });

  async function cargarPacientesAdmin(): Promise<void> {
    try {
      const tbody = document.getElementById('cuerpo-tabla-pacientes') as HTMLTableSectionElement;
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--primary);">Consultando BD y Desencriptando datos <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';

      const cifrados = await getPacientes();
      const promesas = cifrados.map(async (p) => {
        const [rut, tel] = await Promise.all([desencriptarDato(p.runP), desencriptarDato(p.telefono)]);
        return { ...p, runP_Legible: rut, telefono_Legible: tel };
      });

      listaPacientesOriginal = await Promise.all(promesas);
      renderPacientes(listaPacientesOriginal);
    } catch (e) {
      console.error(e);
    }
  }

  function renderPacientes(lista: any[]): void {
    const tbody = document.getElementById('cuerpo-tabla-pacientes') as HTMLTableSectionElement;
    tbody.innerHTML = '';
    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No se encontraron pacientes que coincidan con la búsqueda.</td></tr>';
      return;
    }
    lista.forEach((p) => {
      const apP = p.apellidoPaterno || '';
      const apM = p.apellidoMaterno || '';
      tbody.insertAdjacentHTML(
        'beforeend',
        `<tr><td>${p.runP_Legible}</td><td>${p.nombre}</td><td>${apP} ${apM}</td><td>${p.telefono_Legible}</td><td><button class="btn-action outline">Editar</button> <button class="btn-action danger"><i class="fa-solid fa-trash"></i></button></td></tr>`
      );
    });
  }

  async function cargarEmpleadosAdmin(): Promise<void> {
    try {
      const tbody = document.getElementById('cuerpo-tabla-empleados') as HTMLTableSectionElement;
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--primary);">Buscando Empleados... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';

      const cifrados = await getEmpleados();
      const sinAdmins = cifrados.filter((emp: any) => emp.rolIdRol !== 1);

      const promesas = sinAdmins.map(async (emp: any) => {
        const rutReal = await desencriptarDato(emp.run);
        return { ...emp, rutLegible: rutReal };
      });

      listaEmpleadosOriginal = await Promise.all(promesas);
      renderEmpleados(listaEmpleadosOriginal);
    } catch {
      const tbody = document.getElementById('cuerpo-tabla-empleados') as HTMLTableSectionElement;
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger);">No se pudo conectar a la API de Empleados.</td></tr>';
    }
  }

  function renderEmpleados(lista: any[]): void {
    const tbody = document.getElementById('cuerpo-tabla-empleados') as HTMLTableSectionElement;
    tbody.innerHTML = '';
    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No hay empleados registrados.</td></tr>';
      return;
    }
    lista.forEach((emp) => {
      const apP = emp.apellidoPaterno || '';
      const apM = emp.apellidoMaterno || '';
      let rol = 'Sin Rol';
      let badgeClass = '';
      if (emp.rolIdRol === 2) { rol = 'Médico'; badgeClass = 'bg-success'; }
      else if (emp.rolIdRol === 3) { rol = 'Autorizador'; badgeClass = 'bg-primary'; }
      else if (emp.rolIdRol === 4) { rol = 'Cuidador'; badgeClass = 'bg-secondary'; }
      tbody.insertAdjacentHTML('beforeend', `<tr><td>${emp.rutLegible}</td><td>${emp.nombre || 'N/A'}</td><td>${apP} ${apM}</td><td><span class="badge ${badgeClass}">${rol}</span></td><td><button class="btn-action outline">Editar</button> <button class="btn-action danger"><i class="fa-solid fa-trash"></i></button></td></tr>`);
    });
  }

  (window as any).cambiarDirectorio = function (tipo: 'pacientes' | 'empleados'): void {
    const btnP = document.getElementById('btn-tab-pacientes') as HTMLButtonElement;
    const btnE = document.getElementById('btn-tab-empleados') as HTMLButtonElement;
    const cP = document.getElementById('contenedor-pacientes') as HTMLElement;
    const cE = document.getElementById('contenedor-empleados') as HTMLElement;

    if (tipo === 'pacientes') {
      btnP.classList.remove('outline');
      btnE.classList.add('outline');
      cP.style.display = 'block';
      cE.style.display = 'none';
      cargarPacientesAdmin();
    } else {
      btnE.classList.remove('outline');
      btnP.classList.add('outline');
      cE.style.display = 'block';
      cP.style.display = 'none';
      cargarEmpleadosAdmin();
    }
  };

  (window as any).abrirModalAgregar = function (tipo: 'paciente' | 'empleado'): void {
    const modal = document.getElementById(tipo === 'paciente' ? 'modal-agregar-paciente' : 'modal-agregar-empleado') as HTMLElement;
    if (modal) modal.style.display = 'flex';
  };

  (window as any).cerrarModalAgregar = function (tipo: 'paciente' | 'empleado'): void {
    const modal = document.getElementById(tipo === 'paciente' ? 'modal-agregar-paciente' : 'modal-agregar-empleado') as HTMLElement;
    if (modal) { modal.style.display = 'none'; const form = modal.querySelector('form'); if (form) form.reset(); }
  };

  (window as any).filtrarPacientesAdmin = function (): void {
    const rutBuscado = (document.getElementById('filtro-rut-pac') as HTMLInputElement).value.toLowerCase().trim();
    renderPacientes(listaPacientesOriginal.filter((pac: any) => pac.runP_Legible.toLowerCase().includes(rutBuscado)));
  };

  (window as any).guardarNuevoPaciente = async function (): Promise<void> {
    const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();
    const rutInput = getVal('nuevo-pac-rut');
    const telInput = getVal('nuevo-pac-tel');
    const nombreInput = getVal('nuevo-pac-nombre');
    const apPaternoInput = getVal('nuevo-pac-apPaterno');
    const apMaternoInput = getVal('nuevo-pac-apMaterno');
    const correoInput = getVal('nuevo-pac-correo');
    const passInput = getVal('nuevo-pac-password');
    const generoInput = (document.getElementById('nuevo-pac-genero') as HTMLSelectElement).value;
    const edadInput = (document.getElementById('nuevo-pac-edad') as HTMLInputElement).value;
    const alturaInput = (document.getElementById('nuevo-pac-altura') as HTMLInputElement).value;
    const pesoInput = (document.getElementById('nuevo-pac-peso') as HTMLInputElement).value;

    if (!rutInput || !telInput || !nombreInput || !apPaternoInput) {
      alert('Por favor, llena los campos principales (RUT, Teléfono, Nombre y Apellido).');
      return;
    }

    try {
      const [rutE, telE, corE, passE] = await Promise.all([
        encriptarDato(rutInput), encriptarDato(telInput),
        correoInput ? encriptarDato(correoInput) : Promise.resolve(null),
        passInput ? encriptarDato(passInput) : Promise.resolve(null),
      ]);

      await postPaciente({
        runP: rutE, nombre: nombreInput, apellidoPaterno: apPaternoInput, apellidoMaterno: apMaternoInput,
        correo: corE, password: passE, genero: generoInput,
        edad: edadInput ? parseInt(edadInput) : null, altura: alturaInput ? parseInt(alturaInput) : null,
        peso: pesoInput ? parseInt(pesoInput) : null, telefono: telE,
      });

      alert('¡Paciente guardado exitosamente!');
      (window as any).cerrarModalAgregar('paciente');
      cargarPacientesAdmin();
    } catch {
      alert('⚠️ ALERTA DE SEGURIDAD: No se pudo conectar con el motor de encriptación (Puerto 8081).');
    }
  };

  (window as any).aplicarFiltros = function (): void {
    const rutBuscado = (document.getElementById('filtro-rut-emp') as HTMLInputElement).value.toLowerCase().trim();
    const rolBuscado = (document.getElementById('filtro-rol-emp') as HTMLSelectElement).value.toLowerCase();
    const filtrados = listaEmpleadosOriginal.filter((emp: any) => {
      const coincideRut = emp.rutLegible.toLowerCase().includes(rutBuscado);
      let rolTexto = '';
      if (emp.rolIdRol === 2) rolTexto = 'medico';
      if (emp.rolIdRol === 3) rolTexto = 'autorizador';
      if (emp.rolIdRol === 4) rolTexto = 'cuidador';
      return coincideRut && (rolBuscado === '' || rolTexto === rolBuscado);
    });
    renderEmpleados(filtrados);
  };

  (window as any).guardarNuevoEmpleado = async function (): Promise<void> {
    const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();
    const rutInput = getVal('nuevo-emp-rut');
    const nombreInput = getVal('nuevo-emp-nombre');
    const apPaternoInput = getVal('nuevo-emp-apPaterno');
    const apMaternoInput = getVal('nuevo-emp-apMaterno');
    const correoInput = getVal('nuevo-emp-correo');
    const passwordInput = getVal('nuevo-emp-password');
    const rolInput = (document.getElementById('nuevo-emp-rol') as HTMLSelectElement).value;
    const sucursalInput = (document.getElementById('nuevo-emp-sucursal') as HTMLSelectElement).value;

    if (!rutInput || !nombreInput || !apPaternoInput || !correoInput || !passwordInput) {
      alert('Por favor, llena todos los campos obligatorios del empleado.');
      return;
    }

    try {
      const [rutE, corE, passE] = await Promise.all([
        encriptarDato(rutInput), encriptarDato(correoInput), encriptarDato(passwordInput),
      ]);

      await postEmpleado({
        run: rutE, nombre: nombreInput, apellidoPaterno: apPaternoInput, apellidoMaterno: apMaternoInput,
        correo: corE, password: passE, rolIdRol: parseInt(rolInput), sucursalIdSucursal: parseInt(sucursalInput),
      });

      alert('¡Empleado guardado exitosamente!');
      (window as any).cerrarModalAgregar('empleado');
      cargarEmpleadosAdmin();
    } catch {
      alert('⚠️ ALERTA DE SEGURIDAD: No se pudo conectar con el motor de encriptación. Guardado bloqueado.');
    }
  };
}
