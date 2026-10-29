# Laser Atlas · 激光器设计学习平台

按完整工程设计流程系统学习固体激光、光纤激光、CO₂ 激光和蓝光半导体激光。支持手机访问、术语点击解释、公式符号手册、互动计算与本机笔记。

**在线网站：** https://luobaoer.github.io/laser-atlas/

## 当前版本

**2026-10-29 · v0.3.1** — 将传播矩阵统一改为真正的 2×2 方阵与竖排列向量；按照行乘列 → 光线变量 → 自由传播 → 薄透镜 → 球面镜 → 矩阵连乘的顺序深入推导。当前学习入口：

1. [固体激光：高斯光束、ABCD 与腔长](https://luobaoer.github.io/laser-atlas/#/lesson/solid-03)
2. [传播矩阵原理专题（图解 + 交互练习）](https://luobaoer.github.io/laser-atlas/#/principle/raymatrix)
3. [固体激光公式符号手册](https://luobaoer.github.io/laser-atlas/#/formulas/solid)

## 网站版本与历史快照

| 日期 | 版本 | 页面 | 说明 |
| --- | --- | --- | --- |
| 2026-10-29 | v0.2.0 | [打开旧版](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.2.0/) | 初版设计流程课程与公式手册 |
| 2026-10-29 | v0.3.0 | [打开本版快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.3.0/) | 矩阵乘法、传播矩阵图解、公式词条及可调数值实验 |
| 2026-10-29 | v0.3.1 | [打开最新版本快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.3.1/) | 方阵与列向量排版、聊天式推导、图解及动态矩阵 |

**更新与回退规则：** 根目录 `index.html` 始终用于线上首页。每次发布前，先把旧站完整存入 `versions/YYYY-MM-DD_vX.Y.Z/index.html`；再将新版本同时写入版本目录和根目录。需要回退时，将对应历史快照内容复制回根目录 `index.html` 并提交。原有历史快照不删除。

## 学习记录

学习进度和笔记保存在浏览器的 localStorage（`laser-atlas-v0.1`）；升级不会主动清除。换设备暂不自动同步，可在网站的笔记页导出/导入备份。

## 部署

这是纯静态网站，不需要服务器。GitHub Pages 设置使用 **main / (root)**。如果新提交后尚未出现，请到仓库的 **Actions** 检查 Pages 部署状态。

> 教学计算属于简化物理模型，不能替代激光器实际设计验证、激光安全评估或元器件额定值核查。
