export function initGeneradorAdmins(): void {
  const credencialesGlobales = btoa('user:dc20f0e4-b1bc-4969-a01c-cbb8282c805f');

  function validarRutChileno(rut: string): boolean {
    let v = rut.replace(/\./g, '').replace(/-/g, '');
    if (v.length < 8) return false;
    const cuerpo = v.slice(0, -1), dv = v.slice(-1).toUpperCase();
    if (!cuerpo.match(/^[0-9]+$/)) return false;
    let suma = 0, mult = 2;
    for (let i = 1; i <= cuerpo.length; i++) { suma += mult * Number(v.charAt(cuerpo.length - i)); mult = mult < 7 ? mult + 1 : 2; }
    let dve: number | string = 11 - (suma % 11);
    dve = dve === 11 ? 0 : dve === 10 ? 'K' : dve;
    return dve.toString() === dv;
  }

  function validarCorreo(c: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c); }

  async function enc(texto: string): Promise<string | null> {
    try {
      const res = await fetch(`https://hydra-arm-security.onrender.com/api/user/cripto/encrypt?texto=${encodeURIComponent(texto)}`, { method: 'GET' });
      if (!res.ok) throw new Error('Motor apagado');
      return await res.text();
    } catch { alert('Error: Motor de seguridad (8081) no responde.'); return null; }
  }

  (window as any).crearAdminDirecto = async function (): Promise<void> {
    const errRut = document.getElementById('error-rut') as HTMLElement;
    const errCorr = document.getElementById('error-correo') as HTMLElement;
    const caja = document.getElementById('caja-credenciales') as HTMLElement;
    errRut.style.display = 'none'; errCorr.style.display = 'none'; caja.style.display = 'none';

    const btn = document.getElementById('btn-generar') as HTMLButtonElement;
    const orig = btn.innerHTML;

    const rut = (document.getElementById('dev-rut') as HTMLInputElement).value.trim();
    const nom = (document.getElementById('dev-nombre') as HTMLInputElement).value.trim();
    const app = (document.getElementById('dev-appat') as HTMLInputElement).value.trim();
    const am = (document.getElementById('dev-apmat') as HTMLInputElement).value.trim();
    const cor = (document.getElementById('dev-correo') as HTMLInputElement).value.trim();
    const pas = (document.getElementById('dev-pass') as HTMLInputElement).value.trim();

    if (!rut || !nom || !app || !cor || !pas) { alert('Complete todos los campos.'); return; }

    let err = false;
    if (!validarRutChileno(rut)) { errRut.style.display = 'block'; err = true; }
    if (!validarCorreo(cor)) { errCorr.style.display = 'block'; err = true; }
    if (err) return;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    const [rutE, corE, pasE] = await Promise.all([enc(rut), enc(cor), enc(pas)]);
    if (rutE && corE && pasE) {
      try {
        const res = await fetch('https://hydra-arm-crud.onrender.com/api/empleados', {
          method: 'POST',
          headers: { Authorization: `Basic ${credencialesGlobales}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ run: rutE, nombre: nom, apellidoPaterno: app, apellidoMaterno: am, correo: corE, password: pasE, rolIdRol: 1, sucursalIdSucursal: 1 }),
        });
        if (res.ok || res.status === 201) {
          document.querySelectorAll<HTMLInputElement>('input').forEach(i => i.value = '');
          document.getElementById('res-correo')!.innerText = cor;
          document.getElementById('res-pass')!.innerText = pas;
          caja.style.display = 'flex';
        } else alert('Error HTTP: ' + res.status);
      } catch { alert('Error conectando a la API principal.'); }
    }
    btn.innerHTML = orig; btn.disabled = false;
  };

  (window as any).copiarCredenciales = function (): void {
    const c = document.getElementById('res-correo')!.innerText;
    const p = document.getElementById('res-pass')!.innerText;
    navigator.clipboard.writeText(`Correo: ${c}\nContraseña: ${p}`).then(() => {
      const btn = document.getElementById('btn-copiar') as HTMLButtonElement;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiados!'; btn.style.background = '#059669';
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar'; btn.style.background = '#10b981'; }, 2000);
    });
  };
}
