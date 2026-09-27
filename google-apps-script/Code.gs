/**
 * Carbeat Kz — приём заявок с сайта.
 * Пишет заявку в Google Таблицу и шлёт уведомление в Telegram.
 *
 * УСТАНОВКА — см. README.md проекта (раздел «Подключение формы»).
 * Коротко:
 *   1. Создайте Google Таблицу → Расширения → Apps Script → вставьте этот код.
 *   2. В меню Apps Script: Настройки проекта → Свойства скрипта → добавьте:
 *        TG_TOKEN   — токен бота от @BotFather
 *        TG_CHAT_ID — ваш chat_id (узнать у @userinfobot)
 *   3. Развернуть → Новое развертывание → Веб-приложение:
 *        «От имени: меня», «Доступ: все» → скопируйте URL.
 *   4. Вставьте URL в js/main.js → ORDER_ENDPOINT.
 */

const SHEET_NAME = 'Заявки';

const HEADERS = [
  'Дата', 'Приоритет', 'Имя / компания', 'Кто', 'Телефон', 'Telegram', 'Что нужно',
  'Трек / референс', 'Бюджет', 'Дедлайн', 'Идея', 'Источник', 'Страница'
];

function doPost(e) {
  const p = e.parameter || {};

  // honeypot — тихо игнорируем ботов
  if (p.website) return json_({ ok: true });

  const priority = calcPriority_(p);

  // --- 1. Запись в таблицу ---
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    Utilities.formatDate(new Date(), 'Asia/Almaty', 'dd.MM.yyyy HH:mm'),
    priority.label,
    p.name || '', p.who || '', p.phone || '', p.telegram || '', p.type || '',
    p.track || '', p.budget || '', p.deadline || '', p.idea || '',
    p.source || '', p.page || ''
  ]);

  // --- 2. Telegram-уведомление ---
  sendTelegram_(p, priority);

  return json_({ ok: true });
}

/**
 * Приоритет заявки: бюджет ×2 + срочность + готовность материала + тип клиента.
 *   🔥 Горячий (>=6) — большой бюджет / B2B и близкий срок: отвечать первым делом.
 *   ⚡ Средний (3–5) — нормальный лид, ответить в течение дня.
 *   ❄️ Холодный (<3) — низкий бюджет, материалов нет: отвечать по остатку.
 */
function calcPriority_(p) {
  const budgetPts = {
    'до 300 000 ₸': 0,
    '300 000 – 700 000 ₸': 1,
    '700 000 – 1 500 000 ₸': 2,
    '1 500 000 ₸ и выше': 3,
    'Пока не определился': 1
  }[p.budget] ?? 1;

  const deadlinePts = {
    'Срочно — до 2 недель': 2,
    '2–4 недели': 2,
    '1–2 месяца': 1,
    'Сроки гибкие': 0
  }[p.deadline] ?? 0;

  // бренды и агентства обычно платят больше и решают быстрее
  const whoPts = {
    'Бренд / бизнес': 1,
    'Агентство / продакшн': 1,
    'Артист / музыкант': 0,
    'Частное лицо': 0
  }[p.who] ?? 0;

  // материал (трек / сайт / референс) уже есть — клиент ближе к сделке
  const materialPts = p.track && p.track.trim() && !/в работе|пока нет/i.test(p.track) ? 1 : 0;

  const score = budgetPts * 2 + deadlinePts + whoPts + materialPts;

  if (score >= 6) return { score, label: '🔥 Горячий' };
  if (score >= 3) return { score, label: '⚡ Средний' };
  return { score, label: '❄️ Холодный' };
}

function sendTelegram_(p, priority) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TG_TOKEN');
  const chatId = props.getProperty('TG_CHAT_ID');
  if (!token || !chatId) return; // Telegram не настроен — заявка всё равно в таблице

  const lines = [
    `${priority.label} — новая заявка!`,
    '',
    `👤 ${p.name || '—'}${p.who ? ' · ' + p.who : ''}`,
    `📞 ${p.phone || '—'}`,
    p.telegram ? `✈️ ${p.telegram}` : null,
    '',
    `🎬 ${p.type || '—'}`,
    `🎵 Трек/референс: ${p.track || '—'}`,
    `💰 Бюджет: ${p.budget || '—'}`,
    `⏰ Срок: ${p.deadline || '—'}`,
    p.idea ? `\n💡 Идея: ${p.idea}` : null,
    p.source ? `\n📣 Источник: ${p.source}` : null
  ].filter(l => l !== null);

  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
    muteHttpExceptions: true
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Тест: запустите вручную, чтобы проверить таблицу и Telegram без сайта. */
function testSubmit() {
  doPost({ parameter: {
    name: 'Тест Тестов',
    who: 'Бренд / бизнес',
    phone: '+7 700 000 00 00',
    telegram: '@test',
    type: 'Видео-клип',
    track: 'https://youtu.be/example',
    budget: '700 000 – 1 500 000 ₸',
    deadline: 'Срочно — до 2 недель',
    idea: 'Неоновый город, дождь, машины',
    source: 'Instagram / TikTok',
    page: 'test'
  }});
}
