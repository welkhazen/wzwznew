import { Link } from "react-router-dom";

function openPrintableDeck(path: string) {
  const win = window.open(path, "_blank", "noopener,noreferrer");
  if (!win) return;
  const triggerPrint = () => {
    win.focus();
    win.print();
  };
  win.addEventListener("load", triggerPrint, { once: true });
  setTimeout(triggerPrint, 1200);
}

export default function PitchSelector() {
  return (
    <main className="min-h-screen bg-[#080808] text-[#EBEBEB] flex items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#121212] p-8 md:p-12 shadow-[0_0_60px_rgba(241,196,45,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D9D9D9]">raW pitch deck hub</p>
        <h1 className="mt-4 text-3xl md:text-5xl font-semibold">Choose deck version</h1>
        <p className="mt-4 text-base md:text-xl text-[#D9D9D9]">Use this screen during founder/investor reviews so nobody needs to remember URLs.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Link to="/pitch-v1" className="rounded-2xl border border-white/20 px-5 py-6 text-center hover:border-[#F1C42D] hover:text-[#F1C42D] transition-colors">
            Open V1
          </Link>
          <Link to="/pitch-v2" className="rounded-2xl border border-[#F1C42D]/40 px-5 py-6 text-center text-[#F1C42D] hover:bg-[#F1C42D]/10 transition-colors">
            Open V2
          </Link>
          <button onClick={() => openPrintableDeck("/pitch-v2")} className="rounded-2xl border border-white/20 px-5 py-6 text-center hover:border-[#F1C42D] hover:text-[#F1C42D] transition-colors">
            Print PDF
          </button>
        </div>

        <p className="mt-8 text-sm text-[#D9D9D9]">Recommended flow: review V2, collect notes, then compare with V1 only for specific copy/layout decisions.</p>
      </section>
    </main>
  );
}
