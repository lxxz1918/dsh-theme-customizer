      // ┌─ 片段 15_borders ──────────────────────────────
      // │ 职责：「框线」板块（v0.9.18）：所有 UI 默认边框/分隔线颜色 + 透明度，5 区域独立
      // │ 定义：BordersModule；挂载：ModuleContent（13_boot，id='borders'，MODULES 在字体颜色上面）
      // │ 测试：5 区域各自调色/透明度互不影响；只调透明度也可恢复；全部恢复官方默认
      // 框线板块（「字体颜色」上面，用户定）：主界面（含侧边栏）/ Cordis 插件界面 / 输入区 / 设置界面 / 浮窗面板。
      // 每行 = ConvBgRow（颜色 + 状态 + 恢复官方默认 + 透明度滑条，始终可用——官方默认色也可调透明度，CSS 用 color-mix 淡化官方色）。
      // 透明度数值大=透明（语义同全局）。底部「全部恢复官方默认」：任一区域改动过才显示（仿对话区 resetAllConvBgs）
      function BordersModule() {
        const { borders } = useStore(['main'])
        const defs = [
          { id: 'main', label: '主界面' },
          // v1.0.2：新会话独立框线，紧跟主界面行（用户定：新会话框线在主界面框线下设置）
          { id: 'newSession', label: '新会话' },
          { id: 'cordis', label: 'Cordis 插件界面' },
          { id: 'composer', label: '输入区' },
          { id: 'details', label: '设置界面' },
          { id: 'float', label: '浮窗面板' },
        ]
        const hasCustom = defs.some((d) => { const b = borders[d.id]; return b && (b.color || (b.opacity != null && b.opacity > 0)) })
        // 色块默认显示（未设置时）用 00_constants 统一常量（与 buildBordersCss 同源）：
        // 主界面/Cordis/输入区 = 淡灰、设置界面/浮窗面板 = 黑色
        return React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginBottom: '8px' } },
            '所有界面默认边框与分隔线颜色 + 透明度（数值大=越透明），各区域独立调整'),
          defs.map((d) => {
            const b = borders[d.id] || {}
            return React.createElement(ConvBgRow, { key: d.id, label: d.label, value: b.color, onSet: (v) => setBorder(d.id, { color: v }), opacity: b.opacity == null ? 0 : b.opacity, onOpacity: (v) => setBorder(d.id, { opacity: v }), onReset: () => setBorder(d.id, { color: null, opacity: 0 }), defaultSwatch: (d.id === 'details' || d.id === 'float') ? BORDER_DEFAULT_DARK : BORDER_DEFAULT_LIGHT, defaultText: d.id === 'float' ? '默认' : undefined })
          }),
          hasCustom
            ? React.createElement('div', { style: { marginTop: '4px' } },
                React.createElement(ConfirmButton, {
                  label: '全部恢复官方默认', confirmLabel: '全部确认恢复官方默认',
                  onConfirm: resetAllBorders, resetKey: hasCustom, size: 'md',
                }),
              )
            : null,
        )
      }
