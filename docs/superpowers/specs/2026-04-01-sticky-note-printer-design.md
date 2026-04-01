# Sticky Note Printer — Design Spec

## Overview

A skeuomorphic card printer web app where users type text into an input field, click "Print", and the text is rendered as a sticky note that animates out of the printer and lands on a draggable board below. Built with React + Vite + Framer Motion.

All project files live in the `printer/` folder.

## Architecture

```
App
├── Header (title + subtitle)
├── Printer
│   ├── NoteInput (textarea with character counter)
│   ├── ColorPicker (6 color dots)
│   ├── PrintButton
│   └── Paper (Framer Motion animation layer)
└── Board
    └── StickyNote × N (grid-snap + drag + delete)
```

### Component Responsibilities

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| `App` | State owner: notes array, print animation trigger | Printer, Board |
| `Printer` | Input UI, color selection, print animation orchestration | NoteInput, ColorPicker, PrintButton, Paper |
| `NoteInput` | Textarea with live character count, validation | none |
| `ColorPicker` | Horizontal row of 6 color dots, click to select | none |
| `PrintButton` | Disabled when printing or input invalid | none |
| `Paper` | Framer Motion element that animates through 4 phases | none |
| `Board` | CSS Grid container, renders StickyNotes | StickyNote |
| `StickyNote` | Draggable card with delete button, spring physics | none |

## Data Model

```typescript
interface StickyNote {
  id: string;           // crypto.randomUUID()
  text: string;         // user input, max 100 chars
  color: string;        // hex color value
  gridIndex: number;    // position in grid (0-based)
  createdAt: number;    // Date.now() timestamp
}
```

State: `notes: StickyNote[]` in `App`. No persistence — refresh clears all notes.

## Print Animation Flow

4 sequential phases, orchestrated by Framer Motion:

1. **Paper Insert (0.3s)** — Input text fades out, blank paper slides into printer top
2. **Text Print (0.5s)** — Text fades onto paper line by line (typewriter feel)
3. **Paper Eject (0.8s)** — Paper slides out of printer bottom exit with spring physics (weighty feel)
4. **Fly & Land (0.6s)** — Paper shrinks and flies to target grid slot, lands with a bounce

State machine: `idle → printing → ejecting → flying → landed`

Print button is disabled during the entire animation sequence.

## Sticky Note Visual Design

- **Size:** 180×180px fixed (grid cells match)
- **Shape:** `rounded-sm` (slightly rounded corners like real sticky notes)
- **Shadow:** Subtle bottom shadow, deepens on drag
- **Font:** Handwritten Chinese font — `Ma Shan Zheng` or `ZCOOL XiaoWei` (Google Fonts)
- **Delete button:** Semi-transparent `×` in top-right, visible on hover
- **Timestamp:** Small gray text at bottom showing print time

### Color Palette

| Name | Hex |
|------|-----|
| Classic Yellow | `#fef3c7` |
| Pink | `#fce7f3` |
| Sky Blue | `#dbeafe` |
| Mint Green | `#d1fae5` |
| Lavender | `#ede9fe` |
| Orange | `#ffedd5` |

## Board Grid & Drag Behavior

- **Layout:** 4-column CSS Grid (`grid-cols-4`)
- **Responsive:** `md:grid-cols-4`, `sm:grid-cols-2`, mobile `grid-cols-1`
- **Gap:** `gap-4`
- **Drag:** Framer Motion `drag` with `dragConstraints` limited to Board bounds
- **On drag:** Scale to `1.05`, deeper shadow, z-index lift
- **On release:** Snap to nearest empty slot (`layout` + `dragSnapToOrigin`)
- **Swap:** If target slot occupied, two notes exchange positions (sortable grid)

## Delete Interaction

- Hover reveals `×` button on sticky note
- Click triggers "tear off" animation: shrink + rotate + fade out
- Remaining notes shift forward to fill gap

## Input Validation

- **Max characters:** 100
- **Live counter:** Shows `23/100` below textarea
- **Over limit:** Textarea turns red, Print button disabled
- **Error message:** "便签写不下了"
- **Empty input:** Print button disabled

## Empty State

Board shows placeholder text when no notes exist: "还没有便签，打印一张吧！"

## Tech Stack

- **Framework:** React + Vite
- **Animation:** Framer Motion
- **Styling:** Tailwind CSS
- **Font:** Google Fonts (`Ma Shan Zheng` or `ZCOOL XiaoWei`)
- **No persistence:** No localStorage, no backend

## File Structure

```
printer/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    └── components/
        ├── Printer.tsx
        ├── NoteInput.tsx
        ├── ColorPicker.tsx
        ├── PrintButton.tsx
        ├── Paper.tsx
        ├── Board.tsx
        └── StickyNote.tsx
```
