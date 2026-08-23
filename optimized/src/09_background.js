      // ┌─ 片段 09_background ────────────────────────────
      // │ 职责：界面板块全套（主界面/侧边栏编辑卡片 + 新会话按钮板块 + 「界面」模块外壳）
      // │ 定义：AreaEditor / NewSessionEditor / BackgroundModule
      // │ 测试：改区域编辑/新会话/界面模块外壳（Cordis/浮窗/其他卡片）时来此片段
      // memo 化（性能优化 2026-08-21）：AreaEditor 不订阅 store，仅依赖 props（area/value/onChange/ratio/children），
      // 父级 BackgroundModule 重渲染时 props 引用稳定（见 BackgroundModule 的 useMemo/useCallback）→ 跳过重渲染；
      // 对应区域 setArea 后 value 引用变化 → 正常重渲染
      const AreaEditor = React.memo(function AreaEditor({ area, value, onChange, ratio, children }) {
        const migratedNoneRef = React.useRef(false)
        // 两步确认：移除图片（第一次点击进入确认态，再点才执行）
        const [confirmRemove, setConfirmRemove] = React.useState(false)
        // 侧边栏"无（官方原样）"选项已删除：旧数据残留 none → 一次性迁移为"无"（transparent）
        React.useEffect(() => {
          if (!migratedNoneRef.current && area.id === 'sidebar' && value.mode === 'none') {
            migratedNoneRef.current = true
            onChange({ ...value, mode: 'transparent' })
          }
        }, [])
        // 选图前强制重新检测侧边栏比例（保证选区比例跟手）；移除图片确认态同步解除
        // maxDim：composer 1280（小卡片），主界面/侧边栏 2560（2K 清晰，防超大 dataURI 撑爆 CSS 变量/localStorage）
        const crop = useImageCrop(() => {
          if (area.id === 'sidebar') {
            const info = detectSidebar()
            if (info) setSidebarInfo(info)
          }
          setConfirmRemove(false)
        }, area.id === 'composer' ? 1280 : 2560)
        const setMode = (mode) => {
          const next = { ...value, mode }
          if (mode !== 'image') next.image = null
          setConfirmRemove(false)
          onChange(next)
        }
        const modes = [
          // 侧边栏的"无（官方原样）"已废弃删除；透明改名"无"
          ...(area.id !== 'sidebar' && area.modes.includes('none') ? [{ id: 'none', label: '无' }] : []),
          ...(area.modes.includes('transparent') ? [{ id: 'transparent', label: area.id === 'sidebar' ? '无' : '透明（透出主体背景）' }] : []),
          ...(area.modes.includes('color') ? [{ id: 'color', label: '纯色' }] : []),
          ...(area.modes.includes('image') ? [{ id: 'image', label: '图片' }] : []),
        ]
        // 侧边栏已无 none 选项：旧数据若为 none，显示为"无"（等效透明）
        const currentMode = modes.some((m) => m.id === value.mode) ? value.mode : (modes[0] ? modes[0].id : 'none')
        return React.createElement('div', { style: { padding: '10px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '8px', marginBottom: '10px' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' } },
            React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, minWidth: '80px' } }, area.label),
            // 只有一个模式（如对话区/详情栏仅"无"）时下拉无意义，不渲染
            modes.length > 1
              ? React.createElement('select', { value: currentMode, onChange: (e) => setMode(e.target.value), style: { padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px' } },
                  modes.map((m) => React.createElement('option', { key: m.id, value: m.id }, m.label)))
              : null,
          ),
          // v1.0.4：collapsedSubApp（主界面收起后）也显示区域开关——与 app 同布局
          // （「主界面」标签行 → 显示区域 → 模式内容，用户定位置）
          (area.id === 'app' || area.id === 'collapsedSubApp')
            ? React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '4px', flexWrap: 'wrap' } },
                React.createElement('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', flex: 'none' } }, '显示区域：'),
                React.createElement('button', { type: 'button', onClick: () => onChange({ ...value, includeSidebar: true }), style: { padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid ' + (value.includeSidebar === false ? 'var(--dsw-alias-border-l2)' : 'var(--dsw-alias-brand-primary)'), background: value.includeSidebar === false ? 'transparent' : 'var(--dsw-alias-brand-primary)', color: value.includeSidebar === false ? 'var(--dsw-alias-label-primary)' : '#fff', fontSize: '12px' } }, '包含侧边栏'),
                React.createElement('button', { type: 'button', onClick: () => onChange({ ...value, includeSidebar: false }), style: { padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid ' + (value.includeSidebar === false ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l2)'), background: value.includeSidebar === false ? 'var(--dsw-alias-brand-primary)' : 'transparent', color: value.includeSidebar === false ? '#fff' : 'var(--dsw-alias-label-primary)', fontSize: '12px' } }, '不包含侧边栏'),
              )
            : null,
          value.mode === 'color'
            ? React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' } },
                  React.createElement('span', null, '颜色:'),
                  React.createElement(ColorField, { value: value.color, onChange: (hex) => onChange({ ...value, color: hex }) }),
                  React.createElement('span', null, value.color),
                ),
                React.createElement(OpacitySlider, { value: value.opacity, onChange: (op) => onChange({ ...value, opacity: op }) }),
              )
            : null,
          value.mode === 'image'
            ? React.createElement('div', null,
                React.createElement('input', { ref: crop.fileRef, type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', style: { display: 'none' }, onChange: crop.handleFile }),
                React.createElement('div', { style: { marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' } },
                  React.createElement('button', { type: 'button', onClick: () => crop.fileRef.current && crop.fileRef.current.click(), style: { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px' } }, value.image ? '重新选择图片' : '选择图片'),
                  value.image && React.createElement('button', { type: 'button', onClick: () => { if (!confirmRemove) { setConfirmRemove(true); return } setConfirmRemove(false); onChange({ ...value, image: null }) }, style: { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: confirmRemove ? 'var(--dsw-alias-state-error-primary)' : 'none', color: confirmRemove ? '#fff' : 'var(--dsw-alias-state-error-primary)', fontSize: '12px' } }, confirmRemove ? '确认移除图片' : '移除图片'),
                  confirmRemove && React.createElement('button', { type: 'button', onClick: () => setConfirmRemove(false), style: { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'none', fontSize: '12px' } }, '取消'),
                ),
                value.image && React.createElement(OpacitySlider, { value: value.opacity, onChange: (op) => onChange({ ...value, opacity: op }) }),
                area.id === 'composer'
                  ? React.createElement('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-caption)', marginTop: '4px' } }, '注：开启固定高度时，选区按输入框实测宽高比；高度动态增减时按视口近似，与实际宽高比可能不完全一致。')
                  : null,
              )
            : null,
          crop.stage === 'crop' && crop.rawImage
            ? React.createElement(CropPanel, { image: crop.rawImage, ratio: ratio, maxDim: area.id === 'composer' ? 1280 : 2560, onConfirm: (bg) => { crop.closeCrop(); onChange({ ...value, mode: 'image', image: bg }) }, onCancel: crop.closeCrop })
            : null,
          !area.supported
            ? React.createElement('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-state-warn-primary)', marginTop: '4px' } }, '该区块待支持（需要官方选择器）')
            : null,
          // 底色：主界面(app)/输入区/设置界面/浮窗面板/Cordis 卡片底部"底色"；
          // 透明度显示（v0.9.14 用户定）：sidebar + details + float + composer + cordis 显示底色透明度；app 仅颜色（用户 v0.9.2 定主界面底色仅颜色）
          // ⚠️ v1.0.1（2026-08-22 用户定）：主界面「无」模式不显示底色——无模式下官方原样、不做垫色
          //   （此前「无」模式垫色被官方 _frame/三列不透明背景盖住看不到，且透出到侧边栏导致"侧边栏变红"连锁问题）；
          //   纯色/图片模式的底层垫色保留（appBottom 仍参与 color/image 分支）
          // v1.0.4：collapsedSub（侧边栏收起后）支持底色（同 sidebar：可开关 + 透明度）；
          // collapsedSubApp（主界面收起后）= app 式（无开关、无透明度、仅颜色）
          (area.id !== 'app' || value.mode !== 'none') && (area.id === 'app' || area.id === 'sidebar' || area.id === 'composer' || area.id === 'details' || area.id === 'float' || area.id === 'cordis' || area.id === 'collapsedSub' || area.id === 'collapsedSubApp')
            ? React.createElement(BottomRow, { value: value, onChange: (next) => onChange({ ...value, ...next }), style: { marginTop: '4px', marginBottom: '4px' }, title: '底色', hideOpacity: area.id === 'app' || area.id === 'collapsedSubApp', noSwitch: area.id !== 'sidebar' && area.id !== 'collapsedSub' })
            : null,
          children,
        )
      })

      // DeepSeek Harness 标志子版块（v0.9.17）：渲染在「侧边栏」区块内、「新会话」之上（细分隔线 + 标题，同「滑条与滚动条」子版块样式）。
      // 默认品牌蓝 #3964fe + 不透明；与正文解耦（常驻独立色，不跟随正文）；透明度数值大=透明（语义同全局）；
      // 恢复默认：颜色回品牌蓝 + 透明度归零（改动过才显示，两步确认，同主界面底色「恢复默认」模式）
      function BrandEditor() {
        const { brand, brandHarness } = useStore(['main'])
        const bColor = brand.color || '#3964fe'
        const changed = bColor !== '#3964fe' || (brand.opacity != null && brand.opacity !== 0)
        // Harness 部分单独颜色（v0.9.20）：null=跟随标志整体色；未设置时色块显示品牌蓝（跟随标志）
        const bh = brandHarness || {}
        const hChanged = !!(bh.color || (bh.opacity != null && bh.opacity > 0))
        return React.createElement('div', { style: { marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
          React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, marginBottom: '6px' } }, '标志（DeepSeek Harness）'),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', marginBottom: '6px' } },
            React.createElement('span', { style: { width: '92px', flex: 'none', fontSize: '13px' } }, '标志颜色:'),
            React.createElement(ColorField, { value: bColor, onChange: (hex) => setBrand({ color: hex }) }),
            // 状态文本固定宽度（对齐恢复按钮），只显示"已自定义/默认"（色值已由 ColorField 显示）
            React.createElement('span', { style: { width: '76px', flex: 'none', fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-secondary)', fontSize: '12px' } }, changed ? '已自定义' : '默认'),
            changed ? React.createElement(ConfirmButton, {
              label: '恢复默认', confirmLabel: '确认恢复默认',
              onConfirm: () => setBrand({ color: '#3964fe', opacity: 0 }), resetKey: bColor + '|' + (brand.opacity == null ? '' : brand.opacity),
            }) : null,
          ),
          React.createElement(OpacitySlider, { value: brand.opacity == null ? 0 : brand.opacity, onChange: (v) => setBrand({ opacity: v }) }),
          // ── Harness 单独颜色（v0.9.20）──
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', marginTop: '4px' } },
            React.createElement('span', { style: { width: '92px', flex: 'none', fontSize: '13px' } }, 'Harness 颜色:'),
            React.createElement(ColorField, { value: bh.color || '#3964fe', onChange: (hex) => setBrandHarness({ color: hex }) }),
            React.createElement('span', { style: { width: '76px', flex: 'none', fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-secondary)', fontSize: '12px' } }, hChanged ? '已自定义' : '跟随标志'),
            hChanged ? React.createElement(ConfirmButton, {
              label: '恢复默认', confirmLabel: '确认恢复默认',
              onConfirm: () => setBrandHarness({ color: null, opacity: 0 }), resetKey: (bh.color || '') + '|' + (bh.opacity == null ? '' : bh.opacity),
            }) : null,
          ),
          React.createElement(OpacitySlider, { value: bh.opacity == null ? 0 : bh.opacity, onChange: (v) => setBrandHarness({ opacity: v }) }),
        )
      }

      // memo 化（性能优化 2026-08-21）：自身订阅 store（newSession/sidebarInfo），store 变化时自行重渲染；
      // memo 只防父级（AreaEditor）重渲染时无谓重复
      const NewSessionEditor = React.memo(function NewSessionEditor() {
        const { newSession, sidebarInfo } = useStore()
        // 两步确认：移除图片
        const [confirmRemoveNS, setConfirmRemoveNS] = React.useState(false)
        // 按钮小，maxDim 1280 足够（大图读入先降采样，防超大 dataURI）
        const crop = useImageCrop(() => setConfirmRemoveNS(false), 1280)
        // 按钮选区比例：宽 ≈ 侧边栏宽 - 16px（容器 padding 6px×2 + 按钮 margin 2px×2），高 38px；折叠模式近方形 → 1:1
        const btnRatio = sidebarInfo ? (sidebarInfo.width < 80 ? 1 : Math.max(0.5, (sidebarInfo.width - 16) / 38)) : 2
        const ns = newSession
        const change = (next) => { setConfirmRemoveNS(false); setNewSession({ ...ns, ...next }) }
        // 作为「侧边栏」区块的一部分：无独立卡片边框，用顶部细分隔线与侧边栏内容分开
        // 布局与主界面/侧边栏一致：「新会话」标题旁 = 样式下拉（无/纯色/图片）；
        // 标题下方紧跟模式内容（颜色/透明度/图片选择），再往下才是显示文本/图标/底色
        return React.createElement('div', { style: { marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' } },
            React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, minWidth: '80px' } }, '新会话'),
            React.createElement('select', { value: ['none', 'color', 'image'].includes(ns.mode) ? ns.mode : 'none', onChange: (e) => change({ mode: e.target.value, ...(e.target.value !== 'image' ? { image: null } : {}) }), style: { padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px' } },
              React.createElement('option', { value: 'none' }, '无'),
              React.createElement('option', { value: 'color' }, '纯色'),
              React.createElement('option', { value: 'image' }, '图片'),
            ),
          ),
          ns.mode === 'color'
            ? React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                  React.createElement('span', null, '颜色:'),
                  React.createElement(ColorField, { value: ns.color, onChange: (hex) => change({ color: hex }) }),
                  React.createElement('span', null, ns.color),
                  // 纯色恢复默认（v0.9.20）：颜色回默认白 + 透明度归零（改动过才显示，黑字红框统一样式）
                  (ns.color !== '#ffffff' || (ns.opacity != null && ns.opacity !== 0))
                    ? React.createElement(ConfirmButton, {
                        label: '恢复默认', confirmLabel: '确认恢复默认',
                        onConfirm: () => change({ color: '#ffffff', opacity: 0 }), resetKey: (ns.color || '') + '|' + (ns.opacity == null ? '' : ns.opacity),
                      })
                    : null,
                ),
                React.createElement(OpacitySlider, { value: ns.opacity, onChange: (op) => change({ opacity: op }) }),
              )
            : null,
          ns.mode === 'image'
            ? React.createElement('div', null,
                React.createElement('input', { ref: crop.fileRef, type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml', style: { display: 'none' }, onChange: crop.handleFile }),
                React.createElement('div', { style: { marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' } },
                  React.createElement('button', { type: 'button', onClick: () => crop.fileRef.current && crop.fileRef.current.click(), style: { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px' } }, ns.image ? '重新选择图片' : '选择图片'),
                  ns.image && React.createElement('button', { type: 'button', onClick: () => { if (!confirmRemoveNS) { setConfirmRemoveNS(true); return } setConfirmRemoveNS(false); change({ image: null }) }, style: { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: confirmRemoveNS ? 'var(--dsw-alias-state-error-primary)' : 'none', color: confirmRemoveNS ? '#fff' : 'var(--dsw-alias-state-error-primary)', fontSize: '12px' } }, confirmRemoveNS ? '确认移除图片' : '移除图片'),
                  confirmRemoveNS && React.createElement('button', { type: 'button', onClick: () => setConfirmRemoveNS(false), style: { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'none', fontSize: '12px' } }, '取消'),
                ),
                ns.image && React.createElement(OpacitySlider, { value: ns.opacity, onChange: (op) => change({ opacity: op }) }),
                crop.stage === 'crop' && crop.rawImage
                  ? React.createElement(CropPanel, { image: crop.rawImage, ratio: btnRatio, maxDim: 1280, onConfirm: (bg) => { crop.closeCrop(); change({ mode: 'image', image: bg }) }, onCancel: crop.closeCrop })
                  : null,
              )
            : null,
          // 开关仅勾选框本身触发（v0.9.20 用户定：不要整栏触发——label 点击会切换，改 div+span）
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px' } },
            React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!ns.showIcon, onChange: (e) => change({ showIcon: e.target.checked }) }),
            React.createElement('span', null, '显示图标'),
          ),
          // 图标颜色：默认(null)=跟随正文；单独设置后与正文解耦、独立覆盖。跟随"显示图标"开关显示，紧贴其下（用户定）
          ...(ns.showIcon
            ? [React.createElement('div', { key: 'nsIconColor', style: { fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                React.createElement('span', null, '图标颜色:'),
                React.createElement(ColorField, { value: ns.iconColor || '#000000', onChange: (hex) => change({ iconColor: hex }) }),
                React.createElement('span', { style: { fontVariantNumeric: 'tabular-nums' } }, ns.iconColor || '官方默认'),
                ns.iconColor ? React.createElement(ConfirmButton, {
                  label: '恢复官方默认', confirmLabel: '确认恢复',
                  onConfirm: () => change({ iconColor: null }), resetKey: ns.iconColor,
                }) : null,
              )]
            : []),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px' } },
            React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!ns.showText, onChange: (e) => change({ showText: e.target.checked }) }),
            React.createElement('span', null, '显示文本'),
          ),
          // 文本颜色：默认(null)=跟随正文；单独设置后与正文解耦、独立覆盖。跟随"显示文本"开关显示
          ...(ns.showText
            ? [React.createElement('div', { key: 'nsTextColor', style: { fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                React.createElement('span', null, '文本颜色:'),
                React.createElement(ColorField, { value: ns.textColor || '#000000', onChange: (hex) => change({ textColor: hex }) }),
                React.createElement('span', { style: { fontVariantNumeric: 'tabular-nums' } }, ns.textColor || '官方默认'),
                ns.textColor ? React.createElement(ConfirmButton, {
                  label: '恢复官方默认', confirmLabel: '确认恢复',
                  onConfirm: () => change({ textColor: null }), resetKey: ns.textColor,
                }) : null,
              )]
            : []),
          // 底色与样式无关：无论样式（无/纯色/图片）都显示、都生效（开底色 = 按钮有底色，关 = 透明透出侧边栏）
          React.createElement(BottomRow, { value: ns, onChange: (next) => change(next), style: { marginBottom: '6px' } }),
        )
      })

      // 「显示透明度说明」勾选（v0.9.13 起在浮窗面板卡片内，原「其他」板块已删）：
      // 自身订阅 store（main 通道），childModules useMemo 闭包不捕获旧值
      function OpacityHintToggle() {
        const { showOpacityHint } = useStore(['main'])
        // 开关仅勾选框触发（v0.9.20）
        return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: '6px' } },
          React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!showOpacityHint, onChange: (e) => setShowOpacityHint(e.target.checked) }),
          React.createElement('span', null, '显示透明度说明'),
        )
      }

      // 「Cordis 按钮常驻」勾选（v0.9.14 起在 Cordis 插件界面区域卡片内，原独立卡片已删）：
      // 自身订阅 store（main 通道），childModules useMemo 闭包不捕获旧值。
      // v1.0.0 开源：开关旁加小字——此开关依赖 dsh-client-ui-cordis 补丁（本插件自带的 apply-patch.cjs 补丁），未打补丁时不生效（用户定"留着，标明要打补丁"）
      function CordisEntryToggle() {
        const { cordisEntry } = useStore(['main'])
        // 开关仅勾选框触发（v0.9.20）
        return React.createElement('div', { style: { marginTop: '6px' } },
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } },
            React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!cordisEntry, onChange: (e) => setCordisEntry(e.target.checked) }),
            React.createElement('span', null, 'Cordis 按钮常驻'),
          ),
          React.createElement('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-caption)', marginTop: '4px', marginLeft: '22px' } },
            '需安装 Cordis 按钮补丁才生效（见 PATCH-CORDIS-BUTTON.md）'),
        )
      }

      // 「设置界面」恢复原位按钮（v0.9.19）：面板被拖动离开居中后显示，点击恢复官方居中（detailsPos=null）；
      // 布局调整「设置界面移动」开关关闭时按钮也消失（detailsDragEnabled=false，与拖动同步禁用）
      function DetailsResetPos() {
        const { detailsPos, detailsDragEnabled } = useStore(['main'])
        if (!detailsPos || !detailsDragEnabled) return null
        return React.createElement('div', { style: { marginTop: '6px' } },
          React.createElement(ConfirmButton, {
            label: '恢复原位', confirmLabel: '确认恢复原位',
            onConfirm: () => setDetailsPos(null), resetKey: detailsPos.x + ',' + detailsPos.y,
          }),
        )
      }

      // 滑条 + 滚动条颜色/透明度（v0.9.15，浮窗面板卡片内的子板块——细分隔线 + 标题，同输入区「命令」子板块）：
      // sliderColor/sliderOpacity = 插件滑条左半边（已填充）+ 圆点；sliderTrackColor/sliderTrackOpacity = 右半边（未填充轨道）；
      // scrollColor/scrollOpacity = 浮窗界面滚动条 thumb
      function SliderScrollEditor() {
        const { convBgs } = useStore(['main'])
        return React.createElement('div', { style: { marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
          React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, marginBottom: '6px' } }, '滑条与滚动条'),
          // v1.0.3：色块默认显示真实初始色（用户反馈"默认值不是初始值"）——
          // 滑条填充未设置 = 浏览器默认 accent 蓝 #0060df（Chrome 默认 range 已填充色）；
          // 轨道未设置 = buildConvCss 默认 rgba(128,128,128,0.3) 白底合成 ≈ #d9d9d9
          ConvBgRow({ label: '滑条颜色', value: convBgs.sliderColor, onSet: (v) => setConvBg('sliderColor', v), opacity: convBgs.sliderOpacity == null ? 0 : convBgs.sliderOpacity, onOpacity: (v) => setConvBg('sliderOpacity', v), onReset: () => { setConvBg('sliderColor', null); setConvBg('sliderOpacity', 0) }, noDefaultText: true, defaultSwatch: '#0060df', opacityAlways: true }),
          ConvBgRow({ label: '滑条轨道颜色', value: convBgs.sliderTrackColor, onSet: (v) => setConvBg('sliderTrackColor', v), opacity: convBgs.sliderTrackOpacity == null ? 0 : convBgs.sliderTrackOpacity, onOpacity: (v) => setConvBg('sliderTrackOpacity', v), onReset: () => { setConvBg('sliderTrackColor', null); setConvBg('sliderTrackOpacity', 0) }, noDefaultText: true, defaultSwatch: '#d9d9d9', opacityAlways: true }),
          ConvBgRow({ label: '滚动条颜色', value: convBgs.scrollColor, onSet: (v) => setConvBg('scrollColor', v), opacity: convBgs.scrollOpacity == null ? 0 : convBgs.scrollOpacity, onOpacity: (v) => setConvBg('scrollOpacity', v), onReset: () => { setConvBg('scrollColor', null); setConvBg('scrollOpacity', 0) }, noDefaultText: true, defaultSwatch: '#e5e5e5', opacityAlways: true }),
        )
      }

      // 对话区背景行（2026-08-21）：标签 + 色盘 + 当前状态（官方默认/自定义）+ 恢复官方默认（改动过才显示，同文字颜色逻辑）
      // 标签窄 + 间距紧凑：确认态"确认恢复官方默认 + 取消"不换行
      // v0.9.14：可选 opacity/onOpacity（命令两按钮）——**始终显示透明度滑条**（官方默认色也可调透明度，作用于官方 token 色）；
      // 可选 onReset（命令两按钮恢复时同时归零透明度，默认只清颜色）；
      // v0.9.15：可选 noDefaultText——滑条/滚动条是插件自己的控件（无官方默认），未设置时不显示"官方默认"文本
      // v0.9.18：恢复按钮条件含透明度（只调透明度未调颜色时也可恢复）——框线/滑条区需要
      // v0.9.18：可选 defaultSwatch——未设置（value null）时色块显示的默认色（默认 #ffffff；框线板块传官方淡灰/设置界面黑色）
      // v0.9.18：可选 defaultText——未设置时的状态文本（默认"官方默认"；浮窗面板传"默认"——浮窗是插件自己的面板无官方语义）
      function ConvBgRow({ label, value, onSet, opacity, onOpacity, onReset, noDefaultText, defaultSwatch, defaultText, opacityAlways }) {
        // hasOpacity = 是否接透明度滑条；opacityAlways=true（命令按钮）始终显示，false（默认）仅设色后显示
        const hasOpacity = opacity != null && onOpacity != null
        const custom = !!(value || (hasOpacity && opacity > 0))
        return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', fontSize: '12px' } },
          React.createElement('span', { style: { width: '92px', flex: 'none', fontSize: '13px' } }, label),
          // 未设置（null）时色盘显示默认色（官方默认近似色 #ffffff → 框线板块用官方淡灰/黑色，见 defaultSwatch）
          React.createElement(ColorField, { value: value || defaultSwatch || '#ffffff', onChange: (hex) => onSet(hex) }),
          // 状态文本固定宽度：对齐恢复按钮；只显示"已自定义/官方默认"（色值已由 ColorField 显示，避免重复 #rrggbb）
          // noDefaultText（插件自己的滑条/滚动条）：未设置时留空（无"官方默认"——它没有官方默认）
          React.createElement('span', { style: { width: '76px', flex: 'none', fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-secondary)', fontSize: '12px' } }, custom ? '已自定义' : (noDefaultText ? '' : (defaultText || '官方默认'))),
          custom ? React.createElement(ConfirmButton, {
            label: '恢复官方默认', confirmLabel: '确认恢复官方默认',
            onConfirm: () => { if (onReset) onReset(); else onSet(null) }, resetKey: (value || '') + '|' + (hasOpacity ? (opacity == null ? 0 : opacity) : ''),
          }) : null,
          // 透明度滑条：opacityAlways=true（命令按钮）始终显示（官方默认色也可调）；默认 false（对话区）仅设色后显示（未设色无官方色可淡，拖动无效会困惑）
          hasOpacity && (opacityAlways || custom) ? React.createElement(OpacitySlider, { value: opacity, onChange: (v) => onOpacity(v) }) : null,
        )
      }

      // 对话区子版块（2026-08-21）：8 类背景（用户发言 / 行内代码 / 代码块背景 / 代码块滚动条 / 对话区滚动条 / 任务栏收起 / 任务栏展开 / 一键到底），默认官方
      // 渲染在「对话区」卡片内部（原待支持区块，现挂接本子版块）；底部"全部恢复官方默认"（任一改动过才显示，仿字体颜色）
      function ConversationEditor() {
        const { convBgs } = useStore()
        const hasCustom = !!convBgs.bubble || !!convBgs.inline || !!convBgs.code || !!convBgs.scrollbar || !!convBgs.chatScroll || !!convBgs.todoCollapsed || !!convBgs.todoExpanded || !!convBgs.toBottom || !!convBgs.bubbleOpacity || !!convBgs.inlineOpacity || !!convBgs.codeOpacity || !!convBgs.scrollbarOpacity || !!convBgs.chatScrollOpacity || !!convBgs.todoCollapsedOpacity || !!convBgs.todoExpandedOpacity || !!convBgs.toBottomOpacity
        return React.createElement('div', null,
          // v1.0.3：8 项全部支持透明度（opacity 数值大=透明；onReset 同时清色+清透明度）
          ConvBgRow({ label: '用户发言背景', value: convBgs.bubble, onSet: (v) => setConvBg('bubble', v), opacity: convBgs.bubbleOpacity == null ? 0 : convBgs.bubbleOpacity, onOpacity: (v) => setConvBg('bubbleOpacity', v), onReset: () => { setConvBg('bubble', null); setConvBg('bubbleOpacity', 0) } }),
          ConvBgRow({ label: '行内代码背景', value: convBgs.inline, onSet: (v) => setConvBg('inline', v), opacity: convBgs.inlineOpacity == null ? 0 : convBgs.inlineOpacity, onOpacity: (v) => setConvBg('inlineOpacity', v), onReset: () => { setConvBg('inline', null); setConvBg('inlineOpacity', 0) } }),
          // v0.9.19：代码块滚动条 / 对话区滚动条两行位置对调（元素整体移动，键跟随；用户要求交换位置+文本）
          // v0.9.20 小调整：代码块背景 / 代码块滚动条位置交换（背景在前、滚动条在后，更符合逻辑）
          ConvBgRow({ label: '代码块背景', value: convBgs.code, onSet: (v) => setConvBg('code', v), opacity: convBgs.codeOpacity == null ? 0 : convBgs.codeOpacity, onOpacity: (v) => setConvBg('codeOpacity', v), onReset: () => { setConvBg('code', null); setConvBg('codeOpacity', 0) } }),
          ConvBgRow({ label: '代码块滚动条', value: convBgs.scrollbar, onSet: (v) => setConvBg('scrollbar', v), opacity: convBgs.scrollbarOpacity == null ? 0 : convBgs.scrollbarOpacity, onOpacity: (v) => setConvBg('scrollbarOpacity', v), onReset: () => { setConvBg('scrollbar', null); setConvBg('scrollbarOpacity', 0) } }),
          ConvBgRow({ label: '对话区滚动条', value: convBgs.chatScroll, onSet: (v) => setConvBg('chatScroll', v), opacity: convBgs.chatScrollOpacity == null ? 0 : convBgs.chatScrollOpacity, onOpacity: (v) => setConvBg('chatScrollOpacity', v), onReset: () => { setConvBg('chatScroll', null); setConvBg('chatScrollOpacity', 0) } }),
          ConvBgRow({ label: '任务栏收起', value: convBgs.todoCollapsed, onSet: (v) => setConvBg('todoCollapsed', v), opacity: convBgs.todoCollapsedOpacity == null ? 0 : convBgs.todoCollapsedOpacity, onOpacity: (v) => setConvBg('todoCollapsedOpacity', v), onReset: () => { setConvBg('todoCollapsed', null); setConvBg('todoCollapsedOpacity', 0) } }),
          ConvBgRow({ label: '任务栏展开', value: convBgs.todoExpanded, onSet: (v) => setConvBg('todoExpanded', v), opacity: convBgs.todoExpandedOpacity == null ? 0 : convBgs.todoExpandedOpacity, onOpacity: (v) => setConvBg('todoExpandedOpacity', v), onReset: () => { setConvBg('todoExpanded', null); setConvBg('todoExpandedOpacity', 0) } }),
          ConvBgRow({ label: '一键到底', value: convBgs.toBottom, onSet: (v) => setConvBg('toBottom', v), opacity: convBgs.toBottomOpacity == null ? 0 : convBgs.toBottomOpacity, onOpacity: (v) => setConvBg('toBottomOpacity', v), onReset: () => { setConvBg('toBottom', null); setConvBg('toBottomOpacity', 0) }, noDefaultText: true }),
          hasCustom
            ? React.createElement('div', { style: { marginTop: '4px' } },
                React.createElement(ConfirmButton, {
                  label: '全部恢复官方默认', confirmLabel: '全部确认恢复官方默认',
                  onConfirm: resetAllConvBgs, resetKey: hasCustom, size: 'md',
                }),
              )
            : null,
        )
      }

      // 「侧边栏收起后 / 主界面侧边栏收起后」子版块（v1.0.4）：
      // 复用 AreaEditor 渲染嵌套配置（areas.sidebar.collapsed / areas.app.collapsedSidebar，默认 mode:'none' 官方原样）。
      // 简化：收起态无「无/透明」区分（模式列表去 transparent）；用独立 AreaEditor 实例 + 独立 area 描述。
      // v1.0.4 补充：主界面收起后的「显示区域」开关由 AreaEditor 内部渲染（area.id === 'collapsedSubApp'，
      // 与 app 同布局：标签行 → 显示区域 → 模式内容）；appLike=true 底色 = 主界面式（无开关、无透明度）
      function CollapsedAreaEditor({ label, value, onChange, ratio, appLike }) {
        // 收起态子版块的区域描述：mode 列表 = color/image/none（默认官方原样，无 transparent）
        // id：侧边栏收起后 = collapsedSub（sidebar 式底色）；主界面收起后 = collapsedSubApp（app 式底色，AreaEditor 按 id 区分）
        const innerId = appLike ? 'collapsedSubApp' : 'collapsedSub'
        const innerArea = React.useMemo(() => ({ id: innerId, label, supported: true, modes: ['none', 'color', 'image'] }), [innerId, label])
        return React.createElement('div', { style: { marginTop: '6px', borderTop: '1px dashed var(--dsw-alias-border-l2)', paddingTop: '6px' } },
          React.createElement('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginBottom: '4px' } }, '侧边栏收起后'),
          React.createElement(AreaEditor, { area: innerArea, value: value, onChange: onChange, ratio: ratio }),
        )
      }

      // 「界面」模块外壳（原 ModuleContent background 分支）：透明度说明 → 全部 AREAS 区域卡片（主界面/侧边栏/对话区/输入区/设置界面/浮窗面板/Cordis 插件界面）
      function BackgroundModule() {
        const { areas, sidebarInfo, showOpacityHint } = useStore()
        // 性能优化 2026-08-21：AreaEditor 已 memo 化 → onChange/children 必须稳定引用，
        // 否则父级每次重渲染都新建闭包/元素，memo 浅比较失效（所有区域跟着全量重渲染）
        const changeArea = React.useMemo(() => {
          const m = {}
          for (const a of AREAS) m[a.id] = (v) => setArea(a.id, v)
          return m
        }, [])
        // v1.0.4 收起态子版块 onChange（写回嵌套字段，触发 areas 引用变化 → AreaCss 重算）：
        // 稳定引用（useMemo），避免父级重渲染破坏 AreaEditor memo
        const changeCollapsed = React.useMemo(() => ({
          sidebar: (v) => setArea('sidebar', { ...areas.sidebar, collapsed: v }),
          app: (v) => setArea('app', { ...areas.app, collapsedSidebar: v }),
        }), [areas.sidebar, areas.app])
        const childModules = React.useMemo(() => ({
          // 「新会话」是侧边栏区块的一部分；「统计条/命令」是输入区区块的一部分（渲染在对应卡片内部末尾）；
          // 「对话区背景」是对话区区块的一部分（渲染在对话区卡片内部末尾）
          // 输入区卡片内部结构（v0.9.11 用户定）：底色（AreaEditor 内）→ 输入框高度（ComposerHeightRow，板块直属）→ 统计条/命令（ComposerEditor 子版块）
          // 浮窗面板卡片（v0.9.13）：背景调整（AreaEditor）+ 显示透明度说明勾选（children）
          // 各子版块自身订阅 store → store 变化时自行重渲染，不受父级跳过影响
          // v1.0.4：主界面/侧边栏卡片加「收起后」子版块（CollapsedAreaEditor 内部用独立 AreaEditor，自有 state）；
          // 侧边栏卡片的「侧边栏收起后」在最上方（用户定：在标志 BrandEditor 上面）
          sidebar: React.createElement(React.Fragment, null,
            // v1.0.4 收起后子版块：ratio 用窄栏实测比例（getCollapsedRatio，折叠时实测 / 展开时 ~60px 近似）
            React.createElement(CollapsedAreaEditor, { label: '侧边栏', value: (areas.sidebar && areas.sidebar.collapsed) || { mode: 'none', opacity: 0 }, onChange: changeCollapsed.sidebar, ratio: getCollapsedRatio() }),
            React.createElement(BrandEditor, null),
            React.createElement(NewSessionEditor, null),
          ),
          composer: React.createElement(React.Fragment, null,
            React.createElement(ComposerHeightRow, null),
            React.createElement(ComposerEditor, null),
          ),
          conversation: React.createElement(ConversationEditor, null),
          float: React.createElement(React.Fragment, null,
            React.createElement(SliderScrollEditor, null),
            React.createElement(OpacityHintToggle, null),
          ),
          cordis: React.createElement(CordisEntryToggle, null),
          details: React.createElement(DetailsResetPos, null),
        }), [areas.sidebar, areas.app, changeCollapsed, sidebarInfo])
        return React.createElement('div', null,
          showOpacityHint
            ? React.createElement('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginBottom: '8px', whiteSpace: 'pre-line' } },
                '透明度说明：数值越大越透明，数值越小越不透明。\n透明度为0时完全半透明，透明度为1时完全透明',
              )
            : null,
          AREAS.map((a) => React.createElement(AreaEditor, {
            // ⚠️ 防御：旧配置整体替换后新区域（float/details/cordis）可能缺失 → emptyArea 兜底（v0.9.13 事故修复）
            area: a, value: areas[a.id] && typeof areas[a.id] === 'object' ? areas[a.id] : emptyArea(), onChange: changeArea[a.id],
            ratio: getCropRatio(a),
            children: a.id === 'app'
              ? React.createElement(React.Fragment, null,
                  React.createElement(CollapsedAreaEditor, {
                    label: '主界面', appLike: true,
                    value: (areas.app && areas.app.collapsedSidebar) || { mode: 'none', opacity: 0 },
                    onChange: changeCollapsed.app,
                    // 收起后主界面选区比例：不包含侧边栏时 = (视口宽-窄栏宽)/高；包含时 = 整屏
                    ratio: (() => {
                      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
                      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
                      const cs = (areas.app && areas.app.collapsedSidebar) || {}
                      if (cs.includeSidebar === false) {
                        const sbw = sidebarInfo && sidebarInfo.width < 120 ? sidebarInfo.width : 60
                        return Math.max(0.1, (vw - sbw) / vh)
                      }
                      return vw / vh
                    })(),
                  }),
                  childModules[a.id] || null,
                )
              : (childModules[a.id] || null),
          })),
        )
      }
