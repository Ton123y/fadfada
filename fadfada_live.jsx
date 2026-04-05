import { useState, useEffect, useCallback, useRef } from "react";

// ==================== STORAGE HELPERS ====================
async function saveShared(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), true); } catch (e) { }
}
async function loadShared(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function listShared(prefix) {
  try {
    const r = await window.storage.list(prefix, true);
    return r ? r.keys : [];
  } catch (e) { return []; }
}

const painEmojis = ['', '😐', '😞', '😭', '💔'];
const painLabels = ['', 'تعب بسيط', 'حزن', 'اكتئاب شديد', 'انهيار'];

const nightQuestions = [
  "إيه أكتر حاجة وجعاك الليلة دي؟",
  "إيه اللي نفسك حد يسمعه منك؟",
  "مين أكتر حد وحشك؟",
  "هل بتتظاهر إنك كويس؟",
  "لو قدرت تقول جملة واحدة للناس دلوقتي، إيه هتقولها؟",
  "إيه اللي بتشيله لوحدك وماحدش عارف بيه؟",
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `من ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `من ${h} ساعة`;
  return `أمس`;
}

// ==================== CSS ====================
const css = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Amiri:ital@0;1&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#080810;--bg2:#0d0d1a;--surface:#111120;--surface2:#181830;
  --border:rgba(255,255,255,0.07);--text:#e8e8f4;--muted:#6a6a8a;
  --accent:#6060f8;--accent2:#9a9aff;--glow:rgba(96,96,248,0.18);
}
body{font-family:'Tajawal',sans-serif;background:var(--bg);color:var(--text);direction:rtl;min-height:100vh;overflow-x:hidden;}
body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;z-index:0;}
.orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;opacity:0.18;}
.orb1{width:600px;height:600px;background:radial-gradient(circle,#3030cc,transparent);top:-250px;right:-200px;animation:drift 25s ease-in-out infinite;}
.orb2{width:500px;height:500px;background:radial-gradient(circle,#6a1a6a,transparent);bottom:-200px;left:-150px;animation:drift 30s ease-in-out infinite reverse;}
@keyframes drift{0%,100%{transform:translate(0,0);}50%{transform:translate(40px,-30px);}}
nav{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:rgba(8,8,16,0.88);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);}
.logo{font-family:'Amiri',serif;font-size:1.5rem;color:var(--accent2);cursor:pointer;}
.nav-links{display:flex;gap:0.2rem;list-style:none;flex-wrap:wrap;}
.nav-btn{background:none;border:none;color:var(--muted);font-family:'Tajawal',sans-serif;font-size:0.88rem;padding:0.45rem 0.9rem;border-radius:8px;cursor:pointer;transition:all 0.2s;}
.nav-btn:hover{color:var(--text);background:var(--surface);}
.nav-btn.active{color:var(--accent2);background:rgba(96,96,248,0.12);}
.page{display:none;min-height:100vh;position:relative;z-index:1;padding-top:68px;}
.page.active{display:block;animation:pageIn 0.45s ease;}
@keyframes pageIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
.sec-header{text-align:center;padding:2.5rem 1.5rem 1.5rem;}
.sec-tag{display:inline-block;font-size:0.72rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent2);background:rgba(96,96,248,0.1);border:1px solid rgba(96,96,248,0.2);padding:0.28rem 0.9rem;border-radius:50px;margin-bottom:0.8rem;}
.sec-title{font-family:'Amiri',serif;font-size:clamp(1.8rem,4vw,2.6rem);color:var(--text);margin-bottom:0.4rem;}
.sec-desc{color:var(--muted);font-size:0.95rem;max-width:480px;margin:0 auto;line-height:1.7;}
/* LANDING */
.landing{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;}
.landing.active{display:flex;}
.eyebrow{font-size:0.75rem;letter-spacing:0.28em;color:var(--muted);text-transform:uppercase;margin-bottom:1.8rem;animation:fadeUp 0.7s ease 0.2s both;}
.hero-title{font-family:'Amiri',serif;font-size:clamp(2.8rem,8vw,5.2rem);line-height:1.22;margin-bottom:1.2rem;animation:fadeUp 0.7s ease 0.4s both;}
.hero-title span{color:var(--accent2);}
.hero-sub{font-size:1.05rem;color:var(--muted);max-width:440px;line-height:1.85;margin-bottom:2.8rem;animation:fadeUp 0.7s ease 0.6s both;}
.btn-primary{display:inline-flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,var(--accent),#9050e8);color:#fff;border:none;padding:1rem 2.4rem;border-radius:50px;font-family:'Tajawal',sans-serif;font-size:1.1rem;font-weight:600;cursor:pointer;transition:all 0.3s;box-shadow:0 0 40px rgba(96,96,248,0.3);animation:fadeUp 0.7s ease 0.8s both;}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 60px rgba(96,96,248,0.45);}
.landing-trust{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);font-size:0.8rem;color:var(--muted);white-space:nowrap;animation:fadeUp 0.7s ease 1s both;}
.tdots{display:inline-flex;gap:0.3rem;margin-right:0.4rem;vertical-align:middle;}
.tdot{width:4px;height:4px;border-radius:50%;background:var(--accent2);opacity:0.5;animation:dotPulse 2s ease-in-out infinite;}
.tdot:nth-child(2){animation-delay:0.3s;}.tdot:nth-child(3){animation-delay:0.6s;}
@keyframes dotPulse{0%,100%{opacity:0.2;transform:scale(1);}50%{opacity:0.9;transform:scale(1.3);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
/* CONFESSION */
.conf-wrap{max-width:680px;margin:0 auto;padding:0.5rem 1.5rem 3rem;}
.conf-prompt{text-align:center;font-family:'Amiri',serif;font-size:1.05rem;color:var(--muted);font-style:italic;margin-bottom:1.3rem;}
.conf-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;transition:border-color 0.3s,box-shadow 0.3s;position:relative;}
.conf-box:focus-within{border-color:rgba(96,96,248,0.4);box-shadow:0 0 40px rgba(96,96,248,0.08);}
.conf-ta{width:100%;background:transparent;border:none;outline:none;color:var(--text);font-family:'Tajawal',sans-serif;font-size:1.08rem;line-height:1.9;padding:1.6rem;min-height:240px;resize:none;direction:rtl;}
.conf-ta::placeholder{color:#2a2a4a;}
.char-c{position:absolute;bottom:0.8rem;left:1rem;font-size:0.7rem;color:var(--muted);opacity:0.4;}
.pain-label{font-size:0.9rem;color:var(--muted);text-align:center;margin:1.5rem 0 1rem;}
.pain-opts{display:flex;gap:0.7rem;flex-wrap:wrap;justify-content:center;}
.pain-opt{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0.8rem 1rem;cursor:pointer;transition:all 0.22s;text-align:center;flex:1;min-width:105px;max-width:150px;}
.pain-opt:hover{border-color:rgba(96,96,248,0.3);background:var(--surface2);}
.pain-opt.sel{border-color:var(--accent);background:rgba(96,96,248,0.1);}
.pain-opt[data-lv="4"].sel{border-color:#e0204a;background:rgba(220,32,74,0.08);}
.pain-emoji{font-size:1.5rem;display:block;margin-bottom:0.25rem;}
.pain-txt{font-size:0.78rem;color:var(--muted);}
.pub-btn{width:100%;background:linear-gradient(135deg,#12122a,#22123a);border:1px solid rgba(140,90,248,0.3);color:var(--accent2);padding:1rem;border-radius:14px;font-family:'Tajawal',sans-serif;font-size:1.05rem;font-weight:600;cursor:pointer;transition:all 0.3s;margin-top:1.2rem;}
.pub-btn:hover{border-color:rgba(140,90,248,0.6);box-shadow:0 0 30px rgba(96,96,248,0.15);transform:translateY(-1px);}
.pub-confirm{text-align:center;padding:2.5rem 1rem;animation:fadeUp 0.4s ease;}
.pub-confirm .ci{font-size:3rem;margin-bottom:1rem;}
.pub-confirm p{color:var(--muted);font-size:1rem;line-height:1.75;}
.pub-confirm strong{color:var(--accent2);}
/* WALL */
.wall-wrap{max-width:760px;margin:0 auto;padding:0.5rem 1.5rem 3rem;}
.wall-grid{display:flex;flex-direction:column;gap:1rem;}
.wcard{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.4rem;position:relative;transition:all 0.22s;animation:fadeUp 0.4s ease both;}
.wcard::before{content:'';position:absolute;top:0;right:0;width:3px;height:100%;border-radius:0 16px 16px 0;opacity:0.5;}
.wcard[data-lv="1"]::before{background:#6060f8;}
.wcard[data-lv="2"]::before{background:#a050b0;}
.wcard[data-lv="3"]::before{background:#c04040;}
.wcard[data-lv="4"]::before{background:#ff2050;}
.wcard:hover{border-color:rgba(255,255,255,0.1);transform:translateX(-2px);}
.card-badge{display:inline-flex;align-items:center;gap:0.35rem;font-size:0.72rem;color:var(--muted);background:var(--surface2);padding:0.22rem 0.65rem;border-radius:50px;margin-bottom:0.7rem;}
.card-text{font-family:'Amiri',serif;font-size:1.05rem;line-height:1.9;color:var(--text);margin-bottom:1rem;}
.card-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;}
.card-time{font-size:0.75rem;color:var(--muted);opacity:0.55;}
.card-reacts{display:flex;gap:0.4rem;}
.react-btn{background:var(--surface2);border:1px solid var(--border);color:var(--muted);padding:0.3rem 0.7rem;border-radius:50px;font-size:0.78rem;cursor:pointer;transition:all 0.2s;font-family:'Tajawal',sans-serif;display:flex;align-items:center;gap:0.25rem;}
.react-btn:hover{background:rgba(96,96,248,0.1);border-color:rgba(96,96,248,0.3);color:var(--text);}
.react-btn.done{background:rgba(96,96,248,0.14);border-color:rgba(96,96,248,0.4);color:var(--accent2);}
.loading-txt{text-align:center;color:var(--muted);padding:3rem;font-size:0.95rem;animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:0.4;}50%{opacity:1;}}
.empty-txt{text-align:center;color:var(--muted);padding:3rem;font-family:'Amiri',serif;font-size:1.1rem;}
/* LETTERS */
.let-wrap{max-width:660px;margin:0 auto;padding:0.5rem 1.5rem 3rem;}
.let-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.8rem;}
.let-to-row{display:flex;align-items:center;gap:0.8rem;margin-bottom:1rem;}
.let-to-lbl{font-size:0.88rem;color:var(--muted);white-space:nowrap;}
.let-to-in{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:0.55rem 0.9rem;color:var(--text);font-family:'Tajawal',sans-serif;font-size:0.95rem;outline:none;direction:rtl;transition:border-color 0.2s;}
.let-to-in:focus{border-color:rgba(96,96,248,0.35);}
.let-to-in::placeholder{color:var(--muted);opacity:0.45;}
.let-ta{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:1.1rem;color:var(--text);font-family:'Amiri',serif;font-size:1rem;line-height:1.9;resize:none;min-height:185px;outline:none;direction:rtl;transition:border-color 0.2s;margin-bottom:1rem;}
.let-ta:focus{border-color:rgba(96,96,248,0.3);}
.let-ta::placeholder{color:var(--muted);opacity:0.35;font-style:italic;}
.let-send{width:100%;background:transparent;border:1px solid rgba(140,90,248,0.3);color:var(--accent2);padding:0.85rem;border-radius:12px;font-family:'Tajawal',sans-serif;font-size:0.95rem;cursor:pointer;transition:all 0.3s;}
.let-send:hover{background:rgba(96,96,248,0.08);border-color:rgba(140,90,248,0.5);}
.let-confirm{text-align:center;padding:2.5rem 1rem;animation:fadeUp 0.4s ease;}
.let-confirm .lci{font-size:2.8rem;margin-bottom:1rem;}
.let-confirm p{color:var(--muted);font-family:'Amiri',serif;font-size:1.1rem;line-height:1.8;}
.buried-section{margin-top:2.5rem;}
.buried-title{font-family:'Amiri',serif;font-size:1.1rem;color:var(--muted);text-align:center;margin-bottom:1.2rem;display:flex;align-items:center;gap:0.8rem;justify-content:center;}
.buried-title::before,.buried-title::after{content:'';flex:1;height:1px;background:var(--border);}
.bcard{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.2rem;margin-bottom:0.9rem;position:relative;transition:all 0.2s;animation:fadeUp 0.4s ease both;}
.bcard:hover{border-color:rgba(255,255,255,0.09);}
.bcard-to{font-size:0.78rem;color:var(--accent2);margin-bottom:0.5rem;opacity:0.7;}
.bcard-text{font-family:'Amiri',serif;font-size:0.98rem;line-height:1.8;color:var(--muted);}
.bcard-stamp{position:absolute;top:0.9rem;left:0.9rem;font-size:1.4rem;opacity:0.2;transform:rotate(-15deg);}
/* NIGHT */
.night-wrap{max-width:640px;margin:0 auto;padding:0.5rem 1.5rem 3rem;text-align:center;}
.night-qcard{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2.2rem 1.8rem;margin-bottom:1.8rem;position:relative;overflow:hidden;}
.night-qcard::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center top,rgba(96,96,248,0.06),transparent);pointer-events:none;}
.night-qlbl{font-size:0.72rem;letter-spacing:0.2em;color:var(--accent2);text-transform:uppercase;margin-bottom:1rem;}
.night-q{font-family:'Amiri',serif;font-size:clamp(1.25rem,3vw,1.7rem);line-height:1.6;color:var(--text);}
.night-in{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.1rem;color:var(--text);font-family:'Tajawal',sans-serif;font-size:1rem;line-height:1.8;resize:none;min-height:110px;outline:none;direction:rtl;text-align:right;transition:border-color 0.2s;margin-bottom:1.2rem;}
.night-in:focus{border-color:rgba(96,96,248,0.35);}
.night-in::placeholder{color:var(--muted);opacity:0.4;}
.night-sub{background:linear-gradient(135deg,rgba(32,32,72,0.8),rgba(50,20,72,0.8));border:1px solid rgba(140,90,248,0.2);color:var(--accent2);padding:0.8rem 2rem;border-radius:50px;font-family:'Tajawal',sans-serif;font-size:0.95rem;cursor:pointer;transition:all 0.3s;margin-bottom:2rem;}
.night-sub:hover{border-color:rgba(140,90,248,0.5);box-shadow:0 0 20px rgba(96,96,248,0.15);}
.whispers-title{font-size:0.8rem;letter-spacing:0.15em;color:var(--muted);text-transform:uppercase;margin-bottom:1.2rem;}
.whisper{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0.9rem 1.1rem;font-family:'Amiri',serif;font-size:0.98rem;color:var(--muted);line-height:1.7;transition:all 0.2s;animation:fadeUp 0.4s ease both;text-align:right;margin-bottom:0.7rem;}
.whisper:hover{color:var(--text);border-color:rgba(255,255,255,0.08);}
/* METER */
.meter-wrap{max-width:700px;margin:0 auto;padding:0.5rem 1.5rem 3rem;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:2rem;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.4rem;text-align:center;position:relative;overflow:hidden;transition:all 0.25s;}
.stat-card::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center bottom,rgba(96,96,248,0.05),transparent);}
.stat-card:hover{border-color:rgba(255,255,255,0.1);transform:translateY(-2px);}
.stat-num{font-size:2.6rem;font-weight:700;color:var(--accent2);font-family:'Amiri',serif;display:block;margin-bottom:0.25rem;}
.stat-lbl{font-size:0.82rem;color:var(--muted);}
.dist-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.6rem;margin-bottom:1.2rem;}
.dist-ttl{font-size:0.88rem;color:var(--muted);text-align:center;margin-bottom:1.3rem;}
.dist-row{display:flex;align-items:center;gap:0.9rem;margin-bottom:0.8rem;}
.dist-em{font-size:1.25rem;width:1.7rem;text-align:center;}
.dist-bg{flex:1;height:7px;background:var(--surface2);border-radius:50px;overflow:hidden;}
.dist-bar{height:100%;border-radius:50px;transition:width 0.8s ease;}
.dist-pct{font-size:0.78rem;color:var(--muted);width:2.5rem;}
.hours-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.6rem;}
.hours-lbl{font-size:0.88rem;color:var(--muted);text-align:center;margin-bottom:1.2rem;}
.hours-bars{display:flex;gap:0.22rem;align-items:flex-end;height:70px;}
.hbar{flex:1;max-width:20px;background:var(--surface2);border-radius:3px 3px 0 0;transition:all 0.5s;}
.hbar.peak{background:linear-gradient(to top,rgba(200,20,70,0.65),rgba(150,20,100,0.3));}
.hbar:not(.peak){background:rgba(96,96,248,0.25);}
.hours-axis{display:flex;justify-content:space-between;margin-top:0.4rem;font-size:0.68rem;color:var(--muted);direction:ltr;}
/* FOOTER */
footer{text-align:center;padding:2rem 1.5rem;border-top:1px solid var(--border);position:relative;z-index:1;}
.foot-q{font-family:'Amiri',serif;font-size:1rem;color:var(--muted);font-style:italic;margin-bottom:0.5rem;}
.foot-s{font-size:0.75rem;color:#2a2a4a;}
/* SOUND */
.sound-btn{position:fixed;bottom:1.5rem;left:1.5rem;background:var(--surface);border:1px solid var(--border);color:var(--muted);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;z-index:999;transition:all 0.2s;}
.sound-btn:hover{border-color:rgba(96,96,248,0.4);color:var(--accent2);}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--surface2);border-radius:4px;}
/* VOICE PAIN */
.voice-wrap{max-width:720px;margin:0 auto;padding:0.5rem 1.5rem 3rem;}
.voice-hero{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:2.5rem 2rem;text-align:center;margin-bottom:2rem;position:relative;overflow:hidden;}
.voice-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(96,96,248,0.07),transparent);pointer-events:none;}
.voice-hero-icon{font-size:3.5rem;margin-bottom:1rem;display:block;}
.voice-hero h3{font-family:'Amiri',serif;font-size:1.6rem;color:var(--text);margin-bottom:0.5rem;}
.voice-hero p{color:var(--muted);font-size:0.95rem;line-height:1.7;max-width:400px;margin:0 auto 1.8rem;}
.rec-btn{display:inline-flex;align-items:center;gap:0.6rem;background:linear-gradient(135deg,#8b1a2a,#c02040);color:#fff;border:none;padding:1rem 2.2rem;border-radius:50px;font-family:'Tajawal',sans-serif;font-size:1.05rem;font-weight:600;cursor:pointer;transition:all 0.3s;box-shadow:0 0 30px rgba(180,20,50,0.35);}
.rec-btn:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(200,20,60,0.5);}
.rec-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
.rec-btn.recording{background:linear-gradient(135deg,#6b0a1a,#a01030);animation:recPulse 1.5s ease-in-out infinite;}
@keyframes recPulse{0%,100%{box-shadow:0 0 30px rgba(180,20,50,0.4);}50%{box-shadow:0 0 60px rgba(220,20,60,0.7);}}
.countdown-ring{position:relative;width:120px;height:120px;margin:1.5rem auto 1rem;}
.countdown-ring svg{transform:rotate(-90deg);}
.countdown-ring circle{fill:none;stroke-width:4;}
.cring-bg{stroke:var(--surface2);}
.cring-fg{stroke:#c02040;stroke-linecap:round;transition:stroke-dashoffset 1s linear;}
.countdown-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:700;color:#ff4060;font-family:'Amiri',serif;}
.rec-status{font-size:0.82rem;color:var(--muted);margin-bottom:1rem;letter-spacing:0.1em;}
.rec-status.active{color:#ff6080;animation:blink 1s step-end infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
.waveform{display:flex;align-items:center;justify-content:center;gap:3px;height:40px;margin:0.8rem 0;}
.wave-bar{width:3px;background:linear-gradient(to top,#c02040,#ff6080);border-radius:3px;animation:waveAnim 0.8s ease-in-out infinite;}
.wave-bar:nth-child(1){animation-delay:0s;}.wave-bar:nth-child(2){animation-delay:0.1s;}.wave-bar:nth-child(3){animation-delay:0.2s;}.wave-bar:nth-child(4){animation-delay:0.15s;}.wave-bar:nth-child(5){animation-delay:0.05s;}.wave-bar:nth-child(6){animation-delay:0.25s;}.wave-bar:nth-child(7){animation-delay:0.1s;}
@keyframes waveAnim{0%,100%{height:4px;opacity:0.3;}50%{height:32px;opacity:1;}}
.post-rec-actions{display:flex;flex-direction:column;gap:0.8rem;margin-top:1rem;}
.post-rec-preview{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:1rem 1.2rem;display:flex;align-items:center;gap:1rem;}
.mini-play{background:rgba(96,96,248,0.15);border:1px solid rgba(96,96,248,0.3);color:var(--accent2);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;transition:all 0.2s;flex-shrink:0;}
.mini-play:hover{background:rgba(96,96,248,0.25);}
.mini-play.playing{background:rgba(96,96,248,0.25);animation:recPulse 1s ease-in-out infinite;}
.preview-label{font-size:0.82rem;color:var(--muted);}
.post-rec-btns{display:flex;gap:0.7rem;}
.btn-delete{flex:1;background:transparent;border:1px solid rgba(255,255,255,0.1);color:var(--muted);padding:0.75rem;border-radius:12px;font-family:'Tajawal',sans-serif;font-size:0.9rem;cursor:pointer;transition:all 0.2s;}
.btn-delete:hover{border-color:rgba(200,50,50,0.4);color:#ff6060;}
.btn-publish-voice{flex:2;background:linear-gradient(135deg,#12122a,#22123a);border:1px solid rgba(140,90,248,0.3);color:var(--accent2);padding:0.75rem;border-radius:12px;font-family:'Tajawal',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.3s;}
.btn-publish-voice:hover{border-color:rgba(140,90,248,0.6);box-shadow:0 0 20px rgba(96,96,248,0.15);}
.voice-pain-sel{margin:1rem 0 0.5rem;}
.voice-pain-sel p{font-size:0.85rem;color:var(--muted);margin-bottom:0.7rem;}
.voice-pain-mini{display:flex;gap:0.5rem;justify-content:center;}
.vpm{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:0.5rem 0.9rem;cursor:pointer;font-size:0.82rem;transition:all 0.2s;color:var(--muted);}
.vpm:hover{border-color:rgba(96,96,248,0.3);}
.vpm.sel{border-color:var(--accent);background:rgba(96,96,248,0.1);color:var(--accent2);}
.voice-pub-confirm{text-align:center;padding:2rem 1rem;animation:fadeUp 0.4s ease;}
.voice-pub-confirm .vci{font-size:3rem;margin-bottom:0.8rem;}
.voice-pub-confirm p{color:var(--muted);font-size:0.95rem;line-height:1.7;}
.voice-pub-confirm strong{color:var(--accent2);}
/* Voice cards */
.voice-list{display:flex;flex-direction:column;gap:1rem;margin-top:2rem;}
.vcard{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.4rem;transition:all 0.22s;animation:fadeUp 0.4s ease both;position:relative;overflow:hidden;}
.vcard::before{content:'';position:absolute;top:0;right:0;width:3px;height:100%;border-radius:0 18px 18px 0;opacity:0.5;}
.vcard[data-lv="1"]::before{background:#6060f8;}.vcard[data-lv="2"]::before{background:#a050b0;}.vcard[data-lv="3"]::before{background:#c04040;}.vcard[data-lv="4"]::before{background:#ff2050;}
.vcard:hover{border-color:rgba(255,255,255,0.1);transform:translateX(-2px);}
.vcard-top{display:flex;align-items:center;gap:0.8rem;margin-bottom:1rem;}
.vcard-play{background:linear-gradient(135deg,rgba(96,96,248,0.15),rgba(140,90,248,0.1));border:1px solid rgba(96,96,248,0.3);color:var(--accent2);width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;transition:all 0.2s;flex-shrink:0;}
.vcard-play:hover{background:rgba(96,96,248,0.25);}
.vcard-play.playing{animation:recPulse 1s ease-in-out infinite;}
.vcard-info{flex:1;}
.vcard-name{font-size:0.85rem;color:var(--text);margin-bottom:0.2rem;font-weight:500;}
.vcard-meta{font-size:0.72rem;color:var(--muted);display:flex;gap:0.6rem;align-items:center;}
.vcard-waveform{display:flex;align-items:center;gap:2px;height:24px;margin-bottom:0.9rem;}
.vcard-wbar{border-radius:2px;background:linear-gradient(to top,rgba(96,96,248,0.4),rgba(140,90,248,0.6));}
.vcard-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;}
.vcard-badge{display:inline-flex;align-items:center;gap:0.3rem;font-size:0.72rem;color:var(--muted);background:var(--surface2);padding:0.2rem 0.6rem;border-radius:50px;}
.err-msg{background:rgba(180,30,30,0.12);border:1px solid rgba(220,50,50,0.2);border-radius:12px;padding:1rem 1.2rem;color:#ff8080;font-size:0.88rem;text-align:center;margin-bottom:1rem;}
@media(max-width:580px){
  nav{padding:0.8rem 1rem;}
  .nav-btn{font-size:0.78rem;padding:0.35rem 0.55rem;}
  .conf-wrap,.wall-wrap,.let-wrap,.night-wrap,.meter-wrap,.voice-wrap{padding:0.5rem 0.9rem 3rem;}
  .post-rec-btns{flex-direction:column;}
}
`;

// ==================== COMPONENTS ====================

function Nav({ page, setPage }) {
  const links = [
    { id: 'landing', label: 'الرئيسية' },
    { id: 'confession', label: 'فضفض' },
    { id: 'wall', label: 'حائط الألم' },
    { id: 'letters', label: 'رسائل' },
    { id: 'night', label: 'ليلة طويلة' },
    { id: 'voice', label: '🎧 صوت الألم' },
    { id: 'meter', label: 'مقياس' },
  ];
  return (
    <nav>
      <div className="logo" onClick={() => setPage('landing')}>فضفضة</div>
      <ul className="nav-links">
        {links.map(l => (
          <li key={l.id}>
            <button className={`nav-btn${page === l.id ? ' active' : ''}`} onClick={() => setPage(l.id)}>
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer({ quote = "فضفضتك مش ضعف… دي محاولة للبقاء.", sub }) {
  return (
    <footer>
      <p className="foot-q">"{quote}"</p>
      {sub && <p className="foot-s">{sub}</p>}
      <p className="foot-s" style={{ marginTop: '1.5rem', color: 'var(--muted)', opacity: 0.6 }}>made by Tony Nabil</p>
    </footer>
  );
}

// ==================== LANDING ====================
function Landing({ setPage }) {
  return (
    <div className="page landing active" id="landing">
      <p className="eyebrow">مكان آمن · بلا أسماء · بلا أحكام</p>
      <h1 className="hero-title">لو وصلت هنا…<br /><span>فأنت تعبت.</span></h1>
      <p className="hero-sub">ومش هنا عشان نصلحك. هنا عشان تتنفس. اكتب اللي جواك وخلّيه يطلع.</p>
      <button className="btn-primary" onClick={() => setPage('confession')}>ابدأ الفضفضة ←</button>
      <p className="landing-trust">
        كل شيء هنا مجهول
        <span className="tdots">
          <span className="tdot" /><span className="tdot" /><span className="tdot" />
        </span>
        لا أسماء، لا حسابات، لا أحكام
      </p>
      <Footer sub="لو أنت بتقرأ ده… فأنت لسه بتحاول." />
    </div>
  );
}

// ==================== CONFESSION ====================
function Confession({ onPost }) {
  const [text, setText] = useState('');
  const [pain, setPain] = useState(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim() || !pain) return;
    setSaving(true);
    const id = `post:${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const post = { id, text: text.trim(), pain, ts: Date.now(), reactions: { a: 0, b: 0, c: 0 } };
    await saveShared(id, post);
    setSaving(false);
    setDone(true);
    onPost && onPost(post);
  }

  function reset() { setText(''); setPain(null); setDone(false); }

  return (
    <div className="page active" id="confession">
      <div className="sec-header">
        <span className="sec-tag">غرفة الفضفضة</span>
        <h2 className="sec-title">قول اللي جواك</h2>
        <p className="sec-desc">اكتب كأنك بتتكلم لنفسك… محدش هيحاسبك.</p>
      </div>
      <div className="conf-wrap">
        {!done ? (
          <>
            <p className="conf-prompt">اكتب كلام طويل، جملة واحدة، شتيمة، بكاء… أي حاجة.</p>
            <div className="conf-box">
              <textarea
                className="conf-ta"
                placeholder="اكتب هنا…"
                maxLength={2000}
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <span className="char-c">{text.length} / 2000</span>
            </div>
            <p className="pain-label">إيه درجة الألم اللي حاسس بيها دلوقتي؟</p>
            <div className="pain-opts">
              {[1, 2, 3, 4].map(lv => (
                <div key={lv} className={`pain-opt${pain === lv ? ' sel' : ''}`} data-lv={lv} onClick={() => setPain(lv)}>
                  <span className="pain-emoji">{painEmojis[lv]}</span>
                  <span className="pain-txt">{painLabels[lv]}</span>
                </div>
              ))}
            </div>
            <button className="pub-btn" onClick={submit} disabled={saving}>
              {saving ? '…جاري الحفظ' : '🌑 اطلع اللي جواك'}
            </button>
          </>
        ) : (
          <div className="pub-confirm">
            <div className="ci">🤍</div>
            <p><strong>تم حفظ كلامك…</strong><br />أنت مش لوحدك.<br />في ناس تانية بتحمل نفس الثقل دلوقتي.</p>
            <br />
            <button className="pub-btn" onClick={reset} style={{ marginTop: '0.5rem' }}>فضفض تاني ↩</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// ==================== WALL ====================
function Wall() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reacted, setReacted] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const keys = await listShared('post:');
    const items = await Promise.all(keys.map(k => loadShared(k)));
    const valid = items.filter(Boolean).sort((a, b) => b.ts - a.ts);
    setPosts(valid);
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  async function react(post, type) {
    const key = `${post.id}-${type}`;
    if (reacted[key]) return;
    setReacted(r => ({ ...r, [key]: true }));
    const updated = { ...post, reactions: { ...post.reactions, [type]: (post.reactions[type] || 0) + 1 } };
    await saveShared(post.id, updated);
    setPosts(ps => ps.map(p => p.id === post.id ? updated : p));
  }

  const reactLabels = { a: ['🤍', 'أنا حاسس بيك'], b: ['🫂', 'مش لوحدك'], c: ['🥀', 'ادعيلي'] };

  return (
    <div className="page active" id="wall">
      <div className="sec-header">
        <span className="sec-tag">حائط الألم</span>
        <h2 className="sec-title">أصوات بتشبهك</h2>
        <p className="sec-desc">ناس حقيقية، ألم حقيقي، كلهم مرّوا من هنا.</p>
      </div>
      <div className="wall-wrap">
        {loading ? (
          <p className="loading-txt">…جاري تحميل الأصوات</p>
        ) : posts.length === 0 ? (
          <p className="empty-txt">لسه مفيش فضفضات… كن أول واحد.</p>
        ) : (
          <div className="wall-grid">
            {posts.map((p, i) => (
              <div key={p.id} className="wcard" data-lv={p.pain} style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="card-badge">{painEmojis[p.pain]} {painLabels[p.pain]}</span>
                <p className="card-text">{p.text}</p>
                <div className="card-foot">
                  <span className="card-time">{timeAgo(p.ts)}</span>
                  <div className="card-reacts">
                    {['a', 'b', 'c'].map(t => (
                      <button
                        key={t}
                        className={`react-btn${reacted[`${p.id}-${t}`] ? ' done' : ''}`}
                        onClick={() => react(p, t)}
                      >
                        {reactLabels[t][0]} <span>{p.reactions[t] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// ==================== LETTERS ====================
function Letters() {
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [buried, setBuried] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBuried = useCallback(async () => {
    setLoading(true);
    const keys = await listShared('letter:');
    const items = await Promise.all(keys.map(k => loadShared(k)));
    const valid = items.filter(Boolean).sort((a, b) => b.ts - a.ts);
    setBuried(valid);
    setLoading(false);
  }, []);

  useEffect(() => { loadBuried(); }, [loadBuried]);

  async function send() {
    if (!text.trim()) return;
    const id = `letter:${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const letter = { id, to: to.trim() || 'شخص', text: text.trim(), ts: Date.now() };
    await saveShared(id, letter);
    setBuried(b => [letter, ...b]);
    setDone(true);
  }

  function reset() { setTo(''); setText(''); setDone(false); }

  return (
    <div className="page active" id="letters">
      <div className="sec-header">
        <span className="sec-tag">رسائل مش هتتبعت</span>
        <h2 className="sec-title">قول اللي عمره ما اتقال</h2>
        <p className="sec-desc">اكتب لشخص في حياتك… أو لنفسك.</p>
      </div>
      <div className="let-wrap">
        {!done ? (
          <div className="let-box">
            <div className="let-to-row">
              <span className="let-to-lbl">إلى…</span>
              <input className="let-to-in" placeholder="شخص سابك، أذاك، مات، أو لنفسك…" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <textarea className="let-ta" placeholder="اكتب اللي عمرك ما قدرت تقوله…" value={text} onChange={e => setText(e.target.value)} />
            <button className="let-send" onClick={send}>إرسال الرسالة 🕊</button>
          </div>
        ) : (
          <div className="let-confirm">
            <div className="lci">✉️</div>
            <p>"الرسالة لن تصل…<br />لكنها خرجت من قلبك."</p>
            <br />
            <button className="let-send" onClick={reset} style={{ maxWidth: '280px', margin: '0 auto', display: 'block' }}>اكتب رسالة تانية</button>
          </div>
        )}

        <div className="buried-section">
          <div className="buried-title">الرسائل المدفونة</div>
          {loading ? (
            <p className="loading-txt">…جاري تحميل الرسائل</p>
          ) : buried.length === 0 ? (
            <p className="empty-txt" style={{ padding: '1.5rem' }}>لسه مفيش رسائل…</p>
          ) : (
            buried.map((l, i) => (
              <div key={l.id} className="bcard" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="bcard-stamp">✉</span>
                <div className="bcard-to">إلى {l.to}</div>
                <div className="bcard-text">{l.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ==================== NIGHT ====================
function Night() {
  const [answer, setAnswer] = useState('');
  const [whispers, setWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const question = nightQuestions[Math.floor(Date.now() / 86400000) % nightQuestions.length];

  const loadWhispers = useCallback(async () => {
    setLoading(true);
    const keys = await listShared('whisper:');
    const items = await Promise.all(keys.map(k => loadShared(k)));
    const valid = items.filter(Boolean).sort((a, b) => b.ts - a.ts).slice(0, 30);
    setWhispers(valid);
    setLoading(false);
  }, []);

  useEffect(() => { loadWhispers(); }, [loadWhispers]);

  async function submit() {
    if (!answer.trim()) return;
    const id = `whisper:${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const w = { id, text: answer.trim(), ts: Date.now() };
    await saveShared(id, w);
    setWhispers(ws => [w, ...ws]);
    setAnswer('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="page active" id="night">
      <div className="sec-header">
        <span className="sec-tag">ليلة طويلة</span>
        <h2 className="sec-title">سؤال الليلة دي</h2>
        <p className="sec-desc">للناس اللي الليل بيجيب معاه كل حاجة.</p>
      </div>
      <div className="night-wrap">
        <div className="night-qcard">
          <p className="night-qlbl">السؤال اليومي</p>
          <h3 className="night-q">{question}</h3>
        </div>
        <textarea
          className="night-in"
          placeholder="همسة قصيرة…"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
        <button className="night-sub" onClick={submit}>
          {sent ? '✓ اتحفظت' : 'اكتب في الظلام 🌙'}
        </button>
        <div className="whispers-title">همسات الليلة دي</div>
        {loading ? (
          <p className="loading-txt">…</p>
        ) : whispers.length === 0 ? (
          <p className="empty-txt" style={{ padding: '1.5rem' }}>لسه مفيش همسات… كن أول واحد.</p>
        ) : (
          whispers.map((w, i) => (
            <div key={w.id} className="whisper" style={{ animationDelay: `${i * 0.06}s` }}>{w.text}</div>
          ))
        )}
      </div>
      <Footer quote="لو أنت بتقرأ ده… فأنت لسه بتحاول." />
    </div>
  );
}

// ==================== METER ====================
function Meter() {
  const [counts, setCounts] = useState({ posts: 0, letters: 0, whispers: 0 });
  const [painDist, setPainDist] = useState([0, 0, 0, 0]);

  useEffect(() => {
    async function load() {
      const [pk, lk, wk] = await Promise.all([
        listShared('post:'), listShared('letter:'), listShared('whisper:')
      ]);
      setCounts({ posts: pk.length, letters: lk.length, whispers: wk.length });
      const posts = await Promise.all(pk.map(k => loadShared(k)));
      const dist = [0, 0, 0, 0];
      posts.filter(Boolean).forEach(p => { if (p.pain >= 1 && p.pain <= 4) dist[p.pain - 1]++; });
      setPainDist(dist);
    }
    load();
  }, []);

  const total = painDist.reduce((a, b) => a + b, 0) || 1;
  const hourData = [5, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 8, 9, 10, 12, 15, 18, 22, 20, 16];
  const maxH = Math.max(...hourData);

  const distColors = [
    'linear-gradient(90deg,#5050e8,#8080ff)',
    'linear-gradient(90deg,#8040a0,#c070d0)',
    'linear-gradient(90deg,#903030,#c05050)',
    'linear-gradient(90deg,#bb0035,#ff2055)',
  ];

  return (
    <div className="page active" id="meter">
      <div className="sec-header">
        <span className="sec-tag">مقياس المجتمع</span>
        <h2 className="sec-title">إحصائيات الحزن</h2>
        <p className="sec-desc">الألم منتشر… وأنت مش الوحيد.</p>
      </div>
      <div className="meter-wrap">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{counts.posts}</span>
            <span className="stat-lbl">فضفضة اتكتبت</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{counts.letters}</span>
            <span className="stat-lbl">رسالة مدفونة</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{counts.whispers}</span>
            <span className="stat-lbl">همسة في الظلام</span>
          </div>
        </div>

        <div className="dist-card">
          <p className="dist-ttl">توزيع درجات الألم</p>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="dist-row">
              <span className="dist-em">{painEmojis[i + 1]}</span>
              <div className="dist-bg">
                <div className="dist-bar" style={{
                  width: `${Math.round((painDist[i] / total) * 100)}%`,
                  background: distColors[i]
                }} />
              </div>
              <span className="dist-pct">{Math.round((painDist[i] / total) * 100)}%</span>
            </div>
          ))}
        </div>

        <div className="hours-card">
          <p className="hours-lbl">متى بتكتب الناس أكتر؟</p>
          <div className="hours-bars">
            {hourData.map((v, i) => (
              <div key={i} className={`hbar${(i >= 22 || i <= 3) ? ' peak' : ''}`}
                style={{ height: `${Math.round((v / maxH) * 70)}px` }} title={`${i}:00`} />
            ))}
          </div>
          <div className="hours-axis">
            <span>12ص</span><span>6ص</span><span>12ظ</span><span>6م</span><span>12ص</span>
          </div>
        </div>
      </div>
      <Footer quote="الحزن منتشر… وأنت مش الوحيد." sub="فضفضتك مش ضعف… دي محاولة للبقاء." />
    </div>
  );
}

// ==================== VOICE PAIN ====================
const PAIN_LABELS_SHORT = ['', 'تعب', 'حزن', 'اكتئاب', 'انهيار'];
const PAIN_COLORS = ['', '#6060f8', '#a050b0', '#c04040', '#ff2050'];

// Generate random waveform bars for display
function randomWave(n = 28) {
  const bars = [];
  for (let i = 0; i < n; i++) bars.push(Math.random() * 0.85 + 0.1);
  return bars;
}

function WaveformDisplay({ bars, playing, color = 'rgba(96,96,248,0.5)', heightPx = 24 }) {
  return (
    <div className="vcard-waveform">
      {bars.map((h, i) => (
        <div key={i} className="vcard-wbar" style={{
          width: '3px',
          height: `${Math.round(h * heightPx)}px`,
          background: playing
            ? `linear-gradient(to top,${color},${color.replace('0.5', '0.9')})`
            : 'rgba(255,255,255,0.1)',
          transition: 'background 0.3s'
        }} />
      ))}
    </div>
  );
}

function VoicePain() {
  const [phase, setPhase] = useState('idle'); // idle | recording | review | published
  const [countdown, setCountdown] = useState(10);
  const [selectedPain, setSelectedPain] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [playingId, setPlayingId] = useState(null);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const audioEls = useRef({});

  // Load voices on mount
  const loadVoices = useCallback(async () => {
    setLoadingVoices(true);
    const keys = await listShared('voice:');
    const items = await Promise.all(keys.map(k => loadShared(k)));
    const valid = items.filter(Boolean).sort((a, b) => b.ts - a.ts);
    setVoices(valid);
    setLoadingVoices(false);
  }, []);

  useEffect(() => { loadVoices(); const iv = setInterval(loadVoices, 20000); return () => clearInterval(iv); }, [loadVoices]);

  // ---- Recording ----
  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setPhase('review');
      };
      mr.start(100);
      setPhase('recording');
      setCountdown(10);
      let t = 10;
      timerRef.current = setInterval(() => {
        t--;
        setCountdown(t);
        if (t <= 0) { clearInterval(timerRef.current); mr.stop(); }
      }, 1000);
    } catch (e) {
      setError('مش قادر يوصل للميكروفون. تأكد إنك أديت الإذن للموقع.');
    }
  }

  function stopEarly() {
    clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
  }

  function deleteRecording() {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioBlob(null); setAudioURL(null);
    setSelectedPain(null); setPhase('idle');
    setIsPlaying(false);
  }

  function previewPlay() {
    if (!audioURL) return;
    if (!audioRef.current) audioRef.current = new Audio(audioURL);
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  async function publishVoice() {
    if (!audioBlob || !selectedPain) { setError('اختار درجة الألم الأول.'); return; }
    setPublishing(true);
    setError('');
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const b64 = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(audioBlob);
      });
      // Check size (~3.5MB limit for JSON overhead)
      if (b64.length > 3_500_000) { setError('حجم التسجيل كبير جداً. حاول تاني.'); setPublishing(false); return; }
      const id = `voice:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const num = Math.floor(Math.random() * 900) + 100;
      const voice = {
        id, ts: Date.now(), pain: selectedPain,
        name: `شخص موجوع #${num}`,
        audio: b64, waveform: randomWave(28),
        reactions: { a: 0, b: 0, c: 0 }
      };
      await saveShared(id, voice);
      setPhase('published');
      setVoices(vs => [voice, ...vs]);
    } catch (e) {
      setError('حصل خطأ في النشر. حاول مرة تانية.');
    }
    setPublishing(false);
  }

  function reset() {
    deleteRecording();
    setPhase('idle');
  }

  // ---- Playback for voice cards ----
  function playVoice(v) {
    // Stop currently playing
    if (playingId && audioEls.current[playingId]) {
      audioEls.current[playingId].pause();
      audioEls.current[playingId].currentTime = 0;
    }
    if (playingId === v.id) { setPlayingId(null); return; }
    if (!audioEls.current[v.id]) {
      const a = new Audio(`data:audio/webm;base64,${v.audio}`);
      a.onended = () => setPlayingId(null);
      audioEls.current[v.id] = a;
    }
    audioEls.current[v.id].play().catch(() => { });
    setPlayingId(v.id);
  }

  // Cleanup
  useEffect(() => () => {
    clearInterval(timerRef.current);
    Object.values(audioEls.current).forEach(a => { a.pause(); });
    if (audioURL) URL.revokeObjectURL(audioURL);
  }, []);

  // Reactions
  const [reacted, setReacted] = useState({});
  async function reactVoice(v, type) {
    const key = `${v.id}-${type}`;
    if (reacted[key]) return;
    setReacted(r => ({ ...r, [key]: true }));
    const updated = { ...v, reactions: { ...v.reactions, [type]: (v.reactions[type] || 0) + 1 } };
    await saveShared(v.id, updated);
    setVoices(vs => vs.map(x => x.id === v.id ? updated : x));
  }

  const reactLabels = { a: ['🤍', 'أنا حاسس بيك'], b: ['🫂', 'مش لوحدك'], c: ['🙏', 'ربنا يخفف عنك'] };
  const circumference = 2 * Math.PI * 50;
  const progress = ((10 - countdown) / 10) * circumference;

  return (
    <div className="page active" id="voice-page">
      <div className="sec-header">
        <span className="sec-tag">🎧 صوت الألم</span>
        <h2 className="sec-title">لو الكتابة مش كفاية…</h2>
        <p className="sec-desc">سجل صوتك. مش لازم تقول اسمك. مش لازم حتى تتكلم.</p>
      </div>

      <div className="voice-wrap">
        {/* Recording Section */}
        <div className="voice-hero">
          {phase === 'idle' && (
            <>
              <span className="voice-hero-icon">🎙️</span>
              <h3>سجل 10 ثواني</h3>
              <p>قول اللي جواك… أو ابكي… أو اتنهد بس.<br />ده هيتنشر بشكل مجهول تماماً.</p>
              {error && <div className="err-msg">{error}</div>}
              <button className="rec-btn" onClick={startRecording}>🎙️ ابدأ التسجيل</button>
            </>
          )}

          {phase === 'recording' && (
            <>
              <p className="rec-status active">● بيسجل دلوقتي</p>
              <div className="countdown-ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle className="cring-bg" cx="60" cy="60" r="50" strokeDasharray={circumference} />
                  <circle className="cring-fg" cx="60" cy="60" r="50"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress} />
                </svg>
                <div className="countdown-num">{countdown}</div>
              </div>
              <div className="waveform">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
              <button className="rec-btn" onClick={stopEarly} style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg,#444,#666)' }}>
                ⏹ وقّف التسجيل
              </button>
            </>
          )}

          {phase === 'review' && (
            <>
              <span className="voice-hero-icon" style={{ fontSize: '2.5rem' }}>✅</span>
              <h3 style={{ marginBottom: '1.2rem' }}>التسجيل جاهز</h3>

              <div className="post-rec-preview">
                <button className={`mini-play${isPlaying ? ' playing' : ''}`} onClick={previewPlay}>
                  {isPlaying ? '⏸' : '▶️'}
                </button>
                <span className="preview-label">{isPlaying ? 'بيشتغل…' : 'اسمع تسجيلك الأول'}</span>
              </div>

              <div className="voice-pain-sel">
                <p>إيه درجة الألم في صوتك؟</p>
                <div className="voice-pain-mini">
                  {[1, 2, 3, 4].map(lv => (
                    <button key={lv} className={`vpm${selectedPain === lv ? ' sel' : ''}`} onClick={() => setSelectedPain(lv)}>
                      {painEmojis[lv]} {PAIN_LABELS_SHORT[lv]}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="err-msg">{error}</div>}

              <div className="post-rec-btns">
                <button className="btn-delete" onClick={deleteRecording}>🗑️ احذف وسجل تاني</button>
                <button className="btn-publish-voice" onClick={publishVoice} disabled={publishing}>
                  {publishing ? '…جاري النشر' : '📤 انشر صوتي'}
                </button>
              </div>
            </>
          )}

          {phase === 'published' && (
            <div className="voice-pub-confirm">
              <div className="vci">🎧</div>
              <p><strong>صوتك اتنشر…</strong><br />حد هيسمعك دلوقتي.<br />أنت مش لوحدك.</p>
              <br />
              <button className="rec-btn" onClick={reset} style={{ marginTop: '0.5rem', fontSize: '0.9rem', padding: '0.8rem 1.8rem' }}>
                🎙️ سجل تاني
              </button>
            </div>
          )}
        </div>

        {/* Voice List */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.8rem' }}>
          <div className="buried-title" style={{ marginBottom: '1.5rem' }}>أصوات الناس</div>

          {loadingVoices ? (
            <p className="loading-txt">…جاري تحميل الأصوات</p>
          ) : voices.length === 0 ? (
            <p className="empty-txt">لسه مفيش أصوات… كن أول واحد يسجل.</p>
          ) : (
            <div className="voice-list">
              {voices.map((v, i) => (
                <div key={v.id} className="vcard" data-lv={v.pain} style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="vcard-top">
                    <button
                      className={`vcard-play${playingId === v.id ? ' playing' : ''}`}
                      onClick={() => playVoice(v)}
                    >
                      {playingId === v.id ? '⏸' : '▶️'}
                    </button>
                    <div className="vcard-info">
                      <div className="vcard-name">{v.name}</div>
                      <div className="vcard-meta">
                        <span>{painEmojis[v.pain]} {painLabels[v.pain]}</span>
                        <span>·</span>
                        <span>⏱ 0:10</span>
                        <span>·</span>
                        <span>{timeAgo(v.ts)}</span>
                      </div>
                    </div>
                  </div>

                  <WaveformDisplay
                    bars={v.waveform || randomWave(28)}
                    playing={playingId === v.id}
                    color={PAIN_COLORS[v.pain] || '#6060f8'}
                  />

                  <div className="vcard-foot">
                    <span className="vcard-badge">{painEmojis[v.pain]} {painLabels[v.pain]}</span>
                    <div className="card-reacts">
                      {['a', 'b', 'c'].map(t => (
                        <button key={t}
                          className={`react-btn${reacted[`${v.id}-${t}`] ? ' done' : ''}`}
                          onClick={() => reactVoice(v, t)}>
                          {reactLabels[t][0]} <span>{v.reactions[t] || 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer quote="فضفضتك مش ضعف… دي محاولة للبقاء." />
    </div>
  );
}

// ==================== APP ====================
export default function App() {
  const [page, setPage] = useState('landing');
  const [sound, setSound] = useState(false);

  function navigate(p) { setPage(p); window.scrollTo(0, 0); }

  return (
    <>
      <style>{css}</style>
      <div className="orb orb1" /><div className="orb orb2" />
      <Nav page={page} setPage={navigate} />

      {page === 'landing' && <Landing setPage={navigate} />}
      {page === 'confession' && <Confession onPost={() => { }} />}
      {page === 'wall' && <Wall />}
      {page === 'letters' && <Letters />}
      {page === 'night' && <Night />}
      {page === 'voice' && <VoicePain />}
      {page === 'meter' && <Meter />}

      <button className="sound-btn" onClick={() => setSound(s => !s)} title="صوت">
        {sound ? '🔊' : '🔇'}
      </button>
    </>
  );
}
