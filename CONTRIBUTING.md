# 参与 VIZ / LAB

感谢一起打磨可交互大屏。设计、建模、Shader、图表、文档、性能和无障碍都欢迎参与。初次贡献可从 [good first issue](https://github.com/yinweinidongle/screen-picture-demo/labels/good%20first%20issue) 开始；先在 Issue 留言说明准备解决的范围，避免重复工作。

## 10 分钟启动

需要 Node.js 22+（CI 使用 24）、Python 3.10+（CI 使用 3.13）。

```bash
git clone https://github.com/yinweinidongle/screen-picture-demo.git
cd screen-picture-demo
npm ci
npm run setup
npm run dev
```

打开 `http://127.0.0.1:5173/home.html`。修改 `src/`、`config/`、`assets/` 后自动重新构建，刷新页面查看。不要编辑 `dist/`。`npm run setup` 创建独立 `.venv` 并安装锁定的 Pillow。

## 一个聚焦的 PR

1. Fork 仓库，从 `master` 新建分支。先明确一个问题及验收方式；大规模视觉改版先开 Issue 对齐。
2. 在对应 `src/screens/<id>/` 修改，复用 `src/shared/runtime.js`。配置和 Home 展示信息在 `config/screens.json`。
3. 运行下面的检查。视觉改动附相同视角的前后截图、桌面尺寸和操作步骤；Shader 改动还需要日夜/线框等状态截图。修改演示数据时说明单位与来源。
4. 提交 PR，写清问题、用户可见变化、验证结果和素材来源。小范围 PR 更容易审阅；不需要为了贡献数量做无意义拆分。

```bash
npm run format
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Linux 首次安装浏览器使用 `npx playwright install --with-deps chromium`。没有 WebGL 的机器可先运行构建和单元测试，在 PR 中说明，交互检查交给 CI。浏览器报告保存在 `playwright-report/`，失败 trace 和截图在 `test-results/`。

## 添加一个大屏

```bash
npm run new:screen -- solar
npm run format
npm run dev
```

生成器创建 `src/screens/solar/{template.html,styles.css,app.js}`、原创 SVG 占位预览，并注册到 `config/screens.json`。替换占位预览、补充真实描述和测试即可；不必复制 Home 的 HTML。详见 [新增大屏教程](docs/adding-a-screen.md)。

## 代码和素材约定

- 原创代码遵循 MIT；提交即表示你有权按仓库对应许可贡献这些内容。保留第三方完整版权声明。
- 不上传参考图、未经许可的商业模型、字体或带真实个人数据的截图。新增素材必须记录来源、作者、许可、用途和 SHA-256；不明确的素材先讨论，不用“网上找到”替代来源。
- 模拟数据保持确定性；真实数据通过适配层引入，不在组件和 Shader 中写接口密钥。页面必须明确演示性质。
- 避免模块加载时主动请求公网服务。Web 版资源本地托管，离线版内嵌；资源 URL 由构建器注入。
- 保留键盘操作、焦点可见性、对话框退出与 `prefers-reduced-motion`。移除场景时断开观察器、停止动画并释放 WebGL 资源。
- 性能比较使用相同设备、视口和模式。提交绘制调用/三角形数、初次资源体积及相关截图，不用单个 FPS 数字宣称跨设备收益。

## 审阅与发布

CI 检查语法、格式、配置/构建契约及 Chromium 交互。PR 构建无发布权限；合并到 `master` 后独立任务将 `dist/` 部署到 GitHub Pages。维护者按实际空闲时间审阅，暂不承诺响应时限。路线图见 [ROADMAP.md](ROADMAP.md)。
