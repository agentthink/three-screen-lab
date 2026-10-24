import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './tasks.mjs';
const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9-]{1,39}$/.test(id)) {
  console.error('Usage: npm run new:screen -- solar');
  process.exit(1);
}
const registryPath = path.join(root, 'config/screens.json');
const entries = JSON.parse(readFileSync(registryPath));
const source = path.join(root, 'src/screens', id);
if (entries.some((e) => e.id === id) || existsSync(source)) {
  console.error('Screen already exists: ' + id);
  process.exit(1);
}
mkdirSync(source, { recursive: true });
writeFileSync(
  path.join(source, 'template.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${id}</title><style>/*__SCREEN_CSS__*/</style></head><body><main id="screen"><h1>${id}</h1><p>从这里开始创作你的大屏。</p><a href="home.html">返回展厅</a></main><script>/*__RUNTIME__*/</script><script>/*__SCREEN_JS__*/</script></body></html>\n`,
);
writeFileSync(
  path.join(source, 'styles.css'),
  'body{margin:0;background:#071420;color:#d8f7ff;font-family:system-ui}#screen{position:absolute;left:50%;top:50%;width:1920px;height:1080px;padding:80px;box-sizing:border-box}a{color:#80d6de}\n',
);
writeFileSync(
  path.join(source, 'app.js'),
  "/* SPDX-License-Identifier: MIT */\nVizLabRuntime.mountStage(document.querySelector('#screen'),1920,1080);\n",
);
writeFileSync(
  path.join(root, 'assets/previews', id + '.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="#071420"/><text x="100" y="200" fill="#80d6de" font-size="80" font-family="sans-serif">${id}</text><text x="100" y="300" fill="#91aaba" font-size="36">Your next visualization</text></svg>\n`,
);
entries.push({
  id,
  title: id,
  description: '新增可视化大屏',
  category: 'operations',
  label: id.toUpperCase(),
  width: 1920,
  height: 1080,
  preview: `assets/previews/${id}.svg`,
  tags: ['新作品'],
  renderer: 'generic',
});
writeFileSync(registryPath, JSON.stringify(entries, null, 2) + '\n');
console.log(`Created ${source}. Edit the source and config/screens.json, then run npm run build.`);
