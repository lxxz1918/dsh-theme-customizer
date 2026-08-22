      // ┌─ 片段 02_utils ─────────────────────────────────
      // │ 职责：纯工具函数（颜色解析 / var 链解析 / 转 hex），无状态
      // │ 定义：parseRgb / resolveVarToken / toHex
      function parseRgb(color) {
        try {
          const s = String(color || '').trim()
          if (s.startsWith('#')) {
            const h = s.replace('#', '')
            if (h.length === 3) return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
            if (h.length === 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
          }
          const m = s.match(/rgba?\(([^)]+)\)/)
          if (m) {
            const parts = m[1].split(',').map((x) => parseFloat(x))
            return [parts[0], parts[1], parts[2]]
          }
        } catch (e) { /* 忽略 */ }
        return [30, 32, 38]
      }

      // P3: 解析 var(--x) 链到最终颜色值（官方 token 定义是 var() 引用）
      function resolveVarToken(value, cs) {
        let v = value
        for (let i = 0; i < 3; i++) {
          const m = String(v || '').match(/^var\(--([^)]+)\)$/)
          if (!m) break
          v = cs.getPropertyValue('--' + m[1]).trim()
        }
        return v
      }
      // P3: 任意颜色格式转 #rrggbb（input[type=color] 只接受 #hex）
      function toHex(color) {
        try {
          let s = String(color || '').trim()
          if (s.startsWith('#')) {
            if (s.length === 4) return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
            if (s.length === 7) return s
          }
          const m = s.match(/rgba?\(([^)]+)\)/)
          if (m) {
            const parts = m[1].split(',').map((x) => parseFloat(x.trim()))
            const to = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
            return '#' + to(parts[0]) + to(parts[1]) + to(parts[2])
          }
        } catch (e) { /* 忽略 */ }
        return null
      }

      // 大图降采样（异步，Image.onload 事件回调，非定时器）：
      // 按最长边缩放输出 WebP 0.92（支持透明、体积小；失败回退 PNG）。
      // 用于选图后避免超大 dataURI（如 40MB 原图 → 53MB dataURL）进内存/CropPanel/CSS 变量/localStorage：
      //   · CSS 变量 var() 替换超大值会失效 → 背景不显示（2026-08-21 主界面/侧边栏/新会话大图事故根因）
      //   · localStorage 配额（~5MB）超限 → 图片被降级丢弃
      //   · CropPanel 加载 53MB dataURL 慢、内存暴涨
      function downscaleDataUrl(dataUrl, maxDim, cb) {
        const img = new Image()
        img.onload = () => {
          try {
            let w = img.naturalWidth || 1, h = img.naturalHeight || 1
            const m = Math.max(w, h)
            if (m > maxDim) { const s = maxDim / m; w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s)) }
            const c = document.createElement('canvas')
            c.width = w
            c.height = h
            c.getContext('2d').drawImage(img, 0, 0, w, h)
            let out
            try { out = c.toDataURL('image/webp', 0.92) } catch (e) { out = c.toDataURL('image/png') }
            cb(out)
          } catch (e) { cb(dataUrl) }
        }
        img.onerror = () => cb(dataUrl)
        img.src = dataUrl
      }

      // #rrggbb ↔ HSV（SV 色板 ColorField 用；明度语义 = 亮度，白色会丢 H/S，拖动中需本地保留 hsv 不能反推覆盖）
      function hexToHsv(hex) {
        const m = String(hex || '').match(/^#?([0-9a-f]{6})$/i)
        if (!m) return [0, 0, 100]
        const n = parseInt(m[1], 16)
        const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        const d = max - min
        const v = max
        if (d === 0) return [0, 0, Math.round(v * 100)]
        const s = d / max
        let h = 0
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        else if (max === g) h = ((b - r) / d + 2) * 60
        else h = ((r - g) / d + 4) * 60
        return [Math.round(h), Math.round(s * 100), Math.round(v * 100)]
      }
      function hsvToHex(h, s, v) {
        h = ((Math.round(h) % 360) + 360) % 360
        s = Math.max(0, Math.min(100, s)) / 100
        v = Math.max(0, Math.min(100, v)) / 100
        const c = v * s
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
        const m = v - c
        let r = 0, g = 0, b = 0
        if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c } else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c } else if (h < 300) { r = x; b = c } else { r = c; b = x }
        const to = (n) => Math.max(0, Math.min(255, Math.round((n + m) * 255))).toString(16).padStart(2, '0')
        return '#' + to(r) + to(g) + to(b)
      }
