# dsh-theme-customizer

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)
[![npm version](https://img.shields.io/npm/v/dsh-theme-customizer?style=flat-square&v=1)](https://www.npmjs.com/package/dsh-theme-customizer)
[![license](https://img.shields.io/github/license/lxxz1918/dsh-theme-customizer?style=flat-square&v=1)](LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-0969da?style=flat-square&v=1)](https://github.com/topics/dsh-plugin)
[![stars](https://img.shields.io/github/stars/lxxz1918/dsh-theme-customizer?style=flat-square&v=1)](https://github.com/lxxz1918/dsh-theme-customizer/stargazers)

**中文** | [English](README.en.md)

> DeepSeek Harness（DSH）Web 界面自定义主题插件：背景、文字、框线、细节全部可视化设置，刷新/重启不丢。
> 配置存 localStorage，预设可导出 `.tczp` 文件（含图片）分享到任意电脑。

## 🎨 主题展示

四套 AI 生成的壁纸作为主题的示例，每套含两种主界面「显示区域」模式：**包含侧边栏**与**不包含侧边栏**，配套 `.tczp` 预设一键导入。（详见下方“资源包”）

| 🌌 星空极光（暗） | 🌇 黄昏云海（亮） |
|:---:|:---:|
| ![星空极光](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-front-1.jpg) | ![黄昏云海](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-front-1.jpg) |
| **🌃 赛博夜景（暗）** | **🌸 樱花晴天（亮）** |
| ![赛博夜景](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-front-1.jpg) | ![樱花晴天](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-front-1.jpg) |

## 📸 界面截图

每套主题两种模式（对应预设 `-0` / `-1`）：**显示区域包含侧边栏**与**显示区域不包含侧边栏**。每种模式 3 张：正面-1 / 正面-2 / 设置面。

<details>
<summary>🌌 星空极光（暗）</summary>

**显示区域包含侧边栏（-0）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![星空极光A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-front-1.jpg) | ![星空极光A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-front-2.jpg) | ![星空极光A-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-settings.jpg) |

**显示区域不包含侧边栏（-1）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![星空极光B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/1-front-1.jpg) | ![星空极光B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/1-front-2.jpg) | ![星空极光B-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/1-settings.jpg) |

</details>

<details>
<summary>🌇 黄昏云海（亮）</summary>

**显示区域包含侧边栏（-0）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![黄昏云海A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-front-1.jpg) | ![黄昏云海A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-front-2.jpg) | ![黄昏云海A-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-settings.jpg) |

**显示区域不包含侧边栏（-1）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![黄昏云海B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/1-front-1.jpg) | ![黄昏云海B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/1-front-2.jpg) | ![黄昏云海B-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/1-settings.jpg) |

</details>

<details>
<summary>🌃 赛博夜景（暗）</summary>

**显示区域包含侧边栏（-0）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![赛博夜景A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-front-1.jpg) | ![赛博夜景A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-front-2.jpg) | ![赛博夜景A-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-settings.jpg) |

**显示区域不包含侧边栏（-1）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![赛博夜景B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/1-front-1.jpg) | ![赛博夜景B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/1-front-2.jpg) | ![赛博夜景B-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/1-settings.jpg) |

</details>

<details>
<summary>🌸 樱花晴天（亮）</summary>

**显示区域包含侧边栏（-0）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![樱花晴天A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-front-1.jpg) | ![樱花晴天A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-front-2.jpg) | ![樱花晴天A-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-settings.jpg) |

**显示区域不包含侧边栏（-1）**

| 正面-1 | 正面-2 | 设置面 |
|:---:|:---:|:---:|
| ![樱花晴天B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/1-front-1.jpg) | ![樱花晴天B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/1-front-2.jpg) | ![樱花晴天B-设置](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/1-settings.jpg) |

</details>

## 功能一览

- **界面板块（7 区域背景）**：主界面 / 侧边栏 / 对话区 / 输入区 / 设置界面 / 浮窗面板 / Cordis 插件界面
  - 每区域：无 / 纯色 / 图片（选区裁剪）+ 透明度（**数值越大越透明**）+ 底色（独立层）
  - 主界面支持「包含侧边栏 / 不包含侧边栏」显示区域切换
  - 侧边栏图片用 mask 直接淡出，不盖顶部 UI、不挡设置面板
  - **侧边栏收起后独立配置**：主界面 / 侧边栏各有一份「收起后」设置（折叠侧边栏时生效，切换淡入淡出）
- **框线板块**：所有界面默认边框/分隔线颜色 + 透明度，主界面（含侧边栏）/ Cordis / 输入区 / 设置界面 / 浮窗 5 区域独立
- **字体颜色板块**：正文 / 过程 / 辅助 / 弱化 / 强调 5 类文字颜色（亮暗主题共用，可恢复官方默认）
- **标志调色**：左上角 DeepSeek Harness 标志颜色 + 透明度；「Harness」文字部分可单独调色；侧边栏**收起后的标志**（鲸鱼图标）可独立配置（默认跟随展开态）
- **新会话欢迎页调色**：空态页鲸鱼图标 / 「探索未至之境」标题 / 「预览版」徽章文字 / 徽章背景，各可独立调色 + 透明度（默认官方原色，与正文文字颜色解耦）
- **对话区细节**：用户发言气泡 / 行内代码 / 代码块背景 / 代码块滚动条 / 对话区滚动条 / 任务栏收起展开 / 「一键到底」按钮背景
- **输入区**：背景、输入框固定高度（1~10 行）、统计条接管渲染（9 项独立开关 + 完全展开）、命令按钮/菜单背景
- **新会话按钮**：无/纯色/图片样式 + 显示文本/图标开关 + 图标/文本颜色独立设置 + 底色
- **布局调整**：设置界面面板可拖动（拖 header 移动 + 位置持久化 + 一键复位）
- **浮动主题面板**：可拖动的迷你设置面板（勾选显示内容），顶层不遮挡
- **预设**：保存/应用/重命名/删除/导出/导入（`.tczp` 含图，最多 10 个）+ 拖拽排序
- **全局恢复默认**：一键重置所有设置（三级确认防误触）

## 安装

```bash
# 方式一：npm 安装（发布包）
npm install -g dsh-theme-customizer
dsh plugin --profile web add dsh-theme-customizer

# 方式二：本地目录安装（GitHub clone 后）
dsh plugin --profile web add <本仓库路径>
```

装完**重启 dsh web** 生效。验证：设置 → 主题 出现即可。

## 使用

1. 打开 **设置 → 主题**，按板块调整；改动即时生效、自动保存（页面底部显示「最近保存」时间）
2. 需要快速调整时可点右上「↗ 打开浮窗」，浮窗可拖动
3. 装完想验证对话区各选项效果，可用 [对话区测试指令.md](对话区测试指令.md) 里的测试文本

## Cordis 按钮常驻（可选）

主题设置里「Cordis 按钮常驻」开关**依赖 dsh-client-ui-cordis 补丁**（本插件随包提供 `apply-patch.cjs` 一键打补丁），未打补丁时开关不生效。安装：

```bash
node apply-patch.cjs           # 打补丁（自动备份）
node apply-patch.cjs --check   # 查看状态
node apply-patch.cjs --undo    # 撤销
```

⚠️ **DSH 升级会覆盖官方包**，升级后需重跑 `apply-patch.cjs`。细节见 [PATCH-CORDIS-BUTTON.md](PATCH-CORDIS-BUTTON.md)。

## 从源码构建（开发者）

```bash
# 1. 拼接源码片段（optimized/src/ → optimized/dist/，自动语法校验 + 行号映射/符号表）
node optimized\build.cjs

# 2. 生成静态 client bundle（dist/p3_2_client.js → lib/client.js）
node build_static.cjs optimized\dist\p3_2_client.js lib\client.js

# 3. 语法校验 + 安装测试
node --check lib\client.js
dsh plugin --profile web add <本仓库路径>
```

源码结构：`optimized/src/` 16 个片段（`00_*`~`15_*` + `host.js`）按文件名拼接为插件函数体，功能定位查 `optimized/INDEX.md`。

## 预设文件（.tczp）

预设面板 → 「导入预设」选择 `.tczp` 文件即可恢复整套配置（含图片，无需原图）。导出同样在预设面板逐条「导出」。

## 📦 素材包

四套主题的**完整素材**（壁纸原图 + 8 个 `.tczp` 预设 + 全部展示截图）打包在 [GitHub Releases 附件](https://github.com/lxxz1918/dsh-theme-customizer/releases) 的 `assets.7z` 中，下载后 7-Zip 解压即可：

```
展示/
├── readme展示图/          # README 用展示截图（4 主题 × 2 方案 × 3 张）
├── 展示1/ ~ 展示4/        # 每套：壁纸原图（横版 + 竖版）+ 2 个 .tczp 预设 + 截图
└── （壁纸竖版/横版原图见 展示N/N-0、N-1）
```

> 预设导入：设置 → 主题 → 预设面板 → 导入预设 → 选 `展示N-N.tczp`，自动带图还原整套效果。

## 卸载

```bash
dsh plugin --profile web remove dsh-theme-customizer
```

## 联系与反馈

- 使用问题 / 功能建议 → [Issues](https://github.com/lxxz1918/dsh-theme-customizer/issues) 发议题
- 维护时间：**每周日**集中查看议题并回复
- 哔哩哔哩：[个人主页](https://space.bilibili.com/38175333)

## AI 使用说明

本项目由 [lxxz1918](https://github.com/lxxz1918) 主导设计与验收，代码在 AI 助手（DeepSeek）辅助下编写。所有功能需求、界面文案与最终效果均由作者本人确认。

## License

[MIT](LICENSE)
