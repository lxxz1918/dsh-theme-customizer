      // ┌─ 片段 06_presets ───────────────────────────────
      // │ 职责：预设库（IndexedDB CRUD + 旧 localStorage 迁移 + applyPresetData）
      // │ 定义：openPresetDb / idbPutAll / idbGetAll / idbDelete / loadPresets / savePresets / applyPresetData
      // │ 测试：预设保存/应用/删除；旧 presets-v1 迁移；应用预设必须覆盖全部颜色 key（null=恢复官方）
      // ── 预设库：IndexedDB 存储（容量远超 localStorage，多图预设也能存）；旧 localStorage 数据自动迁移 ──
      const PRESET_LIMIT = 10
      let presets = []
      let presetDb = null
      function openPresetDb() {
        if (presetDb) return Promise.resolve(presetDb)
        return new Promise((resolve, reject) => {
          try {
            const req = window.indexedDB.open('theme-customizer-presets', 1)
            req.onupgradeneeded = () => {
              const db = req.result
              if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' })
            }
            req.onsuccess = () => { presetDb = req.result; resolve(presetDb) }
            req.onerror = () => reject(req.error || new Error('IndexedDB 打开失败'))
          } catch (e) { reject(e) }
        })
      }
      function idbPutAll(items) {
        return openPresetDb().then((db) => new Promise((resolve, reject) => {
          try {
            const tx = db.transaction('presets', 'readwrite')
            const store = tx.objectStore('presets')
            for (const it of items) store.put(it)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => reject(tx.error || new Error('写入失败'))
            tx.onabort = () => reject(tx.error || new Error('写入中止'))
          } catch (e) { reject(e) }
        }))
      }
      function idbGetAll() {
        return openPresetDb().then((db) => new Promise((resolve, reject) => {
          try {
            const tx = db.transaction('presets', 'readonly')
            const req = tx.objectStore('presets').getAll()
            req.onsuccess = () => resolve(req.result || [])
            req.onerror = () => reject(req.error || new Error('读取失败'))
          } catch (e) { reject(e) }
        }))
      }
      function idbDelete(id) {
        return openPresetDb().then((db) => new Promise((resolve, reject) => {
          try {
            const tx = db.transaction('presets', 'readwrite')
            tx.objectStore('presets').delete(id)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => reject(tx.error || new Error('删除失败'))
          } catch (e) { reject(e) }
        }))
      }
      function loadPresets() {
        // 旧 localStorage 数据（presets-v1）自动迁移到 IndexedDB
        try {
          const raw = window.localStorage.getItem('theme-customizer-presets-v1')
          if (raw) {
            const arr = JSON.parse(raw)
            if (Array.isArray(arr) && arr.length) {
              idbPutAll(arr).then(() => {
                try { window.localStorage.removeItem('theme-customizer-presets-v1') } catch (e) { /* 忽略 */ }
                return idbGetAll()
              }).then((items) => {
                presets = (items || []).filter((p) => p && typeof p === 'object' && p.data && p.data.areas)
                presetNotify()
              }).catch(() => { /* 忽略 */ })
              return
            }
            try { window.localStorage.removeItem('theme-customizer-presets-v1') } catch (e) { /* 忽略 */ }
          }
        } catch (e) { /* 忽略 */ }
        idbGetAll().then((items) => {
          presets = (items || []).filter((p) => p && typeof p === 'object' && p.data && p.data.areas)
          presetNotify()
        }).catch(() => { /* 忽略 */ })
      }
      function savePresets() {
        return idbPutAll(presets)
      }
      // 当前应用的预设 id（localStorage 持久，刷新后仍显示）
      let lastAppliedId = null
      try { lastAppliedId = window.localStorage.getItem('theme-customizer-last-applied') || null } catch (e) { /* 忽略 */ }
      // 应用预设数据（导入文件 / 切换预设共用）。
      // ⚠️ 必须完整应用所有颜色 key（null=恢复官方），否则上一个预设的颜色会残留
      // ⚠️ 性能（2026-08-22 梳理修复）：原实现逐 setter（35+ 次 notify + saveNow，每次全量渲染 + 全量序列化含图 dataURI）
      //   → 改为**直接赋值状态 + 保留必要副作用（applyCordisEntryFlag）+ 末尾一次通知保存**。行为不变（中间态本就不该渲染）
      function applyPresetData(c) {
        // ── 区域：完整覆盖（缺键回默认）+ opacity 语义迁移（与 loadSettings 一致）──
        const nextAreas = {}
        const sem = c.opacitySem
        for (const a of AREAS) {
          const src = c.areas[a.id]
          let area = src && typeof src === 'object' ? { ...emptyArea(), ...src } : emptyArea()
          // 预设 opacity 语义迁移（与 loadSettings 一致，统一为透明度语义）：
          // sem 4 = 统一透明度（当前）；3 = 主界面不透明度/侧边栏透明度；2 = 全透明度；无标记 = 全不透明度
          if (src && typeof src === 'object' && typeof src.opacity === 'number') {
            if (sem === 4 || sem === 2) { /* 当前语义/全透明度，直接用 */ }
            else if (sem === 3) { if (a.id === 'app') area.opacity = 1 - src.opacity }
            else { area.opacity = 1 - src.opacity }
          }
          nextAreas[a.id] = area
        }
        // v1.0.4 侧边栏收起态：预设缺 collapsedSidebar/collapsed 字段（或字段异常缺 mode）→ 补默认（防读 undefined.mode 崩溃）
        if (nextAreas.app && (!nextAreas.app.collapsedSidebar || nextAreas.app.collapsedSidebar.mode === undefined)) nextAreas.app = { ...nextAreas.app, collapsedSidebar: emptyArea() }
        if (nextAreas.sidebar && (!nextAreas.sidebar.collapsed || nextAreas.sidebar.collapsed.mode === undefined)) nextAreas.sidebar = { ...nextAreas.sidebar, collapsed: emptyArea() }
        areas = nextAreas
        // ── 文字颜色：完整覆盖（null=恢复官方）──
        colors = { main: null, process: null, aux: null, faded: null, accent: null }
        const pc = c.colors && typeof c.colors === 'object' ? c.colors : {}
        for (const it of COLOR_ITEMS) {
          const v = pc[it.key]
          if (typeof v === 'string' && v) colors[it.key] = v
        }
        // ── Cordis 按钮常驻：有 boolean 才应用（副作用：同步 window 变量 + 重渲染官方按钮）──
        if (typeof c.cordisEntry === 'boolean') { cordisEntry = c.cordisEntry; applyCordisEntryFlag() }
        // ── 浮窗/其他开关：缺失保留当前值（原行为）──
        if (c.floatModules && typeof c.floatModules === 'object') floatModules = { ...floatModules, ...c.floatModules }
        // 浮窗显示全局恢复按钮（v0.9.16）：⚠️ 2026-08-22 梳理修复——原实现漏应用此键，预设保存了但应用时不恢复
        if (typeof c.floatShowReset === 'boolean') floatShowReset = c.floatShowReset
        if (c.floatPos && typeof c.floatPos === 'object') floatPos = { ...floatPos, ...c.floatPos }
        if (typeof c.floatVisible === 'boolean') floatVisible = c.floatVisible
        if (typeof c.showOpacityHint === 'boolean') showOpacityHint = c.showOpacityHint
        // 设置界面拖动位置（v0.9.19）：合法 {x,y} 应用；缺失/非法 = null（居中）
        if (c.detailsPos && typeof c.detailsPos === 'object' && typeof c.detailsPos.x === 'number' && typeof c.detailsPos.y === 'number') detailsPos = c.detailsPos
        else detailsPos = null
        if (typeof c.detailsDragEnabled === 'boolean') detailsDragEnabled = c.detailsDragEnabled
        if (typeof c.composerStatsExpanded === 'boolean') composerStatsExpanded = c.composerStatsExpanded
        if (typeof c.composerFixedHeight === 'boolean') composerFixedHeight = c.composerFixedHeight
        if (typeof c.composerRows === 'number') composerRows = c.composerRows
        if (c.composerStatsItems && typeof c.composerStatsItems === 'object') composerStatsItems = { ...composerStatsItems, ...c.composerStatsItems }
        // ── 新会话：有才应用（缺失保留当前值，原行为）；旧 unified 迁移 + 默认白底──
        if (c.newSession && typeof c.newSession === 'object') {
          const nsOld = c.newSession
          const nsMode = nsOld.unified === true ? 'none' : (nsOld.mode === 'transparent' ? 'none' : nsOld.mode)
          // bottomEnabled fallback 与 05_storage 统一为 true（v0.9.20 新默认白底；2026-08-22 梳理修复，原为 bottomColor != null）
          newSession = { showText: true, showIcon: true, mode: 'none', color: '#ffffff', opacity: 0, bottomEnabled: true, bottomColor: '#ffffff', bottomOpacity: 0, image: null, iconColor: null, textColor: null, ...nsOld, mode: nsMode, bottomEnabled: typeof nsOld.bottomEnabled === 'boolean' ? nsOld.bottomEnabled : true }
        }
        // ── 标志：完整覆盖（预设缺该字段 → 回默认，避免残留上一预设）──
        const pb = c.brand && typeof c.brand === 'object' ? c.brand : {}
        // v1.0.5 收起态 collapsed：null = 跟随展开态；预设缺 → 回默认（跟随展开）
        const pcb = pb.collapsed
        brand = {
          color: typeof pb.color === 'string' && /^#[0-9a-f]{6}$/i.test(pb.color) ? pb.color : '#3964fe',
          opacity: typeof pb.opacity === 'number' && pb.opacity >= 0 && pb.opacity <= 1 ? pb.opacity : 0,
          collapsed: pcb && typeof pcb === 'object'
            ? {
                color: typeof pcb.color === 'string' && /^#[0-9a-f]{6}$/i.test(pcb.color) ? pcb.color : null,
                opacity: typeof pcb.opacity === 'number' && pcb.opacity >= 0 && pcb.opacity <= 1 ? pcb.opacity : null,
              }
            : { color: null, opacity: null },
        }
        const ph = c.brandHarness && typeof c.brandHarness === 'object' ? c.brandHarness : {}
        brandHarness = {
          color: typeof ph.color === 'string' && /^#[0-9a-f]{6}$/i.test(ph.color) ? ph.color : null,
          opacity: typeof ph.opacity === 'number' && ph.opacity >= 0 && ph.opacity <= 1 ? ph.opacity : 0,
        }
        // ── 新会话欢迎页四项调色（v1.0.5）：完整覆盖（预设缺该字段 → 回默认全官方，不残留上一预设）──
        const heroData = c.hero && typeof c.hero === 'object' ? c.hero : {}
        const nh2 = {}
        for (const key of ['fish', 'title', 'badge', 'badgeBg']) {
          const it = heroData[key]
          nh2[key] = {
            color: it && typeof it === 'object' && typeof it.color === 'string' && /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : null,
            opacity: it && typeof it === 'object' && typeof it.opacity === 'number' && it.opacity >= 0 && it.opacity <= 1 ? it.opacity : 0,
          }
        }
        hero = nh2
        // ── 对话区背景：有才应用；颜色键完整覆盖（null=官方默认）+ 透明度键完整覆盖（0-1，缺失回 0）──
        if (c.convBgs && typeof c.convBgs === 'object') {
          const cb = c.convBgs
          for (const key of ['bubble', 'inline', 'code', 'scrollbar', 'chatScroll', 'todoCollapsed', 'todoExpanded', 'addBtn', 'cmdMenu', 'toBottom', 'sliderColor', 'sliderTrackColor', 'scrollColor']) {
            convBgs = { ...convBgs, [key]: (typeof cb[key] === 'string' && cb[key]) ? cb[key] : null }
          }
          // 透明度类键（v0.9.14/15；v1.0.3 加对话区 8 项）：数值 0-1，缺失/非法回 0（不残留上一预设）
          for (const key of ['addBtnOpacity', 'cmdMenuOpacity', 'sliderOpacity', 'sliderTrackOpacity', 'scrollOpacity', 'bubbleOpacity', 'inlineOpacity', 'codeOpacity', 'scrollbarOpacity', 'chatScrollOpacity', 'todoCollapsedOpacity', 'todoExpandedOpacity', 'toBottomOpacity']) {
            const v = cb[key]
            convBgs = { ...convBgs, [key]: (typeof v === 'number' && v >= 0 && v <= 1) ? v : 0 }
          }
        }
        // ── 框线：有才完整覆盖（缺键回默认）；缺失时全部重置（原行为）──
        if (c.borders && typeof c.borders === 'object') {
          for (const key of BORDER_KEYS) {
            const b = c.borders[key]
            borders = { ...borders, [key]: {
              color: b && typeof b === 'object' && typeof b.color === 'string' && /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : null,
              opacity: b && typeof b === 'object' && typeof b.opacity === 'number' && b.opacity >= 0 && b.opacity <= 1 ? b.opacity : 0,
            } }
          }
        } else {
          for (const key of BORDER_KEYS) borders = { ...borders, [key]: { color: null, opacity: 0 } }
        }
        // 末尾一次通知 + 保存（批量：替代原 35+ 次逐 setter 通知）
        notify(); statsNotify(); floatNotify(); saveNow()
      }
      try { loadPresets() } catch (e) { /* 忽略 */ }
