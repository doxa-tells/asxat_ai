/* ============================================================
   Carbeat Kz — анимации по референсу futuredeluxe.com
   ============================================================ */

/* ---------- 1. Хедер подтаивает во время скролла ---------- */
(() => {
  const header = document.getElementById('siteHeader');
  let timer;
  window.addEventListener('scroll', () => {
    header.classList.add('is-scrolling');
    clearTimeout(timer);
    timer = setTimeout(() => header.classList.remove('is-scrolling'), 260);
  }, { passive: true });
})();

/* ---------- 2. Hero-заглушка: анимированные wireframe-волны ---------- */
(() => {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, t = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const LINES = 28;

  const draw = () => {
    t += 0.006;

    // фон с лёгкой виньеткой
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .7);
    bg.addColorStop(0, '#0b1410');
    bg.addColorStop(1, '#04070a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // «сеточные» волны
    for (let i = 0; i < LINES; i++) {
      const p = i / (LINES - 1);
      const yBase = h * 0.18 + p * h * 0.64;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 8) {
        const nx = x / w;
        const amp = 34 * Math.sin(p * Math.PI);
        const y = yBase
          + Math.sin(nx * 6 + t * 2 + p * 4) * amp * 0.6
          + Math.sin(nx * 13 - t * 3 + p * 9) * amp * 0.35
          + Math.cos(nx * 3 + t + p * 2) * amp * 0.5;
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const glow = 0.05 + 0.22 * Math.pow(Math.sin(p * Math.PI), 2)
                 + 0.08 * Math.sin(t * 2 + p * 10);
      ctx.strokeStyle = `rgba(120, 235, 170, ${Math.max(glow, 0.03)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  };
  draw();
})();

/* ---------- 3. Пословный reveal интро-текста при скролле ---------- */
(() => {
  const blocks = document.querySelectorAll('.reveal-words');

  blocks.forEach(block => {
    // оборачиваем каждое слово в span, сохраняя классы строк и <br>
    block.querySelectorAll('.line-dark, .line-grey').forEach(line => {
      const words = line.textContent.trim().split(/\s+/);
      line.innerHTML = words.map(wd => `<span class="w">${wd}</span>`).join(' ');
    });
  });

  const allWords = document.querySelectorAll('.reveal-words .w');

  const update = () => {
    blocks.forEach(block => {
      const r = block.getBoundingClientRect();
      const vh = window.innerHeight;
      // прогресс: 0, когда блок внизу экрана; 1, когда его центр выше ~половины
      const progress = Math.min(Math.max((vh * 0.98 - r.top) / (vh * 0.5), 0), 1);
      const words = block.querySelectorAll('.w');
      const lit = Math.floor(progress * words.length);
      words.forEach((wd, i) => wd.classList.toggle('on', i < lit));
    });
  };

  if (allWords.length) {
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();

/* ---------- 4. Появление карточек при входе в вьюпорт ---------- */
(() => {
  const cards = document.querySelectorAll('.fade-in');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  cards.forEach(c => io.observe(c));
})();

/* ---------- 5. Живые часы в футере ---------- */
(() => {
  const clocks = document.querySelectorAll('.office-clock');
  if (!clocks.length) return;

  const tick = () => {
    const now = new Date();
    clocks.forEach(el => {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: el.dataset.tz,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).format(now);
    });
  };
  tick();
  setInterval(tick, 1000);
})();

/* ---------- 6. Cookie bar ---------- */
(() => {
  const bar = document.getElementById('cookieBar');
  if (!bar) return;

  if (localStorage.getItem('cb-cookies')) bar.classList.add('hidden');

  bar.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'more') return; // сюда позже — ссылка на политику
      localStorage.setItem('cb-cookies', action);
      bar.classList.add('hidden');
    });
  });
})();
