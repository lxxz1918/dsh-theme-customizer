# dsh-theme-customizer

[![npm version](https://img.shields.io/npm/v/dsh-theme-customizer?style=flat-square&v=1)](https://www.npmjs.com/package/dsh-theme-customizer)
[![license](https://img.shields.io/github/license/lxxz1918/dsh-theme-customizer?style=flat-square&v=1)](LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-0969da?style=flat-square&v=1)](https://github.com/topics/dsh-plugin)
[![stars](https://img.shields.io/github/stars/lxxz1918/dsh-theme-customizer?style=flat-square&v=1)](https://github.com/lxxz1918/dsh-theme-customizer/stargazers)

**English** | [中文](README.md)

> A theme customizer plugin for the DeepSeek Harness (DSH) web UI. Backgrounds, text colors, borders and details — all adjustable visually, persisted across restarts.
> Config is stored in localStorage; presets can be exported as `.tczp` files (images included) and shared with any machine.

## 🎨 Theme Gallery

Four AI-generated wallpaper themes, each with two main-UI "display area" modes: **include sidebar**  and **exclude sidebar**, plus matching `.tczp` presets for one-click import (see "Asset Pack" below).

| 🌌 Aurora Nights (dark) | 🌇 Sunset Clouds (bright) |
|:---:|:---:|
| ![Aurora](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-front-1.jpg) | ![Sunset](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-front-1.jpg) |
| **🌃 Cyber Nights (dark)** | **🌸 Sakura Sky (bright)** |
| ![Cyber](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-front-1.jpg) | ![Sakura](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-front-1.jpg) |

## 📸 Screenshots

Each theme has two modes (presets `-0` / `-1`): **display area includes sidebar**  and **display area excludes sidebar** . Each mode has 3 shots: front-1 / front-2 / settings.

<details>
<summary>🌌 Aurora Nights (dark)</summary>

**Display area includes sidebar (-0)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Aurora A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-front-1.jpg) | ![Aurora A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-front-2.jpg) | ![Aurora A-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/0-settings.jpg) |

**Display area excludes sidebar (-1)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Aurora B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/1-front-1.jpg) | ![Aurora B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/1-front-2.jpg) | ![Aurora B-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/1-aurora/1-settings.jpg) |

</details>

<details>
<summary>🌇 Sunset Clouds (bright)</summary>

**Display area includes sidebar (-0)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Sunset A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-front-1.jpg) | ![Sunset A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-front-2.jpg) | ![Sunset A-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/0-settings.jpg) |

**Display area excludes sidebar (-1)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Sunset B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/1-front-1.jpg) | ![Sunset B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/1-front-2.jpg) | ![Sunset B-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/2-sunset/1-settings.jpg) |

</details>

<details>
<summary>🌃 Cyber Nights (dark)</summary>

**Display area includes sidebar (-0)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Cyber A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-front-1.jpg) | ![Cyber A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-front-2.jpg) | ![Cyber A-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/0-settings.jpg) |

**Display area excludes sidebar (-1)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Cyber B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/1-front-1.jpg) | ![Cyber B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/1-front-2.jpg) | ![Cyber B-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/3-cyber/1-settings.jpg) |

</details>

<details>
<summary>🌸 Sakura Sky (bright)</summary>

**Display area includes sidebar (-0)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Sakura A-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-front-1.jpg) | ![Sakura A-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-front-2.jpg) | ![Sakura A-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/0-settings.jpg) |

**Display area excludes sidebar (-1)**

| Front 1 | Front 2 | Settings |
|:---:|:---:|:---:|
| ![Sakura B-1](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/1-front-1.jpg) | ![Sakura B-2](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/1-front-2.jpg) | ![Sakura B-settings](https://github.com/lxxz1918/dsh-theme-customizer/raw/main/docs/screenshots/4-sakura/1-settings.jpg) |

</details>

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

Presets panel → "Import preset" and pick a `.tczp` file to restore a whole config (images included — no original files needed). Export each preset via "Export" in the same panel.

## 📦 Asset Pack

The **full assets** for all four themes (original wallpapers + 8 `.tczp` presets + all showcase screenshots) are packed in `assets.7z` attached to [GitHub Releases](https://github.com/lxxz1918/dsh-theme-customizer/releases). Download and extract with 7-Zip:

```
展示/
├── readme展示图/          # README screenshots (4 themes × 2 variants × 3 shots)
├── 展示1/ ~ 展示4/        # Each: original wallpapers (landscape + portrait) + 2 .tczp presets + shots
└── (wallpaper originals: 展示N/N-0, N-1)
```

> Import: Settings → Theme → Presets → Import → pick `展示N-N.tczp` — images included, full effect restored in one click.

## Uninstall

```bash
dsh plugin --profile web remove dsh-theme-customizer
```

## Contact & Feedback

- Bugs / feature requests → open an [issue](https://github.com/lxxz1918/dsh-theme-customizer/issues)
- Maintenance: issues are reviewed and replied to **every Sunday**
- Bilibili: [homepage](https://space.bilibili.com/38175333)

## AI Usage

This project is designed and reviewed by [lxxz1918](https://github.com/lxxz1918); the code is written with the assistance of an AI assistant (DeepSeek). All feature requirements, UI copy and final results are confirmed by the author.

## License

[MIT](LICENSE)
