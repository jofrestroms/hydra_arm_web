import { login, clearTokens } from '../../Services/auth';

export function initLogin(): void {
  (window as any).iniciarSesion = async function iniciarSesion(): Promise<void> {
    const inputs = document.querySelectorAll<HTMLInputElement>('input');
    const correoElement = inputs[0];
    const passElement = inputs[1];
    const btnLogin = document.querySelector<HTMLButtonElement>('button');

    if (!correoElement || !passElement || !btnLogin) {
      alert('Error interno: No se detecta el formulario en el HTML.');
      return;
    }

    const correoInput = correoElement.value.trim();
    const passInput = passElement.value.trim();

    if (!correoInput || !passInput) {
      alert('Por favor, ingresa tu correo y contrasena.');
      return;
    }

    const textoOriginal = btnLogin.innerHTML;
    btnLogin.innerHTML = 'Verificando... <i class="fa-solid fa-spinner fa-spin"></i>';
    btnLogin.disabled = true;

    try {
      const data = await login(correoInput, passInput, 'MEDICO', '');
      localStorage.setItem('hydraUser', JSON.stringify({ email: correoInput, role: data.role }));
      window.location.href = '/home/';
    } catch (error: any) {
      alert(error.message || 'Correo o contrasena incorrectos.');
      passElement.value = '';
      btnLogin.innerHTML = textoOriginal;
      btnLogin.disabled = false;
    }
  };
}
