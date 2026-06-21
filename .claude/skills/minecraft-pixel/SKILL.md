---
name: minecraft-pixel
description: Use when designing or redesigning UI in a Minecraft/voxel/pixel-art style — blocky layouts, pixel fonts, hard-edged shadows, inventory-style components. Trigger on requests mentioning Minecraft, voxel, blocky, 8-bit, retro game UI, or pixel art interfaces.
license: Personal use
---

# Minecraft / Pixel Art UI Design

Design as if the interface was crafted inside the game itself: every element looks like it could be a block, an item, or a GUI panel from Minecraft's own inventory and menu screens. The reference is the game's actual UI language, not a generic "retro gaming" aesthetic — no neon, no scanlines, no CRT glow unless explicitly requested (that's arcade/cyberpunk, a different style).

## Hard rules — never break these

1. **No anti-aliasing, no blur, no smooth gradients.** Every visual edge is either pixel-stepped or a flat hard line. Set `image-rendering: pixelated` on every `<img>` and pixel-art canvas/sprite.
2. **No `border-radius` anywhere**, except the rare deliberate "rounded item slot" which still uses stepped corners, never a CSS circle/ellipse curve.
3. **No blurred box-shadow.** Shadows are flat offset blocks: `box-shadow: 4px 4px 0 #000;` (zero blur-radius, always). This is the single most important rule — a blurred shadow instantly breaks the illusion.
4. **No system/sans-serif body font as the primary voice.** Headlines and UI chrome use a true pixel font. Body copy (longer paragraphs) can drop to a clean monospace for readability, but never a humanist sans like Inter/Roboto/Helvetica as the dominant face.

## Typography

- **Display/headers/buttons:** a true bitmap pixel font. Use one of these via Google Fonts or self-hosted: `"Press Start 2P"` (chunky, most iconic, use sparingly — it's wide, so only for short labels/titles), `"VT323"` (narrower, readable at body sizes, good workhorse), `"Pixelify Sans"` (softer, closer to Minecraft's actual typeface, good default for general UI text).
- **Recommended pairing:** "Pixelify Sans" for all UI text and body copy + "Press Start 2P" reserved only for the page title / hero / big numbers (it doesn't scale well below ~14px and is unreadable in long lines).
- Always disable font smoothing: `-webkit-font-smoothing: none; font-smooth: never;` so the font renders crisp, not anti-aliased by the browser.
- Letter-spacing: keep tight to zero. Pixel fonts get worse with added tracking.
- Line-height: generous (1.6+) for body text in pixel fonts — the glyphs are dense and need room to breathe.

## Color palette

Pull from actual in-game material colors, not arbitrary brights. Pick ONE biome/material direction per project and stay consistent — don't mix grass-green UI chrome with nether-red accents unless the brief calls for a specific multi-biome theme.

Suggested starting palettes (pick one as the base, define as CSS variables):

- **Overworld (default, safe choice):** `--grass: #5D8A3A`, `--dirt: #6B4226`, `--stone: #7A7A7A`, `--stone-dark: #4A4A4A`, `--wood: #9C6B30`, `--sky: #7EC0EE`, `--bg: #1E1E1E` (or sky for light mode)
- **Nether:** `--netherrack: #6B2B2B`, `--lava: #FF6A00`, `--obsidian: #15101E`, `--gold: #FCEE4B`
- **Diamond/End-game:** `--obsidian: #15101E`, `--diamond: #5DEFEA`, `--enchant-purple: #8A2BE2`, `--gold: #FCEE4B`
- **Ocean:** `--water: #1C72B8`, `--sand: #DBC98E`, `--prismarine: #4DC4B0`

Functional colors stay game-literal: success = emerald green `#3DCC4A`, danger/error = redstone red `#B02E26`, warning/legendary = gold `#FCEE4B`, info/rare = diamond cyan `#5DEFEA` (matches Minecraft's actual rarity color coding — common/white, uncommon/yellow, rare/cyan, epic/purple — reuse that system for badges, tags, or status indicators if the product has tiers).

## Components — the "inventory slot" language

This is the signature device. Minecraft's entire GUI is built from one repeating primitive: a slot. Reuse it everywhere — buttons, cards, inputs, tags all derive from the same bevel.

**The bevel (3D pixel border), built with layered hard shadows, not gradients:**
```css
.slot {
  background: var(--stone);
  border-top: 3px solid color-mix(in srgb, var(--stone) 100%, white 40%);
  border-left: 3px solid color-mix(in srgb, var(--stone) 100%, white 40%);
  border-bottom: 3px solid color-mix(in srgb, var(--stone) 100%, black 50%);
  border-right: 3px solid color-mix(in srgb, var(--stone) 100%, black 50%);
  image-rendering: pixelated;
}
```
Light edges top-left, dark edges bottom-right — that's the game's standard "raised" bevel. Invert it (dark top-left, light bottom-right) for a "pressed/inset" state, e.g. an active button or a selected slot.

**Buttons:** raised bevel by default, pressed bevel on `:active`, with a 1px translate down on press to sell the depth. No hover glow/blur — instead, brighten the fill flat (`filter: brightness(1.1)`) or add a thin highlight outline.

**Cards/panels:** same bevel logic at larger scale, background usually the dark stone/obsidian tone, with a slightly inset content area.

**Progress bars (health/XP/loading):** segmented or stepped fill, not a smooth gradient sweep — Minecraft's hunger/health bars are literally discrete icons (hearts, drumsticks); consider using repeating pixel-icon units instead of a continuous bar where it fits the content.

**Icons:** 16×16 or 32×32 pixel-grid icons only. Flat color blocks, no vector smoothness, no drop shadows beyond the hard offset rule above.

**Tooltips:** dark panel with a colored left border matching rarity (white/yellow/cyan/purple per the rarity system above), monospace pixel font, hard-edged, appears instantly (no fade — Minecraft tooltips snap on).

## Layout

- Grid-based, snapping to a consistent unit (e.g. 8px or 16px base unit, echoing the game's block grid). Spacing values should be multiples of that unit, not arbitrary.
- Inventory-style grids (uniform square slots in rows/columns) are a strong, on-brand pattern for any content that's naturally a collection: product grids, dashboards, settings panels, file lists.
- Avoid soft asymmetric "magazine" layouts — Minecraft UI is rigid, centered, and grid-snapped. Symmetry and alignment read as more authentic here than asymmetric editorial composition.

## Motion

Split motion into two registers and don't mix them:

**1. UI chrome (controls, cards, inputs, menus) — snap, don't ease.**
- Transitions are short (100–150ms) and often stepped rather than eased — `transition-timing-function: steps(4, end)` on hover/press states reinforces the pixel feel more than a smooth `ease-out`.
- Button press = instant 1px shift down + bevel inversion, no scale/blur.
- No particle effects, glow pulses, or parallax on interactive controls — those read as "retro arcade," not Minecraft.

**2. Decorative scene background — ambient animation IS encouraged.**
The one place rich, continuous motion belongs is a full-bleed scenic background that sits *behind* the content (think the game's own animated title screen / a living biome panorama). Here, slow ambient life sells the world and is a signature "wow" moment. Keep it pixel-honest: animate whole blocks, not sub-pixel tweens; loop seamlessly; keep it behind a readability overlay so it never fights the foreground text.
- Build it as layered pixel SVG (`shapeRendering: crispEdges`) with **atmospheric perspective** — distant layers hazier/desaturated toward the sky color, near layers saturated. Parallax = slower drift on far layers, faster on near.
- Good ambient elements: drifting clouds (seamless-loop tiling), day/night swap, aurora curtains, twinkling stars + occasional shooting star, water shimmer + celestial reflection, fireflies/embers, gentle tree sway, and a wandering mob (e.g. a side-view chicken that paces the meadow, flips at each turn, with stepping legs and a ground shadow).
- All of it pure SVG/SMIL (`<animate>` / `<animateTransform>`) so it costs zero per-frame JS.
- Reference implementation in this project: `apps/web/components/mc-background.tsx`.

## Things that break the illusion — avoid

- Smooth gradients of any kind (backgrounds, buttons, text)
- Box-shadow with blur > 0
- Border-radius (except literal pixel-stepped corners using `clip-path` polygons)
- Anti-aliased icons or photographic imagery without a pixelation pass
- Thin/light font weights — pixel fonts read best bold/regular, never thin
- Glassmorphism, backdrop-blur, translucency — Minecraft UI is opaque and flat

**Narrow exceptions, only for the decorative scene background (never for UI chrome):** a vertical sky/aurora gradient on the far backdrop is acceptable (the game's own sky is gradient); and a single low-opacity scrim (flat color or a light `backdrop-blur`) over the scene purely to keep foreground text legible is fine. Everything in the foreground UI stays opaque and flat.