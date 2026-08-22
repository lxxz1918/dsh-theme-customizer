      // ┌─ 片段 00_constants ─────────────────────────────
      // │ 职责：apply 入口（slots 守卫）+ 模块/区域/颜色常量
      // │ 定义：MODULES / AREAS / COLOR_ITEMS / COLOR_TOKENS / emptyArea
      // │ 测试：改区域或模块清单后检查设置页渲染；改 emptyArea 检查配置默认值
      const slots = ctx.get('slots')
      if (slots === undefined) return

      const MODULES = [
        { id: 'background', title: '界面' },
        // 框线板块（v0.9.18）：所有 UI 默认边框/分隔线颜色 + 透明度，5 区域独立；放「字体颜色」上面（用户定）
        { id: 'borders', title: '框线' },
        { id: 'colors', title: '字体颜色' },
        { id: 'layout', title: '布局调整' },
        { id: 'presets', title: '预设' },
      ]
      // 框线区域（v0.9.18）：main=主界面（含侧边栏，覆盖布局三列）/ cordis=Cordis 插件界面 / composer=输入区 /
      // details=设置界面 / float=浮窗面板；label 显示名在 15_borders.js，选择器在 07_css_builder buildBordersCss
      const BORDER_KEYS = ['main', 'cordis', 'composer', 'details', 'float']
      // 框线默认色（v0.9.18 用户定）：主界面/Cordis/输入区 = 淡灰 #e6e6e6（官方 border-l2 rgba(0,0,0,.1) 白底合成，与色块一致）；
      // 设置界面/浮窗面板 = 黑色。CSS 用（07 buildBordersCss）、色块显示用（15 BordersModule）共用一处定义
      const BORDER_DEFAULT_LIGHT = '#e6e6e6'
      const BORDER_DEFAULT_DARK = '#000000'
      const AREAS = [
        { id: 'app', label: '主界面', supported: true, modes: ['none', 'color', 'image'] },
        { id: 'sidebar', label: '侧边栏', supported: true, modes: ['none', 'transparent', 'color', 'image'] },
        { id: 'conversation', label: '对话区', supported: true, modes: ['none'] },
        { id: 'composer', label: '输入区', supported: true, modes: ['none', 'color', 'image'] },
        // 设置界面（2026-08-22，v0.9.12）：官方设置面板 [class*="VOzbGW_panel"]（居中模态，背景 --dsw-alias-bg-layer-2，圆角 24px）
        // 逻辑类似主界面：无/纯色/图片 + 透明度 + 底色；无显示区域开关（非 app）
        { id: 'details', label: '设置界面', supported: true, modes: ['none', 'color', 'image'] },
        // 浮窗面板（2026-08-22，v0.9.13）：自研浮窗 [data-thmcz-float]（原 floatOpacity 滑条已删，改背景调整）
        // 逻辑类似主界面：无/纯色/图片 + 透明度 + 底色；无显示区域开关
        { id: 'float', label: '浮窗面板', supported: true, modes: ['none', 'color', 'image'] },
        // Cordis 插件界面（2026-08-22，v0.9.14）：官方 Cordis 面板 [class*="Nqubda_panel"]（z-index:30 建层叠上下文 → ::before 安全，
        // 背景 --dsw-alias-bg-base，圆角 12px）。原 cordisOpacity 滑条已删，改背景调整（像设置界面）+ 底色含透明度
        { id: 'cordis', label: 'Cordis 插件界面', supported: true, modes: ['none', 'color', 'image'] },
      ]
      // P3 文字颜色分类（用户确认的 5 类）
      const COLOR_ITEMS = [
        { key: 'main', label: '正文', desc: '消息正文、标题、侧边栏导航、菜单项' },
        { key: 'process', label: '过程文字', desc: '工具调用(read/pwsh)、思考摘要、上下文计量' },
        { key: 'aux', label: '辅助文字', desc: '时间戳、描述、次级信息' },
        { key: 'faded', label: '弱化文字', desc: '注释、占位符、禁用态' },
        { key: 'accent', label: '强调文字', desc: '链接、激活高亮、品牌色文字' },
      ]
      const COLOR_TOKENS = {
        main: ['--dsw-alias-label-primary'],
        process: ['--dsw-alias-label-tertiary'],
        aux: ['--dsw-alias-label-secondary'],
        faded: ['--dsw-alias-label-caption', '--dsw-alias-label-dimmed'],
        accent: ['--dsw-alias-brand-primary'],
      }
      function emptyArea() { return { mode: 'none', color: '#ffffff', opacity: 0, image: null, bottomColor: null, bottomEnabled: false, bottomOpacity: 0 } }
