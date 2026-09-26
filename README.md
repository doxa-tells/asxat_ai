# Carbeat Kz

Портфолио-сайт студии AI видео-клипов. Композиция и анимации вдохновлены futuredeluxe.com.

## Структура

```
index.html          — разметка страницы
css/style.css       — стили
js/main.js          — анимации (hero-canvas, reveal текста, часы, cookie bar)
assets/hero/        — сюда положить showreel.mp4 (hero-видео)
assets/clips/       — сюда положить 3 видео-клипа
assets/posters/     — сюда положить 5 постеров
```

## Как заменить заглушки

**Hero:** в `index.html` замените `<canvas id="heroCanvas">` на закомментированный рядом тег `<video>`, положив файл в `assets/hero/showreel.mp4`.

**Карточки:** внутри `.card-media` замените заглушку на
`<video src="assets/clips/clip-001.mp4" autoplay muted loop playsinline></video>`
или `<img src="assets/posters/poster-001.jpg" alt="">` — стили подхватятся автоматически (добавьте `width:100%; height:100%; object-fit:cover`, класс можно взять `.hero-media`).

## Запуск локально

Просто откройте `index.html` в браузере, либо:

```
python3 -m http.server 8000
```
