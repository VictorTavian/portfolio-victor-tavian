'use client';

import { useEffect } from 'react';

// Cursor original do site: um rastro em degradê (ciano → violeta) que segue o mouse
// e afina conforme se afasta. Só ativa com mouse de precisão e sem "reduzir movimento".
export default function TrailCursor() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    root.classList.add('custom-cursor');

    const canvas = document.createElement('canvas');
    canvas.id = 'trail';
    canvas.setAttribute('aria-hidden', 'true');
    // estilos inline: o rastro aparece mesmo que o CSS externo não carregue
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1000';
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      root.classList.remove('custom-cursor');
      return;
    }
    document.body.appendChild(canvas);

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let mx = -100, my = -100, hx = -100, hy = -100;
    const pts: { x: number; y: number }[] = [];
    const N = 38;
    const C1 = [111, 245, 255]; // ciano
    const C2 = [201, 155, 255]; // violeta

    // sobre links/botões e sobre projetos da galeria, o rastro engrossa
    let linkHover = false, galleryHover = false, hoverAmt = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      linkHover = !!(t && typeof t.closest === 'function' && t.closest('a, button'));
    };
    const onGallery = (e: Event) => {
      galleryHover = !!(e as CustomEvent<{ hover: boolean }>).detail?.hover;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('vt-cursor', onGallery);

    let raf = 0;
    const frame = () => {
      hx += (mx - hx) * 0.42;
      hy += (my - hy) * 0.42;
      const target = linkHover || galleryHover ? 1 : 0;
      hoverAmt += (target - hoverAmt) * 0.15;

      pts.unshift({ x: hx, y: hy });
      if (pts.length > N) pts.length = N;

      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (let i = 1; i < pts.length; i++) {
        const k = 1 - i / pts.length;
        const p = i / pts.length;
        const r = Math.round(C1[0] + (C2[0] - C1[0]) * p);
        const g = Math.round(C1[1] + (C2[1] - C1[1]) * p);
        const b = Math.round(C1[2] + (C2[2] - C1[2]) * p);
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${(0.95 * k).toFixed(3)})`;
        ctx.lineWidth = (1 + 9 * k * k) * (1 + 0.9 * hoverAmt);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('vt-cursor', onGallery);
      canvas.remove();
      root.classList.remove('custom-cursor');
    };
  }, []);

  return null;
}
