      // ┌─ 片段 10_colors ────────────────────────────────
      // │ 职责：字体颜色板块（颜色行组件 + 「字体颜色」模块外壳）
      // │ 定义：ColorRow / ColorsModule
      // │ 测试：改 5 类文字颜色行为/颜色模块说明与全部恢复按钮时来此片段
      function ColorRow({ item, value, official, onChange, onReset }) {
        const v = value || official || '#000000'
        const isCustom = !!value
        return React.createElement('div', { style: { padding: '8px 10px', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } },
          React.createElement(ColorField, { value: v, onChange: (hex) => onChange(hex) }),
          React.createElement('div', { style: { flex: 1, minWidth: '160px' } },
            React.createElement('div', { style: { fontSize: '13px', fontWeight: 600 } },
              item.label,
              isCustom ? React.createElement('span', { style: { marginLeft: '6px', fontSize: '11px', color: 'var(--dsw-alias-brand-primary)' } }, '已自定义') : React.createElement('span', { style: { marginLeft: '6px', fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } }, '官方原样'),
            ),
            React.createElement('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)', marginTop: '2px' } }, item.desc),
            React.createElement('div', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-caption)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' } },
              '当前: ' + v,
            ),
          ),
          isCustom
            ? React.createElement(ConfirmButton, {
                label: '恢复官方默认', confirmLabel: '确认恢复官方默认',
                onConfirm: onReset, resetKey: v,
              })
            : null,
        )
      }

      // 「字体颜色」模块外壳（原 ModuleContent colors 分支）：说明 + 5 行 ColorRow + 全部恢复官方默认（改动过才显示）
      function ColorsModule() {
        const { colors, officialColors } = useStore()
        const hasCustomColor = COLOR_ITEMS.some((it) => !!colors[it.key])
        return React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginBottom: '8px' } },
            '亮暗主题共用同一套颜色；不设置 = 官方原样。状态色（错误/成功/警告）为功能语义色，保持官方。',
          ),
          COLOR_ITEMS.map((it) => React.createElement(ColorRow, {
            key: it.key,
            item: it,
            value: colors[it.key],
            official: officialColors[it.key],
            onChange: (v) => setColor(it.key, v),
            onReset: () => resetColor(it.key),
          })),
          hasCustomColor
            ? React.createElement(ConfirmButton, {
                label: '全部恢复官方默认', confirmLabel: '全部确认恢复官方默认',
                onConfirm: resetAllColors, resetKey: hasCustomColor, size: 'md',
              })
            : null,
        )
      }
