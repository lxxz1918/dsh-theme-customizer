# dsh-theme-customizer

[![npm version](https://img.shields.io/npm/v/dsh-theme-customizer?style=flat-square)](https://www.npmjs.com/package/dsh-theme-customizer)
[![license](https://img.shields.io/github/license/lxxz1918/dsh-theme-customizer?style=flat-square)](LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-0969da?style=flat-square)](https://github.com/topics/dsh-plugin)
[![stars](https://img.shields.io/github/stars/lxxz1918/dsh-theme-customizer?style=flat-square)](https://github.com/lxxz1918/dsh-theme-customizer/stargazers)

**English** | [中文](README.md)

> A theme customizer plugin for the DeepSeek Harness (DSH) web UI. Backgrounds, text colors, borders and details — all adjustable visually, persisted across restarts.
> Config is stored in localStorage; presets can be exported as `.tczp` files (images included) and shared with any machine.

## Features

- **Interface module (7 background areas)**: Main / Sidebar / Conversation / Composer / Settings panel / Floating panel / Cordis panel
  - Each area: None / Solid color / Image (with crop & selection) + opacity (**larger value = more transparent**) + base color (independent layer)
  - Main background supports "include sidebar / exclude sidebar" display area toggle
  - Sidebar image fades out directly via mask — never covers the top UI or the settings panel
- **Borders module**: color + opacity for all default UI borders/dividers, independently for 5 areas (Main incl. sidebar / Cordis / Composer / Settings / Floating panel)
- **Text colors module**: 5 categories (Body / Process / Auxiliary / Faded / Accent), shared across light & dark themes, restorable to official defaults
- **Brand color**: color + opacity for the top-left DeepSeek Harness logo; the "Harness" wordmark can be tinted separately
- **Conversation details**: user bubble / inline code / code block background / code block scrollbar / conversation scrollbar / todo panel collapsed & expanded / "scroll to bottom" button background
- **Composer**: background, fixed input height (1–10 rows), stats line takeover (9 independent toggles + full expand), command button & menu backgrounds
- **New session button**: None/Solid/Image style + show text/icon toggles + independent icon/text colors + base color
- **Layout**: draggable settings panel (drag its header; position persisted; one-click reset)
- **Floating panel**: a draggable mini settings panel (choose which modules to show), always on top
- **Presets**: save/apply/rename/delete/export/import (`.tczp`, images included, up to 10) + drag-to-reorder
- **Global reset**: one click to restore all defaults (3-step confirm to prevent accidents)

## Installation

```bash
# Option 1: npm (published package)
npm install -g dsh-theme-customizer
dsh plugin --profile web add dsh-theme-customizer

# Option 2: local directory (after cloning this repo)
dsh plugin --profile web add <path-to-this-repo>
```

Then **restart dsh web** for it to take effect. Verify: Settings → Theme should appear.

## Usage

1. Open **Settings → Theme** and adjust by module; changes apply instantly and save automatically (the bottom of the page shows "last saved" time)
2. For quick tweaks, click "↗ Open float panel" at the top right — the panel is draggable
3. To verify the conversation-area options, use the test text in [对话区测试指令.md](对话区测试指令.md)

## Persistent Cordis button (optional)

The "Cordis button always visible" toggle in Theme settings **requires a patch to the official dsh-client-ui-cordis package**; without the patch the toggle has no effect. One-click install:

```bash
node apply-patch.cjs           # apply patch (auto backup)
node apply-patch.cjs --check   # check status
node apply-patch.cjs --undo    # revert
```

⚠️ **DSH upgrades overwrite the official package** — re-run `apply-patch.cjs` after upgrading. Details in [PATCH-CORDIS-BUTTON.md](PATCH-CORDIS-BUTTON.md).

## Build from source (developers)

```bash
# 1. Concatenate source fragments (optimized/src/ → optimized/dist/, with syntax check + line map/symbols)
node optimized\build.cjs

# 2. Generate the static client bundle (dist/p3_2_client.js → lib/client.js)
node build_static.cjs optimized\dist\p3_2_client.js lib\client.js

# 3. Syntax check + install for testing
node --check lib\client.js
dsh plugin --profile web add <path-to-this-repo>
```

Source layout: `optimized/src/` contains 16 fragments (`00_*`~`15_*` + `host.js`) concatenated in filename order into the plugin function body. Look up features in `optimized/INDEX.md`.

## Preset files (.tczp)

Presets panel → "📥 Import preset" and pick a `.tczp` file to restore a whole config (images included — no original files needed). Export each preset via "📤 Export" in the same panel.

## Uninstall

```bash
dsh plugin --profile web remove dsh-theme-customizer
```

## License

[MIT](LICENSE)
