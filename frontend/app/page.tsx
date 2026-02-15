"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, Video, Shield, Zap, Globe, Mic, Smartphone, Check, 
  Activity, Star, Code, Hash, Bot, Sparkles, BrainCircuit
} from 'lucide-react';

const QuiblyApex = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020204] text-[#ececed] font-sans selection:bg-cyan-500/40 overflow-x-hidden">
      
      {/* --- BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1e3a_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Subtle Moving Glow */}
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* --- NAVIGATION --- */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrollY > 20 ? 'py-4 bg-black/60 backdrop-blur-2xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <Image src="/logo.png" alt="Quibly Logo" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-black tracking-widest uppercase italic hidden sm:block">Quibly</span>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden lg:flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
            {['Download', 'Nitro', 'Discover', 'Safety', 'AI Engine', 'Support'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-cyan-400 transition-all">{item}</a>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            <Link href="/login">
              <button className="hidden sm:block bg-white/5 border border-white/10 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-cyan-400/50 hover:text-cyan-400 transition-all">Login</button>
            </Link>
            <button className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-all" onClick={() => setMobileMenu(!mobileMenu)}>
              <div className={`w-6 h-0.5 bg-white mb-1.5 transition-transform ${mobileMenu ? 'rotate-45 translate-y-2' : ''}`} />
              <div className={`w-6 h-0.5 bg-white transition-transform ${mobileMenu ? '-rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-2xl border-b border-white/5 py-8 px-6 animate-fade-in">
            <div className="flex flex-col gap-6 text-sm font-black uppercase tracking-widest text-gray-400">
              {['Download', 'Nitro', 'Discover', 'Safety', 'AI Engine', 'Support'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-cyan-400 transition-all py-2" onClick={() => setMobileMenu(false)}>{item}</a>
              ))}
              <Link href="/login" onClick={() => setMobileMenu(false)}>
                <button className="w-full bg-white/5 border border-white/10 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:border-cyan-400/50 hover:text-cyan-400 transition-all mt-4">Login</button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 md:pt-60 pb-20 md:pb-40 px-6 flex flex-col items-center text-center">
        <div className="max-w-5xl z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[10px] font-black tracking-[0.2em] text-cyan-400 mb-8 uppercase">
             <Sparkles size={12} /> AI-Enhanced Communication
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[120px] font-black leading-[0.9] mb-10 tracking-tighter">
            IMAGINE A <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">DIGITAL HOME.</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
            Whether you're a gaming squad, a study group, or a global community, Quibly provides the space to belong. Now powered by advanced AI protocols.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button className="px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-3 rounded-full">
              <Download size={18} /> Download for Windows
            </button>
            <Link href="/login">
              <button className="w-full px-8 sm:px-10 py-4 sm:py-5 border border-white/10 bg-white/5 backdrop-blur-xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-white/10 hover:border-cyan-400/50 transition-all rounded-full">
                Open in Browser
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- AI NEURAL ENGINE SECTION --- */}
      <section id="ai-engine" className="max-w-[1400px] mx-auto px-6 py-20 md:py-32 border-t border-white/5">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative order-2 lg:order-1">
             <div className="absolute -inset-4 bg-cyan-500/20 blur-3xl opacity-20" />
             <div className="relative bg-[#08080a] border border-white/10 rounded-[20px] md:rounded-[30px] p-1 font-mono text-[10px] sm:text-[12px] overflow-hidden">
                <div className="bg-white/5 p-3 md:p-4 flex justify-between items-center border-b border-white/5">
                   <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/50" />
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/50" />
                   </div>
                   <span className="text-gray-500 text-[9px] sm:text-xs">quibly_ai_core.sh</span>
                </div>
                <div className="p-4 sm:p-6 md:p-8 space-y-3 md:space-y-4 text-cyan-400/80">
                   <p>$ initializing_neural_protocols...</p>
                   <p className="text-white">{'>'} AI Summary: 42 new messages in #dev-talk</p>
                   <p className="text-purple-400">{'>'} Action: Auto-mod prevented 2 spam links</p>
                   <p>{'>'} Voice: Noise suppression active (RNN-Noise)</p>
                   <div className="h-3 md:h-4 w-0.5 md:w-1 bg-cyan-500 animate-pulse inline-block" />
                </div>
             </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="w-12 md:w-16 h-1 bg-cyan-500 mb-6 md:mb-8" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 italic uppercase tracking-tighter">THE NEURAL <br /> <span className="text-cyan-400">EDGE.</span></h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 mb-8 md:mb-10 leading-relaxed font-medium">
              We've integrated AI into the very core of Quibly. From automated server summaries and smart moderation to studio-quality AI noise cancellation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
               <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-all">
                  <BrainCircuit className="text-cyan-400 shrink-0" size={20} />
                  <span className="text-[10px] sm:text-xs font-black uppercase self-center">Smart Summaries</span>
               </div>
               <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5 hover:border-purple-400/30 transition-all">
                  <Bot className="text-purple-400 shrink-0" size={20} />
                  <span className="text-[10px] sm:text-xs font-black uppercase self-center">Autonomous Mod</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CORE FEATURES --- */}
      <section className="space-y-20 md:space-y-40 lg:space-y-60 max-w-7xl mx-auto px-6 py-20 md:py-40">
        
        {/* Feature 1 */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 italic uppercase tracking-tighter">Invite-only <br /> spaces.</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 leading-relaxed mb-6 md:mb-8 font-medium">Quibly servers are organized into topic-based channels where you can collaborate, share, and just talk about your day.</p>
            <ul className="space-y-3 md:space-y-4">
              {['Topic-based channels', 'Custom member roles', 'Private node access'].map(i => (
                <li key={i} className="flex items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-cyan-400/70 hover:text-cyan-400 transition-colors">
                  <Check size={14} className="shrink-0" /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="aspect-square bg-white/5 rounded-[30px] md:rounded-[40px] border border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-cyan-400/30 transition-all">
             <Hash size={60} className="sm:w-24 sm:h-24 md:w-28 md:h-28 text-white/5 group-hover:text-cyan-500/20 transition-all duration-700" />
             <div className="absolute inset-6 sm:inset-8 md:inset-10 border-2 border-dashed border-white/5 rounded-[20px] md:rounded-[30px] group-hover:border-cyan-400/20 transition-all duration-700" />
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1 aspect-video bg-[#0c0c0e] rounded-[30px] md:rounded-[40px] border border-white/10 overflow-hidden relative shadow-2xl hover:border-white/20 transition-all">
             <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center opacity-40">
                <Video size={36} className="sm:w-12 sm:h-12 md:w-14 md:h-14 text-white/10" />
             </div>
             <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 bg-black/80 backdrop-blur-xl rounded-full border border-white/10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"><Mic size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"><Video size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all cursor-pointer"><Smartphone size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
             </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 italic uppercase tracking-tighter">Where hanging <br /> out is easy.</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 mb-8 md:mb-10 leading-relaxed font-medium">Grab a seat in a voice channel when you're free. Friends in your server can see you're around and instantly pop in.</p>
            <div className="p-4 sm:p-5 md:p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-xl md:rounded-2xl italic text-xs sm:text-sm text-cyan-400 font-bold hover:bg-cyan-500/10 transition-all">
               "The latency is so low, it feels like we're in the same room." — Quibly Beta User
            </div>
          </div>
        </div>
      </section>

      {/* --- DISCOVER SECTION --- */}
      <section id="discover" className="py-20 md:py-32 lg:py-40 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-8 md:mb-10 italic uppercase tracking-tighter">FROM A FEW <br /> TO A FANDOM.</h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-3xl mb-12 md:mb-16 lg:mb-20 font-medium px-4">Get any community running with moderation tools and custom member access. Give members special powers, set up private channels, and more.</p>
          <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
             {[
               { name: 'Gaming', count: '450k+', color: 'text-cyan-400', icon: <Activity size={24} /> },
               { name: 'Education', count: '120k+', color: 'text-purple-400', icon: <Code size={24} /> },
               { name: 'Creators', count: '290k+', color: 'text-emerald-400', icon: <Sparkles size={24} /> },
             ].map(cat => (
               <div key={cat.name} className="p-8 md:p-10 lg:p-12 bg-black border border-white/5 rounded-[30px] md:rounded-[40px] hover:border-white/20 hover:bg-white/5 transition-all group cursor-pointer">
                  <div className={`mb-4 ${cat.color} opacity-50 group-hover:opacity-100 transition-opacity`}>{cat.icon}</div>
                  <div className={`text-3xl md:text-4xl font-black mb-3 md:mb-4 ${cat.color}`}>{cat.count}</div>
                  <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">{cat.name} Communities</div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* --- NITRO & PRICING --- */}
      <section id="nitro" className="py-20 md:py-32 lg:py-40 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">Quibly Nitro</h2>
             <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Support the protocol & get perks</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
             <div className="p-8 md:p-10 bg-white/5 border border-white/10 rounded-[30px] md:rounded-[40px] flex flex-col hover:border-white/20 transition-all">
                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-6 md:mb-8">Basic</h3>
                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                   {['Global Emojis', '300MB File Sharing', 'Nitro Badge', 'Custom Profile Card'].map(i => (
                     <li key={i} className="flex gap-3 text-xs font-bold text-gray-400 italic"><Star size={14} className="text-cyan-400 shrink-0" /> {i}</li>
                   ))}
                </ul>
                <div className="text-2xl md:text-3xl font-black mb-6 md:mb-8">$2.99<span className="text-sm font-normal">/mo</span></div>
                <button className="w-full py-3 md:py-4 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Choose Basic</button>
             </div>
             <div className="p-8 md:p-10 bg-gradient-to-br from-purple-900/30 to-black border-2 border-purple-500 rounded-[30px] md:rounded-[40px] flex flex-col relative overflow-hidden hover:border-purple-400 transition-all">
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 md:px-6 py-1.5 md:py-2 text-[9px] md:text-[10px] font-black uppercase rounded-bl-2xl">Premium</div>
                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-6 md:mb-8 mt-2">Ultra</h3>
                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                   {['4K Streaming', '5GB File Sharing', 'AI-Personal Assistant', 'Server Boosting', 'Custom App Icons'].map(i => (
                     <li key={i} className="flex gap-3 text-xs font-bold text-white italic"><Zap size={14} className="text-purple-400 shrink-0" /> {i}</li>
                   ))}
                </ul>
                <div className="text-2xl md:text-3xl font-black mb-6 md:mb-8">$9.99<span className="text-sm font-normal">/mo</span></div>
                <button className="w-full py-3 md:py-4 bg-purple-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-purple-400 transition-all shadow-xl shadow-purple-500/20">Go Ultra</button>
             </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA & FOOTER --- */}
      <footer className="pt-20 md:pt-32 lg:pt-40 pb-12 md:pb-16 lg:pb-20 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 md:mb-32 lg:mb-40">
             <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-8 md:mb-12 italic tracking-tighter uppercase">Ready to join?</h2>
             <Link href="/login">
               <button className="px-12 sm:px-14 md:px-16 py-5 md:py-6 bg-cyan-500 text-black font-black text-base sm:text-lg md:text-xl uppercase tracking-widest hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 rounded-full">
                  Launch Quibly Core
               </button>
             </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 lg:gap-16 mb-16 md:mb-20 lg:mb-24">
             <div className="col-span-2">
                <div className="text-2xl md:text-3xl font-black italic tracking-tighter mb-6 md:mb-8">QUIBLY<span className="text-cyan-500">.</span></div>
                <div className="flex gap-3 md:gap-4">
                   <div className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"><Globe size={16} className="md:w-[18px] md:h-[18px]" /></div>
                   <div className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"><Smartphone size={16} className="md:w-[18px] md:h-[18px]" /></div>
                   <div className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"><Shield size={16} className="md:w-[18px] md:h-[18px]" /></div>
                </div>
             </div>
             {['Product', 'Company', 'Support'].map(cat => (
               <div key={cat}>
                  <h4 className="text-cyan-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6 md:mb-8">{cat}</h4>
                  <ul className="space-y-3 md:space-y-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                     <li className="hover:text-white cursor-pointer transition-colors">Infrastructure</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Protocols</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
                  </ul>
               </div>
             ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-[4px] text-gray-800">
             <span>© 2026 Quibly Systems Group</span>
             <div className="flex gap-6 md:gap-8">
                <span className="hover:text-gray-600 cursor-pointer transition-colors">Terms</span>
                <span className="hover:text-gray-600 cursor-pointer transition-colors">Privacy</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default QuiblyApex;
