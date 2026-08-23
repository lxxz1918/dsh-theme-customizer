      // ┌─ 片段 07_css_builder ───────────────────────────
      // │ 职责：全部 CSS 注入（token 覆盖 + 背景/侧边栏/新会话/Cordis/浮窗层级样式）
      // │ 定义：AreaCss + buildXxx 纯函数 + manualCssRefresh
      // │ ⚠️ 层级铁律见 EXPERIENCE §5.8bis（v20：容器不建层叠上下文）
      // │ 性能（2026-08-21 优化）：
      // │   · CSS 按模块拆分独立 useMemo + 独立 <style> 标签（img/app/composer/sidebar/ns/lift/cordis/float），
      // │     改某区域透明度/颜色只重算该模块，其他模块不重算（此前整份一起重建，调主界面连坐输入区卡顿）；
      // │   · 图片 dataURI 单独注入 CSS 变量（--tcz-*-img）→ 透明度/颜色变化不重拼几 MB 图片字符串；
      // │     ⚠️ 主界面（app）例外：其背景是多层 background-image，var() 在多层列表中替换失效 → app 直接拼 dataURI；
      // │   · 拖动中（saveSuppress 抑制期）setXxx 走 manualCssRefresh 直接写 style 标签（绕过 React 渲染链，
      // │     零虚拟 DOM 重建），松开（commitSave）后 notify 同步 React 状态 → 滑块拖动更顺滑
      // 各模块 CSS 生成纯函数（读全局状态 let；拖动中 manualCssRefresh 与 React useMemo 共用，保证一致）
      function buildImgVars() {
        const parts = []
        if (areas.sidebar.mode === 'image' && areas.sidebar.image && sidebarInfo && sidebarInfo.selector) {
          parts.push(sidebarInfo.selector + ' { --tcz-sidebar-img: url("' + areas.sidebar.image.dataURI + '"); }')
        }
        // v1.0.4 收起态侧边栏图片变量：用收起态选择器（自身含 collapsed class 或后代含）
        const sc = areas.sidebar.collapsed
        if (sc && sc.mode === 'image' && sc.image && sidebarInfo && sidebarInfo.selector) {
          const sel = sidebarInfo.selector
          parts.push(sel + '[class*="_collapsed"] { --tcz-sidebar-img: url("' + sc.image.dataURI + '"); }')
          parts.push(sel + ':has([class*="_collapsed"]) { --tcz-sidebar-img: url("' + sc.image.dataURI + '"); }')
        }
        if (areas.composer.mode === 'image' && areas.composer.image) {
          parts.push('[data-composer-card] { --tcz-composer-img: url("' + areas.composer.image.dataURI + '"); }')
        }
        if (newSession.mode === 'image' && newSession.image) {
          parts.push('[class*="_newSession"]:not([class*="_newSessionLabel"]) { --tcz-ns-img: url("' + newSession.image.dataURI + '"); }')
        }
        const detImg = areas.details || {}
        if (detImg.mode === 'image' && detImg.image) {
          parts.push('[class*="VOzbGW_panel"] { --tcz-details-img: url("' + detImg.image.dataURI + '"); }')
        }
        // ⚠️ 防御：areas.float/details/cordis 可能 undefined（旧配置整体替换后缺键），读前兜底空对象（v0.9.13 事故修复）
        const flImg = areas.float || {}
        if (flImg.mode === 'image' && flImg.image) {
          parts.push('[data-thmcz-float] { --tcz-float-img: url("' + flImg.image.dataURI + '"); }')
        }
        const corImg = areas.cordis || {}
        if (corImg.mode === 'image' && corImg.image) {
          parts.push('[class*="Nqubda_panel"] { --tcz-cordis-img: url("' + corImg.image.dataURI + '"); }')
        }
        return parts.length ? parts.join(' ') : null
      }
      function buildAppCss() {
        // 主界面（html,body 背景）。底色 = 最底层垫色（常驻仅颜色）；模式内容（纯色渐变/图片）叠在其上。
        // 图片直接拼 dataURI（不用 var()：多层 background-image 里 var() 替换失效 → 图片不显示）；图片已在选图时 downscale 体积小
        // v1.0.4 收起态：侧边栏折叠（hHd-Xa_collapsed）时用 areas.app.collapsedSidebar 独立配置（默认 none 官方原样）；
        //   折叠 class 在侧边栏内层 → 主界面用 :has() 从根选择。展开态用 areas.app + includeSidebar 偏移逻辑（不变）
        const cssParts = []
        // 折叠判定：html 内存在 collapsed 侧边栏（收起时切换）
        const collapsedNow = sidebarInfo && sidebarInfo.collapsed
        const appArea = collapsedNow ? (areas.app.collapsedSidebar || { mode: 'none', opacity: 0 }) : areas.app
        const useInclude = appArea.includeSidebar !== false
        // 收起态宽度 = 侧边栏收起后的实测宽度（默认窄栏 ~50px；未检测到时用 52 近似）
        const sbW = collapsedNow
          ? (sidebarInfo.width > 0 && sidebarInfo.width < 120 ? Math.round(sidebarInfo.width) : 52)
          : (sidebarInfo && sidebarInfo.width ? Math.round(sidebarInfo.width) : 0)
        let appBottom = null
        if (appArea.bottomColor) {
          const abRgb = parseRgb(appArea.bottomColor)
          appBottom = 'rgb(' + abRgb[0] + ',' + abRgb[1] + ',' + abRgb[2] + ')'
        }
        const appImg = appArea.image
        const appInclude = useInclude
        if (appArea.mode === 'image' && appImg) {
          const op = appArea.opacity == null ? 0 : appArea.opacity
          const layerRgb = appBottom ? parseRgb(appArea.bottomColor) : parseRgb(baseBg)
          const grad = 'linear-gradient(rgba(' + layerRgb[0] + ',' + layerRgb[1] + ',' + layerRgb[2] + ',' + op + '), rgba(' + layerRgb[0] + ',' + layerRgb[1] + ',' + layerRgb[2] + ',' + op + '))'
          const url = 'url("' + appImg.dataURI + '")'
          if (!appInclude && sbW > 0) {
            const mainW = Math.max(100, Math.round(window.innerWidth - sbW))
            cssParts.push('html, body { background-color: ' + (appBottom || baseBg) + ' !important; background-image: ' + grad + ', ' + url + ' !important; background-size: ' + mainW + 'px 100%, ' + mainW + 'px 100% !important; background-position: ' + sbW + 'px center, ' + sbW + 'px center !important; background-repeat: no-repeat, no-repeat !important; }')
          } else {
            cssParts.push('html, body { background-color: ' + (appBottom || 'transparent') + ' !important; background-image: ' + grad + ', ' + url + ' !important; background-size: cover, cover !important; background-position: center !important; background-repeat: no-repeat !important; background-attachment: fixed !important; }')
          }
        } else if (appArea.mode === 'color') {
          const a = 1 - (appArea.opacity == null ? 0 : appArea.opacity)
          const rgbC = parseRgb(appArea.color)
          const bg = appBottom || baseBg
          const grad = 'linear-gradient(rgba(' + rgbC[0] + ',' + rgbC[1] + ',' + rgbC[2] + ',' + a + '), rgba(' + rgbC[0] + ',' + rgbC[1] + ',' + rgbC[2] + ',' + a + '))'
          if (!appInclude && sbW > 0) {
            const mainW = Math.max(100, Math.round(window.innerWidth - sbW))
            cssParts.push('html, body { background-color: ' + bg + ' !important; background-image: ' + grad + ' !important; background-size: ' + mainW + 'px 100% !important; background-position: ' + sbW + 'px center !important; background-repeat: no-repeat !important; }')
          } else {
            cssParts.push('html, body { background-color: ' + bg + ' !important; background-image: ' + grad + ' !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }')
          }
        } else {
          // 「无」模式（v1.0.1 2026-08-22 用户定）：不注入任何内容 = 完全官方原样。
          // 曾做 html,body 垫色（v0.9.2），但官方 _frame/三列等容器自带不透明背景盖住垫色看不到，
          // 且侧边栏「无」模式透出下层会透出垫色 → "侧边栏变红"（连锁问题）。
          // 主界面「无」模式已不显示底色选项（09 AreaEditor）；旧配置残留 bottomColor 也不再垫色。
          // v1.0.4 收起态 none：同样零注入（官方原样）——但收起态无垫色会露出官方白底（无主界面图时正常）
        }
        return cssParts.join(' ')
      }
      // 卡片式背景通用构建（2026-08-22 梳理去重）：composer/details/cordis/float 四区域共用同一套
      // 「无/纯色/图片 + 底色 + ::before 铺满」结构（原四个函数 90% 相同，各 ~45 行）。
      // opts: { sel, area, radius, mainExtra, imgVar }
      //   · mainExtra = 图片/纯色分支主元素附加声明（composer 'z-index:0'、details 'z-index:1'；::before z-index:-1 沉底的前提）
      //   · imgVar = 图片 dataURI 的 CSS 变量名（--tcz-*-img，buildImgVars 注入）
      //   · 纯底色分支（无模式）不拼 mainExtra（::before 不存在，无需建层叠上下文）——与原实现一致
      // 底色透明度：数值大=透明 → alpha = 1-bottomOpacity；alpha=1 时输出 rgb 等价值
      function buildCardCss(opts) {
        const sel = opts.sel
        const area = opts.area || {}
        const radius = opts.radius || 12
        const mainExtra = opts.mainExtra ? ' ' + opts.mainExtra : ''
        const imgVar = opts.imgVar || '--tcz-card-img'
        const cssParts = []
        let bottom = null
        if (area.bottomColor) {
          const rgb = parseRgb(area.bottomColor)
          const a = 1 - (area.bottomOpacity == null ? 0 : area.bottomOpacity)
          bottom = a >= 1 ? 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')' : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'
        }
        if (area.mode === 'image' && area.image) {
          const alpha = 1 - (area.opacity == null ? 0 : area.opacity)
          cssParts.push(sel + ' { background-color: ' + (bottom || 'transparent') + ' !important;' + mainExtra + ' }')
          cssParts.push(sel + '::before { content: "" !important; position: absolute !important; inset: 0 !important; z-index: -1 !important; pointer-events: none !important; border-radius: ' + radius + 'px !important; background-image: var(' + imgVar + ') !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; -webkit-mask-image: linear-gradient(rgba(0,0,0,' + alpha + '), rgba(0,0,0,' + alpha + ')) !important; mask-image: linear-gradient(rgba(0,0,0,' + alpha + '), rgba(0,0,0,' + alpha + ')) !important; }')
        } else if (area.mode === 'color') {
          const a = 1 - (area.opacity == null ? 0 : area.opacity)
          const rgbC = parseRgb(area.color)
          cssParts.push(sel + ' { background-color: ' + (bottom || baseBg) + ' !important;' + mainExtra + ' }')
          cssParts.push(sel + '::before { content: "" !important; position: absolute !important; inset: 0 !important; z-index: -1 !important; pointer-events: none !important; border-radius: ' + radius + 'px !important; background-image: linear-gradient(rgba(' + rgbC[0] + ',' + rgbC[1] + ',' + rgbC[2] + ',' + a + '), rgba(' + rgbC[0] + ',' + rgbC[1] + ',' + rgbC[2] + ',' + a + ')) !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }')
        } else if (bottom) {
          cssParts.push(sel + ' { background-color: ' + bottom + ' !important; }')
        }
        return cssParts.join(' ')
      }
      function buildComposerCss() {
        // 输入区（composer）：背景作用在 [data-composer-card]；纯色/图片用 ::before 铺满（显示范围一致）；含统计条隐藏/固定高度/光标
        const cssParts = []
        cssParts.push(buildCardCss({ sel: '[data-composer-card]', area: areas.composer, radius: 22, mainExtra: 'z-index: 0 !important;', imgVar: '--tcz-composer-img' }))
        // 官方 StatsLine 隐藏（v0.9.19 调整后恢复无条件）：统计条始终由我们的 ComposerStatsLine 接管渲染——
        // 9 项子开关在不展开时也要生效（官方无法按项过滤）；外观复刻官方（block/居中/单行省略）
        cssParts.push('.FJxK0a_root { display: none !important; }')
        if (composerFixedHeight) {
          const rows = Math.max(1, Math.min(10, Math.round(composerRows || 4)))
          const h = rows * 24
          cssParts.push('[data-input-scroll] { height: ' + h + 'px !important; max-height: ' + h + 'px !important; }')
        }
        cssParts.push('[data-input-scroll] { cursor: text !important; }')
        return cssParts.join(' ')
      }
      function buildDetailsCss() {
        // 设置界面（details，v0.9.12）：官方设置面板 [class*="VOzbGW_panel"]（居中模态，背景 --dsw-alias-bg-layer-2，
        // 圆角 24px，z-index:1 建层叠上下文 → ::before z-index:-1 安全，同 composer 方案）。
        // 逻辑像主界面：无/纯色/图片 + 透明度（大=透明）+ 底色（常驻白底）；无显示区域开关
        // ⚠️ detSel 必须先声明（v0.9.19 事故：detailsPos 分支在 const detSel 之前用 → TDZ ReferenceError →
        //    buildDetailsCss 抛错 → AreaCss 崩溃 → 全部 CSS 失效，用户"拖动后全部设置不生效"）
        const detSel = '[class*="VOzbGW_panel"]'
        const cssParts = []
        // 拖动位置（v0.9.19）：非 null 时面板脱离 overlay flex 居中，固定在拖动位置（刷新后由本 CSS 保持）
        if (detailsPos) {
          cssParts.push(detSel + ' { position: fixed !important; margin: 0 !important; left: ' + detailsPos.x + 'px !important; top: ' + detailsPos.y + 'px !important; }')
        }
        // 拖动区 header 光标 = 系统原生 move（与浮窗一致，v0.9.19）
        cssParts.push(detSel + ' [class*="_header"] { cursor: move !important; }')
        // ⚠️ 防御：areas.details 可能 undefined（旧配置整体替换后缺键），读前兜底空对象（v0.9.13 事故同源修复）
        cssParts.push(buildCardCss({ sel: detSel, area: areas.details || {}, radius: 24, mainExtra: 'z-index: 1 !important;', imgVar: '--tcz-details-img' }))
        return cssParts.join(' ')
      }
      function buildSidebarCss() {
        // 侧边栏（底色 + 图片/纯色/无）；三层独立架构（层1 body / 层2 底色 / 层3 ::before 图片）
        // v1.0.4 收起态：折叠（官方 hHd-Xa_collapsed class，F12 实测）时用 areas.sidebar.collapsed 独立配置；
        //   默认 mode:'none' = 官方原样（背景层 opacity:0）。切换用 transition 淡入淡出（容器/伪元素 opacity 过渡）。
        //   折叠 class 在内层 hHd-Xa_root 上（sidebarInfo.selector 是外层列容器）→ 用 :has() 区分两态
        const cssParts = []
        const sel = sidebarInfo && sidebarInfo.selector ? sidebarInfo.selector : null
        // 收起态选择器：collapsed class 可能在容器自身（兜底分支选中 hHd-Xa_root）或后代（列容器选中 _sidebarCol）
        const colSel = sel ? sel + '[class*="_collapsed"], ' + sel + ':has([class*="_collapsed"])' : null
        // 展开态选择器：非折叠才生效（:not 双条件）——与收起规则互斥，防折叠后展开规则残留
        const expSel = sel ? sel + ':not([class*="_collapsed"]):not(:has([class*="_collapsed"]))' : null
        if (!sel) return cssParts.join(' ')
        const mk = (area, isCollapsed) => {
          const out = []
          const bottomColor = (() => {
            if (!area.bottomEnabled || !area.bottomColor) return null
            const ba = 1 - (area.bottomOpacity == null ? 0 : area.bottomOpacity)
            const [br, bg, bb] = parseRgb(area.bottomColor)
            return 'rgba(' + br + ',' + bg + ',' + bb + ',' + ba + ')'
          })()
          // 容器：底色 + 过渡（背景色淡入淡出；收起态默认官方原样 = 透明底）
          const bottom = bottomColor || 'transparent'
          out.push((isCollapsed ? colSel : expSel) + ' { position: relative !important; background-color: ' + bottom + ' !important; transition: background-color 0.35s ease !important; }')
          if (area.mode === 'image' && area.image) {
            const maskAlpha = 1 - (area.opacity == null ? 0 : area.opacity)
            out.push((isCollapsed ? colSel : expSel) + '::before { content: "" !important; position: absolute !important; inset: 0 !important; pointer-events: none !important; background-image: var(--tcz-sidebar-img) !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; -webkit-mask-image: linear-gradient(rgba(0,0,0,' + maskAlpha + '), rgba(0,0,0,' + maskAlpha + ')) !important; mask-image: linear-gradient(rgba(0,0,0,' + maskAlpha + '), rgba(0,0,0,' + maskAlpha + ')) !important; opacity: 1 !important; transition: opacity 0.35s ease !important; }')
          } else if (area.mode === 'color') {
            // ⚠️ 纯色用**容器 background**（不用 ::before）：容器背景天然在内容之下，永不盖 UI（v20 架构）。
            // v1.0.4 重构曾改 ::before → 盖住所有 UI（回归，用户反馈"纯色模式上边 UI 在颜色层下"）→ 改回容器背景。
            const a = 1 - (area.opacity == null ? 0 : area.opacity)
            const [r, g, b] = parseRgb(area.color)
            out.push((isCollapsed ? colSel : expSel) + ' { background-color: ' + bottom + ' !important; background-image: linear-gradient(rgba(' + r + ',' + g + ',' + b + ',' + a + '), rgba(' + r + ',' + g + ',' + b + ',' + a + ')) !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }')
          } else {
            // 无/透明：背景层淡出（opacity 0），官方原样透出
            out.push((isCollapsed ? colSel : expSel) + '::before { content: "" !important; position: absolute !important; inset: 0 !important; pointer-events: none !important; opacity: 0 !important; transition: opacity 0.35s ease !important; }')
          }
          return out
        }
        // 展开态（默认）规则
        cssParts.push.apply(cssParts, mk(areas.sidebar, false))
        // 收起态规则（若配置了收起模式；默认 none → 淡出）
        cssParts.push.apply(cssParts, mk(areas.sidebar.collapsed || { mode: 'none', opacity: 0 }, true))
        return cssParts.join(' ')
      }
      function buildBrandCss() {
        // DeepSeek Harness 标志（v0.9.17）：左上角品牌行 wordmark（BrandWordmark svg，path 全部 fill:currentColor → 给 svg 设 color 即变色）。
        // 作用于 logoRow 内 [_brand] 的 svg（稳定后缀；限定祖先防误伤其他 _brand 元素）；折叠态 brand 不渲染（wide 才显示）。
        // v1.0.5 收起态：折叠后 logoRow 无 _brand，DeepSeek 标志 = 鲸鱼图标 hHd-Xa_railFish（F12 实测，
        //   path fill=currentColor → 同样设 svg color 即变色）；brand.collapsed.color/opacity null = 跟随展开态（默认一致）。
        //   透明度：数值大=透明 → alpha = 1-opacity（rgba 直接作用于 color，无需 color-mix——用户色非 token）
        const cssParts = []
        const bc = brand.color || '#3964fe'
        const ba = Math.max(0, Math.min(1, 1 - (brand.opacity == null ? 0 : brand.opacity)))
        const color = ba >= 1 ? bc : (() => {
          const rgb = parseRgb(bc)
          return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + ba + ')'
        })()
        cssParts.push('[class*="_logoRow"] [class*="_brand"] svg { color: ' + color + ' !important; }')
        // ── 收起态标志（v1.0.5）：折叠容器带 _collapsed class（稳定后缀）；railFish 在 logoRow 内
        const bcCol = brand.collapsed || {}
        const cc = bcCol.color || bc // null=跟随展开态颜色
        const ca = Math.max(0, Math.min(1, 1 - (bcCol.opacity == null ? (brand.opacity == null ? 0 : brand.opacity) : bcCol.opacity))) // null=跟随展开态透明度
        const cColor = ca >= 1 ? cc : (() => {
          const rgb = parseRgb(cc)
          return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + ca + ')'
        })()
        cssParts.push('[class*="_collapsed"] [class*="_logoRow"] [class*="_railFish"] { color: ' + cColor + ' !important; }')
        // 标志文字 "Harness" 部分单独颜色（v0.9.20）：实际渲染的 BrandWordmark（dsh 内部版）结构 =
        // svg > path×9(DeepSeek) + g[whale-clip](鲸鱼图标) + rect(129,52 = Harness 徽章背景) + g[badge-clip](Harness 文字×7)。
        // Harness 文字 = badge-clip 的 g 内 path → `svg g[clip-path*="badge"] path`（属性值含 badge，精确区分 whale g）。
        // fill 直接覆盖 currentColor。color null 时：opacity>0 → 淡化**官方默认白**（Badge 蓝底白字；2026-08-23 修正：原淡化品牌蓝与默认白不符）
        const bh = brandHarness || {}
        const bhOp = bh.opacity == null ? 0 : bh.opacity
        if (bh.color || bhOp > 0) {
          // 2026-08-23 修正：未设色时 base = 官方默认白 #ffffff（Badge 蓝底白字），不再淡化品牌蓝——与设置面板色块显示一致
          const base = bh.color || '#ffffff'
          const bha = Math.max(0, Math.min(1, 1 - bhOp))
          const bhrgb = parseRgb(base)
          const hColor = bha >= 1 ? base : 'rgba(' + bhrgb[0] + ',' + bhrgb[1] + ',' + bhrgb[2] + ',' + bha + ')'
          cssParts.push('[class*="_logoRow"] [class*="_brand"] svg g[clip-path*="badge"] path { fill: ' + hColor + ' !important; }')
        }
        return cssParts.join(' ')
      }
      // 框线（v0.9.18）：所有 UI 默认边框/分隔线颜色 + 透明度，5 区域独立。
      // 各区域容器覆盖官方边框 token（子树内优先于 body 继承值）：
      //   · color 设了 → 5 变量 = rgba(用户色, 1-opacity)（层级统一为用户色）；
      //   · color 未设（默认）→ 各区域固定默认色：主界面/Cordis/输入区 = 淡灰（BORDER_DEFAULT_LIGHT，与色块显示一致，
      //     官方 --dsw-alias-border-l2 rgba(0,0,0,.1) 白底合成，官方 l1=.04 太淡像没颜色，用户要求）；
      //     设置界面/浮窗面板 = 黑色（BORDER_DEFAULT_DARK，用户定）。常量统一在 00_constants（07/15 共用）。
      //     透明度（数值大=透明）淡化默认色/用户色。始终注入（无 early return）→ 默认色恒生效。
      // main = 布局三列（sidebarCol/centerCol/detailsCol，稳定后缀；浮层面板都不在三列内 → 天然隔离）
      function buildBordersCss() {
        const VARS = ['--dsw-alias-border-l1', '--dsw-alias-border-l2', '--dsw-alias-border-l2-darkmode-thin', '--dsw-alias-border-l3', '--dsw-alias-border-l4']
        const AREA_SELS = {
          main: '[class*="_sidebarCol"], [class*="_centerCol"], [class*="_detailsCol"]',
          cordis: '[class*="Nqubda_panel"]',
          composer: '[data-composer-seat], [data-composer-card]',
          details: '[class*="VOzbGW_panel"]',
          float: '[data-thmcz-float]',
          // v1.0.2：新会话按钮独立框线（官方边框 1px solid border-l2 → 随本区域变量）
          newSession: '[class*="_newSession"]:not([class*="_newSessionLabel"])',
        }
        const cssParts = []
        for (const k of BORDER_KEYS) {
          const b = borders[k] || {}
          const op = b.opacity == null ? 0 : b.opacity
          const a = Math.max(0, Math.min(1, 1 - op))
          const base = b.color || ((k === 'details' || k === 'float') ? BORDER_DEFAULT_DARK : BORDER_DEFAULT_LIGHT)
          const rgb = parseRgb(base)
          const c = a >= 1 ? base : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'
          cssParts.push(AREA_SELS[k] + ' { ' + VARS.map((v) => v + ': ' + c).join('; ') + '; }')
        }
        return cssParts.join(' ')
      }
      function buildNewSessionCss() {
        // 新会话按钮（_newSession 是 _newSessionLabel 子串 → 选择器必须排除 label）
        const cssParts = []
        const ns = newSession
        const nsBtn = '[class*="_newSession"]:not([class*="_newSessionLabel"])'
        const nsLabel = '[class*="_newSessionLabel"]'
        let bottom = 'transparent'
        if (ns.bottomEnabled && ns.bottomColor) {
          const ba = 1 - (ns.bottomOpacity == null ? 0 : ns.bottomOpacity)
          const [br, bg2, bb] = parseRgb(ns.bottomColor)
          bottom = 'rgba(' + br + ',' + bg2 + ',' + bb + ',' + ba + ')'
        }
        if (!ns.showText) cssParts.push(nsLabel + ' { display: none !important; }')
        if (!ns.showIcon) cssParts.push(nsBtn + ' svg { display: none !important; }')
        if (ns.mode === 'none') {
          // 「无」模式：背景透明透出侧边栏，但保留官方边框（v1.0.2 用户定：默认状态新会话要有边框。
          // 曾强制 border-color transparent（v0.7.x"无模式完全隐形"），官方默认是 1px solid --dsw-alias-border-l2）
          cssParts.push(nsBtn + ' { background-color: ' + bottom + ' !important; }')
          cssParts.push(nsBtn + ':hover { background-color: transparent !important; }')
        } else if (ns.mode === 'color') {
          const a = 1 - (ns.opacity == null ? 0 : ns.opacity)
          const [r, g, b] = parseRgb(ns.color)
          // v1.0.2：纯色模式也保留边框（跟随新会话框线设置）；边框绘制在 ::before 之上（背景在 z-index:-1 层）
          cssParts.push(nsBtn + ' { background-color: ' + bottom + ' !important; position: relative !important; z-index: 0 !important; }')
          cssParts.push(nsBtn + '::before { content: "" !important; position: absolute !important; inset: 0 !important; z-index: -1 !important; pointer-events: none !important; background-image: linear-gradient(rgba(' + r + ',' + g + ',' + b + ',' + a + '), rgba(' + r + ',' + g + ',' + b + ',' + a + ')) !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }')
          cssParts.push(nsBtn + ':hover { background-color: transparent !important; }')
        } else if (ns.mode === 'image' && ns.image) {
          const alpha = 1 - (ns.opacity == null ? 0 : ns.opacity)
          // v1.0.2：图片模式也保留边框（跟随新会话框线设置）
          cssParts.push(nsBtn + ' { background-color: ' + bottom + ' !important; position: relative !important; z-index: 0 !important; }')
          cssParts.push(nsBtn + '::before { content: "" !important; position: absolute !important; inset: 0 !important; z-index: -1 !important; pointer-events: none !important; background-image: var(--tcz-ns-img) !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; -webkit-mask-image: linear-gradient(rgba(0,0,0,' + alpha + '), rgba(0,0,0,' + alpha + ')) !important; mask-image: linear-gradient(rgba(0,0,0,' + alpha + '), rgba(0,0,0,' + alpha + ')) !important; }')
          cssParts.push(nsBtn + ':hover { background-color: transparent !important; }')
        }
        if (ns.iconColor) cssParts.push(nsBtn + ' svg { color: ' + ns.iconColor + ' !important; }')
        if (ns.textColor) cssParts.push(nsLabel + ' { color: ' + ns.textColor + ' !important; }')
        return cssParts.join(' ')
      }
      function buildLiftCss() {
        // 侧边栏图片模式下内容提升（v20 铁律：任何会包住官方设置面板的祖先都不得建层叠上下文）。
        // v1.0.4 修正（两次迭代）：
        //  · 第一版：regionArea/footArea 加 z-index:1（建 mini 上下文）→ **盖住设置面板**（面板 DOM 在侧边栏内，
        //    settingsArea 是兄弟，z-index:1 > auto 把面板压住，用户反馈"上方那一栏覆盖设置界面上层"）。
        //  · 正确方案：用 `position: relative`（**不加 z-index**）——relative + z-index:auto **不建层叠上下文**
        //    （面板不受影响），且内容 DOM 顺序在 ::before（伪元素，渲染为第一个子）之后 → 自然绘制在图片层之上。
        //  · logoRow/新会话保持 z-index:1（v20 已验证安全：内部无 fixed 面板）。
        //  · settingsArea 也加 position:relative（让设置按钮可见于图片层之上，且不关面板——relative 不建上下文）。
        // 收起态图片（areas.sidebar.collapsed mode image）同样需要提升。
        const cssParts = []
        const hasExpandImg = areas.sidebar.mode === 'image' && areas.sidebar.image && sidebarInfo && sidebarInfo.selector
        const sc = areas.sidebar.collapsed
        const hasCollapsedImg = sc && sc.mode === 'image' && sc.image && sidebarInfo && sidebarInfo.selector
        if (hasExpandImg || hasCollapsedImg) {
          cssParts.push(sidebarInfo.selector + ' [class*="_logoRow"] { position: relative !important; z-index: 1 !important; }')
          cssParts.push('[class*="_newSession"]:not([class*="_newSessionLabel"]) { position: relative !important; z-index: 1 !important; }')
          // 内容区提升（不建上下文）：relative 无 z-index → DOM 顺序盖住 ::before，且不影响设置面板
          cssParts.push(sidebarInfo.selector + ' [class*="_regionArea"] { position: relative !important; }')
          cssParts.push(sidebarInfo.selector + ' [class*="_footArea"] { position: relative !important; }')
          cssParts.push(sidebarInfo.selector + ' [class*="_settingsArea"] { position: relative !important; }')
        }
        return cssParts.join(' ')
      }
      function buildCordisCss() {
        // Cordis 插件界面（v0.9.14）：官方面板 [class*="Nqubda_panel"]（z-index:30 建层叠上下文 + position:fixed → ::before z-index:-1 安全，
        // 圆角 12px，背景 --dsw-alias-bg-base）。背景调整像设置界面：无/纯色/图片 + 透明度（大=透明）+ 底色（含透明度）。
        // 原 cordisOpacity（半透明白盖层）已删；「Cordis 按钮常驻」开关在 13_boot 的 applyCordisEntryFlag（与本 CSS 无关）
        // ⚠️ 防御：areas.cordis 可能 undefined（旧配置整体替换后缺键），读前兜底空对象（v0.9.13 事故修复）
        return buildCardCss({ sel: '[class*="Nqubda_panel"]', area: areas.cordis || {}, radius: 12, imgVar: '--tcz-cordis-img' })
      }
      function buildFloatCss() {
        // 浮窗面板（v0.9.13）：自研浮窗容器 [data-thmcz-float]（12_float GlobalFloat）。
        // 背景像主界面/设置界面：无/纯色/图片 + 透明度（大=透明）+ 底色（常驻白底）；
        // 容器本身 position:fixed + z-index 2147483647（建层叠上下文）→ ::before z-index:-1 安全（同 details 方案）。
        // 另保留浮窗可见时的 overlay 层级提升（[data-shell-overlay]）。
        const cssParts = []
        if (floatVisible) cssParts.push('[data-shell-overlay] { z-index: 2147483646 !important; }')
        // ⚠️ 防御：areas.float 可能 undefined（旧配置整体替换后缺键），读前兜底空对象（v0.9.13 事故修复）
        cssParts.push(buildCardCss({ sel: '[data-thmcz-float]', area: areas.float || {}, radius: 12, imgVar: '--tcz-float-img' }))
        return cssParts.join(' ')
      }
      // 对话区：代码块滚动条 + 对话区滚动条 + 任务栏收起/展开背景（各自定向，避免全局变化）
      function buildConvCss() {
        const cssParts = []
        // 代码块滚动条（v0.9.19 根治）：对话区内容区 [data-chat-flow]（column）整体设变量——
        // column 内部**所有**滚动条（代码块 terminal/read/search/diff、JsonBlock、IO 卡片 IN/OUT 等，
        // 不管哈希类名）都跟随「代码块滚动条」。对话区滚动容器是 column 的**祖先**（不继承 column 变量）→
        // 不受影响，仍由「对话区滚动条」直接 thumb 控制。此前逐个补 _block_/md-code-block/pre/_body_ 仍有漏网（IO 卡片）
        // v1.0.3：对话区各键透明度（数值大=透明 → alpha = 1-opacity）——设色时合成 rgba；滚动条/任务栏/一键到底未设色时无官方色可淡，跳过
        const sbA = Math.max(0, Math.min(1, 1 - (convBgs.scrollbarOpacity == null ? 0 : convBgs.scrollbarOpacity)))
        if (convBgs.scrollbar) {
          const c = sbA >= 1 ? convBgs.scrollbar : 'rgba(' + parseRgb(convBgs.scrollbar).join(',') + ',' + sbA + ')'
          cssParts.push('[data-chat-flow] { --dsh-scrollbar-thumb: ' + c + ' !important; --dsh-scrollbar-thumb-hover: ' + c + ' !important; }')
        }
        // 对话区滚动条（含 data-chat-flow 的 _scroll 容器）：v0.9.19 改**直接作用于自身 thumb**（不设变量）——
        // 变量会被内部滚动条（JsonBlock 裸 pre 等）继承 → 代码块竖滚动条错误跟随对话区颜色（用户反馈"竖的绑错"）。
        // ⚠️ v0.9.19 再修：不用 Firefox scrollbar-color——scrollbar-color 是**继承属性**，会继续污染内部代码块滚动条；
        // 只保留 Webkit ::-webkit-scrollbar-thumb 直接样式（只控制对话区最外层滚动条，即最右边的滚动条）
        const csA = Math.max(0, Math.min(1, 1 - (convBgs.chatScrollOpacity == null ? 0 : convBgs.chatScrollOpacity)))
        if (convBgs.chatScroll) {
          const c = csA >= 1 ? convBgs.chatScroll : 'rgba(' + parseRgb(convBgs.chatScroll).join(',') + ',' + csA + ')'
          cssParts.push('[class*="_scroll"]:has([data-chat-flow])::-webkit-scrollbar-thumb { background: ' + c + ' !important; }')
          cssParts.push('[class*="_scroll"]:has([data-chat-flow])::-webkit-scrollbar-thumb:hover { background: ' + c + ' !important; }')
        }
        // 任务栏：展开滑入动画（官方渲染 list 时播放）+ 背景渐变（0.2s 快速跟手，与状态切换基本同步）；
        // 收起 = 官方行为（list 瞬间移除，不做列表动画）
        cssParts.push('@keyframes tcz-todo-expand { from { opacity: 0; transform: scaleY(0.6); } to { opacity: 1; transform: scaleY(1); } }')
        cssParts.push('[data-testid="todo-panel"] [class*="_list"] { animation: tcz-todo-expand 0.4s ease-in-out !important; transform-origin: top !important; }')
        const tdA = Math.max(0, Math.min(1, 1 - (convBgs.todoCollapsedOpacity == null ? 0 : convBgs.todoCollapsedOpacity)))
        const teA = Math.max(0, Math.min(1, 1 - (convBgs.todoExpandedOpacity == null ? 0 : convBgs.todoExpandedOpacity)))
        if (convBgs.todoCollapsed || convBgs.todoExpanded) {
          cssParts.push('[data-testid="todo-panel"] { transition: background-color 0.2s ease-out !important; }')
        }
        if (convBgs.todoCollapsed) {
          const c = tdA >= 1 ? convBgs.todoCollapsed : 'rgba(' + parseRgb(convBgs.todoCollapsed).join(',') + ',' + tdA + ')'
          cssParts.push('[data-testid="todo-panel"]:has([aria-expanded="false"]) { background-color: ' + c + ' !important; }')
        }
        if (convBgs.todoExpanded) {
          const c = teA >= 1 ? convBgs.todoExpanded : 'rgba(' + parseRgb(convBgs.todoExpanded).join(',') + ',' + teA + ')'
          cssParts.push('[data-testid="todo-panel"]:has([aria-expanded="true"]) { background-color: ' + c + ' !important; }')
        }
        // ── bubble/inline/code 未设色但透明度>0：元素级 color-mix 淡化官方 token（不覆盖 token——覆盖值里 var 自身会循环失效）──
        // 选择器：气泡 = 用户消息 _bubble；行内代码 = 非 pre 的 code；代码块 = _block_/md-code-block（banner 单列略过）
        const bOp = convBgs.bubbleOpacity == null ? 0 : convBgs.bubbleOpacity
        if (!convBgs.bubble && bOp > 0) {
          const pct = Math.round(Math.max(0, Math.min(1, 1 - bOp)) * 100) + '%'
          cssParts.push('[data-chat-flow] [class*="_bubble"] { background-color: color-mix(in srgb, var(--dsw-specific-bubble) ' + pct + ', transparent) !important; }')
        }
        const iOp = convBgs.inlineOpacity == null ? 0 : convBgs.inlineOpacity
        if (!convBgs.inline && iOp > 0) {
          const pct = Math.round(Math.max(0, Math.min(1, 1 - iOp)) * 100) + '%'
          cssParts.push('[data-chat-flow] :not(pre) > code { background-color: color-mix(in srgb, var(--dsw-alias-markdown-inline-code) ' + pct + ', transparent) !important; }')
        }
        const cOp = convBgs.codeOpacity == null ? 0 : convBgs.codeOpacity
        if (!convBgs.code && cOp > 0) {
          const pct = Math.round(Math.max(0, Math.min(1, 1 - cOp)) * 100) + '%'
          cssParts.push('[data-chat-flow] [class*="_block_"], [data-chat-flow] [class*="md-code-block"] { background-color: color-mix(in srgb, var(--dsw-alias-markdown-code-block) ' + pct + ', transparent) !important; }')
        }
        // 输入框「+」命令按钮背景（官方 --dsw-specific-selector；hover 官方 --dsw-alias-interactive-bg-hover-solid → 一并覆盖防悬停跳回官方色）
        // v0.9.14：支持透明度——自定义颜色用 rgba(1-opacity)；官方默认色（addBtn null）时透明度作用于官方 token（color-mix）
        const addBtnA = Math.max(0, Math.min(1, 1 - (convBgs.addBtnOpacity == null ? 0 : convBgs.addBtnOpacity)))
        if (convBgs.addBtn) {
          const rgb = parseRgb(convBgs.addBtn)
          const bg = addBtnA >= 1 ? convBgs.addBtn : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + addBtnA + ')'
          cssParts.push('[class*="uV2eYG_add"] { background-color: ' + bg + ' !important; }')
          cssParts.push('[class*="uV2eYG_add"]:hover:not(:disabled) { background-color: ' + bg + ' !important; }')
        } else if (addBtnA < 1) {
          // 官方默认色 + 透明度：color-mix 混合官方 token 与透明（background-color 单值，var() 安全）
          const pct = Math.round(addBtnA * 100) + '%'
          cssParts.push('[class*="uV2eYG_add"] { background-color: color-mix(in srgb, var(--dsw-specific-selector) ' + pct + ', transparent) !important; }')
          cssParts.push('[class*="uV2eYG_add"]:hover:not(:disabled) { background-color: color-mix(in srgb, var(--dsw-specific-selector) ' + pct + ', transparent) !important; }')
        }
        // 命令菜单面板背景（官方 --dsw-specific-menu，被多包共用 → 精确选择器覆盖，不改全局 token）
        // v0.9.14：支持透明度（cmdMenuOpacity，同 addBtn；官方默认色用 color-mix）
        const cmdMenuA = Math.max(0, Math.min(1, 1 - (convBgs.cmdMenuOpacity == null ? 0 : convBgs.cmdMenuOpacity)))
        if (convBgs.cmdMenu) {
          const rgb = parseRgb(convBgs.cmdMenu)
          const bg = cmdMenuA >= 1 ? convBgs.cmdMenu : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + cmdMenuA + ')'
          cssParts.push('[class*="_3e4SsG_menu"] { background-color: ' + bg + ' !important; }')
        } else if (cmdMenuA < 1) {
          const pct = Math.round(cmdMenuA * 100) + '%'
          cssParts.push('[class*="_3e4SsG_menu"] { background-color: color-mix(in srgb, var(--dsw-specific-menu) ' + pct + ', transparent) !important; }')
        }
        // 对话区「V」一键到底部按钮背景（v0.9.15）：官方 token --dsw-alias-button-floating-fill 被布局手柄共用 → 精确选择器覆盖
        // v1.0.3：支持透明度（设色时 rgba 合成）
        const tbA = Math.max(0, Math.min(1, 1 - (convBgs.toBottomOpacity == null ? 0 : convBgs.toBottomOpacity)))
        if (convBgs.toBottom) {
          const c = tbA >= 1 ? convBgs.toBottom : 'rgba(' + parseRgb(convBgs.toBottom).join(',') + ',' + tbA + ')'
          cssParts.push('[class*="Md3f7G_toBottom"] { background-color: ' + c + ' !important; }')
        }
        // 主题设置插件滑条（v0.9.15）：range 分左右两半——左半边（已填充）+ 右半边（未填充轨道）+ 圆点，各自独立颜色/透明度。
        // 仅作用于 data-thmcz-range（插件自己的 range，不碰官方滑条）。
        // ⚠️ 矩形框 bug 修复：必须 -webkit-appearance:none 去掉原生轨道样式（原生+自定义背景叠加 = 矩形框）；
        // track 设固定高度+圆角（渐变 = 左填充 P% / 右轨道 P%，P = --tcz-range-val JS 每帧更新）；thumb 圆形 = sliderColor。
        // 透明度：数值大=透明 → alpha = 1-opacity（rgba）
        const sliderFill = convBgs.sliderColor
        const sliderTrack = convBgs.sliderTrackColor
        // v1.0.3：未设色也可调透明度（用户要滑条/轨道透明度默认显示）——未设色用默认初始色参与淡化
        // （填充 = Chrome 默认 accent 蓝 #0060df、轨道 = rgba(128,128,128,0.3) 白底合成 ≈ #d9d9d9，与色块默认显示一致）
        const fillOp = convBgs.sliderOpacity == null ? 0 : convBgs.sliderOpacity
        const trackOp = convBgs.sliderTrackOpacity == null ? 0 : convBgs.sliderTrackOpacity
        if (sliderFill || sliderTrack || fillOp > 0 || trackOp > 0) {
          const fillA = Math.max(0, Math.min(1, 1 - fillOp))
          const trackA = Math.max(0, Math.min(1, 1 - trackOp))
          const fillBase = sliderFill || '#0060df'
          const trackBase = sliderTrack || '#d9d9d9'
          const fillRgb = parseRgb(fillBase)
          const trackRgb = parseRgb(trackBase)
          const fBg = fillA >= 1 ? fillBase : 'rgba(' + fillRgb[0] + ',' + fillRgb[1] + ',' + fillRgb[2] + ',' + fillA + ')'
          const tBg = trackA >= 1 ? trackBase : 'rgba(' + trackRgb[0] + ',' + trackRgb[1] + ',' + trackRgb[2] + ',' + trackA + ')'
          cssParts.push('[data-thmcz-range] { -webkit-appearance: none !important; appearance: none !important; background: transparent !important; --tcz-range-fill: ' + fBg + '; --tcz-range-track: ' + tBg + '; }')
          cssParts.push('[data-thmcz-range]::-webkit-slider-runnable-track { -webkit-appearance: none !important; appearance: none !important; height: 6px !important; border-radius: 3px !important; background: linear-gradient(to right, var(--tcz-range-fill) var(--tcz-range-val, 0%), var(--tcz-range-track) var(--tcz-range-val, 0%)) !important; }')
          cssParts.push('[data-thmcz-range]::-webkit-slider-thumb { -webkit-appearance: none !important; appearance: none !important; width: 14px !important; height: 14px !important; border-radius: 50% !important; margin-top: -4px !important; background-color: ' + fBg + ' !important; border: none !important; }')
          cssParts.push('[data-thmcz-range]::-moz-range-track { height: 6px !important; border-radius: 3px !important; background: linear-gradient(to right, var(--tcz-range-fill) var(--tcz-range-val, 0%), var(--tcz-range-track) var(--tcz-range-val, 0%)) !important; }')
          if (sliderFill) {
            cssParts.push('[data-thmcz-range]::-moz-range-thumb { width: 14px !important; height: 14px !important; border-radius: 50% !important; background-color: ' + fBg + ' !important; border: none !important; }')
          }
        }
        // 浮窗界面滚动条（v0.9.15 修正）：用户要的是浮窗（GlobalFloat）内容区滚动条 [data-thmcz-float-scroll]，
        // 不是设置面板的（此前误做成 VOzbGW_options，用户反馈"没作用"——因为看的是浮窗滚动条）。
        // 变量作用于滚动容器（thumb var() 解析基准），滚动条宽度走 body 全局 8px
        // v1.0.3：未设色也可调透明度（默认色 = 官方 scrollbar-bg-l1 → neutral-200 #e5e5e5）
        const scOp = convBgs.scrollOpacity == null ? 0 : convBgs.scrollOpacity
        if (convBgs.scrollColor || scOp > 0) {
          const ca = Math.max(0, Math.min(1, 1 - scOp))
          const base = convBgs.scrollColor || '#e5e5e5'
          const crgb = parseRgb(base)
          const cBg = ca >= 1 ? base : 'rgba(' + crgb[0] + ',' + crgb[1] + ',' + crgb[2] + ',' + ca + ')'
          cssParts.push('[data-thmcz-float-scroll] { --dsh-scrollbar-thumb: ' + cBg + ' !important; --dsh-scrollbar-thumb-hover: ' + cBg + ' !important; }')
        }
        return cssParts.join(' ')
      }
      // 新会话欢迎页四项调色（v1.0.5）：鲸鱼图标 / 探索未至之境 / 预览版文字 / 预览版背景。
      // 官方结构（dsh-client-ui-conversation HeroShell，F12 + 源码实测）：
      //   .pXSMma_fishHitbox 包 .pXSMma_fish（svg，fill=currentColor → 设 svg color 即变色，官方 label-primary）
      //   .pXSMma_headlineText（探索未至之境，官方 label-primary）
      //   .pXSMma_previewBadge（预览版：color=label-primary-bluish + background=state-business-tertiary + border 不动）
      // 选择器用稳定后缀 _fishHitbox（祖先，内部唯一 svg）/ _headlineText / _previewBadge（官方 CSS Module 哈希前缀可变，后缀稳定）
      // 透明度（数值大=透明 → alpha = 1-opacity）：设色 → rgba 合成；未设色 + 透明度>0 → 元素级 color-mix 淡化官方 token
      //   （不覆盖 token——覆盖值里 var 自身循环失效，同 convBgs bubble/inline/code 方案）
      // ⚠️ 2026-08-23 解除正文关联：fish/title 官方用 label-primary——该 token 会被插件「文字颜色」功能覆盖（overrideTokens
      //   写到 body），未设置时继承到的是**被覆盖的正文色**（用户设蓝 → 鲸鱼/标题变蓝，用户反馈"与正文有联系"）。
      //   修复：未设置时显式注入官方原色（亮 body → static-neutral-bluish-1000 近黑 / 暗 body[data-ds-dark-theme] →
      //   static-neutral-bluish-50 近白，同官方 label-primary 定义链），与正文文字颜色**彻底解耦**。
      function buildHeroCss() {
        const cssParts = []
        // fish / title 官方原色（亮/暗双主题，同官方 label-primary 定义；static 层不被 overrideTokens 覆盖）
        const mkColor = (sel, it, officialToken, officialDarkToken) => {
          if (!it) return
          const op = it.opacity == null ? 0 : it.opacity
          if (it.color) {
            const a = Math.max(0, Math.min(1, 1 - op))
            const rgb = parseRgb(it.color)
            const c = a >= 1 ? it.color : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'
            cssParts.push(sel + ' { color: ' + c + ' !important; }')
          } else if (op > 0) {
            const pct = Math.round(Math.max(0, Math.min(1, 1 - op)) * 100) + '%'
            cssParts.push(sel + ' { color: color-mix(in srgb, ' + officialToken + ' ' + pct + ', transparent) !important; }')
            cssParts.push('body[data-ds-dark-theme] ' + sel + ' { color: color-mix(in srgb, ' + officialDarkToken + ' ' + pct + ', transparent) !important; }')
          } else {
            // 未设置：显式固定官方原色（独立于正文文字颜色覆盖）→ 双主题规则
            cssParts.push(sel + ' { color: ' + officialToken + ' !important; }')
            cssParts.push('body[data-ds-dark-theme] ' + sel + ' { color: ' + officialDarkToken + ' !important; }')
          }
        }
        const mkBg = (sel, it, officialToken, officialDarkToken) => {
          if (!it) return
          const op = it.opacity == null ? 0 : it.opacity
          if (it.color) {
            const a = Math.max(0, Math.min(1, 1 - op))
            const rgb = parseRgb(it.color)
            const c = a >= 1 ? it.color : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'
            cssParts.push(sel + ' { background-color: ' + c + ' !important; }')
          } else if (op > 0) {
            const pct = Math.round(Math.max(0, Math.min(1, 1 - op)) * 100) + '%'
            cssParts.push(sel + ' { background-color: color-mix(in srgb, ' + officialToken + ' ' + pct + ', transparent) !important; }')
            if (officialDarkToken) cssParts.push('body[data-ds-dark-theme] ' + sel + ' { background-color: color-mix(in srgb, ' + officialDarkToken + ' ' + pct + ', transparent) !important; }')
          } else if (officialDarkToken) {
            // 未设置：显式固定官方原色（亮/暗双主题）
            cssParts.push(sel + ' { background-color: ' + officialToken + ' !important; }')
            cssParts.push('body[data-ds-dark-theme] ' + sel + ' { background-color: ' + officialDarkToken + ' !important; }')
          }
        }
        // 鲸鱼图标：fishHitbox 是稳定祖先（官方 class 唯一后缀），内部唯一 svg 就是鲸鱼
        mkColor('[class*="_fishHitbox"] svg', hero.fish, 'var(--dsw-static-neutral-bluish-1000)', 'var(--dsw-static-neutral-bluish-50)')
        // 探索未至之境
        mkColor('[class*="_headlineText"]', hero.title, 'var(--dsw-static-neutral-bluish-1000)', 'var(--dsw-static-neutral-bluish-50)')
        // 预览版文字（color）：label-primary-bluish 官方亮=blue-900 / 暗=neutral-bluish-50（token 不被文字颜色覆盖，双主题固定保主题正确）
        mkColor('[class*="_previewBadge"]', hero.badge, 'var(--dsw-static-blue-900)', 'var(--dsw-static-neutral-bluish-50)')
        // 预览版背景（background-color）：state-business-tertiary 官方亮=deepseek-100 / 暗=deepseek-800
        mkBg('[class*="_previewBadge"]', hero.badgeBg, 'var(--dsw-static-deepseek-100)', 'var(--dsw-static-deepseek-800)')
        return cssParts.join(' ')
      }
      // AreaCss useEffect（React 路径）与 refreshConvTokens（拖动抑制期直更）共用——保证两路径覆盖同一完整集合，
      // 避免 overrideTokens 替换 namespace 时顶掉彼此（"调 V 按钮主界面背景失效"事故根因）
      function buildThemeTokens() {
        const tokens = {}
        const app = areas.app, sb = areas.sidebar
        // v1.0.4：主界面 bg-base 透明化按当前折叠态判定（收起态 none → 不含该 token = 官方默认；
        // ⚠️ 勿设 null——官方 validateOverrides 拒绝 null（必须 {light,dark} 字符串对），同名 source
        // 整层替换，新层不含 bg-base 即恢复官方）
        const collapsedNow = sidebarInfo && sidebarInfo.collapsed
        const appArea = collapsedNow ? (areas.app.collapsedSidebar || {}) : app
        if (appArea.mode === 'color' || appArea.mode === 'image') {
          tokens['--dsw-alias-bg-base'] = { light: 'transparent', dark: 'transparent' }
          if (appArea.includeSidebar !== false) tokens['--dsw-specific-sidebar-fill'] = { light: 'transparent', dark: 'transparent' }
        }
        // v1.0.4：侧边栏 fill 透明化按当前折叠态判定——收起态用 areas.sidebar.collapsed 配置
        //   （有背景才透明化 fill，否则保留官方白 = 官方原样，符合"收起后默认官方原样"语义）
        const sbCollapsed = sidebarInfo && sidebarInfo.collapsed
        const sbArea = sbCollapsed ? (areas.sidebar.collapsed || {}) : sb
        if (sbArea.mode === 'transparent' || sbArea.mode === 'image' || sbArea.mode === 'color') tokens['--dsw-specific-sidebar-fill'] = { light: 'transparent', dark: 'transparent' }
        for (const it of COLOR_ITEMS) {
          const v = colors[it.key]
          if (!v) continue
          for (const t of COLOR_TOKENS[it.key]) {
            tokens[t] = { light: v, dark: v }
          }
        }
        // 对话区背景（2026-08-21）：我的发言气泡 + 行内代码 + 代码块/编辑卡片/脚本终端（官方 token 覆盖，亮暗统一用户色）
        // v1.0.3 透明度：设色时 rgba(色, 1-opacity) 合成；未设色时透明度走 buildConvCss 元素级 color-mix（token 自引用会循环，勿在覆盖值里 var 自身）
        const bubbleA = Math.max(0, Math.min(1, 1 - (convBgs.bubbleOpacity == null ? 0 : convBgs.bubbleOpacity)))
        if (convBgs.bubble) tokens['--dsw-specific-bubble'] = { light: bubbleA >= 1 ? convBgs.bubble : 'rgba(' + parseRgb(convBgs.bubble).join(',') + ',' + bubbleA + ')', dark: bubbleA >= 1 ? convBgs.bubble : 'rgba(' + parseRgb(convBgs.bubble).join(',') + ',' + bubbleA + ')' }
        const inlineA = Math.max(0, Math.min(1, 1 - (convBgs.inlineOpacity == null ? 0 : convBgs.inlineOpacity)))
        if (convBgs.inline) tokens['--dsw-alias-markdown-inline-code'] = { light: inlineA >= 1 ? convBgs.inline : 'rgba(' + parseRgb(convBgs.inline).join(',') + ',' + inlineA + ')', dark: inlineA >= 1 ? convBgs.inline : 'rgba(' + parseRgb(convBgs.inline).join(',') + ',' + inlineA + ')' }
        const codeA = Math.max(0, Math.min(1, 1 - (convBgs.codeOpacity == null ? 0 : convBgs.codeOpacity)))
        if (convBgs.code) {
          const cv = codeA >= 1 ? convBgs.code : 'rgba(' + parseRgb(convBgs.code).join(',') + ',' + codeA + ')'
          tokens['--dsw-alias-markdown-code-block'] = { light: cv, dark: cv }
          // banner（read/search 卡片标题栏）同色，补全"背景不完全"
          tokens['--dsw-alias-markdown-code-block-banner'] = { light: cv, dark: cv }
        }
        return tokens
      }
      // 对话区 token 覆盖直更（bubble/inline/code 走 theme.overrideTokens，不在 conv style 标签内）：
      // 拖动抑制期 notify 被跳过 → AreaCss 的 token useEffect 不重跑 → 这里手动同步完整 token 集合（buildThemeTokens）
      function refreshConvTokens() {
        try {
          const theme = ctx.get('theme')
          if (!theme || typeof theme.overrideTokens !== 'function') return
          const tokens = buildThemeTokens()
          if (Object.keys(tokens).length) theme.overrideTokens('theme-customizer', tokens)
        } catch (e) { /* 忽略 */ }
      }
      // 拖动中直更 style 标签（绕过 React 渲染链）：滑块拖动每帧调用。
      // ⚠️ 只更新变化的模块（id 对应区域），绝不全量重建——appCss 含主界面大图 dataURI（多层背景不能用变量的代价），
      //   全量重建会连坐所有滑块卡顿（与"整份 CSS 一起重建"同源问题）。
      // imgVars 不重建（大 dataURI 不随透明度/颜色变化，换图/切模式走 React 正常路径）
      // ⚠️ 性能（2026-08-22 v0.9.15 优化）：conv 键分两类——
      //   · 非 token 键（scrollbar/chatScroll/todo*/addBtn/cmdMenu/toBottom/slider*/scroll*）：只刷 conv style 标签（'convStyle'）；
      //   · token 键（bubble/inline/code）：style + refreshConvTokens（'conv'）。
      //   此前拖动滚动条/滑条颜色每帧都跑 buildThemeTokens+overrideTokens（无用开销）→ 卡顿
      // ⚠️ v1.0.3 修复：Chromium 对 ::-webkit-scrollbar-thumb 样式变化**不即时重绘**（style 标签已更新但画面不变，
      // 松手触发 React 重渲染才刷新——用户反馈"对话区滚动条颜色/透明度调整不会实时变化"）。
      // 强制重绘滚动容器：transform 微调（无布局跳动、不改变视觉）；仅 convStyle/conv 分支调用（拖动滚动条/滑条相关）
      function repaintScrollbars() {
        try {
          for (const sel of ['[class*="_scroll"]:has([data-chat-flow])', '[data-chat-flow]']) {
            const el = document.querySelector(sel)
            if (!el) continue
            el.style.transform = 'translateZ(0)'
            void el.offsetHeight // 强制 reflow，刷新合成层 → 重绘 thumb
            el.style.transform = ''
          }
        } catch (e) { /* 忽略 */ }
      }

      function manualCssRefresh(id) {
        try {
          const setStyle = (key, css) => {
            const el = document.querySelector('style[data-thmcz-' + key + ']')
            if (el && typeof css === 'string') el.textContent = css
          }
          if (!id) {
            setStyle('app', buildAppCss())
            setStyle('composer', buildComposerCss())
            setStyle('details', buildDetailsCss())
            setStyle('sidebar', buildSidebarCss())
            setStyle('brand', buildBrandCss())
            setStyle('hero', buildHeroCss())
            setStyle('borders', buildBordersCss())
            setStyle('ns', buildNewSessionCss())
            setStyle('lift', buildLiftCss())
            setStyle('cordis', buildCordisCss())
            setStyle('float', buildFloatCss())
            setStyle('conv', buildConvCss())
            refreshConvTokens()
            repaintScrollbars()
            return
          }
          if (id === 'app') setStyle('app', buildAppCss())
          else if (id === 'composer') setStyle('composer', buildComposerCss())
          else if (id === 'details') setStyle('details', buildDetailsCss())
          else if (id === 'sidebar') { setStyle('sidebar', buildSidebarCss()); setStyle('lift', buildLiftCss()) }
          else if (id === 'brand') setStyle('brand', buildBrandCss())
          else if (id === 'hero') setStyle('hero', buildHeroCss())
          else if (id === 'borders') setStyle('borders', buildBordersCss())
          else if (id === 'ns') setStyle('ns', buildNewSessionCss())
          else if (id === 'cordis') setStyle('cordis', buildCordisCss())
          else if (id === 'float') setStyle('float', buildFloatCss())
          else if (id === 'convStyle') { setStyle('conv', buildConvCss()); repaintScrollbars() }
          else if (id === 'conv') { setStyle('conv', buildConvCss()); refreshConvTokens(); repaintScrollbars() }
        } catch (e) { /* 忽略 */ }
      }

      function AreaCss() {
        const { areas, sidebarInfo, floatVisible, newSession, composerFixedHeight, composerRows, convBgs } = useStore()
        // 侧边栏就绪门控（2026-08-23 修复偶发 bug）：首次挂载时侧边栏可能尚未渲染（插件 CSS 注入先于侧边栏 DOM），
        // detectSidebar 返回 null → sidebarInfo 保持 null → 主界面「不包含侧边栏」偏移量 sbW=0（背景铺到侧边栏区域）
        // + 新会话选区比例 fallback 错（用户反馈两个偶发 bug：刷新后正常 = 第二次加载 DOM 已就绪）。
        // 修复：sidebarReady ref 标记检测成功；成功前，MutationObserver 的 childList 变化也触发重试（零定时器）。
        // setSidebarInfo 值比较保证检测成功后的冗余 refresh 零渲染（v1.0.0 优化保留）
        const sidebarReady = React.useRef(false)
        React.useEffect(() => {
          detectColors()
          const refresh = () => {
            const info = detectSidebar()
            if (info) { sidebarReady.current = true; setSidebarInfo(info) }
          }
          if (!sidebarInfo && !sidebarReady.current) refresh()
          // 网页变化（窗口缩放/布局变动）时重新检测侧边栏比例，保证选区比例始终跟手
          window.addEventListener('resize', refresh)
          // v1.0.4 折叠态监听：官方折叠/展开会增删 hHd-Xa_collapsed class（F12 实测稳定后缀）。
          // MutationObserver 监听 body 子树 class 变化 → 折叠切换时重新检测（collapsed + 宽度），
          // setSidebarInfo 值比较保证零冗余重渲染。零定时器（事件驱动）
          let collapseObserver = null
          try {
            let lastCollapsed = !!(document.querySelector('[class*="_collapsed"]'))
            collapseObserver = new MutationObserver(() => {
              const nowCollapsed = !!(document.querySelector('[class*="_collapsed"]'))
              if (nowCollapsed !== lastCollapsed) {
                lastCollapsed = nowCollapsed
                refresh()
              } else if (!sidebarReady.current) {
                // 侧边栏尚未检测到：DOM 增删（childList）可能正是侧边栏渲染完成 → 重试（检测成功后不再走这里）
                refresh()
              }
            })
            collapseObserver.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true })
          } catch (e) { /* 忽略（observer 不可用时只在 resize 时重检） */ }
          return () => {
            window.removeEventListener('resize', refresh)
            if (collapseObserver) { try { collapseObserver.disconnect() } catch (e) { /* 忽略 */ } }
          }
        }, [])

        // 输入区固定高度：卡片实测宽高比缓存。
        // useLayoutEffect 在 DOM 提交后、浏览器绘制前同步执行，读 clientWidth/Height 强制 reflow → 拿到新 CSS 生效后的最新布局值
        // （getCropRatio 若在渲染期读 DOM，改行数那次渲染时新 CSS 尚未应用，会读到旧高度 → 选区不跟手）。
        // 固定高度关闭 / 卡片缺失时置 null（getCropRatio 回退视口比例）
        React.useLayoutEffect(() => {
          if (!composerFixedHeight) { setComposerCardRatio(null); return }
          const el = document.querySelector('[data-composer-card]')
          if (el && el.clientWidth > 0 && el.clientHeight > 0) {
            setComposerCardRatio(el.clientWidth / el.clientHeight)
          } else {
            setComposerCardRatio(null)
          }
        }, [composerFixedHeight, composerRows])

        // Cordis 面板实测宽高比缓存（v0.9.15）：面板高度内容驱动（max-height 60vh，宽固定 420），固定公式不准。
        // useLayoutEffect 在面板打开时测量；MutationObserver 监听面板开合（DOM 挂载/卸载）→ 开时重测、关时置 null；
        // resize 重测（面板随视口缩放）。零定时器（observer 是事件驱动，非轮询）
        React.useLayoutEffect(() => {
          const measure = () => {
            const el = document.querySelector('[class*="Nqubda_panel"]')
            if (el && el.clientWidth > 0 && el.clientHeight > 0) {
              setCordisCardRatio(el.clientWidth / el.clientHeight)
            } else {
              setCordisCardRatio(null)
            }
          }
          measure()
          let observer = null
          try {
            observer = new MutationObserver(() => { measure() })
            observer.observe(document.body, { childList: true, subtree: true })
          } catch (e) { /* 忽略（observer 不可用时不监听，只在挂载时测一次） */ }
          window.addEventListener('resize', measure)
          return () => {
            if (observer) { try { observer.disconnect() } catch (e) { /* 忽略 */ } }
            window.removeEventListener('resize', measure)
          }
        }, [])

        // 输入框聚焦增强：官方 textarea 只覆盖文字实际高度，点文字下方的空白不聚焦。
        React.useEffect(() => {
          const onDocClick = (e) => {
            const scroll = document.querySelector('[data-input-scroll]')
            if (!scroll || !scroll.contains(e.target)) return
            const grow = scroll.firstElementChild
            const ta = scroll.querySelector('textarea')
            if (!grow || !ta) return
            const gb = grow.getBoundingClientRect()
            if (e.clientY >= gb.top && e.clientY <= gb.bottom) return
            const len = ta.value.length
            ta.focus()
            try { ta.setSelectionRange(len, len) } catch (err) { /* 忽略 */ }
          }
          document.addEventListener('click', onDocClick, true)
          return () => document.removeEventListener('click', onDocClick, true)
        }, [])

        // 任务栏全面板点击（2026-08-22 定稿）：列表收起用官方行为（瞬间移除，不做列表动画）；
        // 点击 header 以外区域时模拟 header 点击（官方切换展开/收起）；document 委托，无需等待 panel 渲染
        React.useEffect(() => {
          const onClick = (e) => {
            const panel = document.querySelector('[data-testid="todo-panel"]')
            if (!panel || !panel.contains(e.target)) return
            const header = panel.querySelector('[class*="_header"]')
            if (header && header.contains(e.target)) return // header 自身处理
            if (header) { try { header.click() } catch (err) { /* 忽略 */ } }
          }
          document.addEventListener('click', onClick, true)
          return () => document.removeEventListener('click', onClick, true)
        }, [])

        // 设置界面面板拖动（v0.9.19）：document 委托（面板每次打开重新挂载，委托无需绑定/解绑）。
        // 拖动区 = 面板 header（[class*="_header"]，54px 标题栏，排除关闭按钮）；拖动中内联 style 直更（零 React），
        // pointerup 写回 detailsPos（持久化）→ CSS 重建固定位置。未拖动过（detailsPos null）→ 官方居中不动。
        // detailsDragEnabled=false（布局调整开关）时直接忽略拖动。
        React.useEffect(() => {
          const onHeaderDown = (e) => {
            if (e.button !== 0) return
            if (!detailsDragEnabled) return
            const header = e.target.closest && e.target.closest('[class*="VOzbGW_panel"] [class*="_header"]')
            if (!header) return
            if (e.target.closest && e.target.closest('[class*="_close"]')) return // 关闭按钮不触发拖动
            e.preventDefault()
            const panel = header.closest('[class*="VOzbGW_panel"]')
            if (!panel) return
            const rect = panel.getBoundingClientRect()
            panel.style.position = 'fixed'
            panel.style.margin = '0'
            // ⚠️ !important：detailsPos 写入后 buildDetailsCss 输出 left/top !important——内联必须同优先级，
            //   否则第二次拖动被 CSS 规则压住（"拖一下拖不了了"）。用 setProperty 带 important
            panel.style.setProperty('left', rect.left + 'px', 'important')
            panel.style.setProperty('top', rect.top + 'px', 'important')
            const sx = e.clientX, sy = e.clientY
            const ox = rect.left, oy = rect.top
            const onMove = (ev) => {
              panel.style.setProperty('left', (ox + ev.clientX - sx) + 'px', 'important')
              panel.style.setProperty('top', (oy + ev.clientY - sy) + 'px', 'important')
            }
            const onUp = () => {
              window.removeEventListener('pointermove', onMove)
              window.removeEventListener('pointerup', onUp)
              const r = panel.getBoundingClientRect()
              setDetailsPos({ x: Math.round(r.left), y: Math.round(r.top) })
            }
            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp)
          }
          document.addEventListener('pointerdown', onHeaderDown, true)
          return () => document.removeEventListener('pointerdown', onHeaderDown, true)
        }, [detailsDragEnabled])

        // 侧边栏复位按钮（v0.9.19）：开启「设置界面移动」（detailsDragEnabled）时，官方设置按钮
        // （[class*="VOzbGW_trigger"]）**右半注入复位按钮**（一分为二：左=设置，右=复位）——用户要求。
        // 原生 DOM 注入（不注册 sidebar 槽位：sidebar.settings 是官方容器槽位，直接注册会覆盖 trigger）。
        // MutationObserver 监听 trigger 挂载（侧边栏设置区渲染后注入）；detailsDragEnabled 关闭时清理。
        React.useEffect(() => {
          const cleanup = () => document.querySelectorAll('[data-thmcz-details-reset]').forEach((el) => { try { el.remove() } catch (e) { /* 忽略 */ } })
          if (!detailsDragEnabled) { cleanup(); return undefined }
          // v1.0.4：侧边栏折叠态不注入复位按钮（收起后 trigger 变窄，两文字挤在一起——用户要求收起后不显示）
          const isCollapsed = () => !!document.querySelector('[class*="_collapsed"]')
          let btn = null
          const ensure = () => {
            if (isCollapsed()) { if (btn) { try { btn.remove() } catch (e) { /* 忽略 */ } btn = null } return }
            if (btn) return
            const t = document.querySelector('[class*="VOzbGW_trigger"]')
            if (!t) return
            if (t.style.position !== 'fixed') t.style.position = 'relative'
            btn = document.createElement('button')
            btn.setAttribute('data-thmcz-details-reset', 'true')
            btn.textContent = '设置复位'
            btn.title = '恢复设置面板到居中位置'
            btn.style.cssText = 'position:absolute;top:0;right:0;bottom:0;width:50%;border:none;border-left:1px solid var(--dsw-alias-border-l1);background:rgba(57,100,254,0.12);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:0 12px 12px 0;display:flex;align-items:center;justify-content:center;font-size:11px;z-index:1;padding:0'
            btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); setDetailsPos(null) })
            t.appendChild(btn)
          }
          ensure()
          let obs = null
          try {
            obs = new MutationObserver(() => { ensure() })
            obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
          } catch (e) { /* 忽略 */ }
          window.addEventListener('resize', ensure)
          return () => {
            if (obs) { try { obs.disconnect() } catch (e) { /* 忽略 */ } }
            window.removeEventListener('resize', ensure)
            cleanup()
          }
        }, [detailsDragEnabled])

        // 合并的 token 覆盖（背景 + 文字颜色）——单一 source 单层覆盖，避免多层交互导致互斥
        // 依赖精细化：透明度/颜色值变化不重跑 overrideTokens，只在 模式/包含侧边栏/图片对象/文字颜色 变化时重跑
        // ⚠️ v0.9.15 修复：token 构建抽成 buildThemeTokens()（模块级纯函数），refreshConvTokens（拖动抑制期直更）与
        //   本 useEffect 共用同一完整集合——否则 overrideTokens 会替换整个 namespace，把主界面 bg-base/sidebar-fill
        //   顶掉（"调 V 按钮时主界面背景失效，调好又恢复"用户反馈）
        React.useEffect(() => {
          const theme = ctx.get('theme')
          if (!theme || typeof theme.overrideTokens !== 'function') return undefined
          const tokens = buildThemeTokens()
          let disposer
          // v1.0.4：tokens 为空也调用（空对象整层替换 → 清除旧透明覆盖，恢复官方）——
          // 折叠态 none 需把展开态设置的 bg-base transparent 清掉；旧逻辑空对象直接跳过会残留
          try { disposer = theme.overrideTokens('theme-customizer', tokens) } catch (e) { /* 忽略 */ }
          return () => { if (typeof disposer === 'function') disposer() }
        }, [areas.app, areas.sidebar, sidebarInfo, colors, convBgs])

        // 各模块 CSS 用缓存（依赖只含本模块状态；拖动中 manualCssRefresh 已直更 style，这里保证 React 状态一致）
        // ⚠️ 防御：areas.float/details/cordis 可能 undefined（旧配置整体替换后缺键），依赖数组用兜底访问（v0.9.13 事故修复）
        const flDep = areas.float || {}
        const detDep = areas.details || {}
        const corDep = areas.cordis || {}
        // v1.0.4：imgVars 依赖必须含收起态图片（areas.sidebar.collapsed.image 引用）——只设「收起后」图片时
        // areas.sidebar.mode/image（展开态）不变，缺依赖 → useMemo 不重算 → --tcz-sidebar-img 变量不生成 → 图片不显示
        const scImg = areas.sidebar && areas.sidebar.collapsed && areas.sidebar.collapsed.image
        const imgVars = React.useMemo(() => buildImgVars(), [areas.sidebar.mode, areas.sidebar.image, scImg, areas.composer.mode, areas.composer.image, newSession.mode, newSession.image, detDep.mode, detDep.image, flDep.mode, flDep.image, corDep.mode, corDep.image, sidebarInfo])
        const appCss = React.useMemo(() => buildAppCss(), [areas.app, sidebarInfo, baseBg])
        const composerCss = React.useMemo(() => buildComposerCss(), [areas.composer, composerFixedHeight, composerRows, baseBg])
        const detailsCss = React.useMemo(() => buildDetailsCss(), [areas.details, baseBg, detailsPos])
        const sidebarCss = React.useMemo(() => buildSidebarCss(), [areas.sidebar, sidebarInfo])
        const brandCss = React.useMemo(() => buildBrandCss(), [brand, brandHarness])
        const heroCss = React.useMemo(() => buildHeroCss(), [hero])
        const bordersCss = React.useMemo(() => buildBordersCss(), [borders])
        const newSessionCss = React.useMemo(() => buildNewSessionCss(), [newSession])
        // v1.0.4：liftCss 依赖同加收起态图片（收起态图片时 logoRow 提升）
        const liftCss = React.useMemo(() => buildLiftCss(), [areas.sidebar.mode, areas.sidebar.image, scImg, sidebarInfo])
        const cordisCss = React.useMemo(() => buildCordisCss(), [areas.cordis, baseBg])
        const floatCss = React.useMemo(() => buildFloatCss(), [floatVisible, areas.float])
        const convCss = React.useMemo(() => buildConvCss(), [convBgs.scrollbar, convBgs.chatScroll, convBgs.todoCollapsed, convBgs.todoExpanded, convBgs.addBtn, convBgs.cmdMenu, convBgs.addBtnOpacity, convBgs.cmdMenuOpacity, convBgs.toBottom, convBgs.sliderColor, convBgs.sliderOpacity, convBgs.sliderTrackColor, convBgs.sliderTrackOpacity, convBgs.scrollColor, convBgs.scrollOpacity, convBgs.scrollbarOpacity, convBgs.chatScrollOpacity, convBgs.todoCollapsedOpacity, convBgs.todoExpandedOpacity, convBgs.toBottomOpacity, convBgs.bubbleOpacity, convBgs.inlineOpacity, convBgs.codeOpacity])

        // 各模块独立 <style> 标签：规则相对顺序与原单标签一致（img → app → composer → details → sidebar → ns → lift → cordis → float → conv）
        return React.createElement(React.Fragment, null,
          imgVars ? React.createElement('style', { 'data-thmcz-img': true }, imgVars) : null,
          React.createElement('style', { 'data-thmcz-app': true }, appCss),
          React.createElement('style', { 'data-thmcz-composer': true }, composerCss),
          React.createElement('style', { 'data-thmcz-details': true }, detailsCss),
          React.createElement('style', { 'data-thmcz-sidebar': true }, sidebarCss),
          React.createElement('style', { 'data-thmcz-brand': true }, brandCss),
          // ⚠️ hero 标签无条件渲染（2026-08-23 修复"第一次调色不实时"）：默认 heroCss 为空串，若条件渲染则
          //   <style data-thmcz-hero> 不存在 → 拖动抑制期 manualCssRefresh('hero') 找不到标签写不进去 → 松手 notify 后才生成标签 → 第二次才实时
          React.createElement('style', { 'data-thmcz-hero': true }, heroCss),
          bordersCss ? React.createElement('style', { 'data-thmcz-borders': true }, bordersCss) : null,
          React.createElement('style', { 'data-thmcz-ns': true }, newSessionCss),
          React.createElement('style', { 'data-thmcz-lift': true }, liftCss),
          React.createElement('style', { 'data-thmcz-cordis': true }, cordisCss),
          React.createElement('style', { 'data-thmcz-float': true }, floatCss),
          convCss ? React.createElement('style', { 'data-thmcz-conv': true }, convCss) : null,
        )
      }
