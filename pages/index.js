import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>REHAT. - Antitesis Profesionalisme</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=Space+Mono&display=swap" rel="stylesheet" />
        <style>{`
          body { background-color: #e5e5e5; font-family: 'Space Grotesk', sans-serif; color: #1a1a1a; overflow-x: hidden; }
          .mono { font-family: 'Space Mono', monospace; }
          .smear-shadow { box-shadow: 20px 20px 60px rgba(26,26,26,0.08), -10px -10px 40px rgba(255,255,255,0.5); transition: all 0.4s; }
          .smear-shadow:hover { transform: translateY(-2px); box-shadow: 30px 30px 80px rgba(0,0,0,0.15); }
          .dither-bg { background-image: radial-gradient(#1a1a1a 0.5px, transparent 0.5px); background-size: 3px 3px; opacity: 0.15; position: fixed; inset: 0; pointer-events: none; z-index: 10; }
        `}</style>
      </Head>

      <div className="p-4 md:p-8 relative z-20">
        <div className="dither-bg"></div>
        <main className="max-w-6xl mx-auto relative z-30">
          
          <header className="flex justify-between items-end mb-16">
            <div>
              <h1 className="text-7xl font-bold uppercase leading-none">REHAT.</h1>
              <p className="mono text-sm mt-2 opacity-60 italic">— Antitesis Profesionalisme Kerah Putih.</p>
            </div>
            <div className="text-right hidden md:block">
              <div className="mono text-xs uppercase mb-1">Status Server</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                <span className="text-xl font-medium">Semua Sedang Rebahan</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white p-1 smear-shadow">
                <div className="border-2 border-black p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-black/10 pb-2">
                    <span className="mono text-xs font-bold text-gray-400">Mode Anonim Aktif</span>
                  </div>
                  <textarea className="w-full h-32 bg-transparent text-2xl outline-none resize-none font-light" placeholder="Nasib hari ini? (Max 140 karakter pelampiasan)"></textarea>
                  <div className="text-right pt-4">
                    <button className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-gray-800 transition-all">
                      Lempar Nasib
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="mono text-sm font-bold border-l-4 border-black pl-4">Lini Masa Solidaritas</h2>
                <div className="bg-white p-8 smear-shadow">
                  <span className="mono text-xs bg-black text-white px-2 py-0.5">#nasib-0129</span>
                  <p className="text-3xl leading-tight mt-4 mb-8">
                    "Sudah di tahap hapus email dari HP biar nggak sakit hati liat notifikasi penolakan."
                  </p>
                  <button className="mono text-xs font-bold underline">[+] Rasakan Nasib Sama (42)</button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-black text-white p-8 smear-shadow">
                <h3 className="text-xl font-bold mb-6 mono uppercase">Bursa Barter Sisa Skill</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between border-b border-white/20 pb-2">
                    <span className="text-xl">Slicing HTML</span>
                    <span className="mono text-sm text-gray-400">Tukar: Cuci Sepatu</span>
                  </li>
                  <li className="flex justify-between border-b border-white/20 pb-2">
                    <span className="text-xl">Translate English</span>
                    <span className="mono text-sm text-gray-400">Tukar: Nasi Padang</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}