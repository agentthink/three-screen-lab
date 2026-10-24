# 风机数字孪生

源码：`src/screens/wind/`。`template.html` 为面板结构，`styles.css` 为布局和装饰，`data.js` 为三台演示机组数据，`app.js` 负责图表和状态，`model.js` 为 Three.js 程序模型与玻璃/流光 Shader。

支持拖动环绕、滚轮缩放、部件点选、启停、线框、拆解、流光、自动环绕与冷光。聚焦模型后方向键旋转、`+/-` 缩放、`R` 复位。对话框支持 Escape 关闭和焦点返回。

渲染细节与性能记录见 [架构](../architecture.md)、[性能](../performance.md)。所有数值和操作为模拟；不是生产控制系统。机组隐藏结构按示意构建，使用项目自己的 VIZLAB 品牌。
