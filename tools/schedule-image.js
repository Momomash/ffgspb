const fs = require('fs');
const path = require('path');
const {chromium} = require('playwright');

const ROOT = '/opt/workspace/ffgspb';
const argv = process.argv.slice(2);
const HIGHLIGHT = argv.includes('--highlight-beginners');
const OUT = argv.find(a => !a.startsWith('--')) || (HIGHLIGHT ? 'schedule-table-beginners.png' : 'schedule-table.png');
const WIDTH = 1280;

const src = fs.readFileSync(path.join(ROOT, 'schedule.html'), 'utf8');
const start = src.indexOf('<div class="schedule-page">');
let block = src.slice(start, src.indexOf('</div>', src.indexOf('<a href="join_us"', start)) + 6);
block = block.replace(/\s*<a href="join_us"[\s\S]*?<\/a>/, '');   // без кнопки «ЗАДАТЬ ВОПРОС»

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<link href="assets/css/bootstrap-5.3.3.min.css" rel="stylesheet">
<link href="assets/css/style.css" rel="stylesheet">
<style>
  body { margin: 0; }
  .schedule-page { padding: 50px 0; }
  /* колонки шире содержимого -> поджимаем, чтобы не было пустых полей по бокам */
  .schedule-page .days { width: 1140px; column-gap: 30px; margin: 40px 0 0 0; }
  .schedule-page .day { max-width: 555px; }
  /* подсветка младших групп */
  td.beginners { background: rgba(86, 180, 235, 0.3) !important; }
</style>
</head>
<body>
${block}
</body>
</html>`;

const tmpPage = path.join(ROOT, '__schedule_render.html');
fs.writeFileSync(tmpPage, html);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: WIDTH, height: 1000}, deviceScaleFactor: 2});
  await page.goto('file://' + tmpPage, {waitUntil: 'networkidle'});

  if (HIGHLIGHT) {
    const marked = await page.evaluate(() => {
      // группы, подходящие новичку: младшие + направления, где нет деления по годам
      const PATTERNS = [
        /младшая группа/i,
        /утренняя группа/i,
        /МЕЧ&БАКЛЕР/i,
        /ДВУРУЧНЫЙ МЕЧ/i,
        /КЛАССИЧЕСКАЯ РАПИРА/i,
      ];
      const hit = [];
      document.querySelectorAll('.schedule-page td').forEach(td => {
        if (td.classList.contains('day') || td.classList.contains('master')) return;
        if (!PATTERNS.some(re => re.test(td.textContent))) return;
        td.classList.add('beginners');
        hit.push(td.textContent.replace(/\s+/g, ' ').trim());
      });
      return hit;
    });
    console.log(`подсвечено ячеек: ${marked.length}`);
    marked.forEach(t => console.log('  •', t));
  }

  await page.evaluate(() => document.fonts.ready);
  const h = Math.ceil(await page.evaluate(() => document.querySelector('.schedule-page').getBoundingClientRect().height));
  await page.setViewportSize({width: WIDTH, height: h});
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path: path.join(ROOT, OUT)});
  await browser.close();
  fs.unlinkSync(tmpPage);
  console.log(`${OUT}: ${WIDTH}x${h} CSS -> ${WIDTH * 2}x${h * 2} px`);
})();
