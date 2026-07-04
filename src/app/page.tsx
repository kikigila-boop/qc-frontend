'use client'
import Link from 'next/link'
import { LogIn, ShieldCheck, MonitorPlay, Palette, Upload, MessageSquare, Rocket } from 'lucide-react'

const ContentOpsLogo = () => (
  <svg viewBox="0 0 158 82" xmlns="http://www.w3.org/2000/svg" className="w-36 h-auto">
    <text x="2" y="34" fontFamily="'Arial Black', 'Helvetica Neue', sans-serif" fontSize="30" fontWeight="900"
      fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.2" paintOrder="stroke">CONTENT</text>
    <text x="32" y="70" fontFamily="'Arial Black', 'Helvetica Neue', sans-serif" fontSize="30" fontWeight="900"
      fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.2" paintOrder="stroke">OPS</text>
    <path d="M 14 40 C 2 55 16 76 36 71" stroke="#f59e0b" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    <polygon points="36,71 28,66 30,74" fill="#f59e0b" />
  </svg>
)

const WorkspaceIllustration = () => (
  <svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg">
    <rect x="130" y="100" width="260" height="175" rx="12" fill="#f8f8f6" stroke="#1e1b4b" strokeWidth="3"/>
    <rect x="142" y="112" width="236" height="151" rx="6" fill="#fff" stroke="#d1d5db" strokeWidth="1.5"/>
    <circle cx="260" cy="188" r="28" fill="#ede9fe" stroke="#6366f1" strokeWidth="2"/>
    <polygon points="254,178 278,188 254,198" fill="#6366f1"/>
    <circle cx="220" cy="232" r="5" fill="#6366f1"/>
    <circle cx="237" cy="232" r="5" fill="#a5b4fc"/>
    <circle cx="254" cy="232" r="5" fill="#e0e7ff"/>
    <circle cx="271" cy="232" r="5" fill="#e0e7ff"/>
    <rect x="245" y="275" width="30" height="30" rx="3" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5"/>
    <rect x="218" y="305" width="84" height="10" rx="5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5"/>
    <rect x="185" y="330" width="150" height="28" rx="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5"/>
    <rect x="196" y="338" width="128" height="12" rx="3" fill="#d1d5db"/>
    <rect x="82" y="310" width="36" height="32" rx="6" fill="#fff" stroke="#1e1b4b" strokeWidth="2"/>
    <path d="M 118 320 Q 130 320 130 330 Q 130 340 118 340" stroke="#1e1b4b" strokeWidth="2" fill="none"/>
    <path d="M 88 310 Q 94 298 100 310" stroke="#6366f1" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M 97 308 Q 100 296 104 308" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M 96 322 Q 94 318 98 318 Q 100 316 102 318 Q 106 318 104 322 L 100 328 Z" fill="#f472b6" opacity="0.8"/>
    <rect x="350" y="300" width="30" height="42" rx="4" fill="#6b7280" stroke="#4b5563" strokeWidth="1.5"/>
    <ellipse cx="365" cy="298" rx="22" ry="28" fill="#86efac" stroke="#22c55e" strokeWidth="1.5"/>
    <path d="M 365 298 Q 348 278 342 260" stroke="#16a34a" strokeWidth="1.5" fill="none"/>
    <path d="M 365 290 Q 382 272 386 255" stroke="#16a34a" strokeWidth="1.5" fill="none"/>
    <ellipse cx="342" cy="258" rx="14" ry="10" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" transform="rotate(-20,342,258)"/>
    <ellipse cx="387" cy="253" rx="14" ry="10" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" transform="rotate(20,387,253)"/>
    <rect x="55" y="88" width="90" height="68" rx="8" fill="#fef9c3" stroke="#facc15" strokeWidth="2" transform="rotate(-6,55,88)"/>
    <text x="63" y="116" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#92400e" transform="rotate(-6,63,116)">QC Check</text>
    <path d="M 67 128 L 77 138 L 93 120" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-6,80,128)"/>
    <rect x="388" y="66" width="110" height="62" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" transform="rotate(5,388,66)"/>
    <text x="398" y="94" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#1e40af" transform="rotate(5,398,94)">Subtitle</text>
    <text x="398" y="110" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#1e40af" transform="rotate(5,398,110)">Sync ✦✦</text>
    <rect x="408" y="193" width="100" height="58" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="2" transform="rotate(4,408,193)"/>
    <text x="418" y="216" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#166534" transform="rotate(4,418,216)">CMS</text>
    <text x="418" y="232" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#166534" transform="rotate(4,418,232)">Upload ↑</text>
    <rect x="393" y="288" width="105" height="55" rx="8" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" transform="rotate(-3,393,288)"/>
    <text x="402" y="312" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#9d174d" transform="rotate(-3,402,312)">Design</text>
    <text x="402" y="328" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#9d174d" transform="rotate(-3,402,328)">Ready! ★</text>
    <ellipse cx="260" cy="52" rx="38" ry="20" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2"/>
    <ellipse cx="238" cy="58" rx="20" ry="14" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2"/>
    <ellipse cx="282" cy="58" rx="20" ry="14" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2"/>
    <path d="M 250 50 L 250 62 M 246 58 L 250 62 L 254 58" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M 270 62 L 270 50 M 266 54 L 270 50 L 274 54" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M 143 126 L 112 118" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4,3"/>
    <path d="M 260 72 L 260 100" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4,3"/>
    <text x="58" y="200" fontSize="18" fill="#f59e0b" opacity="0.8">✦</text>
    <text x="460" y="155" fontSize="14" fill="#818cf8" opacity="0.8">✦</text>
    <text x="88" y="280" fontSize="12" fill="#f472b6" opacity="0.7">★</text>
    <text x="478" y="370" fontSize="20" fill="#f59e0b" opacity="0.9">★</text>
  </svg>
)

const features = [
  { icon: ShieldCheck, label: 'Quality Control', color: 'bg-purple-100 text-purple-600' },
  { icon: MessageSquare, label: 'Subtitle Management', color: 'bg-blue-100 text-blue-600' },
  { icon: MonitorPlay, label: 'CMS & Distribution', color: 'bg-green-100 text-green-600' },
  { icon: Palette, label: 'Design Graphic', color: 'bg-pink-100 text-pink-600' },
]

const flow = [
  { icon: Upload, label: 'Ingest', desc: 'Terima dan kumpulkan materi konten.', color: 'bg-purple-100', iconColor: 'text-purple-500' },
  { icon: ShieldCheck, label: 'QC Content', desc: 'Periksa kualitas video, audio, dan teknis.', color: 'bg-green-100', iconColor: 'text-green-500' },
  { icon: MessageSquare, label: 'Subtitle', desc: 'Buat, sinkronkan dan pastikan akurasi subtitle.', color: 'bg-yellow-100', iconColor: 'text-yellow-500' },
  { icon: MonitorPlay, label: 'CMS & Upload', desc: 'Kelola metadata dan unggah ke CMS.', color: 'bg-blue-100', iconColor: 'text-blue-500' },
  { icon: Palette, label: 'Design Graphic', desc: 'Siapkan thumbnail, poster, dan materi promo.', color: 'bg-pink-100', iconColor: 'text-pink-500' },
  { icon: Rocket, label: 'Publish', desc: 'Konten siap tayang dan dinikmati audiens.', color: 'bg-indigo-100', iconColor: 'text-indigo-500' },
]

const stats = [
  { icon: MonitorPlay, value: '1,245+', label: 'Konten Dikelola', color: 'bg-purple-100 text-purple-500' },
  { icon: ShieldCheck, value: '98.7%', label: 'Konten QC Passed', color: 'bg-green-100 text-green-500' },
  { icon: MessageSquare, value: '3,512+', label: 'Subtitle Selesai', color: 'bg-yellow-100 text-yellow-500' },
  { icon: Upload, value: '2,108+', label: 'Konten Terupload', color: 'bg-blue-100 text-blue-500' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-900">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div>
          <ContentOpsLogo />
          <p className="text-xs text-slate-400 mt-0.5 ml-0.5">Control Asset Management</p>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm"
        >
          <LogIn size={16} />
          Masuk
        </Link>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-8 py-8 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900">
              All Content.
            </h1>
            <h1
              className="text-5xl font-black leading-tight tracking-tight text-indigo-600 italic"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", borderBottom: '3px solid #f59e0b', display: 'inline-block', paddingBottom: '2px' }}
            >
              One Flow.
            </h1>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs" style={{ fontFamily: 'monospace' }}>
            Kelola, pastikan kualitas, distribusikan, dan tampilkan konten terbaik dengan workflow terintegrasi.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            {features.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-2 w-[76px]">
                <div className={`p-3 rounded-2xl ${color} shadow-sm`}>
                  <Icon size={20} />
                </div>
                <span className="text-[11px] text-center text-slate-500 font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <WorkspaceIllustration />
        </div>
      </section>

      {/* CONTENT FLOW */}
      <section className="max-w-6xl mx-auto px-8 py-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 relative overflow-hidden">
          <span className="absolute top-5 right-6 text-yellow-400 text-3xl select-none">★</span>
          <h2 className="text-xs font-black tracking-widest text-slate-700 mb-8 uppercase">Content Flow</h2>
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-start gap-4">
            {flow.map(({ icon: Icon, label, desc, color, iconColor }, i) => (
              <div key={label} className="flex items-start gap-1 flex-1 min-w-[100px]">
                <div className="flex flex-col items-center gap-2 flex-1 text-center">
                  <div className={`p-4 rounded-full ${color} shadow-sm`}>
                    <Icon size={22} className={iconColor} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{i + 1}. {label}</span>
                  <p className="text-[10px] text-slate-400 leading-snug">{desc}</p>
                </div>
                {i < flow.length - 1 && (
                  <span className="text-slate-300 text-sm mt-5 hidden lg:block flex-shrink-0">- →</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE + STATS */}
      <section className="max-w-6xl mx-auto px-8 py-6 pb-16">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 min-w-[200px]">
              <span className="text-5xl text-indigo-300 font-serif leading-none select-none">&ldquo;</span>
              <p className="text-slate-700 text-lg font-medium -mt-2 leading-snug">
                Behind every great content,<br />there is a great team.
              </p>
              <div className="mt-3 w-28 h-0.5 bg-indigo-400 rounded" />
              <span className="text-2xl text-pink-400 select-none">♥</span>
            </div>
            <div className="flex flex-wrap gap-3 flex-1 justify-center lg:justify-end">
              {stats.map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="flex items-center gap-3 border border-slate-100 rounded-2xl px-4 py-3 shadow-sm bg-white min-w-[148px]">
                  <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-tight">{value}</p>
                    <p className="text-[11px] text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-slate-400 pb-8">
        Content Ops - Control Asset Management &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
