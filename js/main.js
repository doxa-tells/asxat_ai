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

/* ---------- 6. Форма заказа → Google Sheets + Telegram ---------- */
/*
   Заявки уходят в Google Apps Script (см. google-apps-script/Code.gs),
   который пишет строку в Google Таблицу и шлёт сообщение в Telegram.
   После деплоя скрипта вставьте его URL сюда:
*/
const ORDER_ENDPOINT = 'https://script.google.com/macros/s/AKfycby-DXf1C7oj5QcapgdoZyZPexlB3lhRIeTAT89o93nPNQtKAsyWD9sMd1i0RY7LTM5k/exec';

// WhatsApp: после отправки формы клиента перекидывает в чат с готовым сообщением
const WHATSAPP_PHONE = '77066660050'; // +7 (706) 666-00-50

(() => {
  const modal = document.getElementById('orderModal');
  const form = document.getElementById('orderForm');
  if (!modal || !form) return;

  const steps = [...form.querySelectorAll('.step')];
  const status = document.getElementById('orderStatus');
  const counter = document.getElementById('wizardCounter');
  const progress = document.getElementById('progressBar');
  const nextBtn = form.querySelector('.wizard-next');
  const backBtn = form.querySelector('.wizard-back');
  const done = document.getElementById('orderDone');
  let current = 0;

  const pad = n => String(n).padStart(2, '0');

  /* --- открытие / закрытие --- */
  const openModal = (e) => {
    if (e) e.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showStep(current);
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-order]').forEach(el =>
    el.addEventListener('click', openModal));
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.order-done-close')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* --- шаги --- */
  const showStep = (i) => {
    steps.forEach((s, idx) => { s.hidden = idx !== i; });
    counter.textContent = `${pad(i + 1)} / ${pad(steps.length)}`;
    progress.style.width = `${((i + 1) / steps.length) * 100}%`;
    backBtn.hidden = i === 0;
    nextBtn.textContent = i === steps.length - 1 ? 'Отправить заявку' : 'Далее →';
    status.textContent = '';
    status.classList.remove('error');
    // фокус на первое поле шага
    const input = steps[i].querySelector('.step-input');
    if (input) setTimeout(() => input.focus(), 350);
  };

  const validateStep = (i) => {
    const step = steps[i];
    let valid = true;
    step.querySelectorAll('[required]').forEach(el => {
      if (!el.value.trim()) valid = false;
    });
    step.classList.toggle('error', !valid);
    if (!valid) {
      const isChoice = step.querySelector('.choices');
      status.textContent = isChoice ? 'Выберите вариант' : 'Заполните поле';
      status.classList.add('error');
    }
    return valid;
  };

  const next = () => {
    if (!validateStep(current)) return;
    if (current < steps.length - 1) {
      current++;
      showStep(current);
    } else {
      submit();
    }
  };

  nextBtn.addEventListener('click', next);
  backBtn.addEventListener('click', () => {
    if (current > 0) { current--; showStep(current); }
  });

  // выбор варианта кликом — сразу дальше
  form.querySelectorAll('.choices').forEach(group => {
    const hidden = form.elements[group.dataset.name];
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.choice');
      if (!btn) return;
      group.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      hidden.value = btn.dataset.value;
      steps[current].classList.remove('error');
      setTimeout(next, 260); // короткая пауза, чтобы увидеть выбор
    });
  });

  // Enter = далее (кроме textarea)
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      next();
    }
  });

  form.addEventListener('input', () => steps[current].classList.remove('error'));

  /* --- отправка --- */
  const submit = async () => {
    if (form.website.value) return; // honeypot

    if (ORDER_ENDPOINT.startsWith('PASTE')) {
      status.textContent = 'Форма ещё не подключена (см. README)';
      status.classList.add('error');
      return;
    }

    nextBtn.disabled = true;
    status.classList.remove('error');
    status.textContent = 'Отправляем…';

    // готовое сообщение в WhatsApp из ответов формы — собираем ДО отправки
    const fd = new FormData(form);
    const waText = [
      'Здравствуйте! Я оставил(а) заявку на сайте Carbeat Kz.',
      '',
      `Имя: ${fd.get('name') || '—'}`,
      `Кто: ${fd.get('who') || '—'}`,
      `Нужно: ${fd.get('type') || '—'}`,
      `Бюджет: ${fd.get('budget') || '—'}`,
      `Срок: ${fd.get('deadline') || '—'}`,
      fd.get('track') ? `Референс: ${fd.get('track')}` : null,
      fd.get('idea') ? `Идея: ${fd.get('idea')}` : null
    ].filter(l => l !== null).join('\n');
    const waUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(waText)}`;

    const waLink = document.getElementById('waLink');
    if (waLink) waLink.href = waUrl;

    const data = new URLSearchParams(fd);
    data.append('page', location.href);

    try {
      await fetch(ORDER_ENDPOINT, { method: 'POST', body: data });
    } catch (err) {
      status.textContent = 'Не удалось отправить. Напишите нам в WhatsApp: +7 706 666 00 50';
      status.classList.add('error');
      nextBtn.disabled = false;
      return;
    }

    form.hidden = true;
    done.hidden = false;

    // авто-переход в WhatsApp; кнопка на экране — запасной вариант.
    // location.href не трогаем, если страница встроена (превью/iframe).
    setTimeout(() => {
      const w = window.open(waUrl, '_blank');
      if (!w && window.top === window.self) location.href = waUrl;
    }, 1200);
  };
})();

/* ---------- 7. Cookie bar ---------- */
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
