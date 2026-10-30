# Laser Atlas · 激光器设计学习平台

按完整工程设计流程系统学习固体激光、光纤激光、CO₂ 激光和蓝光半导体激光。支持手机访问、术语点击解释、公式符号手册、互动计算与本机笔记。

**在线网站：** https://luobaoer.github.io/laser-atlas/

## 当前版本

**2026-10-30 · v0.4.1** — 1064 nm 三镜腔模设计器新增独立 LD 端泵整形与匹配模块：双轴 M²、f₁/f₂ 位置与焦距、晶体泵浦吸收，以及与 1064 nm 本征模沿 Nd:YVO₄ 的空间比较。

1. [固体激光：高斯光束、ABCD 与腔长](https://luobaoer.github.io/laser-atlas/#/lesson/solid-03)
2. [传播矩阵原理专题（图解 + 交互练习）](https://luobaoer.github.io/laser-atlas/#/principle/raymatrix)
3. [固体激光公式符号手册](https://luobaoer.github.io/laser-atlas/#/formulas/solid)
4. [新课程：从 ABCD 到各元件位置设计](https://luobaoer.github.io/laser-atlas/#/lesson/solid-03b)
5. [交互工具：1064 nm 三镜腔模设计器](https://luobaoer.github.io/laser-atlas/tools/resonator1064/)
6. [新泵浦设计模块：LD → f₁/f₂ → Nd:YVO₄](https://luobaoer.github.io/laser-atlas/tools/resonator1064/#pump)

## 网站版本与历史快照

| 日期 | 版本 | 页面 | 说明 |
| --- | --- | --- | --- |
| 2026-10-29 | v0.2.0 | [打开旧版](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.2.0/) | 初版设计流程课程与公式手册 |
| 2026-10-29 | v0.3.0 | [打开本版快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.3.0/) | 矩阵乘法、传播矩阵图解、公式词条及可调数值实验 |
| 2026-10-29 | v0.3.1 | [打开最新版本快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.3.1/) | 方阵与列向量排版、聊天式推导、图解及动态矩阵 |

| 2026-10-29 | v0.3.2 | [查看专业版快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.3.2/) | 专业传播矩阵教材；12 个完整小节、公式推导、介质折射与腔模算例 |

| 2026-10-29 | v0.3.3 | [查看修复备份](https://luobaoer.github.io/laser-atlas/versions/2026-10-29_v0.3.3/) | 图文同步、分式初步调整；未正式上线的草稿已修复脚本错误后归档 |
| 2026-10-30 | v0.3.4 | [查看当前版本快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-30_v0.3.4/) | 四类激光器课程与公式手册全面改为上下分式 |

| 2026-10-30 | v0.4.0 | [打开本版快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-30_v0.4.0/) | 1064 nm 三镜腔模设计、双轴 q、参考面光斑、热透镜扫描与导出 |

| 2026-10-30 | v0.4.1 | [打开本版快照](https://luobaoer.github.io/laser-atlas/versions/2026-10-30_v0.4.1/) | 泵浦双轴 M²、f₁/f₂ 光路、Nd 吸收、与本征腔模的形状匹配 |

**更新与回退规则：** 根目录 `index.html` 始终用于线上首页。每次发布前，先把旧站完整存入 `versions/YYYY-MM-DD_vX.Y.Z/index.html`；再将新版本同时写入版本目录和根目录。需要回退时，将对应历史快照内容复制回根目录 `index.html` 并提交；V0.4.0 及后续版本还需要同步回退其 `tools/` 子目录。原有历史快照不删除。

## 学习记录

学习进度和笔记保存在浏览器的 localStorage（`laser-atlas-v0.1`）；升级不会主动清除。换设备暂不自动同步，可在网站的笔记页导出/导入备份。

## 部署

这是纯静态网站，不需要服务器。GitHub Pages 设置使用 **main / (root)**。如果新提交后尚未出现，请到仓库的 **Actions** 检查 Pages 部署状态。

> 教学计算属于简化物理模型，不能替代激光器实际设计验证、激光安全评估或元器件额定值核查。
