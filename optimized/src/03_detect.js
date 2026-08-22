      // ┌─ 片段 03_detect ────────────────────────────────
      // │ 职责：DOM/官方 token 检测（官方原色采集、侧边栏探测）；官方 token 定义在 body 上
      // │ 定义：detectColors / detectSidebar
      function detectColors() {
        try {
          if (typeof document === 'undefined') return
          // 注意：官方 token 定义在 body 上（design-platform.css: body {...}），不是 html 根
          const cs = window.getComputedStyle(document.body)
          const bg = cs.getPropertyValue('--dsw-alias-bg-base').trim()
          if (bg && bg !== 'transparent') baseBg = bg
          // P3: 读取官方文字原色（在 token 被覆盖前）。注意：若 AreaCss 在颜色
          // 已覆盖后重挂载（仅插件重启场景），读到的是覆盖值——内存态重启即重置，可接受
          const off = {}
          for (const it of COLOR_ITEMS) {
            for (const t of COLOR_TOKENS[it.key]) {
              const raw = cs.getPropertyValue(t).trim()
              if (!raw || raw === 'transparent' || raw === 'initial' || raw === '') continue
              const hex = toHex(resolveVarToken(raw, cs))
              if (hex) { off[it.key] = hex; break }
            }
          }
          setOfficialColors(off)
        } catch (e) { /* 忽略 */ }
      }

      function detectSidebar() {
        try {
          if (typeof document === 'undefined') return null
          const candidates = ['[class*="sidebar"]', '[class*="Sidebar"]', '[class*="sideBar"]', 'nav']
          for (const sel of candidates) {
            const els = document.querySelectorAll(sel)
            for (const el of els) {
              const r = el.getBoundingClientRect()
              if (r.width > 50 && r.height > 100 && r.left === 0 && r.top === 0) {
                const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : ''
                const selector = cls ? '.' + cls.replace(/[^a-zA-Z0-9_-]/g, '\\$&') : el.tagName.toLowerCase()
                return { selector, ratio: r.width / r.height, width: r.width, height: r.height }
              }
            }
          }
          return null
        } catch (e) { /* 忽略 */ }
        return null
      }
