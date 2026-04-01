# Sticky Note Printer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a skeuomorphic card printer web app — type text, click Print, and a sticky note animates out of the printer onto a draggable grid board.

**Architecture:** React + Vite SPA with modular components. App owns note state. Printer orchestrates a 4-phase Framer Motion animation. Board renders a sortable CSS grid of StickyNote cards.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Google Fonts (Ma Shan Zheng)

---

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

---

### Task 1: Scaffold Vite + React + TypeScript Project

**Files:**
- Create: `printer/index.html`
- Create: `printer/package.json`
- Create: `printer/vite.config.ts`
- Create: `printer/tsconfig.json`
- Create: `printer/tsconfig.node.json`
- Create: `printer/src/main.tsx`
- Create: `printer/src/App.tsx`
- Create: `printer/src/index.css`
- Create: `printer/src/vite-env.d.ts`

- [ ] **Step 1: Create project scaffolding**

```json
// printer/package.json
{
  "name": "sticky-note-printer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.11.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "~5.6.2",
    "vite": "^6.0.1"
  }
}
```

```ts
// printer/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

```json
// printer/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"]
}
```

```json
// printer/tsconfig.node.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

```html
<!-- printer/index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>便签打印机</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```tsx
// printer/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

```tsx
// printer/src/App.tsx
export default function App() {
  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center gap-8 py-12 px-4">
      <h1 className="text-3xl font-bold text-stone-700">便签打印机</h1>
      <p className="text-stone-500">输入文字，打印便签，拖到看板上</p>
    </main>
  );
}
```

```css
/* printer/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
```

```ts
// printer/src/vite-env.d.ts
/// <reference types="vite/client" />
```

- [ ] **Step 2: Install dependencies**

Run: `cd printer && npm install`
Expected: All dependencies installed, no errors.

- [ ] **Step 3: Verify dev server starts**

Run: `cd printer && npx vite --host`
Expected: Dev server starts on localhost:5173, page shows title and subtitle.

- [ ] **Step 4: Commit**

```bash
git add printer/
git commit -m "feat: scaffold sticky note printer Vite project"
```

---

### Task 2: Configure Tailwind CSS

**Files:**
- Create: `printer/tailwind.config.js`
- Create: `printer/postcss.config.js`
- Modify: `printer/src/index.css`

- [ ] **Step 1: Add Tailwind config with custom colors and font**

```js
// printer/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        handwriting: ["'Ma Shan Zheng'", "cursive"],
      },
      colors: {
        note: {
          yellow: "#fef3c7",
          pink: "#fce7f3",
          blue: "#dbeafe",
          green: "#d1fae5",
          purple: "#ede9fe",
          orange: "#ffedd5",
        },
      },
    },
  },
  plugins: [],
};
```

```js
// printer/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Verify Tailwind works**

Run: `cd printer && npx vite --host`
Expected: Page loads, Tailwind classes compile without errors.

- [ ] **Step 3: Commit**

```bash
git add printer/
git commit -m "feat: configure Tailwind with note colors and handwriting font"
```

---

### Task 3: Build NoteInput + ColorPicker + PrintButton Components

**Files:**
- Create: `printer/src/components/NoteInput.tsx`
- Create: `printer/src/components/ColorPicker.tsx`
- Create: `printer/src/components/PrintButton.tsx`
- Modify: `printer/src/App.tsx`

- [ ] **Step 1: Create NoteInput component**

```tsx
// printer/src/components/NoteInput.tsx
import { useState } from "react";

const MAX_CHARS = 100;

interface NoteInputProps {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
}

export default function NoteInput({ value, onChange, disabled }: NoteInputProps) {
  const charCount = value.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS + 20))}
        disabled={disabled}
        placeholder="输入便签内容..."
        rows={4}
        className={`w-full rounded-lg border-2 p-3 text-base resize-none
          transition-colors duration-200
          ${overLimit ? "border-red-400 bg-red-50" : "border-stone-300 bg-white"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          focus:outline-none focus:border-stone-500`}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
        <span className={overLimit ? "text-red-500 font-medium" : ""}>
          {charCount}/{MAX_CHARS}
          {overLimit && " — 便签写不下了"}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ColorPicker component**

```tsx
// printer/src/components/ColorPicker.tsx
const COLORS = [
  { name: "yellow", hex: "#fef3c7" },
  { name: "pink", hex: "#fce7f3" },
  { name: "blue", hex: "#dbeafe" },
  { name: "green", hex: "#d1fae5" },
  { name: "purple", hex: "#ede9fe" },
  { name: "orange", hex: "#ffedd5" },
] as const;

type ColorName = (typeof COLORS)[number]["name"];

interface ColorPickerProps {
  selected: ColorName;
  onSelect: (color: ColorName) => void;
  disabled: boolean;
}

export default function ColorPicker({ selected, onSelect, disabled }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 mr-1">颜色:</span>
      {COLORS.map((c) => (
        <button
          key={c.name}
          onClick={() => onSelect(c.name)}
          disabled={disabled}
          className={`w-6 h-6 rounded-full border-2 transition-transform
            ${selected === c.name ? "border-stone-700 scale-110" : "border-stone-300"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
          style={{ backgroundColor: c.hex }}
          aria-label={`选择${c.name}色便签`}
        />
      ))}
    </div>
  );
}

export type { ColorName };
```

- [ ] **Step 3: Create PrintButton component**

```tsx
// printer/src/components/PrintButton.tsx
import { Printer } from "lucide-react";

interface PrintButtonProps {
  onClick: () => void;
  disabled: boolean;
  isPrinting: boolean;
}

export default function PrintButton({ onClick, disabled, isPrinting }: PrintButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isPrinting}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium
        transition-all duration-200
        ${disabled || isPrinting
          ? "bg-stone-400 cursor-not-allowed"
          : "bg-stone-700 hover:bg-stone-800 active:scale-[0.98]"
        }`}
    >
      <Printer size={18} />
      {isPrinting ? "打印中..." : "Print"}
    </button>
  );
}
```

- [ ] **Step 4: Wire up in App.tsx**

```tsx
// printer/src/App.tsx
import { useState } from "react";
import NoteInput from "./components/NoteInput";
import ColorPicker, { type ColorName } from "./components/ColorPicker";
import PrintButton from "./components/PrintButton";

export default function App() {
  const [text, setText] = useState("");
  const [color, setColor] = useState<ColorName>("yellow");
  const [isPrinting, setIsPrinting] = useState(false);

  const canPrint = text.trim().length > 0 && text.length <= 100 && !isPrinting;

  const handlePrint = () => {
    if (!canPrint) return;
    setIsPrinting(true);
    setTimeout(() => setIsPrinting(false), 2000);
  };

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center gap-8 py-12 px-4">
      <h1 className="text-3xl font-bold text-stone-700">便签打印机</h1>
      <p className="text-stone-500">输入文字，打印便签，拖到看板上</p>

      <div className="w-full max-w-md bg-stone-200 rounded-2xl p-6 shadow-lg border border-stone-300">
        <NoteInput value={text} onChange={setText} disabled={isPrinting} />
        <div className="mt-4 flex items-center justify-between">
          <ColorPicker selected={color} onSelect={setColor} disabled={isPrinting} />
          <PrintButton onClick={handlePrint} disabled={!canPrint} isPrinting={isPrinting} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify components render and interact correctly**

Run: `cd printer && npx vite --host`
Expected: Input textarea works, color dots clickable, Print button disables when empty or printing.

- [ ] **Step 6: Commit**

```bash
git add printer/
git commit -m "feat: add NoteInput, ColorPicker, PrintButton components"
```

---

### Task 4: Build the Printer Component with 4-Phase Animation

**Files:**
- Create: `printer/src/components/Printer.tsx`
- Create: `printer/src/components/Paper.tsx`
- Modify: `printer/src/App.tsx`

- [ ] **Step 1: Create Paper animation component**

```tsx
// printer/src/components/Paper.tsx
import { motion, AnimatePresence } from "framer-motion";

type PrintPhase = "idle" | "inserting" | "printing" | "ejecting" | "flying";

interface PaperProps {
  phase: PrintPhase;
  text: string;
  color: string;
}

const springConfig = { type: "spring" as const, stiffness: 80, damping: 18 };

export default function Paper({ phase, text, color }: PaperProps) {
  return (
    <div className="relative h-32 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            className="absolute w-48 rounded shadow-md"
            style={{ backgroundColor: color }}
            initial={
              phase === "inserting"
                ? { y: -80, opacity: 0, scale: 0.8 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            animate={
              phase === "inserting"
                ? { y: 0, opacity: 1, scale: 1 }
                : phase === "printing"
                  ? { y: 0, opacity: 1, scale: 1 }
                  : phase === "ejecting"
                    ? { y: 60, opacity: 1, scale: 1 }
                    : { y: 120, opacity: 0, scale: 0.5 }
            }
            exit={{ opacity: 0, scale: 0.3 }}
            transition={
              phase === "ejecting"
                ? springConfig
                : phase === "flying"
                  ? { ...springConfig, duration: 0.6 }
                  : { duration: 0.3 }
            }
          >
            <div className="p-3 font-handwriting text-stone-800 text-lg leading-relaxed">
              {phase !== "inserting" && text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Create Printer component that orchestrates phases**

```tsx
// printer/src/components/Printer.tsx
import { useState, useCallback } from "react";
import NoteInput from "./NoteInput";
import ColorPicker, { type ColorName } from "./ColorPicker";
import PrintButton from "./PrintButton";
import Paper from "./Paper";

const COLOR_HEX: Record<ColorName, string> = {
  yellow: "#fef3c7",
  pink: "#fce7f3",
  blue: "#dbeafe",
  green: "#d1fae5",
  purple: "#ede9fe",
  orange: "#ffedd5",
};

type PrintPhase = "idle" | "inserting" | "printing" | "ejecting" | "flying";

interface PrinterProps {
  onPrintComplete: (text: string, color: ColorName) => void;
}

const PHASE_TIMING: Record<PrintPhase, number> = {
  idle: 0,
  inserting: 300,
  printing: 500,
  ejecting: 800,
  flying: 600,
};

export default function Printer({ onPrintComplete }: PrinterProps) {
  const [text, setText] = useState("");
  const [color, setColor] = useState<ColorName>("yellow");
  const [isPrinting, setIsPrinting] = useState(false);
  const [phase, setPhase] = useState<PrintPhase>("idle");

  const canPrint = text.trim().length > 0 && text.length <= 100;

  const handlePrint = useCallback(() => {
    if (!canPrint || isPrinting) return;
    setIsPrinting(true);

    setPhase("inserting");
    setTimeout(() => {
      setPhase("printing");
      setTimeout(() => {
        setPhase("ejecting");
        setTimeout(() => {
          setPhase("flying");
          setTimeout(() => {
            onPrintComplete(text, color);
            setText("");
            setPhase("idle");
            setIsPrinting(false);
          }, PHASE_TIMING.flying);
        }, PHASE_TIMING.ejecting);
      }, PHASE_TIMING.printing);
    }, PHASE_TIMING.inserting);
  }, [canPrint, isPrinting, text, color, onPrintComplete]);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
      {/* Printer body */}
      <div className="bg-gradient-to-b from-stone-300 to-stone-400 p-6 pb-4 border border-stone-500">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-stone-600 tracking-widest uppercase">
            StickyPrint 3000
          </span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <div className="w-2 h-2 rounded-full bg-stone-500" />
          </div>
        </div>

        <NoteInput value={text} onChange={setText} disabled={isPrinting} />
        <div className="mt-4 flex items-center justify-between">
          <ColorPicker selected={color} onSelect={setColor} disabled={isPrinting} />
          <PrintButton onClick={handlePrint} disabled={!canPrint} isPrinting={isPrinting} />
        </div>
      </div>

      {/* Paper exit slot */}
      <div className="bg-stone-500 border-t-4 border-stone-600 px-6 py-2 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-stone-700 rounded-b" />
        <Paper phase={phase} text={text} color={COLOR_HEX[color]} />
      </div>

      {/* Paper tray / base */}
      <div className="h-6 bg-gradient-to-b from-stone-500 to-stone-600 border-t border-stone-700" />
      <div className="h-3 bg-stone-700 rounded-b-2xl" />
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx to use Printer component**

```tsx
// printer/src/App.tsx
import { useState } from "react";
import Printer from "./components/Printer";
import Board from "./components/Board";
import type { StickyNote } from "./components/Board";
import type { ColorName } from "./components/ColorPicker";

const COLOR_MAP: Record<ColorName, string> = {
  yellow: "bg-note-yellow",
  pink: "bg-note-pink",
  blue: "bg-note-blue",
  green: "bg-note-green",
  purple: "bg-note-purple",
  orange: "bg-note-orange",
};

export default function App() {
  const [notes, setNotes] = useState<StickyNote[]>([]);

  const handlePrintComplete = (text: string, color: ColorName) => {
    const note: StickyNote = {
      id: crypto.randomUUID(),
      text,
      color: COLOR_MAP[color],
      createdAt: Date.now(),
    };
    setNotes((prev) => [...prev, note]);
  };

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center gap-8 py-12 px-4">
      <h1 className="text-3xl font-bold text-stone-700">便签打印机</h1>
      <p className="text-stone-500">输入文字，打印便签，拖到看板上</p>

      <Printer onPrintComplete={handlePrintComplete} />
      <Board notes={notes} />
    </main>
  );
}
```

- [ ] **Step 4: Verify animation flow**

Run: `cd printer && npx vite --host`
Expected: Click Print → paper inserts → text appears → paper ejects → paper flies away → input clears.

- [ ] **Step 5: Commit**

```bash
git add printer/
git commit -m "feat: add Printer component with 4-phase print animation"
```

---

### Task 5: Build the Board + StickyNote Components

**Files:**
- Create: `printer/src/components/Board.tsx`
- Create: `printer/src/components/StickyNote.tsx`
- Modify: `printer/src/App.tsx`

- [ ] **Step 1: Create StickyNote component**

```tsx
// printer/src/components/StickyNote.tsx
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

export interface StickyNote {
  id: string;
  text: string;
  color: string;
  createdAt: number;
}

interface StickyNoteProps {
  note: StickyNote;
  onDelete: (id: string) => void;
}

export default function StickyNoteCard({ note, onDelete }: StickyNoteProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(note.id), 400);
  };

  const timeStr = new Date(note.createdAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      className={`relative ${note.color} rounded-sm shadow-md p-4
        hover:shadow-lg transition-shadow duration-200
        cursor-grab active:cursor-grabbing`}
      layout
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      dragSnapToOrigin
      whileDrag={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", zIndex: 10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={isDeleting ? { scale: 0.8, rotate: -12, opacity: 0 } : {}}
      transition={isDeleting ? { duration: 0.4 } : { type: "spring", stiffness: 300, damping: 25 }}
    >
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          aria-label="删除便签"
        >
          <X size={14} className="text-stone-600" />
        </button>
      )}

      <p className="font-handwriting text-stone-800 text-lg leading-relaxed mt-2 break-words">
        {note.text}
      </p>

      <p className="text-[10px] text-stone-400 mt-3 text-right">{timeStr}</p>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create Board component**

```tsx
// printer/src/components/Board.tsx
import { AnimatePresence, motion } from "framer-motion";
import StickyNoteCard, { type StickyNote } from "./StickyNote";

export type { StickyNote } from "./StickyNote";

interface BoardProps {
  notes: StickyNote[];
  onDelete: (id: string) => void;
}

export default function Board({ notes, onDelete }: BoardProps) {
  if (notes.length === 0) {
    return (
      <div className="w-full max-w-3xl min-h-[200px] bg-stone-200/50 rounded-xl border-2 border-dashed border-stone-300 flex items-center justify-center">
        <p className="text-stone-400 text-lg">还没有便签，打印一张吧！</p>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-3xl min-h-[200px] bg-stone-200/50 rounded-xl p-6 border border-stone-300"
      layout
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {notes.map((note) => (
            <StickyNoteCard key={note.id} note={note} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Update App.tsx to pass onDelete**

```tsx
// printer/src/App.tsx — full file
import { useState } from "react";
import Printer from "./components/Printer";
import Board from "./components/Board";
import type { StickyNote } from "./components/Board";
import type { ColorName } from "./components/ColorPicker";

const COLOR_MAP: Record<ColorName, string> = {
  yellow: "bg-note-yellow",
  pink: "bg-note-pink",
  blue: "bg-note-blue",
  green: "bg-note-green",
  purple: "bg-note-purple",
  orange: "bg-note-orange",
};

export default function App() {
  const [notes, setNotes] = useState<StickyNote[]>([]);

  const handlePrintComplete = (text: string, color: ColorName) => {
    const note: StickyNote = {
      id: crypto.randomUUID(),
      text,
      color: COLOR_MAP[color],
      createdAt: Date.now(),
    };
    setNotes((prev) => [...prev, note]);
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <main className="min-h-screen bg-stone-100 flex flex-col items-center gap-8 py-12 px-4">
      <h1 className="text-3xl font-bold text-stone-700">便签打印机</h1>
      <p className="text-stone-500">输入文字，打印便签，拖到看板上</p>

      <Printer onPrintComplete={handlePrintComplete} />
      <Board notes={notes} onDelete={handleDelete} />
    </main>
  );
}
```

- [ ] **Step 4: Verify Board renders with notes, drag works, delete works**

Run: `cd printer && npx vite --host`
Expected: Notes appear in 4-col grid after printing, drag and drop works, hover shows X, delete animates tear-off.

- [ ] **Step 5: Commit**

```bash
git add printer/
git commit -m "feat: add Board and StickyNote with drag, delete, and grid layout"
```

---

### Task 6: Polish and Final Review

**Files:**
- Modify: `printer/src/index.css`
- Modify: `printer/src/App.tsx`

- [ ] **Step 1: Add global polish styles**

```css
/* printer/src/index.css — append */
@layer base {
  textarea {
    font-family: system-ui, -apple-system, sans-serif;
  }
}
```

- [ ] **Step 2: Final verification**

Run: `cd printer && npx vite build`
Expected: Build succeeds, no TypeScript errors, no unused imports.

Run: `cd printer && npx vite --host`
Expected: Full flow works — type, print, animate, land on board, drag, delete.

- [ ] **Step 3: Commit**

```bash
git add printer/
git commit -m "feat: polish and finalize sticky note printer"
```
