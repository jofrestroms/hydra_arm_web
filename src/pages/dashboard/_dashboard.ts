import { getUsuarioSesion } from '../../services/crypto';
import Chart from 'chart.js/auto';

export function initDashboard(): void {
  document.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioSesion();
    const el = document.getElementById('doc-name-sidebar');
    if (el && usuario) el.innerText = `Dr. ${usuario.nombre} ${usuario.apellidoPaterno}`;

    const dataString = localStorage.getItem('dashboardTemporal');
    if (!dataString) { alert('No hay datos telemétricos.'); window.location.href = '/home/'; return; }

    const dataObj = JSON.parse(dataString);
    const telemetria: Array<{ fecha: string; usoHoras: string; bateria: number; temperatura: string }> = dataObj.telemetria;

    setText('titulo-paciente', `Análisis: ${dataObj.paciente}`);
    setText('subtitulo-rut', `RUN: ${dataObj.rut} | Reporte de 14 Días`);

    let sumHoras = 0, sumBat = 0, maxTemp = 0;
    telemetria.forEach(d => { sumHoras += parseFloat(d.usoHoras); sumBat += d.bateria; const t = parseFloat(d.temperatura); if (t > maxTemp) maxTemp = t; });

    setText('kpi-uso', `${(sumHoras / telemetria.length).toFixed(1)} hrs`);
    setText('kpi-bateria', `${Math.round(sumBat / telemetria.length)}%`);
    setText('kpi-temp', `${maxTemp}°C`);

    const fechas = telemetria.map(d => d.fecha);
    const datosUso = telemetria.map(d => parseFloat(d.usoHoras));
    const datosTemp = telemetria.map(d => parseFloat(d.temperatura));

    const ctxUso = (document.getElementById('graficoUso') as HTMLCanvasElement)?.getContext('2d');
    if (ctxUso) new Chart(ctxUso, { type: 'bar', data: { labels: fechas, datasets: [{ label: 'Horas de Uso', data: datosUso, backgroundColor: 'rgba(79,70,229,0.8)', borderRadius: 4 }] }, options: { responsive: true, scales: { y: { beginAtZero: true, suggestedMax: 15 } } } });

    const ctxTemp = (document.getElementById('graficoTemp') as HTMLCanvasElement)?.getContext('2d');
    if (ctxTemp) new Chart(ctxTemp, { type: 'line', data: { labels: fechas, datasets: [{ label: 'Grados °C', data: datosTemp, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2, fill: true, tension: 0.3 }] }, options: { responsive: true, scales: { y: { suggestedMin: 20, suggestedMax: 45 } } } });
  });

  function setText(id: string, t: string): void { const e = document.getElementById(id); if (e) e.innerText = t; }
}
