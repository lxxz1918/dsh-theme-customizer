      // ┌─ 片段 13_boot ──────────────────────────────────
      // │ 职责：主题页 + 模块注册表 + 槽位注册 + Cordis 常驻开关 + 启动副作用（集中在本片段）
      // │ 定义：ModuleContent / ThemePage / applyCordisEntryFlag；执行：slots.inject ×3 + applyCordisEntryFlag()
      // 「布局调整」板块开关（v0.9.19）：设置界面可移动（详情见 07 拖动委托 + 09 DetailsResetPos）
      function LayoutToggle() {
        const { detailsDragEnabled } = useStore(['main'])
        // 开关仅勾选框触发（v0.9.20）
        return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px' } },
          React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!detailsDragEnabled, onChange: (e) => setDetailsDragEnabled(e.target.checked) }),
          React.createElement('span', null, '设置界面可移动'),
        )
      }

      // 模块注册表（四模块总开关）：设置页与浮窗共用；各模块渲染已归位到所属板块片段（09 界面 / 10 颜色 / 11 预设）
      function ModuleContent({ id }) {
        if (id === 'background') return React.createElement(BackgroundModule, null)
        if (id === 'borders') return React.createElement(BordersModule, null)
        if (id === 'colors') return React.createElement(ColorsModule, null)
        // 布局调整：目前只有「设置界面可移动」开关（P4 拖拽布局占位按钮已删——2026-08-22 梳理，开源前去掉未完成功能占位）
        if (id === 'layout') return React.createElement(LayoutToggle, null)
        if (id === 'presets') return React.createElement(PresetsPanel, null)
        return null
      }

      // 主题页注册**最前**（EXPERIENCE 铁律：保证设置入口存在，即使其他槽位注册失败——v0.9.19 侧边栏槽位事故后再次确认）
      slots.inject('settings.section', () => slots.register({ name: 'settings.section', id: 'theme-customizer', label: '主题', order: 900 }, () => React.createElement(ThemePage, null)))

      slots.inject('shell.overlay', () => slots.register({ name: 'shell.overlay', id: 'theme-customizer-bg', order: 50 }, () => React.createElement(AreaCss, null)))
      slots.inject('shell.overlay', () => slots.register({ name: 'shell.overlay', id: 'theme-customizer-float', order: 100 }, () => React.createElement(GlobalFloat, null)))

      // 统计条接管：注册到 conversation.composer.dock（官方 stats 同 slot，order 更大靠后渲染；
      // 官方 stats 用 CSS 隐藏，见 07_css_builder）。组件收到 slot 注入的 useSession/useProjection。
      slots.inject('conversation.composer.dock', () => slots.register({ name: 'conversation.composer.dock', id: 'theme-customizer-stats', order: 100 }, (props) => React.createElement(ComposerStatsLine, props)))

      // ⚠️ v0.9.19 事故：曾直接 slots.register('sidebar.settings')——官方把它注册为**容器槽位**（children 含
      // settings.trigger/header/action/close），直接注册同名冲突 → 官方设置按钮消失 → "主题没有了"。
      // 曾试子槽位 sidebar.settings.settings.action 也不生效（官方子槽位仅容器内部使用）。
      // ✅ 最终方案：侧边栏复位按钮改用**原生 DOM 注入**（07 AreaCss useEffect：VOzbGW_trigger 右半注入），
      // 不再注册任何 sidebar 槽位。

      // ── Cordis 常驻：官方按钮已由官方包补丁支持常驻（window.__TCZ_HIDE_OFFICIAL_CORDIS 控制开关）──
      // 开关状态同步到 window 变量（官方组件渲染时读取）；false=常驻，true=恢复官方逻辑
      // 官方包补丁已监听 'tcz:cordis-visibility' 事件 → 切换后立即重渲染（无需刷新页面）
      function applyCordisEntryFlag() {
        try { window.__TCZ_HIDE_OFFICIAL_CORDIS = !cordisEntry } catch (e) { /* 忽略 */ }
        try { window.dispatchEvent(new Event('tcz:cordis-visibility')) } catch (e) { /* 忽略 */ }
      }
      applyCordisEntryFlag()

      function ThemePage() {
        // main（lastSavedAt/floatVisible 双发）+ float（floatModules）
        const { floatVisible, floatModules, lastSavedAt } = useStore(['main', 'float'])
        return React.createElement('div', { style: { maxWidth: '720px', padding: '8px 4px' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' } },
            React.createElement('h2', { style: { fontSize: '18px', margin: 0 } }, '主题设置'),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
              React.createElement('button', { type: 'button', onClick: resetFloatPos, style: { padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '13px' } }, '↺ 复位浮窗'),
              React.createElement('button', { type: 'button', onClick: () => setFloatVisible(!floatVisible), style: { padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: floatVisible ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-1)', color: floatVisible ? '#fff' : 'var(--dsw-alias-label-primary)' } }, floatVisible ? '关闭浮窗' : '↗ 打开浮窗'),
            ),
          ),
          React.createElement(FloatModulePicker, null),
          MODULES.map((m) => React.createElement(Section, { key: m.id, title: m.title }, React.createElement(ModuleContent, { id: m.id }))),
          // 全局恢复默认（v0.9.16）：预设板块下面、不属于任何板块、居中；三级确认（文本依次：确认全局恢复默认 → 确认吗？你的全部自定义设置都会消失），取消按钮换行到下面
          React.createElement('div', { style: { marginTop: '14px', borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: '12px' } },
            React.createElement(TripleConfirmButton, {
              label: '全局恢复默认', confirmLabel1: '确认全局恢复默认', confirmLabel2: '确认吗？你的全部自定义设置都会消失',
              onConfirm: resetAllSettings, resetKey: 'reset-all-settings',
            }),
          ),
          React.createElement('div', { style: { marginTop: '12px', fontSize: '11px', color: 'var(--dsw-alias-label-caption)', fontVariantNumeric: 'tabular-nums' } },
            '最近保存: ' + (lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '—'),
          ),
        )
      }