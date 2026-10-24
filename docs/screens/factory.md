# 智慧工厂

源码：`src/screens/factory/`。`model.js` 构建冷却塔、主厂房、储罐、管线、道路及配套建筑，`app.js` 负责面板数据与交互。模型导出保存在 `assets/models/factory-campus.glb`。

鼠标拖动环绕，滚轮缩放，建筑点选显示信息。`#factory-theme-toggle` 切换日夜；约 1.6 秒的 Shader 扫光从左向右过渡。夜景保留极细网格、模糊辉光和菲涅耳轮廓，使用深度遮挡避免重复边线。网格纹理由项目程序生成，按 MIT 提供，可商用和再分发。WebGL 不可用时显示生成的厂区降级图。

重新构建使用 `npm run build:factory`，预览 `http://127.0.0.1:5173/factory.html`。修改材质需检查白天、过渡中段、夜晚以及返回白天四种状态。图表和产量均为演示数据；并非真实工厂工程模型。
