# 添加大屏：从一个小改动开始

1. 按 [CONTRIBUTING](../CONTRIBUTING.md) 启动环境。
2. 运行 `npm run new:screen -- solar`。标识只允许小写字母、数字、连字符，且必须以字母开头。已有目录和标识不会覆盖。
3. 修改 `src/screens/solar/template.html`、`styles.css`、`app.js`，保持 `/*__SCREEN_CSS__*/`、`/*__SCREEN_JS__*/`、`/*__RUNTIME__*/` 标记。需要 Three.js/D3 时按现有场景加入对应构建标记。
4. 修改 `config/screens.json` 中生成的条目：标题、描述、分类、设计宽高、标签。`renderer: generic` 即可使用通用构建。
5. 用自己的实际截图替换 `assets/previews/solar.svg` 占位图，更新注册路径，并把素材来源和校验和记入 `assets/manifest.json`。不要使用未经许可的截图或模型。
6. 执行 `npm run dev`，确认 Home 自动出现卡片，筛选有效，实时预览比例正确，进入大屏路径正确。不会再需要改 Home HTML。
7. 增加最关键的交互检查，运行格式、语法、测试和完整构建，附截图提交 PR。

运行时脚本使用 `VizLabRuntime.mountStage(document.querySelector('#screen'),1920,1080)` 适配固定舞台。动画、观察器和 WebGL 资源清理注册到 `onDispose`。支持减少动态效果与键盘控制。需要特别资源的渲染器，可以先在 Issue 中讨论构建注入方案；不要为了单个主题把所有逻辑塞进 Home。
