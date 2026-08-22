# 官方 Cordis 按钮常驻补丁说明（dsh-client-ui-cordis）

> 验证通过（2026-08-19，临时静态测试插件 v3 确认：无插件活动时按钮常驻、开关即时显隐、刷新持久）。
> **推荐直接用随包脚本一键安装**：`node apply-patch.cjs`（自动备份 / `--check` 查状态 / `--undo` 撤销）。本文档记录补丁内容与手动重打方法。

## 为什么需要补丁

官方 `CordisPanel` 在**没有任何动态插件活动**时 `return null`（按钮隐藏）。
需求：侧边栏底部的官方 Cordis 按钮**常驻**（无插件时也显示），并由主题插件开关控制。

## 补丁文件

```
<home>\.dsh\profiles\node_modules\@deepseek-ai\dsh-client-ui-cordis\lib\client.js
```

原始备份：同目录 `client.js.bak-theme-customizer`
⚠️ DSH 升级会覆盖此文件 → 需按下面内容重打（或重跑 `node apply-patch.cjs`）。

## 补丁内容（两处）

### 1. 常驻条件（原约 712 行，组件内）

**原代码**：
```js
if (all.length === 0) return null;
```

**补丁后**：
```js
if (all.length === 0 && window.__TCZ_HIDE_OFFICIAL_CORDIS) return null; /* [dsh-theme-customizer] Cordis按钮常驻补丁 */
```

⚠️ 千万不要加 `!`！历史上写反过一次（`!window.__TCZ_HIDE_OFFICIAL_CORDIS`），
导致 flag=false（常驻）时反而隐藏。语义：
- `window.__TCZ_HIDE_OFFICIAL_CORDIS = false` → 常驻（无插件也显示）
- `window.__TCZ_HIDE_OFFICIAL_CORDIS = true` → 官方原逻辑（无插件隐藏）

### 2. 即时响应 hook（原约 688 行后，组件顶部 hooks 区，必须在条件 return 之前）

在 `}, [onRefresh, open]);` 之后、`const byPlugin = ...` 之前插入：

```js
const [, tczForce] = (0, react.useState)(0);
(0, react.useEffect)(() => {
    const tczFn = () => tczForce((n) => n + 1);
    window.addEventListener('tcz:cordis-visibility', tczFn);
    return () => window.removeEventListener('tcz:cordis-visibility', tczFn);
}, []);
```

效果：切换开关后按钮**立即**显隐（无需刷新页面）。

## 触发端约定

设置 flag 的插件（动态 thmcz-1 / 静态 dsh-theme-customizer 的 `applyCordisEntryFlag`）：
```js
window.__TCZ_HIDE_OFFICIAL_CORDIS = !cordisEntry;
window.dispatchEvent(new Event('tcz:cordis-visibility'));
```

## 验证记录

- 2026-08-19：临时静态插件 `dsh-theme-customizer-test`（plugin-test/，v3 非受控 checkbox）验证通过。
- 教训：受控 checkbox + React force 重渲染在静态插件环境不可靠（第二次切换后 UI 不更新），
  测试插件改用**非受控 checkbox + 手动 DOM 同步**后完全正常。
- ✅ 2026-08-19 已清理：`plugin-test/` 目录、junction、`web/package.json` 两行均已移除（设置里"主题测试"入口随重启消失）。
