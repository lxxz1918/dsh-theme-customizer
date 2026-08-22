      // ┌─ 片段 01_state ─────────────────────────────────
      // │ 职责：全部可变状态 + 默认值（区域/新会话/浮窗/Cordis/透明度提示）
      // │ 测试：新增配置字段 = 此片段加 let + 05_storage 持久化 + 06_presets 预设快照三处联动
      let floatVisible = false
      let floatPos = { x: 80, y: 80, width: 560, height: 640 }
      // v0.9.20 默认全开（含框线 borders——v0.9.18 加模块时漏加，这里补上；含布局调整 layout）
      let floatModules = { background: true, borders: true, colors: true, layout: true, presets: true }
      let floatShowReset = true // 浮窗内是否显示「全局恢复默认」按钮（v0.9.16）
      let cordisEntry = true // Cordis 按钮常驻开关（侧边栏设置上方）
      let areas = {
        // 透明度语义统一：数值大 = 透明（主界面与侧边栏一致）；默认 0 = 不透明（实/清晰）
        // 主界面底色：默认开启白色（bottomEnabled/bottomColor/bottomOpacity，复用 emptyArea 字段，逻辑同侧边栏）
        // 作用是主界面最底层垫色：模式"无"时显示白底；纯色/图片盖在底色之上
        app: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
        sidebar: { ...emptyArea(), opacity: 0 },
        // 输入区（composer）：像主界面——默认白底常驻（bottomEnabled:true/color:#fff），背景作用在 [data-composer-seat]
        composer: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
        // 设置界面（details，v0.9.12）：像主界面——默认白底常驻，背景作用在官方设置面板 [class*="VOzbGW_panel"]
        details: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
        // 浮窗面板（float，v0.9.13）：像主界面——默认白底常驻，背景作用在自研浮窗容器 [data-thmcz-float]
        float: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
        // Cordis 插件界面（cordis，v0.9.14）：像主界面——默认白底常驻，背景作用在官方 Cordis 面板 [class*="Nqubda_panel"]
        cordis: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
        conversation: emptyArea(),
      }
      // 新会话按钮（侧边栏顶部"新建会话"）：showText=显示"新会话"文本；showIcon=显示图标；
      // 样式 mode: none(无) / color(纯色) / image(图片)，独立于侧边栏模式与底色（与主界面/侧边栏同套逻辑），
      // 透明度语义与侧边栏一致（大=透明）；底色（bottomEnabled/bottomColor/bottomOpacity）独立控制按钮底色
      // v0.9.20：默认底色**开启 + 白色**（用户定；主界面/输入区同款默认白底）
      // 旧数据 unified（"与侧边栏样式统一"）已废弃删除：unified=true 的旧效果 = 样式"无"
      let newSession = {
        showText: true, showIcon: true, mode: 'none', color: '#ffffff', opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0, image: null,
        // 图标/文本颜色：null = 跟随正文（官方默认），设置后独立覆盖（与正文解耦）
        iconColor: null, textColor: null,
      }
      // DeepSeek Harness 标志（左上角品牌行，v0.9.17）：默认品牌蓝 #3964fe + 不透明。
      // 与正文解耦（常驻独立色，不跟随 --dsw-alias-label-primary）；透明度语义同全局（数值大=透明）；
      // 作用于 .hHd-Xa_brand svg（BrandWordmark 的 path 全部 fill:currentColor → 给 svg 设 color 即变色）
      let brand = { color: '#3964fe', opacity: 0 }
      // 标志文字 "Harness" 部分单独颜色（v0.9.20）：color null = 跟随标志整体色（brand）；
      // BrandWordmark path 顺序：第 1-10 个 = DeepSeek，第 11-17 个 = Harness（x 坐标 132-178）
      // → CSS `svg path:nth-child(n+11) { fill: 色 }` 直接覆盖 currentColor
      let brandHarness = { color: null, opacity: 0 }
      // 框线（v0.9.18）：所有 UI 默认边框/分隔线颜色 + 透明度（数值大=透明），5 区域独立。
      // color null=官方默认（此时 opacity>0 用 color-mix 淡化官方色，层级保留）；
      // main=主界面（含侧边栏）/ cordis=Cordis 插件界面 / composer=输入区 / details=设置界面 / float=浮窗面板
      let borders = {
        main: { color: null, opacity: 0 },
        cordis: { color: null, opacity: 0 },
        composer: { color: null, opacity: 0 },
        details: { color: null, opacity: 0 },
        float: { color: null, opacity: 0 },
      }
      // 设置界面面板拖动位置（v0.9.19）：null=官方居中（默认）；{x,y}=拖动后的固定位置（persist 到 localStorage）
      // 拖动用内联 style 直更（pointermove），pointerup 写回本状态 → CSS 重建保持位置（刷新不丢）
      let detailsPos = null
      // 设置界面可移动开关（v0.9.19，布局调整板块）：false = 面板不可拖动（拖动委托直接忽略）+ 恢复原位按钮消失
      let detailsDragEnabled = true
      let sidebarInfo = null
      let baseBg = 'rgba(249,250,251,1)'
      let colors = { main: null, process: null, aux: null, faded: null, accent: null }
      let officialColors = {} // 官方原色参考（读 computed style）
      // 透明度说明提示（界面板块顶部，默认显示，可在「其他」板块关闭）
      let showOpacityHint = true
      // 输入区统计条「完全展开」：false=官方单行省略（默认），true=换行完整显示
      let composerStatsExpanded = false
      // 输入框高度：false=动态增高（官方默认，随内容增长直到 max-height 滚动）；true=固定 N 行高度（超出滚动）
      let composerFixedHeight = false
      let composerRows = 4 // 固定高度时的行数（1~10），4 = 官方默认初始行数附近的舒适高度
      // 输入区卡片实测宽高比缓存（固定高度时用）：AreaCss useLayoutEffect 在 DOM 布局后测量写入，
      // 避免 getCropRatio 在渲染期读到旧布局值（改行数后选区不跟手）。非用户配置，不持久化
      let composerCardRatio = null
      // Cordis 面板实测宽高比缓存（v0.9.15）：面板高度内容驱动（max-height 60vh），固定公式不准 →
      // AreaCss useLayoutEffect + MutationObserver 在面板开合时测量写入；未打开时用默认近似
      let cordisCardRatio = null
      // 输入区统计条各子项显隐（9 项独立开关）：默认全显示
      let composerStatsItems = {
        turns: true,   // 轮数
        steps: true,   // 步数
        llm: true,     // LLM 时长
        tool: true,    // 工具调用时长
        ttft: true,    // 首 token 平均
        tps: true,     // tok/s
        cache: true,   // 缓存命中
        input: true,   // 输入 token
        output: true,  // 输出 token
      }
      // 对话区背景（2026-08-21 新增；08-22 定稿 5 项 + 任务栏 2 项 = 7 项；08-22 v0.9.14 命令两按钮加透明度）：null = 官方默认；设置后亮暗统一用用户色。
      // bubble = 我的发言气泡（--dsw-specific-bubble）；
      // inline = 你的发言中的行内代码背景（--dsw-alias-markdown-inline-code）；
      // code = 代码块/编辑卡片/脚本终端背景（--dsw-alias-markdown-code-block + banner）；
      // scrollbar = 代码块滚动条（[class*="_block_"], .md-code-block 重定义 --dsh-scrollbar-thumb）；
      // chatScroll = 对话区滚动条（[class*="_scroll"]:has([data-chat-flow])）；
      // todoCollapsed / todoExpanded = 任务栏收起/展开背景（[data-testid="todo-panel"]:has([aria-expanded=...])，官方 token --dsw-specific-tip）
      // addBtn = 输入框「+」命令按钮背景（[class*="uV2eYG_add"]，官方 token --dsw-specific-selector，hover 官方 --dsw-alias-interactive-bg-hover-solid）；
      // cmdMenu = 命令菜单面板背景（[class*="_3e4SsG_menu"]，官方 token --dsw-specific-menu——被多包共用，必须精确选择器覆盖）；
      // addBtnOpacity / cmdMenuOpacity = 命令两按钮透明度（0=不透明官方，1=全透明；数值大=透明，语义同全局；仅 addBtn/cmdMenu 有值时生效）
      // toBottom = 对话区「V」一键到底部按钮背景（[class*="Md3f7G_toBottom"]，官方 token --dsw-alias-button-floating-fill——被布局手柄共用，必须精确选择器覆盖）
      // sliderColor / sliderOpacity = 主题设置插件滑条（range，data-thmcz-range）已填充部分（左半边）+圆点 颜色/透明度
      // sliderTrackColor / sliderTrackOpacity = 滑条未填充轨道（右半边）颜色/透明度（v0.9.15；默认浏览器深色 → 必须自定义）
      // scrollColor / scrollOpacity = 浮窗界面滚动条（[data-thmcz-float-scroll]）thumb 颜色/透明度
      let convBgs = { bubble: null, inline: null, code: null, scrollbar: null, chatScroll: null, todoCollapsed: null, todoExpanded: null, addBtn: null, cmdMenu: null, addBtnOpacity: 0, cmdMenuOpacity: 0, toBottom: null, sliderColor: null, sliderOpacity: 0, sliderTrackColor: null, sliderTrackOpacity: 0, scrollColor: null, scrollOpacity: 0 }
