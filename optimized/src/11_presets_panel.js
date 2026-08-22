      // ┌─ 片段 11_presets_panel ─────────────────────────
      // │ 职责：预设板块交互 + UI（保存/导入/同名覆盖/放弃/应用/删除/导出/重命名/拖拽排序 FLIP）
      // │ 数据层在 06_presets.js（IndexedDB + applyPresetData）
      // │ ⚠️ 保留 useStore(['preset']) 订阅：预设异步加载/拖拽排序后靠 preset 通道触发重渲染，去掉订阅列表不会刷新
      // memo 化 + 通道订阅（性能优化 2026-08-21）：只订阅 preset 通道（loadPresets 异步完成/拖拽排序刷新），
      // 不订阅 main 通道 → 颜色/透明度/背景拖动时预设面板不再跟着每帧重渲染（最大组件，收益最大）
      const PresetsPanel = React.memo(function PresetsPanel() {
        const [presetMsg, setPresetMsg] = React.useState('')
        const [newPresetName, setNewPresetName] = React.useState('')
        const [naming, setNaming] = React.useState(false)
        // 同名冲突：{ kind: 'save' | 'import', name, data, targetId }；null = 无冲突
        const [conflict, setConflict] = React.useState(null)
        // 预设删除：两步确认（记录待确认删除的预设 id）
        const [confirmDeleteId, setConfirmDeleteId] = React.useState(null)
        const [renameTargetId, setRenameTargetId] = React.useState(null)
        const [renameInput, setRenameInput] = React.useState('')
        const [dragIndex, setDragIndex] = React.useState(null)
        const dragIndexRef = React.useRef(null)
        const listRef = React.useRef(null)
        const flipDataRef = React.useRef(null)
        const presetFileRef = React.useRef(null)
        useStore(['preset'])
        // FLIP 动画：预设重排后，各行从旧位置平滑过渡到新位置（拖拽交换时其他行也有移动动画）
        React.useEffect(() => {
          if (!flipDataRef.current || !listRef.current) return
          const rows = listRef.current.querySelectorAll('[data-preset-row]')
          rows.forEach((el) => {
            const oldTop = flipDataRef.current.get(el)
            if (oldTop === undefined) return
            const newTop = el.getBoundingClientRect().top
            const dy = oldTop - newTop
            if (dy !== 0) {
              el.style.transition = 'none'
              el.style.transform = 'translateY(' + dy + 'px)'
              void el.offsetHeight // 强制 reflow
              el.style.transition = 'transform 160ms ease'
              el.style.transform = 'translateY(0px)'
            }
          })
          flipDataRef.current = null
        }, [presets])
        // P5 预设：本地预设库（最多 10 个，IndexedDB 存储）；保存/应用/重命名/删除/导出单个/导入
        const handlePresetFile = (e) => {
          const file = e.target.files && e.target.files[0]
          if (!file) return
          setConfirmDeleteId(null)
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const c = JSON.parse(String(reader.result))
              if (!c || typeof c !== 'object' || !c.areas || typeof c.areas !== 'object') throw new Error('不是有效的主题预设文件')
              const base = (file.name || '导入预设').replace(/\.tczp$/i, '').replace(/\.json$/i, '').trim() || '导入预设'
              // 同名检测：已有同名预设时不直接入库，提示用户选择（覆盖 / 放弃）
              const dup = presets.find((p) => p.name === base)
              if (dup) {
                setConflict({ kind: 'import', name: base, data: c, targetId: dup.id })
                setPresetMsg('')
                return
              }
              // 预设库满员：直接拒绝导入（不应用设置），提示失败
              if (presets.length >= PRESET_LIMIT) {
                setPresetMsg('❌ 导入失败：能保存的预设数量达到上限（' + PRESET_LIMIT + ' 个），请先删除部分预设后再导入')
                return
              }
              applyPresetData(c) // 应用（setter 路径 + 末尾统一保存）
              const newItem = { id: String(Date.now()) + '-' + presets.length, name: base, savedAt: Date.now(), data: c }
              presets = [...presets, newItem]
              savePresets().then(() => {
                // 导入后更新"当前预设"显示
                lastAppliedId = newItem.id
                try { window.localStorage.setItem('theme-customizer-last-applied', newItem.id) } catch (e) { /* 忽略 */ }
                setPresetMsg('✅ 导入成功：设置已恢复，并已存入预设库（' + presets.length + '/' + PRESET_LIMIT + '）')
              }).catch(() => {
                presets = presets.slice(0, -1)
                setPresetMsg('✅ 导入成功：设置已恢复。⚠️ 预设库存储空间不足（图片较大），未存入库')
              })
            } catch (err) {
              const stack = err && err.stack ? String(err.stack).split('\n').slice(0, 3).join(' | ') : ''
              setPresetMsg('❌ 导入失败：' + (err && err.message ? err.message : String(err)) + (stack ? ' | ' + stack : ''))
            }
          }
          reader.readAsText(file)
          e.target.value = ''
        }
        const savePreset = () => {
          setConfirmDeleteId(null)
          const name = (newPresetName || '').trim() || ('预设 ' + (presets.length + 1))
          // 同名检测：已有同名预设时不直接保存，提示用户选择（覆盖 / 放弃）
          const dup = presets.find((p) => p.name === name)
          if (dup) {
            setConflict({ kind: 'save', name, data: null, targetId: dup.id })
            setPresetMsg('')
            return
          }
          if (presets.length >= PRESET_LIMIT) {
            setPresetMsg('❌ 能保存的预设数量达到上限（' + PRESET_LIMIT + ' 个），请先删除部分预设')
            return
          }
          // ⚠️ 必须深拷贝快照（JSON 往返）：data 里的 areas/colors 若直接引用当前对象，
          // 保存后修改设置会让已存预设"跟随"变化（应用时读到的是当前设置而非保存快照）
          const data = JSON.parse(JSON.stringify({ v: 1, opacitySem: 4, areas, colors, cordisEntry, floatModules, floatShowReset, floatPos, floatVisible, newSession, brand, brandHarness, borders, detailsPos, detailsDragEnabled, showOpacityHint, convBgs }))
          const newItem = { id: String(Date.now()) + '-' + presets.length, name, savedAt: Date.now(), data }
          presets = [...presets, newItem]
          savePresets().then(() => {
            setNewPresetName('')
            setNaming(false)
            // 保存后更新"当前预设"显示
            lastAppliedId = newItem.id
            try { window.localStorage.setItem('theme-customizer-last-applied', newItem.id) } catch (e) { /* 忽略 */ }
            setPresetMsg('✅ 已保存预设：' + name + '（' + presets.length + '/' + PRESET_LIMIT + '）')
          }).catch(() => {
            presets = presets.slice(0, -1)
            setPresetMsg('❌ 保存失败：存储空间不足（图片较大），请删除部分预设或换用较小图片')
          })
        }
        // 同名冲突：覆盖当前同名预设（保留原 id 和排序位置，仅更新数据）
        const confirmOverwrite = () => {
          if (!conflict) return
          setConfirmDeleteId(null)
          const targetId = conflict.targetId
          const name = conflict.name
          const oldItem = presets.find((p) => p.id === targetId)
          if (!oldItem) { setConflict(null); return }
          if (conflict.kind === 'save') {
            // 保存覆盖：用当前设置生成深拷贝快照
            const data = JSON.parse(JSON.stringify({ v: 1, opacitySem: 4, areas, colors, cordisEntry, floatModules, floatShowReset, floatPos, floatVisible, newSession, brand, brandHarness, borders, detailsPos, detailsDragEnabled, showOpacityHint, convBgs }))
            presets = presets.map((p) => p.id === targetId ? { ...p, name, savedAt: Date.now(), data } : p)
            savePresets().then(() => {
              setConflict(null)
              setNewPresetName('')
              setNaming(false)
              setPresetMsg('✅ 已覆盖同名预设：' + name)
            }).catch(() => {
              presets = presets.map((p) => p.id === targetId && oldItem ? oldItem : p)
              setPresetMsg('❌ 覆盖失败：存储空间不足（图片较大），原预设未变')
            })
          } else {
            // 导入覆盖：应用文件设置 + 覆盖该预设数据
            try { applyPresetData(conflict.data) } catch (err) {
              setConflict(null)
              setPresetMsg('❌ 覆盖失败：' + (err && err.message ? err.message : String(err)))
              return
            }
            presets = presets.map((p) => p.id === targetId ? { ...p, name, savedAt: Date.now(), data: conflict.data } : p)
            savePresets().then(() => {
              setConflict(null)
              setPresetMsg('✅ 导入成功：已覆盖同名预设 ' + name + '（设置已恢复）')
            }).catch(() => {
              presets = presets.map((p) => p.id === targetId && oldItem ? oldItem : p)
              setPresetMsg('❌ 导入成功：设置已恢复。⚠️ 覆盖入库失败（空间不足），原预设未变')
            })
          }
        }
        // 同名冲突：放弃增加预设（保存=清空命名框关闭；导入=不入库不应用）
        const cancelConflict = () => {
          const wasSave = conflict && conflict.kind === 'save'
          setConfirmDeleteId(null)
          setConflict(null)
          if (wasSave) {
            setNewPresetName('')
            setNaming(false)
            setPresetMsg('⏹ 已放弃保存：未增加预设')
          } else {
            setPresetMsg('⏹ 已放弃导入：未增加预设')
          }
        }
        const applyPreset = (item) => {
          setConfirmDeleteId(null)
          try {
            applyPresetData(item.data)
            lastAppliedId = item.id
            try { window.localStorage.setItem('theme-customizer-last-applied', item.id) } catch (e) { /* 忽略 */ }
            setPresetMsg('✅ 已应用预设：' + item.name)
          } catch (err) {
            setPresetMsg('❌ 应用预设失败：' + (err && err.message ? err.message : String(err)))
          }
        }
        const deletePreset = (id) => {
          // 两步确认：第一次点击进入确认态（按钮变"确认删除"），再点才真正删除
          if (confirmDeleteId !== id) { setConfirmDeleteId(id); setPresetMsg(''); return }
          setConfirmDeleteId(null)
          const it = presets.find((p) => p.id === id)
          presets = presets.filter((p) => p.id !== id)
          if (lastAppliedId === id) {
            lastAppliedId = null
            try { window.localStorage.removeItem('theme-customizer-last-applied') } catch (e) { /* 忽略 */ }
          }
          idbDelete(id).then(() => {
            setPresetMsg('🗑 已删除预设：' + (it ? it.name : '') + '（剩余 ' + presets.length + '/' + PRESET_LIMIT + '）')
          }).catch(() => {
            setPresetMsg('⚠️ 已从列表移除，但存储清理失败（刷新后可能重现），请重试')
          })
        }
        // 导出指定预设为 .tczp 文件（原"导出当前设置"废弃）
        const exportPresetItem = (item) => {
          setConfirmDeleteId(null)
          try {
            const blob = new Blob([JSON.stringify(item.data)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = (item.name || '预设').replace(/[\\/:*?"<>|]/g, '-') + '.tczp'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            try { URL.revokeObjectURL(url) } catch (e) { /* 忽略 */ }
            setPresetMsg('✅ 已导出预设：' + item.name + '（.tczp，含图片）')
          } catch (e) {
            setPresetMsg('❌ 导出失败：' + (e && e.message ? e.message : String(e)))
          }
        }
        const startRename = (item) => { setConfirmDeleteId(null); setRenameTargetId(item.id); setRenameInput('') }
        const cancelRename = () => { setConfirmDeleteId(null); setRenameTargetId(null); setRenameInput('') }
        // 拖拽排序：三条灰线手柄 → 按起始位置+行高推算目标（不读实时 DOM，避免高频 pointermove 下 React 渲染滞后导致边界抖动）→ FLIP 动画 → 松手保存
        const startDragPreset = (e, index) => {
          if (e.button !== 0) return
          e.preventDefault()
          setConfirmDeleteId(null)
          dragIndexRef.current = index
          setDragIndex(index)
          // 拖拽期间锁定光标（grabbing）并禁止选中，避免指针经过按钮/文本时光标频繁变化
          let dragStyle = null
          try {
            dragStyle = document.createElement('style')
            dragStyle.setAttribute('data-thmcz-drag', 'true')
            dragStyle.textContent = '* { cursor: grabbing !important; user-select: none !important; }'
            document.head.appendChild(dragStyle)
          } catch (err) { /* 忽略 */ }
          const startY = e.clientY
          let rowH = 40
          try {
            const rows0 = listRef.current && listRef.current.querySelectorAll('[data-preset-row]')
            const el0 = rows0 && rows0[index]
            if (el0) rowH = el0.getBoundingClientRect().height || 40
          } catch (err) { /* 忽略 */ }
          const onMove = (ev) => {
            if (!listRef.current) return
            const rows = listRef.current.querySelectorAll('[data-preset-row]')
            if (!rows.length) return
            // 目标 = 起始序号 + 移动距离/行高（Math.round 滞回：越过半行高才换位，边界不来回抖动）
            const dy = ev.clientY - startY
            let target = index + Math.round(dy / rowH)
            target = Math.max(0, Math.min(rows.length - 1, target))
            if (target !== dragIndexRef.current) {
              // FLIP 前置：记录各行当前位置（React 重排后由 useEffect 播放过渡动画）
              const rowsNow = listRef.current.querySelectorAll('[data-preset-row]')
              const oldTops = new Map()
              rowsNow.forEach((r) => oldTops.set(r, r.getBoundingClientRect().top))
              const arr = [...presets]
              const [moved] = arr.splice(dragIndexRef.current, 1)
              arr.splice(target, 0, moved)
              presets = arr
              dragIndexRef.current = target
              flipDataRef.current = oldTops
              presetNotify()
            }
          }
          const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            try {
              const s = document.querySelector('style[data-thmcz-drag]')
              if (s) s.remove()
            } catch (err) { /* 忽略 */ }
            setDragIndex(null)
            dragIndexRef.current = null
            savePresets().then(() => {
              setPresetMsg('↕ 已调整预设顺序')
            }).catch(() => {
              setPresetMsg('⚠️ 顺序已调整，但保存失败（刷新后可能恢复原序）')
            })
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        }
        const confirmRename = () => {
          const name = (renameInput || '').trim()
          if (!name) { setPresetMsg('❌ 名称不能为空'); return }
          const targetId = renameTargetId
          const old = presets.find((p) => p.id === targetId)
          presets = presets.map((p) => p.id === targetId ? { ...p, name } : p)
          savePresets().then(() => {
            setRenameTargetId(null)
            setRenameInput('')
          }).catch(() => {
            presets = presets.map((p) => p.id === targetId && old ? { ...p, name: old.name } : p)
            setPresetMsg('❌ 重命名保存失败')
          })
        }
        const btnSmall = { padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px', flex: 'none' }
        const currentName = (presets.find((p) => p.id === lastAppliedId) || {}).name || '未应用'
        return React.createElement('div', null,
          React.createElement('div', { style: { padding: '10px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '8px', marginTop: '4px' } },
            React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, marginBottom: '6px' } }, '本地预设库（' + presets.length + '/' + PRESET_LIMIT + '）'),
            React.createElement('div', { style: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' } },
              React.createElement('span', { style: { fontSize: '13px', flex: 'none' } }, '当前预设：'),
              React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-brand-primary)', flex: 1, minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, currentName),
              React.createElement('button', { type: 'button', onClick: () => { setConfirmDeleteId(null); setNaming(true) }, style: { ...btnSmall, background: 'var(--dsw-alias-brand-primary)', color: '#fff', border: 'none' } }, '💾 保存预设'),
              React.createElement('button', { type: 'button', onClick: () => presetFileRef.current && presetFileRef.current.click(), style: btnSmall }, '📥 导入预设'),
              React.createElement('input', { ref: presetFileRef, type: 'file', accept: '.tczp,application/json,.json', style: { display: 'none' }, onChange: handlePresetFile }),
            ),
            conflict
              ? React.createElement('div', { style: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap', padding: '8px 10px', border: '1px solid var(--dsw-alias-state-warning-primary, #d97706)', borderRadius: '6px', background: 'var(--dsw-alias-bg-layer-1)' } },
                  React.createElement('span', { style: { fontSize: '13px', color: 'var(--dsw-alias-state-warning-primary, #d97706)', flex: 1, minWidth: 200 } }, '⚠️ 当前预设与已有预设同名：' + conflict.name),
                  React.createElement('button', { type: 'button', onClick: confirmOverwrite, style: { ...btnSmall, background: 'var(--dsw-alias-brand-primary)', color: '#fff', border: 'none' } }, '覆盖当前同名预设'),
                  React.createElement('button', { type: 'button', onClick: cancelConflict, style: btnSmall }, '放弃增加预设'),
                )
              : null,
            presetMsg
              ? React.createElement('div', { style: { marginBottom: '8px', fontSize: '12px', color: presetMsg.indexOf('❌') === 0 ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-label-secondary)', fontVariantNumeric: 'tabular-nums' } }, presetMsg)
              : null,
            naming
              ? React.createElement('div', { style: { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' } },
                  React.createElement('span', { style: { fontSize: '13px', flex: 'none' } }, '预设名称：'),
                  React.createElement('input', { autoFocus: true, value: newPresetName, onChange: (e) => setNewPresetName(e.target.value), placeholder: '输入名称', style: { flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '13px', minWidth: 120 } }),
                  React.createElement('button', { type: 'button', onClick: savePreset, style: { ...btnSmall, background: 'var(--dsw-alias-brand-primary)', color: '#fff', border: 'none' } }, '✓ 确定'),
                  React.createElement('button', { type: 'button', onClick: () => setNaming(false), style: btnSmall }, '✕ 取消'),
                )
              : null,
            presets.length === 0
              ? React.createElement('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-caption)' } }, '还没有预设：点「保存预设」命名保存，或导入 .tczp 文件（自动入库）。')
              : React.createElement('div', { ref: listRef, style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
                  presets.map((p, pi) => React.createElement(React.Fragment, { key: p.id },
                    React.createElement('div', { 'data-preset-row': true, style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '6px', opacity: dragIndex === pi ? 0.5 : 1 } },
                      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                        React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.name),
                        React.createElement('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-caption)', fontVariantNumeric: 'tabular-nums' } }, new Date(p.savedAt).toLocaleString()),
                      ),
                      React.createElement('button', { type: 'button', onClick: () => applyPreset(p), style: btnSmall }, '▶ 应用'),
                      React.createElement('button', { type: 'button', onClick: () => startRename(p), style: btnSmall }, '✏ 重命名'),
                      React.createElement('button', { type: 'button', onClick: () => exportPresetItem(p), style: btnSmall }, '📤 导出'),
                      React.createElement('button', { type: 'button', onClick: () => deletePreset(p.id), style: confirmDeleteId === p.id ? { ...btnSmall, background: 'var(--dsw-alias-state-error-primary)', color: '#fff', border: 'none' } : { ...btnSmall, color: 'var(--dsw-alias-state-error-primary)', borderColor: 'var(--dsw-alias-state-error-primary)' } }, confirmDeleteId === p.id ? '确认删除' : '🗑 删除'),
                      confirmDeleteId === p.id
                        ? React.createElement('button', { type: 'button', onClick: () => setConfirmDeleteId(null), style: btnSmall }, '取消')
                        : null,
                      React.createElement('div', { onPointerDown: (e) => startDragPreset(e, pi), title: '拖拽排序', style: { cursor: 'grab', padding: '4px', display: 'flex', flex: 'none', touchAction: 'none' } },
                        React.createElement('svg', { width: '14', height: '12', viewBox: '0 0 14 12', style: { display: 'block' } },
                          React.createElement('line', { x1: '0', y1: '1', x2: '14', y2: '1', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: '2' }),
                          React.createElement('line', { x1: '0', y1: '6', x2: '14', y2: '6', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: '2' }),
                          React.createElement('line', { x1: '0', y1: '11', x2: '14', y2: '11', stroke: 'var(--dsw-alias-border-l2)', strokeWidth: '2' }),
                        ),
                      ),
                    ),
                    renameTargetId === p.id
                      ? React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 10px', border: '1px dashed var(--dsw-alias-border-l2)', borderRadius: '6px' } },
                          React.createElement('span', { style: { fontSize: '13px', flex: 'none' } }, '重命名为：'),
                          React.createElement('input', { autoFocus: true, value: renameInput, onChange: (e) => setRenameInput(e.target.value), placeholder: '输入新名称', style: { flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '13px', minWidth: 120 } }),
                          React.createElement('button', { type: 'button', onClick: confirmRename, style: { ...btnSmall, background: 'var(--dsw-alias-brand-primary)', color: '#fff', border: 'none' } }, '✓ 确定'),
                          React.createElement('button', { type: 'button', onClick: cancelRename, style: btnSmall }, '✕ 取消'),
                        )
                      : null,
                  )),
                ),
          ),
        )
      })
