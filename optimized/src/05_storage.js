      // ┌─ 片段 05_storage ───────────────────────────────
      // │ 职责：localStorage 持久化（读/写/配额降级/关页前保存）+ 旧数据迁移（opacitySem/unified）
      // │ 定义：loadSettings / slimAreas / saveNow / flushPersist；执行：beforeunload 监听 + loadSettings()
      // │ 测试：刷新后配置保持；旧配置迁移；超大图降级保存（QuotaExceeded）
      // ── 持久化：localStorage（纯浏览器存储，刷新/重启页面不丢）──
      // ⚠️ 性能（2026-08-21 优化）：saveNow 内不再 notify —— 所有 setXxx 已是 notify + saveNow，
      //    原双重通知导致每次操作触发 2 次全量重渲染 + 2 次 CSS 重建。
      // ⚠️ 拖动型控件（透明度滑块/颜色选择器）拖动期间连续 onChange → 每帧 saveNow →
      //    全量 JSON.stringify（含图片 dataURI 几 MB）+ setItem 同步阻塞主线程 → 卡顿。
      //    抑制方案（零定时器）：拖动开始置时间戳窗口，期间 saveNow 跳过写入；
      //    pointerup/blur 提交保存一次；窗口 60s 超时自动恢复（pointerup 丢失兜底）；beforeunload 强制保存。
      const STORAGE_KEY = 'theme-customizer-config-v1'
      // ⚠️ 透明度语义（统一）：数值大 = 透明/虚（主界面与侧边栏一致，用户确认）。
      // opacitySem: 4 = 当前统一透明度语义；3 = 主界面不透明度/侧边栏透明度（旧）；2 = 全透明度（更旧）；无标记 = 更早全不透明度语义
      function loadSettings() {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY)
          if (!raw) return
          const c = JSON.parse(raw)
          if (!c || typeof c !== 'object') return
          if (c.areas && typeof c.areas === 'object') {
            const sem = c.opacitySem
            const next = {}
            for (const k of Object.keys(c.areas)) {
              const a = c.areas[k]
              if (!a || typeof a !== 'object' || typeof a.opacity !== 'number') { next[k] = a; continue }
              if (sem === 4) next[k] = a
              else if (sem === 3) {
                // 旧语义：主界面=不透明度（取反为透明度），侧边栏=透明度（保持）
                next[k] = k === 'app' ? { ...a, opacity: 1 - a.opacity } : a
              } else if (sem === 2) {
                // 全透明度：保持
                next[k] = a
              } else {
                // 更早全不透明度语义：全部取反
                next[k] = { ...a, opacity: 1 - a.opacity }
              }
            }
            areas = next
          }
          // 主界面底色（2026-08-21 新增）：默认开启白色底。旧配置无此功能 → 一次性迁移开启白底。
          // appBottomVersion 标记随 saveNow 持久化：迁移后下次保存带上标记，此后不再重复迁移（尊重用户之后的开关/颜色设置）
          if (c.appBottomVersion !== 1 && areas.app && typeof areas.app === 'object') {
            areas.app = { ...areas.app, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          }
          // 输入区底色（2026-08-21 新增，像主界面默认白底常驻）：复用同一 appBottomVersion 标记一次性迁移
          if (c.appBottomVersion !== 1 && areas.composer && typeof areas.composer === 'object') {
            areas.composer = { ...areas.composer, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          }
          // 设置界面底色（2026-08-22 新增，v0.9.12，像主界面默认白底常驻）：
          // ⚠️ 不能复用 appBottomVersion 标记（旧配置已是 1，details 迁移会被跳过）；
          // 改用独立条件：details 存在且从未设过底色（bottomColor == null）→ 补默认白底。
          // 无损：用户已设置的底色（字符串）不被覆盖；后续保存自动带上
          if (areas.details && typeof areas.details === 'object' && areas.details.bottomColor == null) {
            areas.details = { ...areas.details, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          }
          // 浮窗面板（2026-08-22 新增区域，v0.9.13，像主界面默认白底常驻）：
          // ⚠️ areas = next 整体替换旧配置 → 旧配置无 float 键 → areas.float 是 undefined，
          //     buildFloatCss/buildImgVars 读 areas.float.mode 会抛错（整站主题面板消失事故，v0.9.13 修复）。
          // 必须无条件补全整个默认区域对象（不是仅补底色字段）
          if (!areas.float || typeof areas.float !== 'object' || areas.float.mode === undefined) {
            areas.float = { mode: 'none', color: '#ffffff', opacity: 0, image: null, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          } else if (areas.float.bottomColor == null) {
            areas.float = { ...areas.float, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          }
          // Cordis 插件界面（2026-08-22 新增区域，v0.9.14，像主界面默认白底常驻）：同 float 无条件补全（防缺键崩溃）
          if (!areas.cordis || typeof areas.cordis !== 'object' || areas.cordis.mode === undefined) {
            areas.cordis = { mode: 'none', color: '#ffffff', opacity: 0, image: null, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          } else if (areas.cordis.bottomColor == null) {
            areas.cordis = { ...areas.cordis, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 }
          }
          // v1.0.4 侧边栏收起态：app.collapsedSidebar / sidebar.collapsed 嵌套配置（默认 mode:'none' 官方原样）。
          // 旧配置无此键 → 无条件补 emptyArea（防 buildSidebarCss/buildAppCss 读 undefined.mode 崩溃）
          if (areas.app && typeof areas.app === 'object' && (areas.app.collapsedSidebar === undefined || areas.app.collapsedSidebar.mode === undefined)) {
            areas.app = { ...areas.app, collapsedSidebar: emptyArea() }
          }
          if (areas.sidebar && typeof areas.sidebar === 'object' && (areas.sidebar.collapsed === undefined || areas.sidebar.collapsed.mode === undefined)) {
            areas.sidebar = { ...areas.sidebar, collapsed: emptyArea() }
          }
          if (c.colors && typeof c.colors === 'object') colors = { main: null, process: null, aux: null, faded: null, accent: null, ...c.colors }
          if (c.newSession && typeof c.newSession === 'object') {
            // 兼容旧数据：无 bottomEnabled 字段时，旧 bottomColor 有值 = 底色已开启；
            // "无"选项已恢复（mode='none' 合法）；旧 unified=true（跟随侧边栏）→ 迁移为样式"无"（等效透明透出）；
            // 旧 unified=false（独立设置）→ 保留原 mode；
            // v0.9.20：无 bottomEnabled 的旧数据 → 默认开启白底（新默认；有显式值则尊重）
            const nsOld = c.newSession
            const nsMode = nsOld.unified === true ? 'none' : (nsOld.mode === 'transparent' ? 'none' : nsOld.mode)
            newSession = { ...newSession, ...nsOld, mode: nsMode, bottomEnabled: typeof nsOld.bottomEnabled === 'boolean' ? nsOld.bottomEnabled : true }
          }
          // 框线（v0.9.18）：旧数据无 borders 字段 → 保持默认（全 null/0）；字段非法时回默认
          if (c.borders && typeof c.borders === 'object') {
            const nb = {}
            for (const key of BORDER_KEYS) {
              const b = c.borders[key]
              nb[key] = {
                color: b && typeof b === 'object' && typeof b.color === 'string' && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : null,
                opacity: b && typeof b === 'object' && typeof b.opacity === 'number' && b.opacity >= 0 && b.opacity <= 1 ? b.opacity : 0,
              }
            }
            borders = nb
          }
          if (typeof c.cordisEntry === 'boolean') cordisEntry = c.cordisEntry
          // DeepSeek Harness 标志（v0.9.17）：旧数据无 brand 字段 → 保持默认（品牌蓝 + 不透明）；字段非法时回默认
          if (c.brand && typeof c.brand === 'object') {
            brand = {
              color: typeof c.brand.color === 'string' && /^#[0-9a-f]{6}$/i.test(c.brand.color) ? c.brand.color : '#3964fe',
              opacity: typeof c.brand.opacity === 'number' && c.brand.opacity >= 0 && c.brand.opacity <= 1 ? c.brand.opacity : 0,
            }
          }
          // 标志 "Harness" 单独颜色（v0.9.20）：color null=跟随标志整体；缺失/非法保持默认
          if (c.brandHarness && typeof c.brandHarness === 'object') {
            brandHarness = {
              color: typeof c.brandHarness.color === 'string' && /^#[0-9a-f]{6}$/i.test(c.brandHarness.color) ? c.brandHarness.color : null,
              opacity: typeof c.brandHarness.opacity === 'number' && c.brandHarness.opacity >= 0 && c.brandHarness.opacity <= 1 ? c.brandHarness.opacity : 0,
            }
          }
          // 浮窗显示内容：旧配置缺新模块键（borders 等）→ 合并默认补全（v0.9.20：默认全开）
          if (c.floatModules && typeof c.floatModules === 'object') floatModules = { ...floatModules, ...c.floatModules }
          if (typeof c.floatShowReset === 'boolean') floatShowReset = c.floatShowReset
          if (c.floatPos && typeof c.floatPos === 'object') floatPos = c.floatPos
          if (typeof c.floatVisible === 'boolean') floatVisible = c.floatVisible
          if (typeof c.showOpacityHint === 'boolean') showOpacityHint = c.showOpacityHint
          // 设置界面拖动位置（v0.9.19）：合法 {x,y} 才恢复；缺失/非法 = null（居中）
          if (c.detailsPos && typeof c.detailsPos === 'object' && typeof c.detailsPos.x === 'number' && typeof c.detailsPos.y === 'number') detailsPos = c.detailsPos
          if (typeof c.detailsDragEnabled === 'boolean') detailsDragEnabled = c.detailsDragEnabled
          if (typeof c.composerStatsExpanded === 'boolean') composerStatsExpanded = c.composerStatsExpanded
          if (typeof c.composerFixedHeight === 'boolean') composerFixedHeight = c.composerFixedHeight
          if (typeof c.composerRows === 'number') composerRows = c.composerRows
          if (c.composerStatsItems && typeof c.composerStatsItems === 'object') composerStatsItems = { ...composerStatsItems, ...c.composerStatsItems }
          // 对话区背景（2026-08-21 新增）：null=官方默认；旧数据无此字段 → 保持默认；旧 terminal/assistant 字段已改版（忽略）
          // v0.9.14：命令两按钮透明度字段（addBtnOpacity/cmdMenuOpacity）默认 0；v0.9.15：toBottom/sliderColor/sliderTrackColor/scrollColor 及透明度
          // v1.0.3：对话区 8 项透明度键（bubbleOpacity 等）默认 0
          if (c.convBgs && typeof c.convBgs === 'object') convBgs = { bubble: null, inline: null, code: null, scrollbar: null, chatScroll: null, todoCollapsed: null, todoExpanded: null, addBtn: null, cmdMenu: null, addBtnOpacity: 0, cmdMenuOpacity: 0, toBottom: null, sliderColor: null, sliderOpacity: 0, sliderTrackColor: null, sliderTrackOpacity: 0, scrollColor: null, scrollOpacity: 0, bubbleOpacity: 0, inlineOpacity: 0, codeOpacity: 0, scrollbarOpacity: 0, chatScrollOpacity: 0, todoCollapsedOpacity: 0, todoExpandedOpacity: 0, toBottomOpacity: 0, ...c.convBgs }
          // 兼容旧数据：缺新字段时立即写回一次（补全 cordisEntry 等）；saveNow 不再 notify，这里补一次
          if (typeof c.cordisEntry !== 'boolean' || c.opacitySem !== 4) { saveNow(); notify() }
        } catch (e) { /* 忽略 */ }
      }
      function slimAreas() {
        // 图片过大超出 localStorage 限额时：保留配置、丢弃图片
        const out = {}
        for (const k of Object.keys(areas)) {
          const a = areas[k]
          out[k] = a.mode === 'image' ? { ...a, image: null } : a
        }
        return out
      }
      let lastSavedAt = 0 // 最近保存时间（诊断用）
      let saveSuppressUntil = 0 // 保存抑制窗口（时间戳毫秒）：拖动型控件拖动期间不写 localStorage
      let saveSuppressOwner = 0 // 抑制窗口归属（拖动控件 id）：blur/pointerup 只提交自己开的窗口
      // ⚠️ v0.9.14 修复：窗口必须带 owner——否则"拖完 A 直接拖 B"时 A 的 onBlur（焦点转移）会把 B 刚开的
      //   窗口误关 → B 拖动走 notify 全量渲染 → 卡顿 + 受控值抖动（"有些透明度滑条不能及时变化"用户反馈）
      function suppressSave(owner) { saveSuppressUntil = Date.now() + 60000; saveSuppressOwner = owner }
      // 拖动结束提交保存一次（抑制已解除或非本控件窗口时跳过，避免 pointerup+blur 双触发重复写/误关他人窗口）
      // 拖动期间走 manualCssRefresh（无 notify）→ 这里补 notify 同步 React 状态（滑块值/文本/组件渲染）
      function commitSave(owner) {
        if (saveSuppressOwner !== owner) return
        if (saveSuppressUntil > Date.now()) { saveSuppressUntil = 0; saveSuppressOwner = 0; saveNow(); notify() }
      }
      function saveNow() {
        // 抑制窗口内跳过写入（不更新 lastSavedAt——"最近保存"仍显示上次真实保存时间）
        if (Date.now() < saveSuppressUntil) return
        try {
          const data = JSON.stringify({ v: 1, opacitySem: 4, appBottomVersion: 1, areas, colors, cordisEntry, floatModules, floatShowReset, floatPos, floatVisible, newSession, brand, brandHarness, borders, detailsPos, detailsDragEnabled, showOpacityHint, composerStatsExpanded, composerFixedHeight, composerRows, composerStatsItems, convBgs })
          window.localStorage.setItem(STORAGE_KEY, data)
          lastSavedAt = Date.now()
        } catch (e) {
          // QuotaExceededError：图片太大，降级只存配置
          try {
            const slim = JSON.stringify({ v: 1, opacitySem: 4, appBottomVersion: 1, areas: slimAreas(), colors, cordisEntry, floatModules, floatShowReset, floatPos, floatVisible, newSession: newSession.mode === 'image' ? { ...newSession, image: null } : newSession, brand, brandHarness, borders, detailsPos, detailsDragEnabled, showOpacityHint, composerStatsExpanded, composerFixedHeight, composerRows, composerStatsItems, convBgs })
            window.localStorage.setItem(STORAGE_KEY, slim)
            lastSavedAt = Date.now()
          } catch (e2) { /* 忽略 */ }
        }
      }
      // ⚠️ 动态环境定时器不可用：setTimeout 被宿主拦截直接抛错（"setTimeout is not available in a
      // dynamic client half"）。持久化策略 = 全部同步保存；浮窗拖动在 pointerup 结束时保存一次。
      // 关页前强制保存（绕过抑制窗口：拖动中直接关页也不丢最后值）
      function flushPersist() {
        saveSuppressUntil = 0
        saveNow()
      }
      try { window.addEventListener('beforeunload', flushPersist) } catch (e) { /* 忽略 */ }
      try { loadSettings() } catch (e) { /* 忽略 */ }
