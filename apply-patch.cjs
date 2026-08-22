// apply-patch.cjs —— 官方 Cordis 按钮常驻补丁一键安装/撤销（dsh-theme-customizer 随包脚本）
// 背景：官方 dsh-client-ui-cordis 在"没有任何动态插件活动"时 return null（按钮隐藏）。
//       本补丁让按钮显隐受 window.__TCZ_HIDE_OFFICIAL_CORDIS 控制（主题插件「Cordis 按钮常驻」开关使用）。
// ⚠️  DSH 升级会覆盖官方包 → 升级后需重跑本脚本。
//
// 用法（任意目录）：
//   node apply-patch.cjs             # 打补丁（首次自动备份 client.js.bak-theme-customizer）
//   node apply-patch.cjs --check     # 只检查补丁状态，不修改任何文件
//   node apply-patch.cjs --undo      # 撤销：从备份恢复官方原文件
//
// 细节与验证记录见 PATCH-CORDIS-BUTTON.md
const fs = require('fs')
const path = require('path')

const MARK = '[dsh-theme-customizer] Cordis按钮常驻补丁'
const BAK = 'client.js.bak-theme-customizer'

// ── 定位官方包 client.js ──
function findTarget() {
  const bases = []
  if (process.env.APPDATA) bases.push(path.join(process.env.APPDATA, '.dsh'))
  if (process.env.USERPROFILE) bases.push(path.join(process.env.USERPROFILE, '.dsh'))
  for (const base of bases) {
    const p = path.join(base, 'profiles', 'node_modules', '@deepseek-ai', 'dsh-client-ui-cordis', 'lib', 'client.js')
    if (fs.existsSync(p)) return p
  }
  return null
}

// ── 两处替换 ──
function apply(content) {
  // 1. 常驻条件：无插件活动时也渲染（flag=true 时恢复官方原逻辑）。
  //    ⚠️ 语义（PATCH-CORDIS-BUTTON.md 历史教训，勿加 !）：
  //    window.__TCZ_HIDE_OFFICIAL_CORDIS = false/未设置 → 常驻（无插件也显示）
  //    window.__TCZ_HIDE_OFFICIAL_CORDIS = true → 官方原逻辑（无插件隐藏）
  const re1 = /if\s*\(\s*all\.length\s*===\s*0\s*\)\s*return\s+null\s*;/
  // 2. 即时响应 hook：监听 tcz:cordis-visibility 事件强制重渲染（切换开关立即显隐）
  const re2 = /(\},\s*\[onRefresh,\s*open\]\);)/

  if (!re1.test(content)) throw new Error('未找到锚点 1：`if (all.length === 0) return null;`（官方代码已变化？）')
  if (!re2.test(content)) throw new Error('未找到锚点 2：`}, [onRefresh, open]);`（官方代码已变化？）')

  const hook = [
    'const [, tczForce] = (0, react.useState)(0); /* ' + MARK + ' */',
    '(0, react.useEffect)(() => {',
    '    const tczFn = () => tczForce((n) => n + 1);',
    "    window.addEventListener('tcz:cordis-visibility', tczFn);",
    "    return () => window.removeEventListener('tcz:cordis-visibility', tczFn);",
    '}, []);',
  ].join('\n')

  return content
    .replace(re1, 'if (all.length === 0 && window.__TCZ_HIDE_OFFICIAL_CORDIS) return null; /* ' + MARK + ' */')
    .replace(re2, '$1\n' + hook)
}

const arg = process.argv[2] || ''
const target = findTarget()
if (!target) {
  console.error('✗ 找不到官方包：<home>/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-cordis/lib/client.js')
  console.error('  请确认 dsh 已安装且路径正确。')
  process.exit(1)
}
console.log('目标文件: ' + target)

const content = fs.readFileSync(target, 'utf8')
const patched = content.includes(MARK)
const bakPath = path.join(path.dirname(target), BAK)

if (arg === '--check') {
  console.log(patched
    ? '✅ 已打补丁（' + MARK + ' 标记存在）'
    : '⏹ 未打补丁')
  console.log(fs.existsSync(bakPath) ? '备份存在: ' + BAK : '无备份')
  process.exit(0)
}

if (arg === '--undo') {
  if (!patched) { console.log('⏹ 未打补丁，无需撤销'); process.exit(0) }
  if (!fs.existsSync(bakPath)) { console.error('✗ 没有备份文件，无法撤销（请手动恢复或重装官方包）'); process.exit(1) }
  fs.copyFileSync(bakPath, target)
  console.log('✅ 已从备份恢复官方原文件')
  process.exit(0)
}

if (patched) {
  console.log('⏹ 已经打过补丁（跳过）。撤销用: node apply-patch.cjs --undo')
  process.exit(0)
}

// 首次打补丁前备份（已存在则不覆盖，保留最早的原版）
if (!fs.existsSync(bakPath)) fs.copyFileSync(target, bakPath)
try {
  const next = apply(content)
  fs.writeFileSync(target, next, 'utf8')
} catch (e) {
  console.error('✗ ' + e.message)
  console.error('  官方包代码已变化，请参照 PATCH-CORDIS-BUTTON.md 手动处理。')
  process.exit(1)
}
console.log('✅ 补丁完成（已备份 ' + BAK + '）')
console.log('   生效方式：刷新/重启 dsh web。主题设置 → Cordis 插件界面 → 「Cordis 按钮常驻」开关即时显隐。')
