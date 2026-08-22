      // ┌─ 片段 12_float ─────────────────────────────────
      // │ 职责：浮窗（显示内容勾选 + 可拖浮窗面板；拖动用局部状态，pointerup 才写回全局 + 保存）
      // │ 定义：Section / FloatModulePicker / GlobalFloat
      function Section({ title, children }) {
        return React.createElement('section', { style: { marginBottom: '16px', padding: '16px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '8px' } },
          React.createElement('h3', { style: { marginTop: 0, marginBottom: '10px', fontSize: '14px' } }, title),
          children,
        )
      }

      function FloatModulePicker() {
        const { floatModules, floatShowReset } = useStore(['float'])
        return React.createElement(Section, { title: '浮窗显示内容' },
          React.createElement('p', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '13px', margin: '0 0 10px' } }, '勾选要在浮窗中显示/可调整的模块：'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            // 开关仅勾选框触发（v0.9.20 用户定：不要整栏触发）
            MODULES.map((m) => React.createElement('div', { key: m.id, style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } },
              React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!floatModules[m.id], onChange: (e) => setFloatModules({ ...floatModules, [m.id]: e.target.checked }) }),
              React.createElement('span', null, m.title),
            )),
            // v0.9.16：浮窗内是否显示「全局恢复默认」按钮
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '4px' } },
              React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!floatShowReset, onChange: (e) => setFloatShowReset(e.target.checked) }),
              React.createElement('span', null, '显示「全局恢复默认」按钮'),
            ),
          ),
        )
      }

      function GlobalFloat() {
        // 只订阅 float 通道：位置/显示内容拖动（float）不重渲染设置页；背景由 areas.float（main 通道 → buildFloatCss）控制
        const { floatVisible, floatPos, floatModules, floatShowReset } = useStore(['float'])
        const [dragging, setDragging] = React.useState(false)
        // 拖动位置局部状态：pointermove 只重渲染浮窗自身（不走全局 notify，避免每帧全量重渲染）
        const [dragPos, setDragPos] = React.useState(null)
        const dragRef = React.useRef(null)
        if (!floatVisible) return null
        const shown = MODULES.filter((m) => floatModules[m.id])
        const pos = dragPos ? { ...floatPos, ...dragPos } : floatPos
        // 背景（底色/纯色/图片 + 透明度）由 buildFloatCss 注入到 [data-thmcz-float]（v0.9.13 起，原 floatOpacity 半透明已删）；
        // 这里只保留布局/阴影/圆角（边框色用主题 token，随主题自动亮暗）
        const onPointerDown = (e) => {
          if (e.button !== 0) return
          e.preventDefault()
          const startX = e.clientX, startY = e.clientY
          const orig = { x: floatPos.x, y: floatPos.y }
          setDragging(true)
          const onMove = (ev) => {
            const next = { x: orig.x + (ev.clientX - startX), y: orig.y + (ev.clientY - startY) }
            dragRef.current = next
            setDragPos(next)
          }
          const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            setDragging(false)
            // 拖动结束才写回全局 + 保存一次（无定时器约定）
            const p = dragRef.current
            dragRef.current = null
            setDragPos(null)
            if (p) setFloatPos({ ...floatPos, x: p.x, y: p.y })
            saveNow()
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        }
        return React.createElement('div', { 'data-thmcz-float': true, style: { position: 'fixed', left: pos.x, top: pos.y, width: pos.width, height: pos.height, zIndex: 2147483647, display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', border: '1px solid var(--dsw-alias-border-l1)', color: 'var(--dsw-alias-label-primary)', overflow: 'hidden', userSelect: dragging ? 'none' : 'auto' } },
          React.createElement('div', { onPointerDown: onPointerDown, style: { height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', cursor: 'move', flex: 'none', background: 'rgba(255,255,255,0.07)', borderBottom: '1px solid var(--dsw-alias-border-l1)' } },
            React.createElement('span', { style: { fontSize: '13px', fontWeight: 600 } }, '主题设置 · 浮动'),
            React.createElement('button', { type: 'button', onClick: () => setFloatVisible(false), style: { border: 'none', background: 'none', color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer', fontSize: '13px', padding: '4px' } }, '✕'),
          ),
          // v0.9.15：滚动容器加 data-thmcz-float-scroll → 浮窗滚动条颜色/透明度（scrollColor/scrollOpacity）作用于此处
          React.createElement('div', { 'data-thmcz-float-scroll': true, style: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' } },
            shown.length === 0
              ? React.createElement('p', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: '13px' } }, '未选择任何模块，请到 设置 → 主题 → 浮窗显示内容 勾选。')
              : shown.map((m) => React.createElement('section', { key: m.id, style: { padding: '12px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '8px' } },
                  React.createElement('h4', { style: { margin: '0 0 8px', fontSize: '13px' } }, m.title),
                  React.createElement(ModuleContent, { id: m.id }),
                )),
            // 全局恢复默认（v0.9.16）：浮窗内也显示（与主题设置页一致），独立、居中、三级确认；受「浮窗显示内容」勾选控制
            floatShowReset
              ? React.createElement('div', { style: { marginTop: '4px', borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: '12px' } },
                  React.createElement(TripleConfirmButton, {
                    label: '全局恢复默认', confirmLabel1: '确认全局恢复默认', confirmLabel2: '确认吗？你的全部自定义设置都会消失',
                    onConfirm: resetAllSettings, resetKey: 'reset-all-settings',
                  }),
                )
              : null,
          ),
        )
      }
