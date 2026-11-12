(function () {
  const grid = (document.getElementById('projects-grid') || document.querySelector('.card').parentElement);
  const wrap = document.getElementById('cyl-wrap');
  const canvas = document.getElementById('cyl-canvas');
  if (!grid || !wrap || !canvas || typeof THREE === 'undefined') return;

  /* ---------- Dados: lidos dos cartões que já existem na página ---------- */
  const projects = [...grid.querySelectorAll('.card')].map(c => ({
    title: c.querySelector('h3').textContent.trim(),
    desc: c.querySelector('p').textContent.trim(),
    tag: (c.querySelector('.tag') || {}).textContent || '',
    url: (c.querySelector('.card-link') || {}).href || '',
    img: (c.querySelector('img') || {}).src || ''
  }));
    // KART CUP e NEXT iPHONES: aparecem só no cilindro, sem cartão na página
  projects.push(
    { title: 'KART CUP', desc: 'Plataforma de inscrição para campeonato de kart, com apresentação do evento e cadastro de participantes.', tag: 'Inscrições', url: 'https://kartcup.netlify.app/', img: '' },
    { title: 'NEXT iPHONES', desc: 'Catálogo digital de iPhones, com apresentação de modelos, especificações, cores e opções de armazenamento.', tag: 'Catálogo digital', url: 'https://nextiphones.netlify.app/', img: '' }
  );grid.remove();
  const PHRASES = [
    'Um mundo inteiro em volta.',
    'Recue. Respire. Veja o todo.',
    'Agora, mergulhe.',
    'Por dentro, cada projeto é uma história.',
    'Atravesse os trabalhos.',
    'E saia do outro lado.'
  ];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = 8, H = 7, ASPECT = 1.6, SPREAD_D = 6, STRIPS = 26, FONT = 'Unbounded, system-ui, sans-serif';
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = x => x * x * (3 - 2 * x);
  const T = x => (window.vtT ? window.vtT(x) : x);
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const stage = wrap.querySelector('.cyl-stage');
  const hintEl = document.getElementById('cyl-hint');
  const cardEl = document.getElementById('cyl-card');
  const cardTag = document.getElementById('cyl-tag');
  const cardTitle = document.getElementById('cyl-title');
  const cardDesc = document.getElementById('cyl-desc');
  const cardLink = document.getElementById('cyl-link');
  document.getElementById('cyl-close').onclick = () => cardEl.classList.remove('on');
  const phraseEls = PHRASES.map(text => {
    const d = document.createElement('div');
    d.className = 'cyl-phrase';
    d.textContent = text;
    stage.appendChild(d);
    return d;
  });

  /* ---------- Cena ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  const ring = new THREE.Group();
  scene.add(ring);

  const Y = new THREE.Vector3(0, 1, 0), Zax = new THREE.Vector3(0, 0, 1);
  const FLIP = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI);
  const PLANE = new THREE.PlaneGeometry(1, 1);
  const STRIP_GEOS = [];
  for (let j = 0; j < STRIPS; j++) {
    const g = new THREE.PlaneGeometry(1, 1);
    const uv = g.attributes.uv, vt = 1 - j / STRIPS, vb = 1 - (j + 1) / STRIPS;
    uv.setXY(0, 0, vt); uv.setXY(1, 1, vt); uv.setXY(2, 0, vb); uv.setXY(3, 1, vb);
    uv.needsUpdate = true;
    STRIP_GEOS.push(g);
  }

  const lines = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const pts = [];
    const r = R * (0.55 + Math.random() * 0.95), y0 = (Math.random() - 0.5) * H * 1.5;
    const turns = 0.3 + Math.random() * 0.6, pitch = (Math.random() - 0.5) * 3, a0 = Math.random() * 6.28;
    for (let j = 0; j <= 90; j++) {
      const a = a0 + (j / 90) * turns * 6.283;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y0 + pitch * (j / 90), Math.sin(a) * r));
    }
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: i % 3 ? 0x27f4df : 0x12a8aa, transparent: true,
        opacity: 0.3 + Math.random() * 0.5, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    l.userData.sp = (0.2 + Math.random() * 0.7) * (i % 2 ? 1 : -1);
    lines.add(l);
  }
  scene.add(lines);

  const V = a => a.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const camPath = new THREE.CatmullRomCurve3(V([
    [0, 2, 24], [0, 9, 30], [0, 12, 13], [0, 5.5, 3], [0, 0.3, 0], [0, 0, -5], [0, 0.5, -13], [-9, 3, -24]
  ]), false, 'centripetal');
  const lookPath = new THREE.CatmullRomCurve3(V([
    [0, 0, 0], [0, 0, 0], [0, -1, 0], [0, -1, -2], [5, 0, -6], [0, 0, -20], [-6, 0, -14], [0, 0, 0]
  ]), false, 'centripetal');

  /* ---------- Cartões ---------- */
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function trunc(c, s, maxW) {
    if (c.measureText(s).width <= maxW) return s;
    let t = s;
    while (t.length > 1 && c.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  }
  function wrapText(c, text, maxW, maxL) {
    const words = text.split(/\s+/), out = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    if (out.length > maxL) { out.length = maxL; out[maxL - 1] = trunc(c, out[maxL - 1] + ' …', maxW); }
    return out;
  }
  function loadImage(src) {
    if (!src) return Promise.resolve(null);
    return new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  }
  function cardTexture(p, img) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 640;
    const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    c.save(); roundRect(c, 0, 0, w, h, 40); c.clip();
    if (img) {
      const k = Math.max(w / img.width, h / img.height);
      c.drawImage(img, (img.width - w / k) / 2, (img.height - h / k) / 2, w / k, h / k, 0, 0, w, h);
    } else {
      const seed = p.title.length * 37;
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${175 + (seed % 20)},75%,46%)`);
      g.addColorStop(1, `hsl(${195 + (seed % 15)},70%,11%)`);
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    const sh = c.createLinearGradient(0, h * 0.3, 0, h);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.88)');
    c.fillStyle = sh; c.fillRect(0, 0, w, h);
    c.restore();
    roundRect(c, 2, 2, w - 4, h - 4, 40);
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 4; c.stroke();

    const maxW = w - 112;
    c.fillStyle = '#27f4df'; c.font = `500 26px ${FONT}`;
    c.fillText(trunc(c, T(p.tag).toUpperCase(), maxW), 56, 96);
    c.fillStyle = '#e8f7fb'; c.font = `600 62px ${FONT}`;
    c.fillText(trunc(c, p.title, maxW), 56, h - 150);
    c.fillStyle = 'rgba(232,247,251,.8)'; c.font = `400 28px ${FONT}`;
    wrapText(c, T(p.desc), maxW, 2).forEach((l, j) => c.fillText(l, 56, h - 92 + j * 40));

    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 8;
    return tex;
  }

  /* ---------- Painéis ---------- */
  let panels = [];
  function clearPanels() {
    panels.forEach(p => {
      ring.remove(p.out, p.inn);
      p.strips.forEach(s => { ring.remove(s.out, s.inn); s.mat.dispose(); });
      p.mat.dispose(); p.tex.dispose();
    });
    panels = [];
  }
  let buildToken = 0;
  async function build(list) {
    const my = ++buildToken;               // só a construção mais recente vale
    const imgs = await Promise.all(list.map(p => loadImage(p.img)));
    if (my !== buildToken) return;
    const prevP = panels.map(p => p.p);
    const n = list.length;
    const arc = (2 * Math.PI * R) / n;
    let bw = arc * 0.94, bh = bw / ASPECT;
    if (bh > H * 0.94) { bh = H * 0.94; bw = bh * ASPECT; }
    let next;
    try {
      next = list.map((p, i) => {
      const tex = cardTexture(p, imgs[i]);
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, fog: false });
      const out = new THREE.Mesh(PLANE, mat), inn = new THREE.Mesh(PLANE, mat);
      out.userData.idx = inn.userData.idx = i;
      ring.add(out, inn);
      const strips = STRIP_GEOS.map(geo => {
        const sm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, fog: false });
        const so = new THREE.Mesh(geo, sm), si = new THREE.Mesh(geo, sm);
        so.userData.idx = si.userData.idx = i;
        so.visible = si.visible = false;
        ring.add(so, si);
        return { out: so, inn: si, mat: sm };
      });
      return {
        out, inn, mat, tex, strips, i, n,
        th: (i / n) * Math.PI * 2, bw, bh, p: prevP[i] || 0,
        roll: (i % 2 ? 1 : -1) * (0.5 + ((i * 0.37) % 0.8))
      };
      });
    } catch (err) {
      // se algo falhar na montagem, mantém os painéis atuais em vez de esvaziar a galeria
      console.error('Galeria: não foi possível montar os projetos', err);
      return;
    }
    clearPanels();
    panels = next;
  }

  function gridTargets(n) {
    const halfH = SPREAD_D * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const halfW = halfH * cam.aspect;
    let cols = 1, best = 1e9;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const sc = Math.abs(c / r - cam.aspect) + 0.3 * (c * r - n);
      if (sc < best) { best = sc; cols = c; }
    }
    const rows = Math.ceil(n / cols);
    const cellW = (2 * halfW * 0.96) / cols, cellH = (2 * halfH * 0.96) / rows;
    const pw = Math.min(cellW * 0.94, cellH * 0.94 * ASPECT), ph = pw / ASPECT;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    const base = cam.position.clone().addScaledVector(fwd, SPREAD_D);
    const out = [];
    for (let r = 0; r < rows; r++) {
      const inRow = Math.min(cols, n - r * cols);
      for (let c = 0; c < inRow; c++) {
        const x = (c - (inRow - 1) / 2) * cellW, y = -(r - (rows - 1) / 2) * cellH;
        out[r * cols + c] = { pos: base.clone().addScaledVector(right, x).addScaledVector(up, y), w: pw, h: ph };
      }
    }
    return out;
  }
  const dirOf = (i, right, up) => [
    up.clone().multiplyScalar(10), up.clone().multiplyScalar(-10),
    right.clone().multiplyScalar(13), right.clone().multiplyScalar(-13)
  ][i % 4];

  function updatePanels(k, t, dt) {
    ring.updateMatrixWorld(true);
    const invRing = ring.quaternion.clone().invert();
    const ringQ = ring.getWorldQuaternion(new THREE.Quaternion());
    const grid = gridTargets(panels.length);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    const back = fwd.clone().negate();

    panels.forEach(pn => {
      const d = (pn.i / pn.n) * 0.35;
      const target = smooth(clamp(k * 1.35 - d, 0, 1));
      pn.p += (target - pn.p) * (1 - Math.exp(-dt * 5));
      const e = pn.p;
      const g = grid[pn.i], a = pn.th;
      const P0 = ring.localToWorld(new THREE.Vector3(Math.sin(a) * R, 0, Math.cos(a) * R));
      const C = cam.position.clone().addScaledVector(back, 8).add(dirOf(pn.i, right, up));
      const B = new THREE.Vector3()
        .addScaledVector(P0, (1 - e) * (1 - e))
        .addScaledVector(C, 2 * (1 - e) * e)
        .addScaledVector(g.pos, e * e);
      const roll = new THREE.Quaternion().setFromAxisAngle(Zax, Math.sin(Math.PI * e) * pn.roll);
      const qOut = ringQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y, a))
        .slerp(cam.quaternion, e).multiply(roll);
      const qIn = ringQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y, a + Math.PI))
        .slerp(cam.quaternion.clone().multiply(FLIP), e).multiply(roll);
      const lp = ring.worldToLocal(B.clone());
      pn.out.position.copy(lp);
      pn.out.quaternion.copy(invRing.clone().multiply(qOut));
      pn.inn.position.copy(lp);
      pn.inn.quaternion.copy(invRing.clone().multiply(qIn));
      pn.hv = (pn.hv || 0) + ((pn.i === hoverIdx ? 1 : 0) - (pn.hv || 0)) * (1 - Math.exp(-dt * 10));
      const lift = 1 + 0.07 * pn.hv;
      pn.out.scale.set(THREE.MathUtils.lerp(pn.bw, g.w, e) * lift, THREE.MathUtils.lerp(pn.bh, g.h, e) * lift, 1);
      pn.inn.scale.copy(pn.out.scale);

      // fitas só durante a apresentação; no cilindro e na grade o cartão é inteiro
      const f = Math.sin(Math.PI * e);
      if (f < 0.001) {
        pn.out.visible = pn.inn.visible = true;
        pn.strips.forEach(st => { st.out.visible = st.inn.visible = false; });
        return;
      }
      pn.out.visible = pn.inn.visible = false;
      const W0 = pn.out.scale.x, H0 = pn.out.scale.y;
      const qo = pn.out.quaternion, qi = pn.inn.quaternion;
      pn.strips.forEach((st, j) => {
        const r1 = rnd(j + pn.i * 13.7), r2 = rnd(j * 7.3 + pn.i * 5.1 + 4);
        const mid = (j - (STRIPS - 1) / 2) / ((STRIPS - 1) / 2);
        const ybase = 0.5 - (j + 0.5) / STRIPS;
        const sway = Math.sin(t * (0.7 + r1 * 1.1) + j * 0.35 + pn.i) * 0.1 * f;
        const slide = Math.sin(t * (0.25 + r2 * 0.6) + j * 0.2) * 0.35 * f * f;
        const split = f * mid * 0.16;
        const off = new THREE.Vector3((slide + sway) * W0, (ybase + split) * H0, 0);
        const wf = 1 - f * 0.12 * r2;
        st.mat.opacity = clamp(1 - f * (0.35 + 0.5 * r1), 0, 1);
        st.out.position.copy(lp).add(off.clone().applyQuaternion(qo));
        st.out.quaternion.copy(qo);
        st.out.scale.set(W0 * wf, H0 / STRIPS + 0.003, 1);
        st.inn.position.copy(lp).add(off.clone().applyQuaternion(qi));
        st.inn.quaternion.copy(qi);
        st.inn.scale.copy(st.out.scale);
        st.out.visible = st.inn.visible = true;
      });
    });
  }

  /* ---------- Tamanho, clique e cartão ---------- */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pick(cx, cy) {
    if (!panels.length) return -1;
    const r = canvas.getBoundingClientRect();
    ptr.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam);
    const meshes = [];
    panels.forEach(p => { meshes.push(p.out, p.inn); p.strips.forEach(st => meshes.push(st.out, st.inn)); });
    const hits = ray.intersectObjects(meshes.filter(m => m.visible), false);
    return hits.length ? hits[0].object.userData.idx : -1;
  }
  function showCard(i) {
    const p = projects[i];
    if (!p) return;
    cardTag.textContent = T(p.tag);
    cardTitle.textContent = p.title;
    cardDesc.textContent = T(p.desc);
    if (p.url) { cardLink.href = p.url; cardLink.hidden = false; } else { cardLink.removeAttribute('href'); cardLink.hidden = true; }
    cardEl.classList.add('on');
  }
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;
    const i = pick(e.clientX, e.clientY);
    if (i >= 0) showCard(i); else cardEl.classList.remove('on');
  });
  let hoverIdx = -1, hoverOn = false;
  const setCursorHover = on => {
    if (on !== hoverOn) {
      hoverOn = on;
      window.dispatchEvent(new CustomEvent('vt-cursor', { detail: { hover: on } }));
    }
  };
  canvas.addEventListener('pointermove', e => {
    const idx = pick(e.clientX, e.clientY);
    const on = idx >= 0 && !cardEl.classList.contains('on');
    hoverIdx = on ? idx : -1;
    canvas.style.cursor = on ? 'pointer' : 'default';
    setCursorHover(on);
  });
  canvas.addEventListener('pointerleave', () => {
    hoverIdx = -1;
    setCursorHover(false);
  });

  /* ---------- Quadro ---------- */
  let s = 0, ringAngle = 0, t = 0, raf = 0, visible = true;
  let last = performance.now();

  function renderAt(k, dt) {
    const sz = stage.clientWidth * stage.clientHeight;
    if (!(sz > 0)) return;
    if (panels.length) {
      const dist = s; // câmera pela posição na seção
      cam.position.copy(camPath.getPoint(dist));
      const lookAt = lookPath.getPoint(dist);
      if (cam.position.distanceTo(lookAt) < 0.01) lookAt.z -= 0.5;
      cam.lookAt(lookAt);
      cam.fov = 55 + 18 * Math.sin(Math.PI * clamp((dist - 0.45) / 0.35, 0, 1));
      cam.updateProjectionMatrix();
      updatePanels(k, t, dt);
    }
    phraseEls.forEach((el, i) => {
      const n = PHRASES.length, a = (i / n) * 0.74, b = ((i + 1) / n) * 0.74, f = 0.025;
      const o = clamp(Math.min(i === 0 ? 1 : (s - a) / f, (b - s) / f), 0, 1) * (1 - k);
      el.style.opacity = String(o);
      el.style.transform = `translateY(calc(-50% + ${(1 - o) * 24}px))`;
      el.style.filter = `blur(${(1 - o) * 8}px)`;
    });
    if (hintEl) hintEl.style.opacity = String(clamp(0.7 - s * 14, 0, 0.7));
    renderer.render(scene, cam);
  }

  function step(now) {
    const dt = Math.min((now - last) / 1000, 0.1) || 0.016;
    last = now;
    if (visible) {
      t += dt;
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - innerHeight;
      const target = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      const prev = s;
      s += (target - s) * (1 - Math.exp(-dt * 3.2));
      const ds = s - prev, v = Math.abs(ds) / dt;
      const k = smooth(clamp((s - 0.72) / 0.24, 0, 1));
      ringAngle += (dt * 0.12 + ds * Math.PI * 6) * (1 - k);
      ring.rotation.y = ringAngle;
      lines.children.forEach(l => { l.rotation.y += dt * l.userData.sp * (1 + v * 25); });
      renderAt(k, dt);
    }
    raf = requestAnimationFrame(step);
  }

  async function init() {
    if (document.fonts) { try { await document.fonts.load(`600 62px Unbounded`); } catch (e) {} }
    window.vtRefreshGallery = () => build(projects);
    await build(projects);
    window.vtGalleryReady = true;
    resize();
    if (reduced) {
      // menos movimento: a grade final, parada, sem giro nem voo
      s = 1;
      renderAt(1, 10);
      addEventListener('resize', () => { resize(); renderAt(1, 10); });
    } else {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(wrap);
      addEventListener('resize', resize);
      raf = requestAnimationFrame(step);
    }
  }
  init();
})();
