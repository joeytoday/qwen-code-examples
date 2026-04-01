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
