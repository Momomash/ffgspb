# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Что это

Статический сайт петербургского клуба исторического фехтования «Гильдия вольных фехтовальщиков» (ffgspb.ru): чистые HTML + CSS (из Sass) + немного jQuery. Ни сборщика, ни package.json, ни тестов, ни CI в репозитории нет — файлы деплоятся как есть. Весь контент на русском.

## Команды

Сборка стилей (единственный шаг сборки — `style.css` и `style.css.map` коммитятся вместе с `style.scss`):

```bash
npx --yes sass@1.77.8 assets/css/style.scss:assets/css/style.css --style=expanded
```

`--style=expanded` обязателен: в этом режиме вывод совпадает с уже закоммиченным `style.css`, иначе diff раздувается переформатированием всего файла. Правку CSS всегда вносить в `style.scss` и перекомпилировать, а не редактировать `style.css` руками.

Локальный просмотр:

```bash
npx --yes serve@14 -l 4321   # http://localhost:4321/montante
```

Нужен именно сервер с «чистыми» URL (`serve` даёт их из коробки). `python3 -m http.server` не подойдёт — внутренние ссылки без `.html` вернут 404. Через `file://` страница тоже сломается: шапка и подвал подгружаются `fetch`.

## Архитектура

**Одна страница — один html в корне.** Общих шаблонов нет: новая страница создаётся копированием ближайшей по типу и правкой содержимого. Дублируются в каждом файле и должны переноситься при копировании: блок счётчика Яндекс.Метрики (id 100118268), набор `<link>` в `<head>`, inline-скрипты подгрузки шапки/подвала, подключение bootstrap + jQuery в конце `<body>`.

**Шапка и подвал** живут в `components/header.html` и `components/footer.html` и вставляются в рантайме:

```js
fetch('./components/header.html').then(r => r.text()).then(h => document.getElementById('header').innerHTML = h);
```

Правка меню делается один раз в компоненте.

**Внутренние ссылки — без расширения** (`href="montante"`, `href="join_us"`), extensionless URL разруливает хостинг. Новые ссылки писать так же.

**Стили — один файл `assets/css/style.scss` (~2150 строк)**, разбитый на блоки верхнего уровня по страницам: `.main-page`, `.groups-page, .groups`, `.masters-page`, `.master-page`, `.schedule-page`, `.group-page`, `.price-page`, `.aboutGuild-page`, и т. д. Класс корневого `div` страницы выбирает её секцию в scss; `.group-page` — общий класс всех страниц направлений, `.master-page` — всех страниц инструкторов. Селектор `.groups-page, .groups` покрывает и страницу «Направления», и одноимённый блок на главной. Наверху файла — переменные (`$grey`, `$navbarHeight`, `$shadow`, …), миксины `mainH` / `light-grey-back` и `@font-face` для локальных шрифтов из `assets/fonts`.

**Кэш-бастинг:** `<link href="assets/css/style.css?vNN">` в каждой странице. После правки стилей номер версии на затронутых страницах увеличивается вручную; версии по страницам разъезжаются, это норма.

**Слайдеры:** slick 1.8.1 + jQuery 1.11, инициализируются inline-скриптом в конце конкретной страницы (`#groupsCards` на `index.html` и `groups.html`, `#mastersCards` на `masters.html`, `#whyCards` на `index.html`). Карусель направлений включается только на узких экранах: `if ($window.width() < 1400) { …slick(…) } else { slick('unslick') }`, плюс `responsive`-брейкпоинты 1000/768/578. Стрелки показываются отдельным CSS-правилом (`.controls-wrapper .controls { display: flex }` внутри медиазапроса) — **порог в JS и медиазапрос в scss нужно менять синхронно**, иначе стрелки появятся без слайдера или наоборот.

### Типы страниц

- **Страница направления** (`longsword`, `rapier`, `saber`, `classic`, `buckler`, `montante`): `.promo` c текстом слева и фоном `assets/img/groups/<name>_promo.png` справа, абзац `.description`, `.divider`, кнопка «ЗАДАТЬ ВОПРОС», затем `.schedule` — по одной `<table>` на день.
- **Страница инструктора** (`melnikov`, `nekrylov`, `kultaev`, `shafranovsky`, …): биография + расписание карточками `.card` (`.day` / `.time` / `.group_name`), фото в `assets/img/masters/<name>/`.
- **Витрины:** `groups.html` и блок «Направления» на `index.html` — одинаковые карточки-ссылки с фоном `assets/img/groups/<name>.png`; `masters.html` — сетка инструкторов.

### Расписание продублировано в трёх местах

Одно и то же занятие описано в `schedule.html` (сетка по дням недели), на странице направления и на странице инструктора. При изменении времени/тренера правятся **все три**. В `schedule.html` и на страницах направлений класс ячейки задаёт цвет направления: `.sword`, `.saber`, `.rapier`, `.buckler` (двуручный меч пока использует `.sword`), а название направления обёрнуто в ссылку на его страницу, имя тренера — в ссылку на его страницу, обе с `target="_blank"`.

## Git

Работа ведётся в ветках от `main` с последующим PR (`Momomash/<тема>`), ветки именуются по задаче: `add_kolotygin`, `update-prices`, `fix_prices_and_matrosov`, `montante`.
