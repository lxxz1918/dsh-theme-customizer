# 📇 代码索引（optimized 优化版）

> **用途**：快速定位代码。想改某功能 → 查下方"功能速查" → 打开对应片段。
> **自动生成部分**（改完片段跑 `node build.cjs` 自动刷新，勿手改）：
> - 行号映射 `dist/line_map.txt`（片段 ↔ dist/client.js 行号）
> - 符号表 `dist/symbols.md`（每个片段定义的 function/const/let）

## 功能速查（功能 → 片段 → 关键代码）

| 想改… | 打开片段 | 找 |
|---|---|---|
| 设置页模块清单 / 区域清单 / 文字颜色 5 类定义 | `00_constants.js` | `MODULES` / `AREAS`（details = 设置界面，v0.9.12）/ `COLOR_ITEMS` / `COLOR_TOKENS` / `emptyArea` |
| 新增/修改配置字段（默认值） | `01_state.js` | 对应 `let`；⚠️ 三处联动：本片段 + `05_storage.js` 持久化 + `06_presets.js` 预设快照 |
| 颜色解析 / var() 链解析 / 转 hex | `02_utils.js` | `parseRgb` / `resolveVarToken` / `toHex` |
| 官方原色采集 / 侧边栏探测 | `03_detect.js` | `detectColors` / `detectSidebar` |
| 状态修改动作 / 订阅 | `04_store.js` | `setXxx` / `useStore` / `notify`（高频动作只 notify 不保存） |
| 配置持久化 / 旧数据迁移 | `05_storage.js` | `loadSettings` / `saveNow` / `slimAreas`（配额降级）/ `flushPersist` |
| 预设库 CRUD / 应用预设 | `06_presets.js` | `openPresetDb` / `idb*` / `applyPresetData` / `loadPresets` |
| **CSS 注入 / token 覆盖 / 层级（v20 规则）** | `07_css_builder.js` | `AreaCss`；⚠️ 层级铁律：任何包住设置面板的祖先不得建层叠上下文（EXPERIENCE §5.8bis）；`buildDetailsCss` = 设置界面面板背景（`[class*="VOzbGW_panel"]`，v0.9.12） |
| 输入区背景 + 固定高度 + 统计条展开/隐藏官方 | `07_css_builder.js` | `AreaCss` 内 `[data-composer-card]` 背景块 + `[data-input-scroll]` 固定高度 + `.FJxK0a_root` 隐藏（统计条已接管）；卡片式背景四区域（composer/details/cordis/float）共用 `buildCardCss`（梳理去重 2026-08-22） |
| 对话区/命令背景 CSS（bubble/inline/code/滚动条/任务栏两态/命令按钮+菜单/V按钮/滑条/滚动条） | `07_css_builder.js` | `buildConvCss`（convBgs 各键定向选择器；v0.9.15 新增 toBottom `[class*="Md3f7G_toBottom"]`、滑条 `[data-thmcz-range]` accent-color+thumb、设置页滚动条 `[class*="VOzbGW_options"]` thumb） |
| Cordis 插件界面背景（v0.9.14 改区域） | `07_css_builder.js` | `buildCordisCss`（`[class*="Nqubda_panel"]` 无/纯色/图片 + 透明度 + 底色含透明度） |
| 裁剪面板 / 透明度滑条 | `08_ui_common.js` | `CropPanel` / `OpacitySlider` |
| 两步/三级确认按钮（通用） | `08_ui_common.js` | `ConfirmButton`（两步）/ `TripleConfirmButton`（三级，v0.9.16 全局恢复默认专用：resetKey 变化自动解除确认态，主按钮居中、取消换行）；样式走 `size`（sm/md/lg → `RESET_BTN_SIZES` 统一三件套，v0.9.18 黑字红框/红底白字；显式 style/confirmStyle/cancelStyle 可覆盖） |
| 底色编辑行（侧边栏/新会话共用） | `08_ui_common.js` | `BottomRow` |
| 选图+裁剪流程（两编辑器共用） | `08_ui_common.js` | `useImageCrop` |
| 裁剪宽高比计算 | `08_ui_common.js` | `getCropRatio` |
| 主界面/侧边栏/输入区编辑卡片 | `09_background.js` | `AreaEditor` |
| 新会话按钮板块 | `09_background.js` | `NewSessionEditor`（选择器 `_newSession` 是 `_newSessionLabel` 子串，须排除；图标/文本颜色 iconColor/textColor，null=跟随正文） |
| DeepSeek Harness 标志（v0.9.17） | `09_background.js` + `07_css_builder.js` | `BrandEditor`（侧边栏子版块、新会话之上：标志颜色 + 透明度，默认品牌蓝 #3964fe，与正文解耦）；CSS = `buildBrandCss`（`[class*="_logoRow"] [class*="_brand"] svg`，BrandWordmark path fill=currentColor → 设 color 即变色）；状态字段 `brand` |
| 「框线」板块（v0.9.18，字体颜色上面） | `15_borders.js` + `07_css_builder.js` + `00_constants.js` | `BordersModule`（5 区域行：主界面含侧边栏/Cordis/输入区/设置界面/浮窗，颜色+透明度+恢复+全部恢复）；CSS = `buildBordersCss`（容器覆盖：main 三列 `_sidebarCol/_centerCol/_detailsCol`、cordis `Nqubda_panel`、composer `data-composer-seat/card`、details `VOzbGW_panel`、float `data-thmcz-float`；默认色：主界面/Cordis/输入区淡灰 #e6e6e6、设置界面/浮窗黑色）；`BORDER_KEYS` 常量 |
| 设置界面面板拖动（v0.9.19） | `07_css_builder.js` + `09_background.js` | 拖面板 header（`[class*="VOzbGW_panel"] [class*="_header"]`，排除关闭按钮）移动；拖动内联直更（setProperty !important，v0.9.19 修二次拖动失效）+ pointerup 写回 `detailsPos`（持久化/预设/全局恢复含）；buildDetailsCss 输出 `position:fixed + left/top`；「设置界面」卡片内 `DetailsResetPos` 恢复原位 + 侧边栏设置按钮旁 DOM 注入「设置复位」（`[class*="VOzbGW_trigger"]` 右半，detailsDragEnabled 控制） |
| Harness 单独调色（v0.9.20） | `01/04/05/06/07/09/11` | `brandHarness`（null=跟随标志）；CSS `svg g[clip-path*="badge"] path`（实际 BrandWordmark = svg>path×9+g[whale]+rect+g[badge]，非源码 nth-child） |
| 开关仅勾选框触发（v0.9.20） | 全片段 | 所有 `label>checkbox` 改 `div+checkbox+span`（点文字/空白不切换） |
| 新会话默认底色白（v0.9.20） | `01/04/05/06` | `bottomEnabled:true, bottomColor:'#ffffff'`；旧数据无 bottomEnabled → 默认开白；纯色加恢复默认按钮 |
| 滚动条绑定（v0.9.19） | `07_css_builder.js` | 代码块滚动条 = `[data-chat-flow]` 整体设变量（column 内部所有滚动条跟随）；对话区滚动条 = 直接 `::-webkit-scrollbar-thumb`（不污染内部）；对话区/代码块选项位置+文本交换 |
| 输入区子版块 | `14_composer.js` | `ComposerEditor`（输入框高度固定 composerFixedHeight/composerRows + 统计条完全展开 composerStatsExpanded + 9 项子开关 composerStatsItems + **命令子板块**：命令按钮 addBtn / 命令菜单 cmdMenu 背景 + 全部恢复 resetCmdBgs）+ `ComposerStatsLine`（注册到 conversation.composer.dock 接管渲染） |
| 「界面」模块外壳（透明度说明 + 全部 AREAS 区域卡片） | `09_background.js` | `BackgroundModule`（v0.9.13 起「其他」板块删除，Cordis 改区域；各区域 children 子板块见 childModules） |
| 全局恢复默认（v0.9.16） | `04_store.js` + `13_boot.js` + `12_float.js` | `resetAllSettings`（重置所有用户配置到默认）；按钮在主题设置预设板块下方 + 浮窗内（TripleConfirmButton 三级确认，floatShowReset 控制浮窗显隐） |
| 颜色行（5 类文字颜色） | `10_colors.js` | `ColorRow` |
| 「字体颜色」模块外壳（说明 + 全部恢复按钮） | `10_colors.js` | `ColorsModule` |
| 预设交互 + UI（保存/导入/同名覆盖/删除/导出/拖拽排序/FLIP） | `11_presets_panel.js` | `PresetsPanel`（⚠️ 内部 useStore() 订阅勿删）；数据层在 `06_presets.js` |
| 四模块注册表 / 布局占位（P4） | `13_boot.js` | `ModuleContent` |
| 浮窗（拖动/背景/内容勾选/全局恢复按钮开关） | `12_float.js` | `GlobalFloat`（背景改由 `buildFloatCss` 注入 `[data-thmcz-float]`，v0.9.13；v0.9.16 底部加全局恢复按钮 floatShowReset 控制）/ `FloatModulePicker`（拖动局部状态，pointerup 才写回） |
| 主题页 / 槽位注册 / Cordis 常驻 / 启动副作用 | `13_boot.js` | `ThemePage` / `applyCordisEntryFlag` / `slots.inject` ×3 |
| host RPC | `src/host.js` | `theme-customizer.ping` |

## 片段清单（职责 + 定义，详见各文件头自述卡）

| 片段 | 职责 | 关键定义 |
|---|---|---|
| `00_constants.js` | apply 入口 + 常量 | MODULES / AREAS / COLOR_ITEMS / COLOR_TOKENS / emptyArea |
| `01_state.js` | 全部可变状态 | floatVisible / floatPos / areas / newSession / brand / colors … |
| `02_utils.js` | 纯工具函数 | parseRgb / resolveVarToken / toHex |
| `03_detect.js` | DOM 检测 | detectColors / detectSidebar |
| `04_store.js` | 状态订阅与修改 | notify / setXxx / useStore |
| `05_storage.js` | localStorage 持久化 | loadSettings / slimAreas / saveNow / flushPersist |
| `06_presets.js` | IndexedDB 预设数据层 | openPresetDb / idb* / loadPresets / applyPresetData |
| `07_css_builder.js` | CSS 注入 | AreaCss |
| `08_ui_common.js` | 通用组件与工具 | CropPanel / OpacitySlider / ConfirmButton / BottomRow / useImageCrop / getCropRatio |
| `09_background.js` | 界面板块全套 | AreaEditor / NewSessionEditor / BackgroundModule |
| `10_colors.js` | 字体颜色板块 | ColorRow / ColorsModule |
| `11_presets_panel.js` | 预设板块交互+UI | PresetsPanel |
| `12_float.js` | 浮窗 | Section / FloatModulePicker / GlobalFloat |
| `13_boot.js` | 主题页 + 模块注册表 + 启动副作用 | ModuleContent / ThemePage / applyCordisEntryFlag / slots.inject |
| `14_composer.js` | 输入区子版块 | ComposerEditor |
| `15_borders.js` | 「框线」板块 | BordersModule |
| `host.js` | host 半部分 | theme-customizer.ping |

## 修改流程

1. 查"功能速查"表定位片段 → 打开
2. 读片段文件头自述卡（职责 / 定义 / 测试点）
3. 改代码（片段内**禁止** import/require；零定时器约定不变）
4. `node theme-customizer\optimized\build.cjs`（语法校验 + 刷新 line_map/symbols）
5. **进静态（纯静态工作流，2026-08-20 起）**：`node theme-customizer\rebuild.cjs`（一键：build + build_static + node --check）→ 手动 bump version + 更新 README → 用户重启 dsh web 生效
6. 按自述卡"测试点"验证；**不再用动态版**（弃用）

## 产物说明（dist/，自动生成勿手改）

| 文件 | 用途 |
|---|---|
| `dist/client.js` | 动态 code.client（函数体，逐字复制） |
| `dist/host.js` | 动态 code.host |
| `dist/p3_2_client.js` | module.exports 格式（静态 `plugin/build_static.cjs` 的输入） |
| `dist/line_map.txt` | 片段 ↔ client.js 行号映射 |
| `dist/symbols.md` | 片段符号表 |
