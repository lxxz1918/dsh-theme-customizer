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
          // v1.0.4 折叠态检测（先行）：官方收起时根容器带 hHd-Xa_collapsed class（F12 实测稳定后缀）。
          // ⚠️ 选择器必须稳定：展开/折叠返回同一个容器（优先外层列容器），否则 buildSidebarCss 的
          // 展开/收起规则用不同选择器 → 折叠后展开规则残留（图片未被隐藏）。列容器折叠后宽度通常仍 >50。
          const collapsed = !!document.querySelector('[class*="_collapsed"]')
          const candidates = ['[class*="sidebar"]', '[class*="Sidebar"]', '[class*="sideBar"]', 'nav', '[class*="hHd-Xa_root"]']
          for (const sel of candidates) {
            const els = document.querySelectorAll(sel)
            for (const el of els) {
              const r = el.getBoundingClientRect()
              if (r.width > 50 && r.height > 100 && r.left === 0 && r.top === 0) {
                const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : ''
                const selector = cls ? '.' + cls.replace(/[^a-zA-Z0-9_-]/g, '\\$&') : el.tagName.toLowerCase()
                return { selector, ratio: r.width / r.height, width: r.width, height: r.height, collapsed }
              }
            }
          }
          // 折叠态兜底（窄栏 <50px 列容器不匹配）：量 hHd-Xa_root。⚠️ 此时 selector 可能与展开态不同，
          // buildSidebarCss 用 :has() 双选择器兜底（自身含 collapsed 或后代含），见 07
          if (collapsed) {
            const root = document.querySelector('[class*="hHd-Xa_root"]')
            if (root) {
              const r = root.getBoundingClientRect()
              const cls = typeof root.className === 'string' ? root.className.split(/\s+/).filter(Boolean)[0] : ''
              const selector = cls ? '.' + cls.replace(/[^a-zA-Z0-9_-]/g, '\\$&') : 'nav'
              return { selector, ratio: r.width / Math.max(1, r.height), width: r.width, height: r.height, collapsed }
            }
          }
          return null
        } catch (e) { /* 忽略 */ }
        return null
      }
