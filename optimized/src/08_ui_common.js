      // ┌─ 片段 08_ui_common ─────────────────────────────
      // │ 职责：通用小组件与工具（裁剪/滑条/两步确认/底色行/选图裁剪 hook/裁剪比例）
      // │ 定义：CropPanel / OpacitySlider / ConfirmButton / BottomRow / useImageCrop / getCropRatio
      function CropPanel({ image, ratio, onConfirm, onCancel, maxDim }) {
        const imgRef = React.useRef(null)
        const [orig, setOrig] = React.useState(null)
        const [disp, setDisp] = React.useState(null)
        const [rect, setRect] = React.useState(null)
        const r = ratio || 16 / 9
        // 选区随 ratio 变化实时重算（如固定高度改行数 → 卡片比例变 → 选区按新比例；保持宽度、居中，超限则降宽）
        // 仅当 ratio 真正变化时重算（拖拽导致的 rect 变化直接跳过）
        const prevRatioRef = React.useRef(r)
        React.useLayoutEffect(() => {
          const prev = prevRatioRef.current
          prevRatioRef.current = r
          if (prev === r || !orig || !rect) return
          let w = rect.w
          let h = w / r
          if (h > orig.h) { h = orig.h; w = h * r }
          setRect({ x: (orig.w - w) / 2, y: (orig.h - h) / 2, w, h })
        }, [r, orig, rect])
        const onImgLoad = (e) => {
          const el = e.target
          const iw = el.naturalWidth, ih = el.naturalHeight
          setOrig({ w: iw, h: ih })
          setDisp({ w: el.clientWidth, h: el.clientHeight })
          let w = iw, h = w / r
          if (h > ih) { h = ih; w = h * r }
          setRect({ x: (iw - w) / 2, y: (ih - h) / 2, w, h })
        }
        const computeRect = (r0, dx, mode, maxW, maxH, r2) => {
          let w = r0.w, x = r0.x
          if (mode === 'se' || mode === 'ne') { w = r0.w + dx; x = r0.x }
          else if (mode === 'sw' || mode === 'nw') { w = r0.w - dx; x = r0.x + dx }
          else { x = r0.x + dx }
          let h = w / r2
          const MIN = 48
          if (h > maxH) { h = maxH; w = h * r2 }
          if (w > maxW) { w = maxW; h = w / r2 }
          if (w < MIN) { w = MIN; h = w / r2 }
          if (x < 0) x = 0
          if (x + w > maxW) x = maxW - w
          let y = r0.y
          if (mode === 'nw' || mode === 'ne') y = r0.y + (r0.h - h)
          if (y < 0) y = 0
          if (y + h > maxH) y = maxH - h
          return { x, y, w, h }
        }
        const startDrag = (e, mode) => {
          if (!orig || !rect) return
          e.preventDefault()
          e.stopPropagation()
          const scale = disp.w / orig.w
          const sx = e.clientX, sy = e.clientY
          const r0 = { ...rect }
          const move = (ev) => {
            const dx = (ev.clientX - sx) / scale
            const dy = (ev.clientY - sy) / scale
            const next = computeRect(r0, dx, mode, orig.w, orig.h, r)
            if (mode === 'move') next.y = Math.max(0, Math.min(orig.h - next.h, r0.y + dy))
            setRect(next)
          }
          const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
          }
          window.addEventListener('pointermove', move)
          window.addEventListener('pointerup', up)
        }
        const confirm = () => {
          if (!orig || !rect || !imgRef.current) return
          try {
            // maxDim 限制输出最长边（背景大图 downscale：小 dataURI 存得下 localStorage、CSS 变量替换不超限、重绘快）
            let w = Math.max(1, Math.round(rect.w))
            let h = Math.max(1, Math.round(rect.h))
            if (typeof maxDim === 'number' && maxDim > 0 && Math.max(w, h) > maxDim) {
              const scale = maxDim / Math.max(w, h)
              w = Math.max(1, Math.round(w * scale))
              h = Math.max(1, Math.round(h * scale))
            }
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const c2d = canvas.getContext('2d')
            c2d.drawImage(imgRef.current, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height)
            // WebP 0.92（支持透明 + 体积小，背景图 dataURI 更小）；老浏览器回退 PNG
            let out
            try { out = canvas.toDataURL('image/webp', 0.92) } catch (e) { out = canvas.toDataURL('image/png') }
            onConfirm({ dataURI: out, fileName: '裁剪背景.webp', fit: 'cover' })
          } catch (err) {
            onConfirm({ dataURI: image, fileName: '原图背景.png', fit: 'cover' })
          }
        }
        if (!image) return null
        const H = 18
        const hd = (mode, hx, vy) => ({
          mode,
          left: (rect ? (rect.x / orig.w) * disp.w + (rect.w / orig.w) * disp.w * hx : 0) - H / 2,
          top: (rect ? (rect.y / orig.h) * disp.h + (rect.h / orig.h) * disp.h * vy : 0) - H / 2,
        })
        const handles = [hd('nw', 0, 0), hd('ne', 1, 0), hd('sw', 0, 1), hd('se', 1, 1)]
        return React.createElement('div', { style: { marginBottom: '12px' } },
          React.createElement('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginBottom: '6px' } },
            '选区宽高比 = ' + r.toFixed(2) + '：拖框内移动，拖四角调整大小。'),
          React.createElement('div', { style: { position: 'relative', display: 'inline-block', maxWidth: '100%' } },
            React.createElement('img', { ref: imgRef, src: image, onLoad: onImgLoad, draggable: false, style: { display: 'block', maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', userSelect: 'none' } }),
            orig && disp && rect
              ? React.createElement(React.Fragment, null,
                  React.createElement('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: '4px' } },
                    React.createElement('div', { style: { position: 'absolute', left: (rect.x / orig.w) * disp.w, top: (rect.y / orig.h) * disp.h, width: (rect.w / orig.w) * disp.w, height: (rect.h / orig.h) * disp.h, border: '2px solid #4f8cff', boxSizing: 'border-box', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' } })),
                  React.createElement('div', { onPointerDown: (e) => startDrag(e, 'move'), style: { position: 'absolute', left: (rect.x / orig.w) * disp.w, top: (rect.y / orig.h) * disp.h, width: (rect.w / orig.w) * disp.w, height: (rect.h / orig.h) * disp.h, cursor: 'move', border: '2px solid #4f8cff', boxSizing: 'border-box' } }),
                  handles.map((h2) => React.createElement('div', { key: h2.mode, onPointerDown: (e) => startDrag(e, h2.mode), style: { position: 'absolute', width: H, height: H, borderRadius: '4px', background: '#4f8cff', border: '2px solid #fff', boxSizing: 'border-box', cursor: h2.mode === 'se' || h2.mode === 'nw' ? 'nwse-resize' : 'nesw-resize', left: h2.left, top: h2.top, zIndex: 5 } })),
                )
              : null,
          ),
          React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } },
            React.createElement('button', { type: 'button', onClick: confirm, style: { padding: '6px 18px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: 'var(--dsw-alias-brand-primary)', color: '#fff', fontWeight: 600, fontSize: '13px', position: 'relative', zIndex: 10 } }, '✓ 应用选区'),
            React.createElement('button', { type: 'button', onClick: onCancel, style: { padding: '6px 18px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'none', fontSize: '13px', position: 'relative', zIndex: 10 } }, '✕ 取消'),
          ),
        )
      }

      // 拖动型控件（透明度滑块/颜色选择器）的保存抑制：拖动开始 suppressSave(owner)（期间 saveNow 跳过写 localStorage），
      // pointerup/失焦 commitSave(owner) 提交一次。owner 由各控件组件自持（useRef(++dragOwnerSeq)），
      // ⚠️ v0.9.14：owner 唯一 → blur/pointerup 只提交本控件开的窗口（拖完 A 直接拖 B 不互相干扰）
      let dragOwnerSeq = 0

      // 统一恢复按钮样式三件套（v0.9.18）：未确认态 = 黑字红框；确认态 = 红底白字；取消 = 灰框。
      // 尺寸三档：sm = 行内小按钮（4px 10px）/ md = 板块底部（5px 14px）/ lg = 全局恢复默认大按钮（8px 18px）。
      // ConfirmButton / TripleConfirmButton 的 size prop 引用（2026-08-22 梳理去重：此前 10+ 处整段复制粘贴）
      const RESET_BTN_SIZES = {
        sm: {
          style: { padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'none', color: 'var(--dsw-alias-label-primary)', fontSize: '12px' },
          confirmStyle: { padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-state-error-primary)', color: '#fff', fontSize: '12px' },
          cancelStyle: { padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'none', fontSize: '12px' },
        },
        md: {
          style: { padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'none', color: 'var(--dsw-alias-label-primary)', fontSize: '12px' },
          confirmStyle: { padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-state-error-primary)', color: '#fff', fontSize: '12px' },
          cancelStyle: { padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'none', fontSize: '12px' },
        },
        lg: {
          style: { padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'none', color: 'var(--dsw-alias-label-primary)', fontSize: '13px' },
          confirmStyle: { padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-state-error-primary)', color: '#fff', fontSize: '13px' },
          cancelStyle: { padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'none', fontSize: '13px' },
        },
      }

      // 自定义颜色选择器（性能优化 2026-08-21 重构）：替代原生 input type=color（Chrome 系统对话框拖动卡）。
      // 色盘形式（直观）：SV 二维色板（横轴饱和度 × 纵轴明度，左上白/右上纯色相/下缘黑）+ 色相条（0-359，到顶不跳 0）+ hex 输入。
      // 拖动走 setXxx 抑制路径（manualCssRefresh，零全局 React 渲染）；HSV 本地保留（白色会丢 H/S，拖动中不能反推覆盖）。
      // 色块点击展开/收起；色盘为 absolute 浮层（不挤动同行元素，如恢复默认按钮位置不变）；点击色盘外关闭。
      function ColorField({ value, onChange, swatchStyle }) {
        const [open, setOpen] = React.useState(false)
        const [hexDraft, setHexDraft] = React.useState(null)
        const [preview, setPreview] = React.useState(null)
        // 本地 HSV：拖动中保留（亮度拖到 100 变白时 H/S 不归零）；外部 value 变化（非拖动，如应用预设）时同步
        const [hsv, setHsv] = React.useState(() => hexToHsv(value || '#ffffff'))
        const draggingRef = React.useRef(false)
        const rootRef = React.useRef(null)
        const boardRef = React.useRef(null)
        const hueRef = React.useRef(null)
        // 本控件唯一 owner（v0.9.14）：beginDrag/endDrag 共用，避免与其他滑条的抑制窗口互扰
        const ownerRef = React.useRef(++dragOwnerSeq)
        React.useEffect(() => {
          if (draggingRef.current) return
          setHsv(hexToHsv(value || '#ffffff'))
        }, [value])
        // 点击色盘外关闭（capture：色盘内点击/拖动不触发）
        React.useEffect(() => {
          if (!open) return undefined
          const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
          }
          document.addEventListener('click', onDoc, true)
          return () => document.removeEventListener('click', onDoc, true)
        }, [open])
        const h = hsv[0], s = hsv[1], vv = hsv[2]
        const v = preview || value || '#ffffff'
        const shownHex = hexDraft != null ? hexDraft : v
        const beginDrag = () => { draggingRef.current = true; suppressSave(ownerRef.current) }
        const endDrag = () => { draggingRef.current = false; setPreview(null); commitSave(ownerRef.current) }
        const emit = (hx, s2, v2) => {
          const hex = hsvToHex(hx, s2, v2)
          setHsv([hx, s2, v2])
          setHexDraft(null)
          setPreview(hex)
          onChange(hex)
        }
        // SV 色板：横轴饱和度（左 0 → 右 100），纵轴明度（下 0 → 上 100）
        const onBoardPointer = (e) => {
          const el = boardRef.current
          if (!el) return
          try { el.setPointerCapture(e.pointerId) } catch (err) { /* 忽略 */ }
          const r = el.getBoundingClientRect()
          const s2 = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
          const v2 = Math.max(0, Math.min(100, (1 - (e.clientY - r.top) / r.height) * 100))
          emit(h, s2, v2)
        }
        // 色相条（竖排，与色板等高 180px ≈ 2°/px；0-359，到顶不跳 0）
        const onHuePointer = (e) => {
          const el = hueRef.current
          if (!el) return
          try { el.setPointerCapture(e.pointerId) } catch (err) { /* 忽略 */ }
          const r = el.getBoundingClientRect()
          const h2 = Math.max(0, Math.min(359, ((e.clientY - r.top) / r.height) * 360))
          emit(h2, s, vv)
        }
        const commitHex = () => {
          const raw = (hexDraft != null ? hexDraft : v).trim()
          setHexDraft(null)
          const m = raw.match(/^#?([0-9a-f]{6})$/i)
          if (m) onChange('#' + m[1].toLowerCase())
        }
        return React.createElement('div', { ref: rootRef, style: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' } },
          React.createElement('button', { type: 'button', onClick: () => setOpen(!open), title: open ? '收起颜色调整' : '展开颜色调整', // 色块加黑框（v0.9.18）：默认白/浅色块在白色界面上边界看不清 → 黑框分隔（swatchStyle 可覆盖）
            style: { width: '26px', height: '24px', borderRadius: '6px', border: '1px solid #000', background: v, cursor: 'pointer', padding: 0, flex: 'none', ...(swatchStyle || {}) } }),
          React.createElement('input', { value: shownHex, onChange: (e) => setHexDraft(e.target.value), onBlur: commitHex, onKeyDown: (e) => { if (e.key === 'Enter') { commitHex(); e.currentTarget.blur() } }, style: { width: '76px', padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-primary)' } }),
          // absolute 浮层：不占 flex 布局流 → 同行恢复默认等按钮位置不随展开变动；点外部（document click）关闭
          // 尺寸：180×180 正方形 SV 色板 + 右侧竖色相条（等高）→ 面板约 220×200 接近正方形、两维精度均衡（主流 picker 规格）
          open ? React.createElement('div', { style: { position: 'absolute', left: '0', top: 'calc(100% + 6px)', zIndex: 60, width: '220px', padding: '8px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '8px', background: 'var(--dsw-alias-bg-layer-1)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' } },
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              // SV 色板（正方形：S/V 两维精度均衡）
              React.createElement('div', { ref: boardRef, onPointerDown: (e) => { beginDrag(); onBoardPointer(e) }, onPointerMove: (e) => { if (e.buttons === 1) onBoardPointer(e) }, onPointerUp: endDrag, onPointerCancel: endDrag, style: { position: 'relative', flex: '1 1 auto', height: '180px', borderRadius: '8px', cursor: 'crosshair', touchAction: 'none', background: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(' + h + ',100%,50%))' } },
                React.createElement('div', { style: { position: 'absolute', left: 'calc(' + s + '% - 7px)', top: 'calc(' + (100 - vv) + '% - 7px)', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 2px rgba(0,0,0,0.6)', boxSizing: 'border-box', pointerEvents: 'none' } }),
              ),
              // 色相条（竖排，与色板等高）
              React.createElement('div', { ref: hueRef, onPointerDown: (e) => { beginDrag(); onHuePointer(e) }, onPointerMove: (e) => { if (e.buttons === 1) onHuePointer(e) }, onPointerUp: endDrag, onPointerCancel: endDrag, style: { position: 'relative', flex: 'none', width: '14px', height: '180px', borderRadius: '7px', cursor: 'pointer', touchAction: 'none', background: 'linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' } },
                React.createElement('div', { style: { position: 'absolute', left: '-2px', right: '-2px', top: 'calc(' + (h / 360 * 100) + '% - 2px)', height: '4px', borderRadius: '2px', background: '#fff', border: '1px solid rgba(0,0,0,0.5)', boxSizing: 'border-box', pointerEvents: 'none' } }),
              ),
            ),
          ) : null,
        )
      }

      function OpacitySlider({ value, onChange, label }) {
        // 拖动中本地预览（性能优化 2026-08-21）：拖动期 onChange 走 setXxx 抑制路径（manualCssRefresh，无全局 React 渲染），
        // 数值文本用本地预览跟随；松开后清预览 + commitSave（saveNow + notify 同步全局）
        // label 可选（默认"透明度"；BottomRow 传"底色透明度"等）——2026-08-22 梳理去重：BottomRow 内联滑条改为复用本组件
        const [preview, setPreview] = React.useState(null)
        const v = preview != null ? preview : (value == null ? 1 : value)
        // 本控件唯一 owner（v0.9.14）：endDrag（pointerup/blur 共用）只提交自己开的窗口
        const ownerRef = React.useRef(++dragOwnerSeq)
        const endDrag = () => { setPreview(null); commitSave(ownerRef.current) }
        return React.createElement('div', { style: { fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' } },
          React.createElement('span', null, label || '透明度:'),
          React.createElement('input', { 'data-thmcz-range': true, style: { '--tcz-range-val': Math.round(v * 100) + '%' }, type: 'range', min: '0', max: '1', step: '0.05', value: v, onChange: (e) => { const nv = parseFloat(e.target.value); setPreview(nv); onChange(nv) }, onPointerDown: () => suppressSave(ownerRef.current), onPointerUp: endDrag, onBlur: endDrag }),
          React.createElement('span', { style: { minWidth: '38px', fontVariantNumeric: 'tabular-nums' } }, v.toFixed(2)),
        )
      }

      // 两步确认按钮（通用）：第一次点击进入确认态，再点执行；resetKey 变化（外部改动）自动解除确认态。
      // size：sm/md/lg（RESET_BTN_SIZES 统一恢复按钮样式，v0.9.18）；style/confirmStyle/cancelStyle 显式传入时覆盖 size 默认
      function ConfirmButton({ label, confirmLabel, onConfirm, style, confirmStyle, cancelStyle, resetKey, size }) {
        const S = RESET_BTN_SIZES[size || 'sm']
        const [armed, setArmed] = React.useState(false)
        const prevKeyRef = React.useRef(resetKey)
        if (prevKeyRef.current !== resetKey) {
          prevKeyRef.current = resetKey
          if (armed) setArmed(false)
        }
        return React.createElement(React.Fragment, null,
          React.createElement('button', { type: 'button', onClick: () => { if (!armed) { setArmed(true); return } setArmed(false); onConfirm() }, style: armed ? (confirmStyle || S.confirmStyle) : (style || S.style) }, armed ? confirmLabel : label),
          armed ? React.createElement('button', { type: 'button', onClick: () => setArmed(false), style: cancelStyle || S.cancelStyle }, '取消') : null,
        )
      }

      // 三级确认按钮（v0.9.16，全局恢复默认专用）：第一次 → confirmLabel1，第二次 → confirmLabel2，第三次 → 执行。
      // 主按钮居中；确认态时取消按钮换行到下面（独立行）。
      // resetKey 变化（外部改动）自动解除确认态回到初始；size 同 ConfirmButton（默认 lg）
      function TripleConfirmButton({ label, confirmLabel1, confirmLabel2, onConfirm, style, confirmStyle, cancelStyle, resetKey, size }) {
        const S = RESET_BTN_SIZES[size || 'lg']
        const [stage, setStage] = React.useState(0)
        const prevKeyRef = React.useRef(resetKey)
        if (prevKeyRef.current !== resetKey) {
          prevKeyRef.current = resetKey
          if (stage !== 0) setStage(0)
        }
        const curStyle = stage === 0 ? (style || S.style) : (confirmStyle || S.confirmStyle)
        const curLabel = stage === 0 ? label : (stage === 1 ? confirmLabel1 : confirmLabel2)
        return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } },
          React.createElement('button', { type: 'button', onClick: () => { if (stage < 2) { setStage(stage + 1); return } setStage(0); onConfirm() }, style: curStyle }, curLabel),
          stage > 0
            ? React.createElement('button', { type: 'button', onClick: () => setStage(0), style: cancelStyle || S.cancelStyle }, '取消')
            : null,
        )
      }

      // 底色编辑器行（侧边栏 / 新会话 / 主界面共用）：
      // 行1 开关+颜色+恢复默认（改动过才显示，noSwitch=true 时常驻无开关）；行2 底色透明度（hideOpacity=true 时隐藏）
      function BottomRow({ value, onChange, style, title, hideOpacity, noSwitch }) {
        const enabled = noSwitch ? true : !!value.bottomEnabled
        const resetShown = hideOpacity
          ? (value.bottomColor && value.bottomColor !== '#ffffff')
          : (value.bottomColor && value.bottomColor !== '#ffffff') || (value.bottomOpacity != null && value.bottomOpacity !== 0)
        return React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', ...style } },
            noSwitch
              ? React.createElement('span', { style: { fontSize: '13px' } }, title || '底色')
              : React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } },
                  React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!value.bottomEnabled, onChange: (e) => onChange({ bottomEnabled: e.target.checked, ...(e.target.checked && !value.bottomColor ? { bottomColor: '#ffffff' } : {}) }) }),
                  React.createElement('span', null, title || '底色'),
                ),
            enabled
              ? React.createElement(React.Fragment, null,
                  React.createElement(ColorField, { value: value.bottomColor || '#ffffff', onChange: (hex) => onChange({ bottomColor: hex }) }),
                  resetShown
                    ? React.createElement(ConfirmButton, {
                        label: '恢复默认', confirmLabel: '确认恢复默认',
                        onConfirm: () => onChange(hideOpacity ? { bottomColor: '#ffffff' } : { bottomColor: '#ffffff', bottomOpacity: 0 }),
                        resetKey: (value.bottomColor || '') + '|' + (hideOpacity ? '' : (value.bottomOpacity == null ? '' : value.bottomOpacity)),
                      })
                    : null,
                )
              : null,
          ),
          enabled && !hideOpacity
            ? React.createElement(OpacitySlider, { label: (title || '底色') + '透明度:', value: value.bottomOpacity == null ? 0 : value.bottomOpacity, onChange: (v) => onChange({ bottomOpacity: v }) })
            : null,
        )
      }

      // 选图 + 裁剪流程（AreaEditor / NewSessionEditor 共用）：选文件 → FileReader → 进入裁剪 stage。
      // maxDim：大图读入后先降采样（dataURL >1.5MB 时），避免超大 dataURI 进内存/CSS/localStorage（见 downscaleDataUrl）
      function useImageCrop(beforePick, maxDim) {
        const [stage, setStage] = React.useState('none')
        const [rawImage, setRawImage] = React.useState(null)
        const fileRef = React.useRef(null)
        const handleFile = (e) => {
          const file = e.target.files && e.target.files[0]
          if (!file) return
          if (typeof beforePick === 'function') beforePick()
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = String(reader.result)
            if (typeof maxDim === 'number' && maxDim > 0 && dataUrl.length > 1500000) {
              // 大图：异步降采样到 maxDim 再进裁剪面板（Image.onload 事件回调，非定时器）
              downscaleDataUrl(dataUrl, maxDim, (small) => { setRawImage(small); setStage('crop') })
            } else {
              setRawImage(dataUrl)
              setStage('crop')
            }
          }
          reader.readAsDataURL(file)
          e.target.value = ''
        }
        const closeCrop = () => { setStage('none'); setRawImage(null) }
        return { stage, rawImage, fileRef, handleFile, closeCrop }
      }

      // 裁剪宽高比：侧边栏按实测比例；主界面"不包含侧边栏"按剩余区域；输入区固定高度时按卡片实测，否则视口比例；
      // 设置界面（details）按设置面板实际尺寸公式（VOzbGW_panel：width 800px/max-width 100vw-48，height min(800px,100vh-48)）——CSS 固定，公式精确无需读 DOM；
      // 浮窗面板（float）按浮窗默认尺寸 560×640（0.875）；
      // Cordis（cordis）按面板 420px 宽 × max-height 60vh → 视口近似（0.42*vw / min(0.6*vh, 面板实际) 简化取 420/可显示高）
      function getCropRatio(a) {
        if (a.id === 'sidebar' && sidebarInfo) return sidebarInfo.ratio
        if (a.id === 'float') return (floatPos.width || 560) / (floatPos.height || 640)
        if (a.id === 'cordis') {
          // v0.9.15：面板打开时用实测宽高比（cordisCardRatio，AreaCss useLayoutEffect+observer 维护）；
          // 未打开（面板不在 DOM）时回退固定近似：宽 420 / 高 60vh
          if (cordisCardRatio && cordisCardRatio > 0) return cordisCardRatio
          const vh = typeof window !== 'undefined' ? window.innerHeight : 800
          return 420 / Math.min(0.6 * vh, vh - 200)
        }
        if (a.id === 'details') {
          const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
          const vh = typeof window !== 'undefined' ? window.innerHeight : 800
          const w = Math.min(800, vw - 48)
          const h = Math.min(800, vh - 48)
          if (w > 0 && h > 0) return w / h
          return 1
        }
        if (a.id === 'composer') {
          // 输入区固定高度：用布局后实测的卡片宽高比（composerCardRatio，AreaCss useLayoutEffect 维护）；
          // 否则视口近似（输入框高度动态增减时）
          if (composerFixedHeight && composerCardRatio) return composerCardRatio
          if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) return window.innerWidth / window.innerHeight
          return 16 / 9
        }
        if (a.id === 'app' && areas.app.includeSidebar === false && sidebarInfo && sidebarInfo.width) {
          return (window.innerWidth - sidebarInfo.width) / window.innerHeight
        }
        if (typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0) {
          return window.innerWidth / window.innerHeight
        }
        return 16 / 9
      }
      // v1.0.4 侧边栏收起后子版块裁剪比例：窄栏极窄（宽 ~52-70px / 高 ~视口），与展开侧边栏/视口比例完全不同。
      // 折叠时用 sidebarInfo 实测窄栏比例；展开时用官方窄栏宽度近似（rail 模式 ~60px）/ 视口高度
      function getCollapsedRatio() {
        if (sidebarInfo && sidebarInfo.collapsed && sidebarInfo.width > 0 && sidebarInfo.height > 0) {
          return sidebarInfo.width / sidebarInfo.height
        }
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800
        return 60 / vh
      }
