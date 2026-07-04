import Link from 'next/link'
import { LogIn, ShieldCheck, MonitorPlay, Palette, Upload, MessageSquare, Rocket } from 'lucide-react'

const ContentOpsLogo = () => (
  <svg viewBox="0 0 158 82" xmlns="http://www.w3.org/2000/svg" className="w-36 h-auto">
    <text x="2" y="34" fontFamily="'Arial Black','Helvetica Neue',sans-serif" fontSize="30" fontWeight="900"
      className="fill-indigo-950 dark:fill-white" stroke="#818cf8" strokeWidth="1.2" paintOrder="stroke">CONTENT</text>
    <text x="32" y="70" fontFamily="'Arial Black','Helvetica Neue',sans-serif" fontSize="30" fontWeight="900"
      className="fill-indigo-950 dark:fill-white" stroke="#818cf8" strokeWidth="1.2" paintOrder="stroke">OPS</text>
    <path d="M 14 40 C 2 55 16 76 36 71" stroke="#f59e0b" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <polygon points="36,71 28,66 30,74" fill="#f59e0b"/>
  </svg>
)

const Illustration = () => (
  <svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg">
    {/* Monitor body */}
    <rect x="130" y="95" width="262" height="178" rx="13" fill="none" stroke="#6366f1" strokeWidth="3"/>
    <rect x="143" y="108" width="236" height="152" rx="7" fill="#f8f7ff" stroke="#c4b5fd" strokeWidth="1.5"/>
    {/* Screen glow */}
    <circle cx="261" cy="184" r="30" fill="#ede9fe" stroke="#6366f1" strokeWidth="2"/>
    <polygon points="254,174 279,184 254,196" fill="#6366f1"/>
    {/* Progress bar */}
    <rect x="186" y="243" width="148" height="6" rx="3" fill="#e0e7ff"/>
    <rect x="186" y="243" width="72" height="6" rx="3" fill="#6366f1"/>
    {/* Stand */}
    <rect x="246" y="273" width="28" height="28" rx="3" fill="#c4b5fd" stroke="#818cf8" strokeWidth="1.5"/>
    <rect x="220" y="301" width="82" height="9" rx="4.5" fill="#c4b5fd" stroke="#818cf8" strokeWidth="1.5"/>
    {/* Keyboard */}
    <rect x="188" y="325" width="144" height="26" rx="6" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5"/>
    <rect x="198" y="333" width="124" height="10" rx="3" fill="#c4b5fd"/>
    {/* Coffee */}
    <rect x="78" y="308" width="36" height="32" rx="7" fill="white" stroke="#6366f1" strokeWidth="2"/>
    <path d="M114 318 Q127 318 127 328 Q127 338 114 338" stroke="#6366f1" strokeWidth="2" fill="none"/>
    <path d="M86 308 Q92 296 98 308" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M95 306 Q98 294 102 306" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M94 320 Q92 316 96 316 Q98 314 100 316 Q104 316 102 320 L98 326 Z" fill="#f472b6"/>
    {/* Plant */}
    <rect x="353" y="300" width="28" height="40" rx="4" fill="#a5b4fc" stroke="#818cf8" strokeWidth="1.5"/>
    <ellipse cx="367" cy="297" rx="22" ry="26" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>
    <path d="M367 297 Q350 278 344 262" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
    <path d="M367 290 Q383 272 387 256" stroke="#22c55e" strokeWidth="1.5" fill="none"/>
    <ellipse cx="344" cy="260" rx="13" ry="9" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5" transform="rotate(-20,344,260)"/>
    <ellipse cx="388" cy="254" rx="13" ry="9" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5" transform="rotate(20,388,254)"/>
    {/* Floating note: QC Check */}
    <rect x="52" y="84" width="88" height="66" rx="9" fill="#fef9c3" stroke="#fde047" strokeWidth="2" transform="rotate(-6,52,84)"/>
    <text x="60" y="112" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#92400e" transform="rotate(-6,60,112)">QC Check</text>
    <path d="M64 126 L74 136 L90 118" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-6,77,126)"/>
    {/* Floating note: Subtitle */}
    <rect x="386" y="62" width="108" height="60" rx="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" transform="rotate(5,386,62)"/>
    <text x="396" y="90" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#1e40af" transform="rotate(5,396,90)">Subtitle</text>
    <text x="396" y="106" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#1e40af" transform="rotate(5,396,106)">Sync ✦✦</text>
    {/* Floating note: CMS Upload */}
    <rect x="406" y="192" width="98" height="56" rx="9" fill="#dcfce7" stroke="#86efac" strokeWidth="2" transform="rotate(4,406,192)"/>
    <text x="416" y="215" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#166534" transform="rotate(4,416,215)">CMS</text>
    <text x="416" y="231" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#166534" transform="rotate(4,416,231)">Upload ↑</text>
    {/* Floating note: Design Ready */}
    <rect x="390" y="286" width="104" height="53" rx="9" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" transform="rotate(-3,390,286)"/>
    <text x="400" y="309" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#9d174d" transform="rotate(-3,400,309)">Design</text>
    <text x="400" y="325" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#9d174d" transform="rotate(-3,400,325)">Ready! ★</text>
    {/* Cloud */}
    <ellipse cx="261" cy="48" rx="36" ry="18" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2"/>
    <ellipse cx="240" cy="54" rx="19" ry="13" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2"/>
    <ellipse cx="282" cy="54" rx="19" ry="13" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2"/>
    <path d="M252 48 L252 60 M248 56 L252 60 L256 56" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M271 60 L271 48 M267 52 L271 48 L275 52" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Dashed connectors */}
    <path d="M261 67 L261 95" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4,3"/>
    <path d="M141 122 L110 110" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4,3"/>
    {/* Sparkles */}
    <text x="55" y="195" fontSize="18" fill="#f59e0b" opacity="0.9">✦</text>
    <text x="460" y="150" fontSize="14" fill="#818cf8" opacity="0.8">✦</text>
    <text x="86" y="278" fontSize="12" fill="#f472b6" opacity="0.8">★</text>
    <text x="476" y="368" fontSize="20" fill="#f59e0b">★</text>
  </svg>
)

const features = [
  { icon: ShieldCheck, label: 'Quality\nControl',       bg: 'bg-purple-100 dark:bg-purple-900/40', ic: 'text-purple-600 dark:text-purple-300' },
  { icon: MessageSquare, label: 'Subtitle\nManagement', bg: 'bg-blue-100 dark:bg-blue-900/40',   ic: 'text-blue-600 dark:text-blue-300'   },
  { icon: MonitorPlay, label: 'CMS &\nDistribution',   bg: 'bg-green-100 dark:bg-green-900/40', ic: 'text-green-600 dark:text-green-300' },
  { icon: Palette,     label: 'Design\nGraphic',       bg: 'bg-pink-100 dark:bg-pink-900/40',   ic: 'text-pink-600 dark:text-pink-300'   },
]

const flow = [
  { icon: Upload,       n:'1', label:'Ingest',       desc:'Terima dan kumpulkan materi konten.',                 bg:'bg-purple-100 dark:bg-purple-900/40', ic:'text-purple-500 dark:text-purple-300' },
  { icon: ShieldCheck,  n:'2', label:'QC Content',   desc:'Periksa kualitas video, audio, dan teknis.',          bg:'bg-green-100 dark:bg-green-900/40',  ic:'text-green-500 dark:text-green-300'  },
  { icon: MessageSquare,n:'3', label:'Subtitle',     desc:'Buat, sinkronkan dan pastikan akurasi subtitle.',     bg:'bg-yellow-100 dark:bg-yellow-900/40',ic:'text-yellow-500 dark:text-yellow-300'},
  { icon: MonitorPlay,  n:'4', label:'CMS & Upload', desc:'Kelola metadata dan unggah ke CMS.',                  bg:'bg-blue-100 dark:bg-blue-900/40',    ic:'text-blue-500 dark:text-blue-300'    },
  { icon: Palette,      n:'5', label:'Design Graphic',desc:'Siapkan thumbnail, poster, dan materi promo.',       bg:'bg-pink-100 dark:bg-pink-900/40',    ic:'text-pink-500 dark:text-pink-300'    },
  { icon: Rocket,       n:'6', label:'Publish',      desc:'Konten siap tayang dan dinikmati audiens.',           bg:'bg-indigo-100 dark:bg-indigo-900/40',ic:'text-indigo-500 dark:text-indigo-300'},
]

const stats = [
  { icon: MonitorPlay,   value:'1,245+', label:'Konten Dikelola',  bg:'bg-purple-100 dark:bg-purple-900/40', ic:'text-purple-500 dark:text-purple-300' },
  { icon: ShieldCheck,   value:'98.7%',  label:'Konten QC Passed', bg:'bg-green-100 dark:bg-green-900/40',  ic:'text-green-500 dark:text-green-300'  },
  { icon: MessageSquare, value:'3,512+', label:'Subtitle Selesai', bg:'bg-yellow-100 dark:bg-yellow-900/40',ic:'text-yellow-500 dark:text-yellow-300'},
  { icon: Upload,        value:'2,108+', label:'Konten Terupload', bg:'bg-blue-100 dark:bg-blue-900/40',   ic:'text-blue-500 dark:text-blue-300'    },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] dark:bg-slate-950 transition-colors">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div>
          <ContentOpsLogo />
          <p className="text-[11px] text-slate-400 mt-0.5 ml-0.5">Control Asset Management</p>
        </div>
        <Link href="/login"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md text-sm">
          <LogIn size={16}/> Masuk
        </Link>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-6 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-5xl font-black leading-tight text-slate-900 dark:text-white">All Content.</h1>
            <h1 className="text-5xl font-black leading-tight text-indigo-600 dark:text-indigo-400 italic"
              style={{fontFamily:"Georgia,serif", borderBottom:'3px solid #f59e0b', display:'inline-block', paddingBottom:'2px'}}>
              One Flow.
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs" style={{fontFamily:'monospace'}}>
            Kelola, pastikan kualitas, distribusikan, dan tampilkan konten terbaik dengan workflow terintegrasi.
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            {features.map(({icon:Icon, label, bg, ic}) => (
              <div key={label} className="flex flex-col items-center gap-2 w-[74px]">
                <div className={`p-3 rounded-2xl ${bg} shadow-sm`}><Icon size={20} className={ic}/></div>
                <span className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium leading-tight whitespace-pre-line">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex justify-center"><Illustration/></div>
      </section>

      {/* CONTENT FLOW */}
      <section className="max-w-6xl mx-auto px-6 py-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 relative overflow-hidden">
          <span className="absolute top-5 right-6 text-yellow-400 text-3xl select-none">★</span>
          <h2 className="text-[11px] font-black tracking-widest text-slate-600 dark:text-slate-400 mb-8 uppercase">Content Flow</h2>
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-start gap-4">
            {flow.map(({icon:Icon, n, label, desc, bg, ic}, i) => (
              <div key={label} className="flex items-start gap-1 flex-1 min-w-[90px]">
                <div className="flex flex-col items-center gap-2 flex-1 text-center">
                  <div className={`p-4 rounded-full ${bg} shadow-sm`}><Icon size={22} className={ic}/></div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{n}. {label}</span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">{desc}</p>
                </div>
                {i < flow.length-1 && <span className="text-slate-300 dark:text-slate-700 text-sm mt-5 hidden lg:block flex-shrink-0">- →</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE + STATS */}
      <section className="max-w-6xl mx-auto px-6 py-4 pb-14">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 min-w-[200px]">
              <span className="text-5xl text-indigo-300 dark:text-indigo-500 font-serif leading-none select-none">&ldquo;</span>
              <p className="text-slate-700 dark:text-slate-300 text-lg font-medium -mt-2 leading-snug">
                Behind every great content,<br/>there is a great team.
              </p>
              <div className="mt-3 w-28 h-0.5 bg-indigo-400 rounded"/>
              <span className="text-2xl text-pink-400 select-none">♥</span>
            </div>
            <div className="flex flex-wrap gap-3 flex-1 justify-center lg:justify-end">
              {stats.map(({icon:Icon, value, label, bg, ic}) => (
                <div key={label} className="flex items-center gap-3 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm bg-white dark:bg-slate-800 min-w-[148px]">
                  <div className={`p-2.5 rounded-xl ${bg}`}><Icon size={18} className={ic}/></div>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{value}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-400 pb-8">
        Content Ops - Control Asset Management &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
