/**
 * SKYBOLT AI — Hero Atmospheric Radar Visualization
 * Calm, scientific radar styling: Restrained Cyan ray, Convective Amber heading & Severe Core.
 */

(function initHeroAtmosphericCanvas() {
  const canvas = document.getElementById('heroRadarCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let sweepAngle = 0;
  let particleOffset = 0;
  let width, height, centerX, centerY, maxRadius;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isReducedMotion = mediaQuery.matches;
  mediaQuery.addEventListener('change', (e) => { isReducedMotion = e.matches; });

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    centerX = width / 2;
    centerY = height / 2;
    maxRadius = Math.min(centerX, centerY) * 0.88;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const streamlineRadii = [0.25, 0.45, 0.65, 0.85];

  function drawVisualization() {
    ctx.clearRect(0, 0, width, height);

    // 1. Compass Crosshairs & Deep Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();

    // 2. Concentric Range Rings (15 km, 30 km, 45 km)
    const ringRadii = [maxRadius * 0.33, maxRadius * 0.66, maxRadius];
    const ringLabels = ['15 km', '30 km', '45 km'];

    ringRadii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 2 ? 'rgba(24, 214, 209, 0.25)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = idx === 2 ? 1.2 : 0.8;
      ctx.stroke();

      // Range labels in subtle mono font
      ctx.fillStyle = 'rgba(24, 214, 209, 0.75)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(ringLabels[idx], centerX + 8, centerY - r + 13);
    });

    // 3. Subtle Wind Streamline Flow
    particleOffset = (particleOffset + 0.35) % 20;
    ctx.save();
    ctx.strokeStyle = '#18D6D1';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -particleOffset;
    ctx.globalAlpha = 0.35;

    streamlineRadii.forEach((sr) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * sr, 0.1 * Math.PI, 1.3 * Math.PI);
      ctx.stroke();
    });
    ctx.restore();

    // 4. Convective Severe Storm Core
    const cellCenterX = centerX + 0.22 * maxRadius;
    const cellCenterY = centerY - 0.18 * maxRadius;
    const cellRadius = 52;

    const cellGrad = ctx.createRadialGradient(cellCenterX, cellCenterY, 4, cellCenterX, cellCenterY, cellRadius * 1.6);
    cellGrad.addColorStop(0, 'rgba(143, 63, 58, 0.75)');    // Severe Red Core #8F3F3A
    cellGrad.addColorStop(0.35, 'rgba(200, 148, 61, 0.45)'); // Amber #C8943D
    cellGrad.addColorStop(0.70, 'rgba(24, 214, 209, 0.15)'); // Cyan #18D6D1
    cellGrad.addColorStop(1, 'rgba(24, 214, 209, 0.0)');

    ctx.fillStyle = cellGrad;
    ctx.beginPath();
    ctx.arc(cellCenterX, cellCenterY, cellRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Reflectivity Isoline Boundary
    ctx.strokeStyle = '#B85C52';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(cellCenterX, cellCenterY, cellRadius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Predicted Motion Trajectory Vector (WSW)
    const vectorLength = maxRadius * 0.35;
    const vectorAngle = Math.PI * 0.72; // 215°
    const vectorEndX = cellCenterX + Math.cos(vectorAngle) * vectorLength;
    const vectorEndY = cellCenterY + Math.sin(vectorAngle) * vectorLength;

    ctx.strokeStyle = '#C8943D';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cellCenterX, cellCenterY);
    ctx.lineTo(vectorEndX, vectorEndY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead
    ctx.fillStyle = '#C8943D';
    ctx.beginPath();
    ctx.arc(vectorEndX, vectorEndY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Laser Radar Sweep Beam
    if (!isReducedMotion) {
      sweepAngle = (sweepAngle + 0.012) % (Math.PI * 2);
    } else {
      sweepAngle = Math.PI * 0.4;
    }

    const sweepTrail = 0.28;
    const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    sweepGrad.addColorStop(0, 'rgba(24, 214, 209, 0.22)');
    sweepGrad.addColorStop(1, 'rgba(24, 214, 209, 0.01)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRadius, sweepAngle - sweepTrail, sweepAngle, false);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // Leading Cyan Ray
    ctx.strokeStyle = '#18D6D1';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#18D6D1';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(sweepAngle) * maxRadius, centerY + Math.sin(sweepAngle) * maxRadius);
    ctx.stroke();
    ctx.restore();

    // 7. Radar Origin Dot
    ctx.fillStyle = '#18D6D1';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F7F6F2';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    animationFrameId = requestAnimationFrame(drawVisualization);
  }

  drawVisualization();
})();
