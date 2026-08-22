      // ┌─ 片段 04_store ─────────────────────────────────
      // │ 职责：状态订阅与修改（分通道 notify + setXxx 动作 + useStore）
      // │ 性能（2026-08-21 优化）：通知分 4 通道（main/stats/float/preset），组件只订阅自己关心的通道 →
      // │   颜色/透明度拖动（main）不重渲染预设面板（preset）/统计条（stats）/浮窗外壳（float），拖动更顺滑。
      // │   注意：拖动类高频动作只 notify 不 saveNow（pointerup 时保存，零定时器约定）
      const listeners = { main: new Set(), stats: new Set(), float: new Set(), preset: new Set() }
      function emit(ch) { const s = listeners[ch]; if (s) for (const fn of s) fn() }
      // main = CSS + 通用 UI（areas/newSession/colors/sidebarInfo/showOpacityHint/composerFixedHeight|Rows/cordisEntry/floatVisible）
      function notify() { emit('main') }
      // stats = 输入区统计条开关（composerStatsExpanded / composerStatsItems）
      function statsNotify() { emit('stats') }
      // float = 浮窗（floatVisible/floatModules/floatPos/areas.float）
      function floatNotify() { emit('float') }
      // preset = 预设列表数据变化（loadPresets 异步完成 / 拖拽排序）
      function presetNotify() { emit('preset') }
      // 低频操作：同步立即保存；浮窗拖动高频只更新内存（pointerup 时保存一次）
      // ⚠️ 性能（2026-08-21）：CSS 相关 setter（areas/newSession/composer 高度）在拖动抑制期
      //   （saveSuppress 窗口，见 05_storage）走 manualCssRefresh 直更 style 标签 → 拖动中零 React 渲染（只更新 CSS 字符串）；
      //   松开（commitSave）后 notify 同步 React 状态。非抑制期保持 notify + saveNow（离散操作/低频不变）
      function setFloatVisible(v) { floatVisible = v; notify(); floatNotify(); saveNow() }
      function setCordisEntry(v) { cordisEntry = v; applyCordisEntryFlag(); notify(); saveNow() }
      function setFloatPos(next) { floatPos = next; floatNotify() }
      function resetFloatPos() { floatPos = { x: 80, y: 80, width: 560, height: 640 }; floatNotify(); saveNow() }
      function setFloatModules(next) { floatModules = next; floatNotify(); saveNow() }
      function setFloatShowReset(v) { floatShowReset = v; floatNotify(); saveNow() }
      function setArea(id, next) {
        areas[id] = next
        if (Date.now() < saveSuppressUntil) manualCssRefresh(id)
        else { notify(); saveNow() }
      }
      function setNewSession(next) {
        newSession = next
        if (Date.now() < saveSuppressUntil) manualCssRefresh('ns')
        else { notify(); saveNow() }
      }
      // DeepSeek Harness 标志（v0.9.17）：颜色/透明度拖动走抑制路径（直更 brand style 标签，零 React 渲染）
      function setBrand(next) {
        brand = { ...brand, ...next }
        if (Date.now() < saveSuppressUntil) manualCssRefresh('brand')
        else { notify(); saveNow() }
      }
      // 标志 "Harness" 部分单独颜色（v0.9.20）：同 setBrand（走 brand style 标签）
      function setBrandHarness(next) {
        brandHarness = { ...brandHarness, ...next }
        if (Date.now() < saveSuppressUntil) manualCssRefresh('brand')
        else { notify(); saveNow() }
      }
      // 框线（v0.9.18）：颜色/透明度拖动走抑制路径（直更 borders style 标签，零 React 渲染）
      function setBorder(area, next) {
        borders = { ...borders, [area]: { ...(borders[area] || {}), ...next } }
        if (Date.now() < saveSuppressUntil) manualCssRefresh('borders')
        else { notify(); saveNow() }
      }
      // 全部恢复官方默认（框线 5 区域全 null/0，仿 resetAllConvBgs）
      function resetAllBorders() {
        const nb = {}
        for (const key of BORDER_KEYS) nb[key] = { color: null, opacity: 0 }
        borders = nb
        notify(); saveNow()
      }
      // 设置界面面板拖动位置（v0.9.19）：null=官方居中；{x,y}=固定位置。pointerup 才调用（非高频）→ notify + saveNow
      function setDetailsPos(v) { detailsPos = v; notify(); saveNow() }
      // 设置界面可移动开关（v0.9.19）
      function setDetailsDragEnabled(v) { detailsDragEnabled = v; notify(); saveNow() }
      // ⚠️ 值未变跳过（2026-08-22 梳理修复）：resize/observer 每触发都调用，值没变也 notify 会全量重渲染
      //   （Cordis 面板 MutationObserver 监听整个 body 节点增删 → 对话流每挂载一条消息都触发一次）
      function setSidebarInfo(next) {
        if (sidebarInfo && next && sidebarInfo.selector === next.selector && sidebarInfo.ratio === next.ratio && sidebarInfo.width === next.width && sidebarInfo.height === next.height) return
        sidebarInfo = next
        notify()
      }
      function setColor(key, v) { colors = { ...colors, [key]: v }; notify(); saveNow() }
      function resetColor(key) { colors = { ...colors, [key]: null }; notify(); saveNow() }
      function resetAllColors() { colors = { main: null, process: null, aux: null, faded: null, accent: null }; notify(); saveNow() }
      function setOfficialColors(next) { officialColors = next; notify() }
      function setShowOpacityHint(v) { showOpacityHint = v; notify(); saveNow() }
      function setComposerStatsExpanded(v) { composerStatsExpanded = v; statsNotify(); saveNow() }
      function setComposerFixedHeight(v) {
        composerFixedHeight = v
        if (Date.now() < saveSuppressUntil) manualCssRefresh('composer')
        else { notify(); saveNow() }
      }
      function setComposerRows(v) {
        composerRows = v
        if (Date.now() < saveSuppressUntil) manualCssRefresh('composer')
        else { notify(); saveNow() }
      }
      function setComposerStatsItems(next) { composerStatsItems = next; statsNotify(); saveNow() }
      // 对话区背景：bubble/inline/code/scrollbar/chatScroll/todoCollapsed/todoExpanded/addBtn/cmdMenu（null=官方）
      // ⚠️ 性能（2026-08-22 v0.9.14 修复）：拖动抑制期（saveSuppress 窗口，见 05_storage）走 manualCssRefresh
      //   直更 style 标签（零 React 渲染）——此前每帧 notify 全量重渲染，同一滑条连续拖动越拖越卡。
      // ⚠️ v0.9.15 优化：bubble/inline/code（token 键）走 'conv'（style+token）；其余键（滚动条/滑条/命令/V等）
      //   只走 'convStyle'（纯 style 标签，不刷 token）——此前拖动滚动条/滑条颜色每帧跑 buildThemeTokens+overrideTokens → 卡顿
      const CONV_TOKEN_KEYS = { bubble: true, inline: true, code: true }
      function setConvBg(key, v) {
        convBgs = { ...convBgs, [key]: v }
        if (Date.now() < saveSuppressUntil) manualCssRefresh(CONV_TOKEN_KEYS[key] ? 'conv' : 'convStyle')
        else { notify(); saveNow() }
      }
      // 全部恢复官方默认（对话区 8 项全 null，仿字体颜色 resetAllColors；v0.9.15 含 V 按钮）
      function resetAllConvBgs() {
        convBgs = { bubble: null, inline: null, code: null, scrollbar: null, chatScroll: null, todoCollapsed: null, todoExpanded: null, toBottom: null }
        notify(); saveNow()
      }
      // 命令子板块全部恢复官方默认（仅 addBtn/cmdMenu + 透明度两项，输入区卡片内；v0.9.14 含透明度归零）
      function resetCmdBgs() {
        convBgs = { ...convBgs, addBtn: null, cmdMenu: null, addBtnOpacity: 0, cmdMenuOpacity: 0 }
        notify(); saveNow()
      }
      // 全局恢复默认（v0.9.16）：按钮在主题设置预设板块下方 + 浮窗内（TripleConfirmButton 三级确认），恢复所有用户配置到初始默认。
      // 范围：areas（全部区域）/colors（文字颜色）/newSession/convBgs（对话区+命令+滑条+滚动条）/
      //       floatVisible/floatPos/floatModules/cordisEntry/showOpacityHint/composerStats*；
      // 不动：sidebarInfo/baseBg/officialColors（检测缓存非用户配置）、composerCardRatio/cordisCardRatio（实测缓存）
      function resetAllSettings() {
        floatVisible = false
        floatPos = { x: 80, y: 80, width: 560, height: 640 }
        floatModules = { background: true, borders: true, colors: true, layout: true, presets: true }
        floatShowReset = true
        cordisEntry = true
        applyCordisEntryFlag()
        areas = {
          app: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
          sidebar: { ...emptyArea(), opacity: 0 },
          composer: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
          details: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
          float: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
          cordis: { ...emptyArea(), opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0 },
          conversation: emptyArea(),
        }
        newSession = { showText: true, showIcon: true, mode: 'none', color: '#ffffff', opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0, image: null, iconColor: null, textColor: null }
        brand = { color: '#3964fe', opacity: 0 }
        brandHarness = { color: null, opacity: 0 }
        borders = { main: { color: null, opacity: 0 }, cordis: { color: null, opacity: 0 }, composer: { color: null, opacity: 0 }, details: { color: null, opacity: 0 }, float: { color: null, opacity: 0 }, newSession: { color: null, opacity: 0 } }
        colors = { main: null, process: null, aux: null, faded: null, accent: null }
        convBgs = { bubble: null, inline: null, code: null, scrollbar: null, chatScroll: null, todoCollapsed: null, todoExpanded: null, addBtn: null, cmdMenu: null, addBtnOpacity: 0, cmdMenuOpacity: 0, toBottom: null, sliderColor: null, sliderOpacity: 0, sliderTrackColor: null, sliderTrackOpacity: 0, scrollColor: null, scrollOpacity: 0 }
        showOpacityHint = true
        composerStatsExpanded = false
        detailsPos = null
        detailsDragEnabled = true
        composerFixedHeight = false
        composerRows = 4
        composerStatsItems = { turns: true, steps: true, llm: true, tool: true, ttft: true, tps: true, cache: true, input: true, output: true }
        // ⚠️ v1.0.2 加固：清空 sidebarInfo 缓存并重新检测（2026-08-22 用户反馈——全局重置后第一次切
        //   「不包含侧边栏」用了旧检测宽度 → 背景偏移错误盖进侧边栏右 4/5，刷新后才正常）。
        //   检测走 detectSidebar（同步 DOM 查询，微秒级）；结果与旧值相同则 setSidebarInfo 值比较直接跳过，零重渲染。
        //   注意：本函数拼接顺序在 03_detect 之后（函数提升），detectSidebar 可用。
        sidebarInfo = null
        const info = detectSidebar()
        if (info) setSidebarInfo(info)
        notify(); statsNotify(); floatNotify(); saveNow()
      }
      // 输入区卡片实测宽高比（非用户配置，不持久化）：AreaCss 布局后测量，供 getCropRatio 使用。
      // ⚠️ 值未变跳过（2026-08-22 梳理修复，同 setSidebarInfo）：useLayoutEffect 每次依赖变化都调用，同值 notify 无谓重渲染
      function setComposerCardRatio(v) {
        if (composerCardRatio === v) return
        composerCardRatio = v
        notify()
      }
      // Cordis 面板实测宽高比（v0.9.15，非用户配置，不持久化）：AreaCss useLayoutEffect+observer 面板开合时测量，供 getCropRatio 使用。
      // ⚠️ 2026-08-22 事故：v0.9.15 初版漏定义本函数 → AreaCss 调用抛 ReferenceError → 整个主题 UI 崩溃（主界面图消失/层次混乱）
      // ⚠️ 值未变跳过（2026-08-22 梳理修复）：observer 监听 body 全量子树增删，对话流消息挂载高频触发；面板尺寸未变时不再 notify
      function setCordisCardRatio(v) {
        if (cordisCardRatio === v) return
        cordisCardRatio = v
        notify()
      }
      // 订阅指定通道（默认 main）：channels 数组；组件只在自己关注的通道变化时重渲染
      function useStore(channels) {
        const [, force] = React.useState(0)
        React.useEffect(() => {
          const fn = () => force((n) => n + 1)
          const chs = Array.isArray(channels) && channels.length ? channels : ['main']
          for (const c of chs) { const s = listeners[c]; if (s) s.add(fn) }
          return () => { for (const c of chs) { const s = listeners[c]; if (s) s.delete(fn) } }
        }, [])
        return { floatVisible, floatPos, cordisEntry, floatModules, floatShowReset, areas, sidebarInfo, colors, officialColors, lastSavedAt, newSession, brand, brandHarness, borders, detailsPos, detailsDragEnabled, showOpacityHint, composerStatsExpanded, composerFixedHeight, composerRows, composerStatsItems, composerCardRatio, cordisCardRatio, convBgs }
      }
