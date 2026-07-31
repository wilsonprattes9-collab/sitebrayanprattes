// rastro branco (tipo "cobra") que desenha/desdesenha ligado ao scroll,
// do topo de servicos ate' o fim de sobre. o caminho e' gerado
// como uma onda organica (nao uma linha reta) via spline catmull-rom.

function catmullRomToBezierPath(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// comeca perto do canto esquerdo (homeX) e vai invadindo o meio do
// conteudo (ate' homeX+swing) e voltando -- duas senoides de periodos
// diferentes somadas pra nao ficar um vaivem uniforme/previsivel. em
// telas estreitas (celular, uma coluna so' de conteudo) um swing grande
// cruzaria por cima do texto o tempo todo -- por isso o balanco fica
// bem mais contido, quase colado na margem esquerda, nesses casos.
function buildWavePoints(height, width, isNarrow) {
  const homeX = width * (isNarrow ? 0.05 : 0.08);
  const swing = width * (isNarrow ? 0.22 : 0.86);
  const period1 = 420;
  const period2 = 150;
  const steps = Math.max(30, Math.round(height / 28));
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height;
    const wave =
      Math.sin((y / period1) * Math.PI * 2) * 0.7 +
      Math.sin((y / period2) * Math.PI * 2 + 1.3) * 0.3;
    const x = homeX + (swing * (wave + 1)) / 2;
    points.push([x, y]);
  }
  return points;
}

let trailScrollTrigger = null;
let trailTween = null;

function setupScrollTrail() {
  const zone = document.querySelector('.trail-zone');
  const svg = document.getElementById('scrollTrail');
  const path = document.getElementById('scrollTrailPath');
  if (!zone || !svg || !path) return;

  if (trailScrollTrigger) { trailScrollTrigger.kill(); trailScrollTrigger = null; }
  if (trailTween) { trailTween.kill(); trailTween = null; }

  // largura ligada ao espaco de verdade disponivel (coluna de conteudo)
  // em vez de um valor fixo -- em telas estreitas o rastro passa a ser
  // uma faixa bem mais fina, colada na margem, pra nunca ultrapassar a
  // viewport nem invadir o texto.
  const trailTrack = document.querySelector('.trail-track');
  const containerWidth = trailTrack ? trailTrack.clientWidth : 460;
  const isNarrow = containerWidth < 700;
  const width = Math.min(460, isNarrow ? containerWidth * 0.55 : containerWidth * 1.1);
  const height = zone.offsetHeight;
  if (!height) return;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;

  const d = catmullRomToBezierPath(buildWavePoints(height, width, isNarrow));
  path.setAttribute('d', d);

  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

  trailTween = gsap.fromTo(
    path,
    { strokeDashoffset: length },
    {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: zone,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.4,
      },
    }
  );
  trailScrollTrigger = trailTween.scrollTrigger;
}

window.addEventListener('DOMContentLoaded', setupScrollTrail);

let trailResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(trailResizeTimer);
  trailResizeTimer = setTimeout(setupScrollTrail, 200);
});
