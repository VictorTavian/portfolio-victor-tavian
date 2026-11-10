/* Site: vídeo de fundo, revelar, progresso, idioma e abertura (antes da galeria) */
(function(){
(function () {
  const VIDEO_SRC = '/assets/bg.mp4';
  const video = document.getElementById('cam');
  const stage = document.getElementById('stage');
  const progressBar = document.getElementById('progress');
  const hint = document.getElementById('hint');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let targetT = 0, currentT = 0, duration = 0, ready = false;

  function b64ToBlobUrl(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
  }

  try {
    video.src = VIDEO_SRC;
    video.addEventListener('loadedmetadata', () => {
      duration = video.duration || 0;
      ready = true;
      video.classList.add('ready');
      video.currentTime = 0;
      updateTarget();
    });
  } catch (e) {
    stage.style.background = 'radial-gradient(ellipse at center, #092b39, #000406 70%)';
  }

  function maxScroll() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function updateTarget() {
    const p = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    progressBar.style.transform = 'scaleX(' + p + ')';
    if (duration) targetT = p * (duration - 0.04);
    if (window.scrollY > 40) hint.style.opacity = '0';
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateTarget(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateTarget);

  function tick() {
    if (ready && !reduced) {
      currentT += (targetT - currentT) * 0.09;
      if (!video.seeking && Math.abs(video.currentTime - currentT) > 0.016) {
        try { video.currentTime = currentT; } catch (e) {}
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Alterna a direção de entrada: esquerda, direita, esquerda...
  let side = 0;
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.classList.contains('tech')) return; // cards de tecnologia já têm direção própria
    el.style.setProperty('--from', side % 2 === 0 ? '-90px' : '90px');
    side++;
  });
  document.querySelectorAll('.reveal-line > span').forEach(sp => {
    sp.style.setProperty('--fx', side % 2 === 0 ? '-105%' : '105%');
    side++;
  });

  const revealEls = document.querySelectorAll('.reveal, .reveal-line');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  }


  const toggleBtn = document.getElementById('toggle-projects');
  const extraCards = document.querySelectorAll('#projects-grid .card.extra');
  if (toggleBtn && extraCards.length) {
    toggleBtn.addEventListener('click', () => {
      const open = toggleBtn.getAttribute('aria-expanded') !== 'true';
      extraCards.forEach(c => { c.hidden = !open; });
      toggleBtn.setAttribute('aria-expanded', String(open));
      toggleBtn.textContent = open ? 'Mostrar menos' : 'Ver todos os projetos';
    });
  }

  window.addEventListener('load', () => {
    document.querySelectorAll('#inicio .reveal, #inicio .reveal-line').forEach(el => {
      setTimeout(() => el.classList.add('in'), 150);
    });
  });


  // ---------- Cursor personalizado: somente o rastro em degradê ----------
  (function () {
    const fine = window.matchMedia('(pointer: fine)').matches;
    return; // rastro antigo, substituído pelo novo cursor
    const root = document.documentElement;
    root.classList.add('custom-cursor');

    const canvas = document.createElement('canvas');
    canvas.id = 'trail';
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    let mx = -100, my = -100, hx = -100, hy = -100;
    const pts = [];
    const N = 38;
    const C1 = [39, 244, 223];   // ciano
    const C2 = [18, 168, 170];   // violeta

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    function frame() {
      hx += (mx - hx) * 0.42;
      hy += (my - hy) * 0.42;

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
        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.95 * k).toFixed(3) + ')';
        ctx.lineWidth = 1 + 17 * k * k;
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  updateTarget();
})();

})();
(function(){
(function () {
  /* abertura: progresso real do carregamento + escolha de idioma */
  const intro = document.getElementById('intro');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (intro) {
    document.documentElement.classList.add('is-intro');
    const bar = intro.querySelector('.intro-progress span');
    const count = intro.querySelector('.intro-count');
    const video = document.getElementById('cam');
    const start = performance.now();
    const MIN = reduced ? 0 : 1800;     // tempo mínimo da animação
    let shown = 0, closed = false, ready = false;

    const realProgress = () => {
      let p = 0;
      if (video && video.readyState >= 2) p += 0.45;
      else if (video && video.readyState >= 1) p += 0.2;
      if (document.readyState === 'complete') p += 0.25;
      else if (document.readyState === 'interactive') p += 0.1;
      if (window.vtGalleryReady) p += 0.3;
      return Math.min(1, p);
    };
    const tick = now => {
      if (closed) return;
      const elapsed = now - start;
      const real = realProgress() * 100;
      // sem resposta do carregamento, a barra ainda sobe devagar até 85%
      const simulated = Math.min(85, (elapsed / 4000) * 85);
      const target = real >= 100 ? 100 : Math.max(real, simulated);
      shown += (target - shown) * 0.12;
      if (bar) bar.style.width = shown.toFixed(1) + '%';
      if (count) count.textContent = Math.round(shown) + '%';
      if (!ready && ((shown >= 99 && elapsed >= MIN) || elapsed >= 5000)) {
        ready = true;
        intro.classList.add('ready');
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      closed = true;
      intro.classList.add('out');
      document.documentElement.classList.remove('is-intro');
      setTimeout(() => intro.remove(), 1000);
    };
    intro.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.vtSetLang) window.vtSetLang(btn.getAttribute('data-lang'));
        finish();
      });
    });
    setTimeout(finish, 9000); // sem escolha, o site abre no idioma padrão
  }

  /* proteção de imagens: sem arrastar e sem menu de salvar */
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('contextmenu', e => {
    if (e.target.closest && e.target.closest('img, canvas')) e.preventDefault();
  });

  /* links externos sempre isolados */
  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    const rel = (a.getAttribute('rel') || '').split(' ');
    if (!rel.includes('noopener')) rel.push('noopener');
    if (!rel.includes('noreferrer')) rel.push('noreferrer');
    a.setAttribute('rel', rel.join(' ').trim());
  });
})();

})();
(function(){
(function () {
  const EN = {
    "Sobre": "About",
    "Projetos": "Projects",
    "Competências": "Skills",
    "Filosofia": "Philosophy",
    "Contato": "Contact",
    "Role para explorar": "Scroll to explore",
    "Tecnologia com propósito.": "Technology with purpose.",
    "Design com intenção.": "Design with intent.",
    "Desenvolvo interfaces e experiências digitais que unem estética, funcionalidade e engenharia de software.": "I build digital interfaces and experiences that unite aesthetics, functionality and software engineering.",
    "Ver projetos": "View projects",
    "Iniciar uma conversa": "Start a conversation",
    "Estratégia, precisão técnica e sensibilidade visual.": "Strategy, technical precision and visual sensitivity.",
    "Sou Victor Tavian, desenvolvedor criativo e fundador da": "I'm Victor Tavian, creative developer and founder of",
    "Minha atuação combina desenvolvimento web, design de interfaces e pesquisa de novas tecnologias. Antes de escrever código, busco entender o propósito de cada projeto e traduzir objetivos de negócio em experiências funcionais, intuitivas e visualmente coerentes.": "My work combines web development, interface design and research into new technologies. Before writing code, I seek to understand the purpose of each project and turn business goals into functional, intuitive and visually coherent experiences.",
    "Acredito que a excelência surge quando estratégia, rigor técnico e sensibilidade visual caminham juntos.": "I believe excellence emerges when strategy, technical rigor and visual sensitivity walk together.",
    "Projetos selecionados.": "Selected projects.",
    "Trabalhos que transformam conceito em experiência, unindo desafio, solução e execução.": "Work that turns concepts into experiences, uniting challenge, solution and execution.",
    "Uma loja de óculos com experiência de rolagem cinematográfica e vitrine de produtos.": "An eyewear store with a cinematic scroll experience and product showcase.",
    "E-commerce": "E-commerce",
    "Abrir site ↗": "Visit site ↗",
    "Uma solução digital para simplificar agendamentos e aproximar clientes do negócio.": "A digital solution to simplify bookings and bring clients closer to the business.",
    "Sistema de agendamento": "Booking system",
    "Uma proposta de interface financeira com apresentação objetiva e linguagem contemporânea.": "A financial interface concept with objective presentation and contemporary language.",
    "Fintech": "Fintech",
    "Uma experiência digital desenvolvida para valorizar cada detalhe da culinária japonesa.": "A digital experience built to highlight every detail of Japanese cuisine.",
    "Cardápio digital": "Digital menu",
    "Uma vitrine digital criada para transformar produtos em uma experiência de compra.": "A digital storefront designed to turn products into a shopping experience.",
    "Uma presença digital que apresenta serviços, identidade e personalidade em um só lugar.": "A digital presence that showcases services, identity and personality in one place.",
    "Landing page": "Landing page",
    "Uma interface de gestão com foco em organização, clareza e experiência de uso.": "A management interface focused on organization, clarity and user experience.",
    "Dashboard": "Dashboard",
    "Uma experiência digital construída em torno de força, movimento e identidade visual.": "A digital experience built around strength, movement and visual identity.",
    "Fitness": "Fitness",
    "Uma experiência digital para apresentar o cardápio e valorizar a identidade da marca.": "A digital experience to present the menu and highlight the brand's identity.",
    "Food & delivery": "Food & delivery",
    "Uma página de apresentação com identidade marcante e foco na experiência visual.": "A presentation page with a striking identity and a focus on the visual experience.",
    "Ver todos os projetos": "See all projects",
    "Competências que conectam design e engenharia.": "Skills that connect design and engineering.",
    "Desenvolvimento": "Development",
    "Desenvolvimento front-end": "Front-end development",
    "Desenvolvimento web": "Web development",
    "Aplicações web sob medida": "Custom web applications",
    "Interfaces responsivas": "Responsive interfaces",
    "Integração de APIs": "API integration",
    "Desenvolvimento full-stack": "Full-stack development",
    "Design & Experiência": "Design & Experience",
    "Design de interfaces (UI)": "Interface design (UI)",
    "Experiência do usuário (UX)": "User experience (UX)",
    "Design systems": "Design systems",
    "Prototipagem": "Prototyping",
    "Animações e interações": "Animation & interaction",
    "Desenvolvimento criativo": "Creative development",
    "Linguagens": "Languages",
    "Frameworks e ferramentas": "Frameworks & tools",
    "Git & GitHub": "Git & GitHub",
    "Não basta funcionar.": "Working is not enough.",
    "Precisa fazer sentido.": "It has to make sense.",
    "Acredito que a tecnologia, quando aplicada com intenção, gera soluções relevantes.": "I believe technology, applied with intention, creates relevant solutions.",
    "Cada detalhe de uma interface influencia a experiência, e cada decisão técnica impacta o resultado. Todo projeto exige uma combinação única de lógica, criatividade e execução.": "Every detail of an interface shapes the experience, and every technical decision shapes the result. Every project demands a unique combination of logic, creativity and execution.",
    "Meu objetivo é criar experiências tão eficientes quanto memoráveis.": "My goal is to create experiences as efficient as they are memorable.",
    "Vamos construir o próximo projeto.": "Let's build the next project.",
    "Estou aberto a oportunidades profissionais, desafios técnicos e colaborações que exploram o potencial da tecnologia com propósito.": "I'm open to professional opportunities, technical challenges and collaborations that explore the potential of technology with purpose.",
    "Se você busca um profissional que una visão criativa, rigor técnico e evolução constante, será um prazer conversar.": "If you're looking for a professional who combines creative vision, technical rigor and constant growth, it will be a pleasure to talk.",
    "Entrar em contato": "Get in touch",
    "Front-End Developer · Fundador da KØDE® Digital Studio": "Front-End Developer · Founder of KØDE® Digital Studio",
    "© 2026 — Todos os direitos reservados.": "© 2026 — All rights reserved.",
    "© 2026 Victor Tavian — Todos os direitos reservados.": "© 2026 Victor Tavian — All rights reserved.",
    "Role para explorar os projetos": "Scroll to explore the projects",
    "Um mundo inteiro em volta.": "A whole world around you.",
    "Recue. Respire. Veja o todo.": "Step back. Breathe. See the whole.",
    "Agora, mergulhe.": "Now, dive in.",
    "Por dentro, cada projeto é uma história.": "Inside, every project is a story.",
    "Atravesse os trabalhos.": "Pass through the work.",
    "E saia do outro lado.": "And step out the other side.",
    "Seções do site": "Site sections",
    "Galeria de projetos. Toque em um painel para ver o projeto.": "Project gallery. Tap a panel to see the project.",
    "Fechar": "Close",
    "Escolher fotos": "Choose photos"
  };
  const RX = [
    [/^Captura da página inicial do projeto (.+)$/, 'Homepage screenshot of project $1'],
    [/^Logotipo (.+)$/, '$1 logo']
  ];
  const tr = t => {
    if (EN[t] !== undefined) return EN[t];
    for (const [rx, rep] of RX) if (rx.test(t)) return t.replace(rx, rep);
    return undefined;
  };

  let lang = 'pt';
  try {
    const saved = localStorage.getItem('vt-lang');
    if (saved === 'en' || saved === 'pt') lang = saved;
    else if ((navigator.language || '').toLowerCase().startsWith('en')) lang = 'en';
  } catch (e) {}

  window.vtT = s => (lang === 'en' && tr(s.trim()) !== undefined) ? tr(s.trim()) : s;

  function apply() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const p = n.parentNode;
      if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'NOSCRIPT') return;
      if (n.__pt === undefined) n.__pt = n.nodeValue;
      const raw = n.__pt, t = raw.trim();
      if (!t) return;
      if (lang === 'en') {
        const out = tr(t);
        if (out !== undefined) n.nodeValue = raw.replace(t, () => out);
      } else {
        n.nodeValue = raw;
      }
    });
    document.querySelectorAll('[alt],[aria-label]').forEach(el => {
      if (!el.__pt) el.__pt = { alt: el.getAttribute('alt'), aria: el.getAttribute('aria-label') };
      if (el.__pt.alt != null) {
        const v = lang === 'en' ? (tr(el.__pt.alt) || el.__pt.alt) : el.__pt.alt;
        el.setAttribute('alt', v);
      }
      if (el.__pt.aria != null) {
        const v = lang === 'en' ? (tr(el.__pt.aria) || el.__pt.aria) : el.__pt.aria;
        el.setAttribute('aria-label', v);
      }
    });
    if (window.vtRefreshGallery) window.vtRefreshGallery();
  }

  let labelBtn = () => {};
  window.vtSetLang = (l) => {
    if (l !== 'en' && l !== 'pt') return;
    lang = l;
    try { localStorage.setItem('vt-lang', lang); } catch (e) {}
    labelBtn();
    apply();
  };

  const nav = document.querySelector('.topbar-nav');
  if (nav) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle';
    btn.setAttribute('aria-label', 'Change language / Mudar idioma');
    labelBtn = () => { btn.textContent = lang === 'en' ? 'PT' : 'EN'; };
    labelBtn();
    btn.addEventListener('click', () => window.vtSetLang(lang === 'en' ? 'pt' : 'en'));
    nav.appendChild(btn);
  }

  if (lang === 'en') apply();
})();

})();
/* Carrega three.js e depois a galeria, nessa ordem */
(function(){
  function add(src){return new Promise(function(res){var s=document.createElement('script');s.src=src;s.async=false;s.onload=res;document.body.appendChild(s);});}
  add('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js').then(function(){return add('/js/gallery.js');});
})();
