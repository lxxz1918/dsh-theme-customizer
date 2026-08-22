      // ┌─ 片段 14_composer ──────────────────────────────
      // │ 职责：输入区子版块（ComposerEditor：统计条完全展开 + 统计条子项开关 + 命令子版块）
      // │       + 输入区板块直属行 ComposerHeightRow（输入框高度固定，底色下、子版块外）
      // │       + 统计条渲染组件 ComposerStatsLine（复刻官方 StatsLine，9 项独立开关）
      // │ 定义：ComposerEditor / ComposerHeightRow / ComposerStatsLine；挂载：composer children（BackgroundModule），ComposerStatsLine 注册到 conversation.composer.dock
      // │ 测试：高度固定开关锁 N 行；完全展开去省略号；子项开关控制统计条各段显隐；命令背景两项设置/恢复
      // ── 统计条纯函数（复刻官方 StatsLine，见 dsh-client-ui-conversation 源码）──
      function statsFormatTokens(n) {
        const scaled = (v) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10)
        if (n < 1e3) return String(n)
        if (n < 1e6) return scaled(n / 1e3) + 'K'
        return scaled(n / 1e6) + 'M'
      }
      function statsFormatDuration(ms) {
        const s = ms / 1e3
        if (s < 60) return Math.round(s * 10) / 10 + 's'
        const whole = Math.round(s)
        return Math.floor(whole / 60) + 'm' + (whole % 60) + 's'
      }
      function statsFormatTps(tps) {
        const c = Math.max(0, tps)
        return c >= 10 ? String(Math.round(c)) : String(Math.round(c * 10) / 10)
      }
      function statsUsageOutputTokens(usage) {
        if (typeof usage !== 'object' || usage === null) return null
        const v = usage.outputTokens
        return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
      }
      function statsAssistantReading(node) {
        const timing = node.timing
        return {
          ttftMs: timing !== void 0 && timing.stepStartTime !== null && timing.firstTokenTime !== null ? Math.max(0, timing.firstTokenTime - timing.stepStartTime) : null,
          decodeMs: timing !== void 0 && timing.firstTokenTime !== null ? Math.max(0, timing.completedTime - timing.firstTokenTime) : null,
          outputTokens: statsUsageOutputTokens(node.usage)
        }
      }
      function statsDerive(nodes) {
        const turns = new Set()
        let steps = 0, llmMs = 0, toolMs = 0, ttftMs = 0, ttftSteps = 0, decodeMs = 0, decodeTokens = 0
        for (const node of nodes) {
          if (node.kind === 'tool-result') {
            if (node.callTime !== null) toolMs += Math.max(0, node.time - node.callTime)
            continue
          }
          if (node.kind !== 'assistant') continue
          turns.add(node.turn)
          steps += 1
          if (node.timing !== void 0 && node.timing.stepStartTime !== null) llmMs += Math.max(0, node.timing.completedTime - node.timing.stepStartTime)
          const r = statsAssistantReading(node)
          if (r.ttftMs !== null) { ttftMs += r.ttftMs; ttftSteps += 1 }
          if (r.decodeMs !== null && r.outputTokens !== null) { decodeMs += r.decodeMs; decodeTokens += r.outputTokens }
        }
        return { turns: turns.size, steps, llmMs, toolMs, ttftMs, ttftSteps, decodeMs, decodeTokens }
      }
      function statsBilledInput(usage) {
        return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
      }
      // 统计条渲染组件：注册到 conversation.composer.dock，slot 注入 useProjection/useSession。
      // 复刻官方 StatsLine，但 9 项独立按 composerStatsItems 开关渲染（官方把 LLM+工具调用、首token+tok/s 各合并一组，无法 CSS 拆分，故整体接管）。
      function ComposerStatsLine({ useSession, useProjection }) {
        // 只订阅 stats 通道（统计条开关）：颜色/透明度/背景拖动（main）不重渲染统计条
        const { composerStatsExpanded, composerStatsItems } = useStore(['stats'])
        // 统计条始终由我们渲染（官方隐藏，v0.9.19 调整）：9 项子开关在不展开时也生效；
        // 不展开 = 官方外观（block/居中/单行省略 + hover 完整内容提示，等效官方 Tooltip）；展开 = 完整展开居中
        const settledNodes = useSession ? useSession((s) => s.chat.legacy.nodes) : null
        const usage = useProjection ? useProjection('tokenUsage') : void 0
        const projected = useProjection ? useProjection('sessionStats') : void 0
        const stats = projected || statsDerive(settledNodes || [])
        const items = []
        if (stats.steps > 0) {
          if (composerStatsItems.turns) items.push(stats.turns + ' 轮')
          if (composerStatsItems.steps) items.push(stats.steps + ' 步')
          if (composerStatsItems.llm && stats.llmMs > 0) items.push('LLM ' + statsFormatDuration(stats.llmMs))
          if (composerStatsItems.tool && stats.toolMs > 0) items.push('工具调用 ' + statsFormatDuration(stats.toolMs))
          if (composerStatsItems.ttft && stats.ttftSteps > 0) items.push('首 token 平均 ' + statsFormatDuration(stats.ttftMs / stats.ttftSteps))
          if (composerStatsItems.tps && stats.decodeMs > 0) items.push(statsFormatTps(stats.decodeTokens / (stats.decodeMs / 1e3)) + ' tok/s')
        }
        if (usage !== void 0 && (statsBilledInput(usage) > 0 || usage.outputTokens > 0)) {
          if (composerStatsItems.cache) {
            const denom = statsBilledInput(usage)
            if (denom > 0) items.push('缓存命中 ' + Math.round(usage.cacheReadTokens / denom * 100) + '%')
          }
          if (composerStatsItems.input && statsBilledInput(usage) > 0) items.push('输入 ' + statsFormatTokens(statsBilledInput(usage)) + ' tok')
          if (composerStatsItems.output && usage.outputTokens > 0) items.push('输出 ' + statsFormatTokens(usage.outputTokens) + ' tok')
        }
        if (items.length === 0) return null
        const rootStyle = { textAlign: 'center', maxWidth: 'var(--dsh-chat-content-width)', boxSizing: 'border-box', width: '100%', padding: '4px calc(var(--dsh-composer-side-clearance) + 16px) 0px', color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', margin: '0 auto', fontSize: '12px', lineHeight: '20px', display: 'block', overflow: 'hidden' }
        if (composerStatsExpanded) {
          rootStyle.whiteSpace = 'nowrap'
          rootStyle.overflow = 'visible'
          rootStyle.textOverflow = 'clip'
          rootStyle.display = 'flex'
          rootStyle.justifyContent = 'center'
          rootStyle.alignItems = 'baseline'
        }
        const sepStyle = { color: 'var(--dsw-alias-separator-primary)', margin: '0 10px', flex: composerStatsExpanded ? '0 0 auto' : null }
        const itemStyle = composerStatsExpanded ? { flex: '0 0 auto' } : null
        // 不展开（单行省略）时 hover 显示完整内容（等效官方 Tooltip：label = 完整 line）；展开时内容全显示无需提示
        const lineText = items.join(' | ')
        return React.createElement('div', { 'data-thmcz-stats': true, title: composerStatsExpanded ? undefined : lineText, style: rootStyle },
          items.map((it, i) => React.createElement(React.Fragment, { key: i },
            i > 0 ? React.createElement('span', { 'aria-hidden': true, style: sepStyle }, '|') : null,
            React.createElement('span', { style: itemStyle }, it),
          )),
        )
      }

      // 输入区子版块：作为「输入区」区块的一部分（渲染在输入区卡片内部末尾），
      // 顶部细分隔线与输入区背景内容分开。后续输入区新功能继续加在这里。
      // 子版块：统计条（完全展开 + 9 项开关）/ 命令（「+」按钮背景 + 命令菜单背景 + 全部恢复官方默认）；
      // 输入框高度为「输入区」板块直属行（ComposerHeightRow，渲染在底色下方、子版块外，见 BackgroundModule）
      // memo 化（性能优化 2026-08-21）：自身订阅 store（composer 系列字段），store 变化时自行重渲染；memo 只防父级重渲染时无谓重复
      const ComposerEditor = React.memo(function ComposerEditor() {
        // main（固定高度/行数）+ stats（统计条开关）+ convBgs（命令按钮/菜单背景）
        const { composerStatsExpanded, composerStatsItems, convBgs } = useStore(['main', 'stats'])
        const itemDefs = [
          { key: 'turns', label: '轮数' },
          { key: 'steps', label: '步数' },
          { key: 'llm', label: 'LLM 时长' },
          { key: 'tool', label: '工具调用时长' },
          { key: 'ttft', label: '首 token 平均' },
          { key: 'tps', label: 'tok/s' },
          { key: 'cache', label: '缓存命中' },
          { key: 'input', label: '输入 token' },
          { key: 'output', label: '输出 token' },
        ]
        const toggleItem = (key) => setComposerStatsItems({ ...composerStatsItems, [key]: !composerStatsItems[key] })
        // 命令子板块：任一改动过才显示「全部恢复官方默认」（仿对话区 resetAllConvBgs，仅命令两项；含透明度非 0）
        const cmdCustom = !!convBgs.addBtn || !!convBgs.cmdMenu || (convBgs.addBtnOpacity > 0) || (convBgs.cmdMenuOpacity > 0)
        return React.createElement('div', { style: { marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
          // ── 统计条 ──
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' } },
            React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, minWidth: '80px' } }, '统计条'),
            // 开关仅勾选框触发（v0.9.20）
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } },
              React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!composerStatsExpanded, onChange: (e) => setComposerStatsExpanded(e.target.checked) }),
              React.createElement('span', null, '完全展开'),
            ),
          ),
          React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginBottom: '4px' } },
            itemDefs.map((d) => React.createElement('div', { key: d.key, style: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' } },
              React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!composerStatsItems[d.key], onChange: () => toggleItem(d.key) }),
              React.createElement('span', null, d.label),
            )),
          ),
          // ── 命令（「+」按钮背景 / 命令菜单背景 + 透明度 + 全部恢复官方默认）──
          React.createElement('div', { style: { marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
            React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, marginBottom: '6px' } }, '命令'),
            ConvBgRow({ label: '命令按钮', value: convBgs.addBtn, onSet: (v) => setConvBg('addBtn', v), opacity: convBgs.addBtnOpacity == null ? 0 : convBgs.addBtnOpacity, onOpacity: (v) => setConvBg('addBtnOpacity', v), onReset: () => { setConvBg('addBtn', null); setConvBg('addBtnOpacity', 0) }, opacityAlways: true }),
            ConvBgRow({ label: '命令菜单', value: convBgs.cmdMenu, onSet: (v) => setConvBg('cmdMenu', v), opacity: convBgs.cmdMenuOpacity == null ? 0 : convBgs.cmdMenuOpacity, onOpacity: (v) => setConvBg('cmdMenuOpacity', v), onReset: () => { setConvBg('cmdMenu', null); setConvBg('cmdMenuOpacity', 0) }, opacityAlways: true }),
            cmdCustom
              ? React.createElement('div', { style: { marginTop: '4px' } },
                  React.createElement(ConfirmButton, {
                    label: '全部恢复官方默认', confirmLabel: '全部确认恢复官方默认',
                    onConfirm: resetCmdBgs, resetKey: cmdCustom, size: 'md',
                  }),
                )
              : null,
          ),
        )
      })

      // 「输入区」板块直属行：输入框高度（固定高度开关 + 行数下拉），渲染在底色下方、子版块（统计条/命令）之外。
      // 拆分自 ComposerEditor（2026-08-22 v0.9.11 用户定：输入框高度不属于子版块）。
      // memo 化 + 订阅 main：固定高度/行数变化自行重渲染，父级重渲染不重复
      const ComposerHeightRow = React.memo(function ComposerHeightRow() {
        const { composerFixedHeight, composerRows } = useStore(['main'])
        const rows = Math.max(1, Math.min(10, Math.round(composerRows || 4)))
        return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' } },
          React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, minWidth: '80px' } }, '输入框高度'),
          // 开关仅勾选框触发（v0.9.20）
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } },
            React.createElement('input', { type: 'checkbox', style: { cursor: 'pointer' }, checked: !!composerFixedHeight, onChange: (e) => setComposerFixedHeight(e.target.checked) }),
            React.createElement('span', null, '固定高度'),
          ),
          composerFixedHeight
            ? React.createElement('select', { value: String(rows), onChange: (e) => setComposerRows(parseInt(e.target.value, 10)), style: { padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-1)', fontSize: '12px' } },
                Array.from({ length: 10 }, (_, i) => React.createElement('option', { key: i + 1, value: String(i + 1) }, (i + 1) + ' 行')),
              )
            : null,
        )
      })
