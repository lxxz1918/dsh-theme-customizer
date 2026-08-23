// build.cjs —— 优化版构建器：拼接 src/ 片段 → dist/ 三产物
// 用法: node optimized\build.cjs
//
// 片段约定（src/）:
//   - 00_~99_ 开头的 *.js = apply(ctx) 函数体内的原始代码行（逐字搬移、保持原缩进）
//   - host.js = host 半部分函数体（return { apply(ctx) {...} }，与动态 host.js 同格式）
//   - 拼接按文件名字典序；片段之间自动插入 `// ════ 片段名 ════` 分节注释
//   - 片段内禁止 import/require（动态 code.client 是纯函数体）；零定时器约定不变
//
// 产物（dist/，自动生成勿手改）:
//   dist/client.js       动态 code.client（cordis_define 用；⚠️ 动态插件轨已弃用 2026-08-20，产物仅作备份/参考）
//   dist/host.js         动态 code.host
//   dist/p3_2_client.js  module.exports 格式（静态 build_static.cjs 的输入，日常构建用这个）
//   dist/line_map.txt    片段 → client.js 行号映射（自动生成，喂给 INDEX.md）
//   dist/symbols.md      片段符号表（自动生成，喂给 INDEX.md）
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const SRC = path.join(ROOT, 'src')
const DIST = path.join(ROOT, 'dist')

const clientFrags = fs.readdirSync(SRC)
  .filter((f) => /^\d{2}_.*\.js$/.test(f))
  .sort()
if (!clientFrags.length) { console.error('NO FRAGMENTS in src/（需要 00_~99_ 开头的 .js）'); process.exit(1) }
const hostPath = path.join(SRC, 'host.js')
if (!fs.existsSync(hostPath)) { console.error('MISSING src/host.js'); process.exit(1) }

// ── 1. 拼接 apply(ctx) 函数体 ──
const outLines = []
const lineMap = []
const symbols = []
const HEADER = 2 // client.js 中 '  return {' + '    apply(ctx) {' 占 2 行
let cursor = HEADER
for (const f of clientFrags) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/)
  outLines.push('      // ════════ ' + f + ' ════════')
  cursor += 1
  const banner = cursor
  const start = cursor + 1
  for (const l of lines) outLines.push(l)
  cursor += lines.length
  lineMap.push({ fragment: f, banner, start, end: cursor })
  // 符号表：本片段内定义的 function / const / let（顶层样式匹配，供索引）
  const found = []
  for (const l of lines) {
    let m = l.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/)
    if (m) { found.push('function ' + m[1]); continue }
    m = l.match(/^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/)
    if (m) found.push(m[1])
  }
  symbols.push({ fragment: f, symbols: found })
}
const applyBody = outLines.join('\n')

// ── 2. 动态 code.client（return { apply(ctx) {...} }，供 cordis_define 逐字复制；动态插件轨已弃用，产物仅作备份）──
const client = '  return {\n    apply(ctx) {\n' + applyBody + '\n    },\n  }'

// ── 3. host 半部分 ──
const hostBody = fs.readFileSync(hostPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()

// ── 4. 静态模块源（module.exports = { clientBodyP31, hostBodyP31 }）──
const moduleSrc = 'function clientBodyP31() {\n' + client + '\n}\n\nfunction hostBodyP31() {\n' + hostBody + '\n}\n\nmodule.exports = { clientBodyP31, hostBodyP31 }\n'

// ── 5. 语法校验（不执行）──
try {
  new Function(client)
  new Function(hostBody)
  new Function(moduleSrc)
} catch (e) {
  console.error('SYNTAX FAIL:', e.message)
  process.exit(1)
}

// ── 6. 写产物 ──
fs.mkdirSync(DIST, { recursive: true })
// dist 产物是 CommonJS（build_static.cjs 用 require 加载 p3_2_client.js）——
// 包根 package.json 若声明 "type": "module"（dsh 包约定，lib/index.js 是 ESM），
// Node 会把本目录 .js 按 ESM 解析 → require 报 "module is not defined"。
// 显式标注本目录为 CJS 覆盖（2026-08-22 开源仓库构建验证发现）
fs.writeFileSync(path.join(DIST, 'package.json'), '{"type":"commonjs"}\n', 'utf8')
fs.writeFileSync(path.join(DIST, 'client.js'), client, 'utf8')
fs.writeFileSync(path.join(DIST, 'host.js'), hostBody + '\n', 'utf8')
fs.writeFileSync(path.join(DIST, 'p3_2_client.js'), moduleSrc, 'utf8')

// line_map.txt：片段 → client.js 行号（1-based）
const mapLines = ['# 片段 → dist/client.js 行号映射（build.cjs 自动生成，勿手改）', '']
for (const m of lineMap) {
  mapLines.push(m.fragment + '\t分节注释 L' + m.banner + ' / 内容 L' + m.start + '-' + m.end)
}
fs.writeFileSync(path.join(DIST, 'line_map.txt'), mapLines.join('\n') + '\n', 'utf8')

// symbols.md：符号表
const symLines = ['# 片段符号表（build.cjs 自动生成，勿手改）', '']
for (const s of symbols) {
  symLines.push('## ' + s.fragment)
  if (s.symbols.length) {
    symLines.push(...s.symbols.map((x) => '- `' + x + '`'))
  } else {
    symLines.push('（无顶层定义）')
  }
  symLines.push('')
}
fs.writeFileSync(path.join(DIST, 'symbols.md'), symLines.join('\n'), 'utf8')

const total = outLines.length
console.log('OK → dist/client.js (' + total + ' body lines, ' + clientFrags.length + ' fragments)')
console.log('   → dist/host.js, dist/p3_2_client.js (' + moduleSrc.length + ' chars), dist/line_map.txt, dist/symbols.md')
console.log('line map:')
for (const m of lineMap) console.log('  ' + m.fragment + ' → client.js L' + m.start + '-' + m.end)
