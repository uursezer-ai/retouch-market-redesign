/*! RMGallery 1.0 — foto / before-after / YouTube / Instagram icin tek lightbox.
 *  Bagimliliksiz, tek dosya. CSS'ini kendi enjekte eder, DOM'unu kendi kurar.
 *  Tum sinif ve id'ler "rmg" ad alaninda: mevcut site stilleriyle carpismaz.
 *
 *  KULLANIM
 *    RMGallery.open(items, { title, startIndex, trigger })
 *    RMGallery.attach('.js-galeri', el => ({ title, items }))
 *    RMGallery.close()   RMGallery.isOpen()
 *
 *  ITEM SOZLESMESI
 *    { type:'photo',     src, srcset?, sizes?, alt?, thumb? }
 *    { type:'ba',        before, after, alt?, thumb? }
 *    { type:'youtube',   id, poster, alt?, thumb? }
 *    { type:'instagram', url, poster, alt?, thumb? }
 */
(function(global){
'use strict';

var CSS = `:root{
  --ink:#101B3D; --ink-2:#3F4666; --ink-3:#767D9C;
  --line:#E4E6F0; --line-2:#D3D7E6;
  --brand:#6C4FE0; --brand-deep:#5B3FD9; --brand-tint:#F1EDFD;
  /* lightbox tokenleri — nötrler mora doğru hafif kaydırıldı */
  --lb-bg:rgba(9,10,22,.94);
  --lb-fg:#FFFFFF;
  --lb-fg-2:#B6BDDC;
  --lb-chip:rgba(255,255,255,.11);
  --lb-chip-hi:rgba(255,255,255,.22);
  --sans:"Poppins","Gilroy",-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif;
}
/* ════════ LIGHTBOX ════════ */
.rmg{
  position:fixed;inset:0;z-index:100;display:none;flex-direction:column;
  /* dvh: mobil tarayıcı çubuğu açılıp kapandığında yükseklik bozulmaz */
  height:100dvh;
  color:var(--lb-fg);
  opacity:0;transition:opacity .22s ease;
}
.rmg.is-open{display:flex}
.rmg.is-visible{opacity:1}
.rmg__backdrop{
  position:absolute;inset:0;background:var(--lb-bg);
  backdrop-filter:blur(22px) saturate(120%);
  -webkit-backdrop-filter:blur(22px) saturate(120%);
}
body.rmg-locked{overflow:hidden}
/* — üst çubuk — */
.rmg__top{
  position:relative;z-index:3;flex:0 0 auto;
  display:flex;align-items:center;gap:12px;
  padding:calc(12px + env(safe-area-inset-top)) calc(14px + env(safe-area-inset-right)) 12px calc(16px + env(safe-area-inset-left));
}
.rmg__title{font-size:15px;font-weight:600;letter-spacing:-.015em;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rmg__title span{color:var(--lb-fg-2);font-weight:400}
.rmg__tools{margin-left:auto;display:flex;align-items:center;gap:8px;flex:0 0 auto}
.rmg-chip{
  font-size:12.5px;font-weight:600;color:var(--lb-fg-2);background:var(--lb-chip);
  padding:7px 12px;border-radius:999px;font-variant-numeric:tabular-nums;
}
.rmg-ib{
  width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;flex:0 0 auto;
  background:var(--lb-chip);color:var(--lb-fg);display:grid;place-items:center;
  transition:background .15s, transform .15s;
}
.rmg-ib:hover{background:var(--lb-chip-hi)}
.rmg-ib:active{transform:scale(.94)}
.rmg-ib:focus-visible{outline:2px solid #fff;outline-offset:2px}
.rmg-ib[disabled]{opacity:.32;cursor:default}
.rmg-ib[disabled]:hover{background:var(--lb-chip)}
.rmg-ic-x{position:relative;width:15px;height:15px}
.rmg-ic-x::before,.rmg-ic-x::after{content:"";position:absolute;top:6.5px;left:0;right:0;height:2px;background:currentColor;border-radius:1px}
.rmg-ic-x::before{transform:rotate(45deg)} .rmg-ic-x::after{transform:rotate(-45deg)}
.rmg-ic-zi,.rmg-ic-zo{position:relative;width:16px;height:16px;border:2px solid currentColor;border-radius:50%}
.rmg-ic-zi::before,.rmg-ic-zi::after,.rmg-ic-zo::before{content:"";position:absolute;background:currentColor;border-radius:1px}
.rmg-ic-zi::before,.rmg-ic-zo::before{left:3px;right:3px;top:5px;height:2px}
.rmg-ic-zi::after{top:3px;bottom:3px;left:5px;width:2px}
/* — viewport + track — */
.rmg__viewport{
  position:relative;z-index:2;flex:1 1 auto;min-height:0;overflow:hidden;
  touch-action:none;
}
.rmg__track{display:flex;height:100%;will-change:transform}
.rmg__track.is-animating{transition:transform .32s cubic-bezier(.22,.61,.36,1)}
.rmg-slide{
  flex:0 0 100%;height:100%;position:relative;
  display:flex;align-items:center;justify-content:center;
  padding:0 clamp(12px,4vw,64px);
}
.rmg-frame{
  position:relative;max-width:100%;border-radius:12px;overflow:hidden;
  background:#0E1020;
  /* nötr siyah değil, zemine göre morumsu yumuşak gölge */
  box-shadow:0 24px 70px -24px rgba(24,16,60,.85);
  will-change:transform;
}
.rmg-frame.is-zoomed{cursor:grab}
.rmg-frame.is-zoomed.is-panning{cursor:grabbing}
.rmg-frame.can-zoom{cursor:zoom-in}
/* BA'da gezdirme karsilastirir; imlec bunu bildirmeli */
.rmg-frame.ba:not(.is-zoomed){cursor:ew-resize}
/* Çerçevedeki HER görsel sürüklenemez olmalı. Aksi halde tarayıcı
   yerel görsel sürüklemesi başlatır ve jestin ortasında
   pointercancel atarak kaydırmayı/kapatmayı iptal eder. */
.rmg-frame img{user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none}
.rmg-frame img.base{
  display:block;width:auto;height:auto;
  max-width:100%;max-height:var(--stageH,70vh);
}
/* video da fotoğrafla aynı kuralı kullanır: yükseklik sınırı
   belirleyicidir, böylece her oran dikeyde tam oturur */
.rmg-frame.vid{max-width:100%}
/* blur-up yükleme */
.rmg-frame img.base{filter:blur(0);transition:filter .4s ease}
.rmg-frame.is-loading img.base{filter:blur(14px);transform:scale(1.02)}
.rmg-errbox{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  font-size:13px;color:var(--lb-fg-2);background:rgba(255,255,255,.08);
  padding:10px 16px;border-radius:10px;white-space:nowrap;
}
.rmg-frame.is-error{min-width:220px;min-height:160px}
.rmg-spin{
  position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;
  border:2.5px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;
  animation:rmgSpin .7s linear infinite;opacity:0;transition:opacity .2s;pointer-events:none;
}
.rmg-frame.is-loading .rmg-spin{opacity:1}
@keyframes rmgSpin{to{transform:rotate(360deg)}}
/* LQIP: karttaki (zaten yüklü) küçük görsel, tam çözünürlük
   gelene kadar çerçevenin arka planı olarak durur — açılışta
   boş/karartılmış kare görünmez. */
.rmg-frame.has-lqip{background-size:cover;background-position:center}
.rmg-frame.has-lqip img.base{opacity:0;transition:opacity .28s ease}
.rmg-frame.has-lqip:not(.is-loading) img.base{opacity:1}
/* — before/after — */
.rmg-ba__after{position:absolute;inset:0;clip-path:inset(0 0 0 var(--pos,50%));}
.rmg-ba__after img{display:block;width:100%;height:100%;object-fit:cover}
.rmg-ba__div{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;
  background:#fff;transform:translateX(-1px);pointer-events:none;
  box-shadow:0 0 12px rgba(0,0,0,.5)}
.rmg-ba__knob{
  position:absolute;top:50%;left:var(--pos,50%);transform:translate(-50%,-50%);
  width:44px;height:44px;border-radius:50%;background:#fff;border:0;padding:0;
  display:flex;align-items:center;justify-content:center;gap:5px;cursor:ew-resize;
  box-shadow:0 4px 18px rgba(0,0,0,.45);
}
.rmg-ba__knob:focus-visible{outline:3px solid var(--brand);outline-offset:3px}
.rmg-ba__knob::before,.rmg-ba__knob::after{content:"";width:0;height:0;
  border-top:5px solid transparent;border-bottom:5px solid transparent}
.rmg-ba__knob::before{border-right:6px solid var(--ink-2)}
.rmg-ba__knob::after{border-left:6px solid var(--ink-2)}
/* Yakınlaştırılmışken de karşılaştırma sürüyor. Çizgi ve tutamaç
   çerçeveyle birlikte büyümesin diye ters ölçekleniyor (--iz = 1/zoom). */
.rmg-ba__div{transform:translateX(-1px) scaleX(var(--iz,1))}
.rmg-ba__knob{transform:translate(-50%,-50%) scale(var(--iz,1))}
.rmg-ba__tag{
  position:absolute;top:12px;font-size:10.5px;font-weight:700;letter-spacing:.09em;
  padding:6px 10px;border-radius:6px;background:rgba(10,12,26,.82);color:#fff;
  backdrop-filter:blur(8px);pointer-events:none;transition:opacity .2s;
}
.rmg-ba__tag.b{left:12px} .rmg-ba__tag.a{right:12px}
.rmg-frame.is-zoomed .rmg-ba__tag{opacity:0}   /* yakınken etiketler kadraj dışına taşar */
.ba.smooth .rmg-ba__after,.ba.smooth .rmg-ba__div,.ba.smooth .rmg-ba__knob{transition:clip-path .3s ease,left .3s ease}
/* — video facade — */
.rmg-vid__poster{position:absolute;inset:0;display:grid;place-items:center;border:0;background:transparent;cursor:pointer;width:100%}
.rmg-vid__play{
  width:76px;height:76px;border-radius:50%;background:rgba(255,255,255,.97);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 10px 34px rgba(0,0,0,.5);transition:transform .16s;
}
.rmg-vid__poster:hover .rmg-vid__play{transform:scale(1.07)}
.rmg-vid__poster:focus-visible{outline:3px solid #fff;outline-offset:-4px;border-radius:12px}
.rmg-vid__play::after{content:"";border-left:21px solid var(--ink);
  border-top:13px solid transparent;border-bottom:13px solid transparent;margin-left:5px}
.rmg-vid__src{
  position:absolute;left:12px;top:12px;background:rgba(10,12,26,.82);color:#fff;
  font-size:10.5px;font-weight:700;letter-spacing:.07em;padding:6px 10px;border-radius:6px;
  backdrop-filter:blur(8px);display:inline-flex;align-items:center;gap:6px;
}
.rmg-frame.vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.rmg-ig__out{
  position:absolute;left:0;right:0;bottom:0;padding:16px;
  background:linear-gradient(to top,rgba(8,10,22,.94),transparent);
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
}
.rmg-ig__cta{font-size:13.5px;font-weight:600;color:#fff;background:var(--brand);
  padding:10px 16px;border-radius:9px;white-space:nowrap;flex:0 0 auto}
.rmg-ig__link{text-decoration:none}
.rmg-ig__link:focus-visible{outline:3px solid #fff;outline-offset:-4px;border-radius:12px}
.rmg-ig__out{pointer-events:none}
.rmg-ig__out p{margin:0;font-size:12px;color:var(--lb-fg-2);line-height:1.45}
/* — yan oklar (masaüstü) — */
.rmg-nav{
  position:absolute;top:50%;transform:translateY(-50%);z-index:4;
  width:48px;height:48px;border-radius:50%;border:0;cursor:pointer;
  background:var(--lb-chip);color:#fff;display:grid;place-items:center;
  backdrop-filter:blur(10px);transition:background .15s;
}
.rmg-nav:hover{background:var(--lb-chip-hi)}
.rmg-nav:focus-visible{outline:2px solid #fff;outline-offset:2px}
.rmg-nav[disabled]{opacity:.25;cursor:default}
.rmg-nav.prev{left:14px} .rmg-nav.next{right:14px}
.rmg-nav i{width:10px;height:10px;border-right:2.4px solid currentColor;border-bottom:2.4px solid currentColor;display:block}
.rmg-nav.prev i{transform:rotate(135deg) translate(-2px,-2px)}
.rmg-nav.next i{transform:rotate(-45deg) translate(-2px,-2px)}
/* — alt bölge: ipucu + şerit (thumb zone) — */
.rmg__bottom{
  position:relative;z-index:3;flex:0 0 auto;
  padding:0 0 calc(12px + env(safe-area-inset-bottom));
}
/* align-items varsayilani stretch: kabarcik kap yuksekligine
   gerilip metni ortalamiyordu. center + inline-flex ile duzeltildi. */
.rmg__hint{
  display:flex;align-items:center;justify-content:center;
  padding:10px 16px 8px;pointer-events:none;min-height:34px;
}
/* inline-flex KULLANMA: flex kabında etiketler arasındaki boşluk
   düğümleri yutulur ve kelimeler birbirine yapışır. Kap zaten
   align-items:center olduğu için gerilme sorunu yok. */
.rmg__hint>span{
  display:inline-block;
  font-size:12px;color:var(--lb-fg-2);background:var(--lb-chip);
  padding:7px 14px;border-radius:999px;text-align:center;line-height:1.35;
}
.rmg__hint b{color:#fff;font-weight:600}
.rmg__strip{
  display:flex;gap:9px;overflow-x:auto;scrollbar-width:none;overscroll-behavior-x:contain;
  padding:6px calc(16px + env(safe-area-inset-left)) 8px calc(16px + env(safe-area-inset-right));
  scroll-snap-type:x proximity;
}
.rmg__strip::-webkit-scrollbar{display:none}
.rmg-th{
  position:relative;flex:0 0 auto;width:62px;height:62px;border:0;padding:0;cursor:pointer;
  border-radius:10px;overflow:hidden;background:#1A1C2E;scroll-snap-align:center;
  opacity:.55;transform:scale(.92);
  transition:opacity .18s, transform .18s, box-shadow .18s;
}
.rmg-th img{width:100%;height:100%;object-fit:cover;display:block}
.rmg-th:hover{opacity:.85}
.rmg-th:focus-visible{outline:2px solid #fff;outline-offset:2px}
/* aktif durum: ÜÇ değişim — opaklık + ölçek + beyaz çerçeve (renk tek başına değil) */
.rmg-th[aria-current="true"]{opacity:1;transform:scale(1);box-shadow:0 0 0 2.5px #fff}
.th__badge{
  position:absolute;right:4px;bottom:4px;width:18px;height:18px;border-radius:5px;
  background:rgba(10,12,26,.85);color:#fff;display:grid;place-items:center;
}
.th__badge.play::after{content:"";border-left:6px solid #fff;border-top:4px solid transparent;
  border-bottom:4px solid transparent;margin-left:2px}
.th__badge.cmp::after{content:"⇄";font-size:10px;line-height:1}
.rmg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){
  *{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
@media (max-width:760px){
.rmg-nav{display:none}                    /* mobilde swipe var */
  .rmg__title{font-size:13.5px}
.rmg-th{width:50px;height:50px}
.rmg-slide{padding:0 10px}
}`;

function injectOnce(){
  if(document.getElementById('rmg-style')) return;
  var st=document.createElement('style');
  st.id='rmg-style'; st.textContent=CSS;
  document.head.appendChild(st);
}
function buildShell(){
  var ex=document.getElementById('rmg-root'); if(ex) return ex;
  var el=document.createElement('div');
  el.className='rmg'; el.id='rmg-root';
  el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true');
  el.setAttribute('aria-label','Görsel galerisi');
  el.innerHTML=`<div class="rmg__backdrop" data-close></div>
  <header class="rmg__top">
    <span class="rmg__title" id="rmg-title"></span>
    <span class="rmg__tools">
      <span class="rmg-chip" id="rmg-count" aria-hidden="true"></span>
      <button class="rmg-ib" id="rmg-zout" aria-label="Uzaklaş"><span class="rmg-ic-zo"></span></button>
      <button class="rmg-ib" id="rmg-zin" aria-label="Yakınlaş"><span class="rmg-ic-zi"></span></button>
      <button class="rmg-ib" id="rmg-close" aria-label="Galeriyi kapat"><span class="rmg-ic-x"></span></button>
    </span>
  </header>
  <div class="rmg__viewport" id="rmg-viewport" data-close>
    <div class="rmg__track" id="rmg-track"></div>
    <button class="rmg-nav prev" id="rmg-prev" aria-label="Önceki görsel"><i></i></button>
    <button class="rmg-nav next" id="rmg-next" aria-label="Sonraki görsel"><i></i></button>
  </div>
  <div class="rmg__bottom">
    <div class="rmg__hint" id="rmg-hint"></div>
    <div class="rmg__strip" id="rmg-strip" role="group" aria-label="Galeri öğeleri"></div>
  </div>
  <p class="rmg-sr" id="rmg-live" aria-live="polite"></p>`;
  document.body.appendChild(el);
  return el;
}

/* API senkron tanimlanir: ev sahibi sayfanin betigi bu dosyadan hemen
   sonra calisabilir. DOM hazir olana kadar cagrilar kuyrukta bekler. */
global.RMGallery = {
  _q: [],
  open:   function(a,b){ this._q && this._q.push(['open',a,b]); },
  close:  function(){    this._q && this._q.push(['close']); },
  attach: function(a,b){ this._q && this._q.push(['attach',a,b]); },
  isOpen: function(){ return false; }
};

var booted=false;
function boot(){ if(booted) return; booted=true; injectOnce(); buildShell(); start(); }

function start(){
const TYPE_LABEL={photo:'Fotoğraf', ba:'Karşılaştırma', youtube:'YouTube', instagram:'Instagram'};

const lb=document.getElementById('rmg-root'), track=document.getElementById('rmg-track'),
      viewport=document.getElementById('rmg-viewport'), strip=document.getElementById('rmg-strip'),
      hintEl=document.getElementById('rmg-hint'), titleEl=document.getElementById('rmg-title'),
      countEl=document.getElementById('rmg-count'), liveEl=document.getElementById('rmg-live'),
      prevBtn=document.getElementById('rmg-prev'), nextBtn=document.getElementById('rmg-next'),
      zInBtn=document.getElementById('rmg-zin'), zOutBtn=document.getElementById('rmg-zout'),
      closeBtn=document.getElementById('rmg-close');

const MAX_ZOOM=5.3, MIN_ZOOM=1, CLICK_ZOOM=3.45;  // 2.6 -> 3.45 ve 4 -> 5.3 (%33 artis)
const WHEEL_STEP=30, WHEEL_LOCK=120;           // esik ve kilit dusuruldu
let items=[], idx=0, galleryTitle='', isOpen=false, trigger=null;
let zoom=1, panX=0, panY=0, lqip=null;                 // aktif slaytın zoom durumu
let dragMode=null;                           // 'track' | 'pan' | 'compare' | 'dismiss' | null
let start=null, trackDX=0, dismissDY=0;
let holdTimer=null, pointers=new Map(), pinchStart=null;
let pushedState=false;
const coarse=matchMedia('(pointer:coarse)').matches;

/* ── açılış / kapanış ── */
function openLB(list, opts){
  opts=opts||{};
  items=Array.isArray(list)?list:[];
  if(!items.length) return;
  idx=Math.max(0,Math.min(items.length-1, opts.startIndex||0));
  galleryTitle=opts.title||'';
  trigger=opts.trigger||null;
  // Karttaki gorsel zaten yuklu: ilk kareye anlik yer tutucu olarak
  // konur, tam cozunurluk gelene kadar bos/karartilmis ekran olmaz.
  lqip = opts.lqip || (trigger && trigger.querySelector && trigger.querySelector('img') && trigger.querySelector('img').currentSrc) || null;
  buildTrack(); buildStrip();
  lb.classList.add('is-open');
  lockScroll(true);
  requestAnimationFrame(()=>lb.classList.add('is-visible'));
  isOpen=true;
  measureStage();
  goTo(idx,false);
  closeBtn.focus();
  // geri tuşu galeriyi kapatsın (mobilde beklenen davranış)
  try{ history.pushState({lb:1},''); pushedState=true; }catch(e){}
}
function closeLB(fromPop){
  if(!isOpen) return;
  isOpen=false;
  lb.classList.remove('is-visible');
  const done=()=>{
    lb.classList.remove('is-open');
    track.innerHTML=''; strip.innerHTML=''; hintEl.innerHTML='';
    lockScroll(false);
    if(trigger) trigger.focus();
  };
  setTimeout(done,180);
  if(pushedState && !fromPop){ pushedState=false; try{history.back();}catch(e){} }
  else pushedState=false;
}
addEventListener('popstate',()=>{ if(isOpen) closeLB(true); });

let scrollY=0;
/* iOS Safari'de overflow:hidden gövde kaydırmasını durdurmaz.
   Küresel standart çözüm: gövdeyi position:fixed yapıp mevcut
   kaydırma konumunu negatif top ile korumak, kapanınca geri almak. */
function bgNodes(){
  return Array.from(document.body.children).filter(n=>n!==lb&&n.tagName!=='SCRIPT'&&n.tagName!=='STYLE');
}
function lockScroll(on){
  if(on){
    scrollY=window.scrollY;
    const sw=window.innerWidth-document.documentElement.clientWidth;
    document.body.style.position='fixed';
    document.body.style.top=(-scrollY)+'px';
    document.body.style.left='0';
    document.body.style.right='0';
    if(sw) document.body.style.paddingRight=sw+'px';
    document.body.classList.add('rmg-locked');
    // Arka plan ekran okuyucudan ve Tab sırasından çıkarılır
    bgNodes().forEach(n=>{ n.setAttribute('aria-hidden','true'); n.inert=true; });
  }else{
    document.body.classList.remove('rmg-locked');
    ['position','top','left','right','paddingRight']
      .forEach(k=>document.body.style[k]='');
    window.scrollTo(0,scrollY);
    bgNodes().forEach(n=>{ n.removeAttribute('aria-hidden'); n.inert=false; });
  }
}

/* ── sahne yüksekliği: içerik dikeyde tam otursun ── */
function measureStage(){
  lb.style.setProperty('--stageH', Math.round(viewport.clientHeight)+'px');
  // Pencere/klavye/yon degisince yakinlastirilmis gorsel bosluga
  // kaymasin diye pan sinirlari yeniden hesaplanir.
  if(isOpen&&zoom>1){ clampPan(); applyZoom(); }
  if(isOpen){ track.classList.remove('is-animating'); setTrack(0); }
}
new ResizeObserver(measureStage).observe(viewport);
addEventListener('orientationchange',()=>setTimeout(measureStage,250));

/* ── slaytları kur ── */
function buildTrack(){
  track.innerHTML='';
  items.forEach((it,i)=>{
    const s=document.createElement('div'); s.className='rmg-slide'; s.dataset.i=i; s.dataset.type=it.type;
    s.appendChild(buildFrame(it,i));
    track.appendChild(s);
  });
}
function buildFrame(it,i){
  const f=document.createElement('div');
  f.className='rmg-frame is-loading'+(it.type==='ba'?' ba':'')+
              ((it.type==='youtube'||it.type==='instagram')?' vid':'');
  if(it.type==='photo'||it.type==='ba') f.classList.add('can-zoom');
  f.dataset.i=i;

  const baseSrc = it.type==='photo'?it.src : it.type==='ba'?it.before : it.poster;
  const base=new Image();
  // Yer tutucu src ile YAPILMAZ: ikinci src ataması ilkini iptal eder.
  // Çerçevenin arka planı olarak konur, gerçek görsel üstünde açılır.
  if(i===idx&&lqip){ f.classList.add('has-lqip'); f.style.backgroundImage='url("'+lqip+'")'; }
  base.className='base'; base.alt=it.alt||''; base.decoding='async'; base.draggable=false;
  if(it.srcset) base.srcset=it.srcset;
  if(it.sizes)  base.sizes=it.sizes;
  base.addEventListener('load',()=>f.classList.remove('is-loading'),{once:true});
  base.addEventListener('error',()=>{           // 404/ag hatasi -> sonsuz spinner olmasin
    f.classList.remove('is-loading'); f.classList.add('is-error');
    f.insertAdjacentHTML('beforeend','<span class="rmg-errbox">Görsel yüklenemedi</span>');
  },{once:true});
  base.src=baseSrc;
  f.appendChild(base);
  f.insertAdjacentHTML('beforeend','<span class="rmg-spin"></span>');

  if(it.type==='ba'){
    f.style.setProperty('--pos','50%');
    const after=document.createElement('span'); after.className='rmg-ba__after';
    const ai=new Image(); ai.alt=''; ai.decoding='async'; ai.draggable=false; ai.src=it.after; after.appendChild(ai);
    f.appendChild(after);
    f.insertAdjacentHTML('beforeend',
      '<span class="rmg-ba__div"></span>'+
      '<button class="rmg-ba__knob" aria-label="Karşılaştırma çizgisi. Sol ve sağ ok tuşlarıyla kaydırın."></button>'+
      '<span class="rmg-ba__tag b">ÖNCE</span><span class="rmg-ba__tag a">SONRA</span>');
  }
  if(it.type==='youtube'){
    f.insertAdjacentHTML('beforeend',
      '<span class="rmg-vid__src">▶ YOUTUBE</span>'+
      '<button class="rmg-vid__poster" aria-label="Videoyu oynat"><span class="rmg-vid__play"></span></button>');
    f.querySelector('.rmg-vid__poster').addEventListener('click',()=>mountYT(f,it.id));
  }
  if(it.type==='instagram'){
    // Sahte play butonu yok: gorunen her sey tiklanabilir ve
    // dogrudan Instagram'a goturur.
    f.insertAdjacentHTML('beforeend',
      '<span class="rmg-vid__src">◎ INSTAGRAM</span>'+
      '<a class="rmg-vid__poster rmg-ig__link" href="'+it.url+'" target="_blank" rel="noopener" '+
        'aria-label="Bu icerigi Instagram\'da ac (yeni sekme)"><span class="rmg-vid__play"></span></a>'+
      '<span class="rmg-ig__out"><span class="rmg-ig__cta">Instagram\'da aç ↗</span>'+
      '<p>Gömülü oynatıcı oturum duvarına takılabildiği için kapak + dış bağlantı daha güvenilir.</p></span>');
  }
  return f;
}
function mountYT(f,id){
  f.querySelector('.rmg-vid__poster')?.remove();
  f.querySelector('.rmg-vid__src')?.remove();
  const ifr=document.createElement('iframe');
  ifr.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';
  ifr.title='YouTube video'; ifr.allow='accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture';
  ifr.allowFullscreen=true;
  f.appendChild(ifr); f.dataset.playing='1';
  setHint();
}
function unmountVideos(exceptIdx){
  track.querySelectorAll('.rmg-frame.vid[data-playing]').forEach(f=>{
    if(+f.dataset.i===exceptIdx) return;
    const it=items[+f.dataset.i];
    f.querySelector('iframe')?.remove(); delete f.dataset.playing;
    f.insertAdjacentHTML('beforeend',
      '<span class="rmg-vid__src">▶ YOUTUBE</span>'+
      '<button class="rmg-vid__poster" aria-label="Videoyu oynat"><span class="rmg-vid__play"></span></button>');
    f.querySelector('.rmg-vid__poster').addEventListener('click',()=>mountYT(f,it.id));
  });
}

/* ── küçük resim şeridi ── */
function buildStrip(){
  strip.innerHTML='';
  items.forEach((it,i)=>{
    const src = it.thumb || (it.type==='photo'?it.src : it.type==='ba'?it.after : it.poster);
    const b=document.createElement('button');
    b.className='rmg-th'; b.dataset.i=i;
    b.setAttribute('aria-label',(i+1)+'. öğe, '+TYPE_LABEL[it.type]+(it.alt?', '+it.alt:''));
    b.innerHTML='<img src="'+src+'" alt="">'+
      (it.type==='youtube'||it.type==='instagram'?'<span class="rmg-th__badge play"></span>':
       it.type==='ba'?'<span class="rmg-th__badge cmp"></span>':'');
    strip.appendChild(b);
  });
}
strip.addEventListener('click',e=>{ const b=e.target.closest('.rmg-th'); if(b) goTo(+b.dataset.i); });

/* ── gezinme ── */
function goTo(i,animate){
  if(i<0||i>=items.length) return;
  idx=i; resetZoom(false);
  track.classList.toggle('is-animating',animate!==false);
  setTrack(0);
  const it=items[idx];
  titleEl.textContent=galleryTitle;
  countEl.textContent=(idx+1)+' / '+items.length;
  liveEl.textContent=(idx+1)+' / '+items.length+', '+TYPE_LABEL[it.type]+(it.alt?', '+it.alt:'');
  prevBtn.disabled=nextBtn.disabled=false;
  prevBtn.disabled=(idx===0); nextBtn.disabled=(idx===items.length-1);
  [...strip.children].forEach((b,k)=>b.setAttribute('aria-current',k===idx));
  strip.children[idx]?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
  unmountVideos(idx);
  setHint();
  preload(idx+1); preload(idx-1);
}
function preload(i){
  const it=items[i]; if(!it) return;
  const s=it.type==='photo'?it.src:it.type==='ba'?it.after:it.poster;
  if(s){ const im=new Image(); im.src=s; }
}
function setTrack(dx){
  track.style.transform='translate3d(calc('+(-idx*100)+'% + '+dx+'px),0,0)';
}
function next(){ if(idx<items.length-1) goTo(idx+1); }
function prev(){ if(idx>0) goTo(idx-1); }

function setHint(){
  const it=items[idx]; let h='';
  if(it.type==='ba'){
    h = coarse
      ? (zoom>1 ? 'Yakınlaştırıldı — <b>sürükle</b> kaydır'
                : 'Çizgiyi <b>sürükle</b> karşılaştır · <b>dokun</b> yakınlaş')
      : (zoom>1 ? '<b>Gezdir</b> karşılaştır · <b>sürükle</b> kaydır'
                : '<b>Fareyi gezdir</b> karşılaştır · <b>tıkla</b> yakınlaş');
  } else if(it.type==='photo'){
    h = zoom>1 ? 'Yakınlaştırıldı — <b>sürükle</b> kaydır'
      : coarse ? '<b>Dokun</b> yakınlaş · iki parmakla sıkıştır'
               : '<b>Tıkla</b> yakınlaş · <b>tekerlek</b> ile gezin';
  } else if(it.type==='youtube'){
    h = track.querySelector('.rmg-frame[data-i="'+idx+'"][data-playing]') ? '' : 'Video <b>ancak dokununca</b> yüklenir';
  }
  hintEl.innerHTML = h ? '<span>'+h+'</span>' : '';
}

/* ── zoom ── */
function activeFrame(){ return track.querySelector('.rmg-slide[data-i="'+idx+'"] .rmg-frame'); }
function canZoom(){ const it=items[idx]; return it && (it.type==='photo'||it.type==='ba'); }
function applyZoom(){
  const f=activeFrame(); if(!f) return;
  f.style.transform = zoom>1 ? 'translate3d('+panX+'px,'+panY+'px,0) scale('+zoom+')' : '';
  f.classList.toggle('is-zoomed',zoom>1);
  f.style.setProperty('--iz',String(1/zoom));
  f.style.transition = dragMode==='pan' ? 'none' : 'transform .26s cubic-bezier(.22,.61,.36,1)';
  zOutBtn.disabled = zoom<=MIN_ZOOM; zInBtn.disabled = zoom>=MAX_ZOOM || !canZoom();
  setHint();
}
function clampPan(){
  const f=activeFrame(); if(!f||zoom<=1){panX=panY=0;return;}
  const r=f.getBoundingClientRect(), vw=viewport.clientWidth, vh=viewport.clientHeight;
  // ölçeklenmiş yarı taşma miktarı
  const ox=Math.max(0,(f.offsetWidth*zoom - vw)/2), oy=Math.max(0,(f.offsetHeight*zoom - vh)/2);
  panX=Math.max(-ox,Math.min(ox,panX)); panY=Math.max(-oy,Math.min(oy,panY));
}
function setZoom(z,cx,cy){
  if(!canZoom()) return;
  const f=activeFrame(); if(!f) return;
  const old=zoom; z=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,z));
  if(z===old) return;
  if(z===1){ panX=panY=0; }
  else if(cx!=null){
    // tıklanan nokta sabit kalsın
    const r=f.getBoundingClientRect();
    const dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2);
    const k=z/old;
    panX=(panX-dx)*k+dx; panY=(panY-dy)*k+dy;
  }
  zoom=z; clampPan(); applyZoom();
}
/* HER kareyi temizler. Yalnızca aktif kareyi temizlemek yetmiyordu:
   goTo() önce idx'i değiştirdiği için eski slayt büyümüş hâlde kalıyor,
   geri gelindiğinde zoom değişkeni 1 olmasına rağmen görsel 3.45x
   duruyordu. */
function resetZoom(){
  zoom=1; panX=panY=0;
  track.querySelectorAll('.rmg-frame').forEach(f=>{
    f.style.transform=''; f.style.removeProperty('--iz');
    f.classList.remove('is-zoomed','is-panning');
  });
  zOutBtn.disabled=true; zInBtn.disabled=!canZoom();
}
zInBtn.addEventListener('click',()=>setZoom(zoom*1.8));
zOutBtn.addEventListener('click',()=>setZoom(zoom/1.8));

/* ── before/after konumu ── */
function setBAPos(f,pct,smooth){
  pct=Math.max(0,Math.min(100,pct));
  f.classList.toggle('smooth',!!smooth);
  f.style.setProperty('--pos',pct+'%');
  const k=f.querySelector('.rmg-ba__knob'); if(k) k.setAttribute('aria-valuenow',Math.round(pct));
}
function baPctFromX(f,x){
  const r=f.getBoundingClientRect();
  return ((x-r.left)/r.width)*100;
}

/* ── işaretçi (fare + dokunmatik tek yol) ── */
viewport.addEventListener('pointerdown',e=>{
  if(!isOpen) return;
  if(e.target.closest('.rmg-vid__poster,.rmg-ig__out,.rmg-nav')) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

  if(pointers.size===2){                       // iki parmak → pinch
    const [a,b]=[...pointers.values()];
    pinchStart={d:Math.hypot(a.x-b.x,a.y-b.y),z:zoom};
    dragMode='pinch'; clearTimeout(holdTimer); return;
  }
  const f=activeFrame(), it=items[idx];
  // Görselin ÜSTÜNDE mi başladı? Pointer capture sonrası e.target
  // viewport'a döndüğü için bunu şimdi kaydediyoruz.
  const onFrame=!!e.target.closest('.rmg-frame');
  const onKnob =!!e.target.closest('.rmg-ba__knob');
  start={x:e.clientX,y:e.clientY,t:Date.now(),moved:false,onFrame:onFrame};
  trackDX=0; dismissDY=0;
  // Parmak/fare viewport dışına çıksa bile olaylar buraya gelmeye devam etsin;
  // aksi halde ekran kenarında bırakılan sürükleme yarıda kalır.
  try{ viewport.setPointerCapture(e.pointerId); }catch(err){}

  // Görselin dışında başlayan her şey "boşluk" → tıklamaysa kapatır
  if(!onFrame){ dragMode='idle'; return; }

  // Tutamacı sürükleme her zaman karşılaştırmadır (yakınlaştırılmışken bile)
  if(it.type==='ba'&&onKnob){ dragMode='compare'; return; }

  // Yakınlaştırılmışsa sürükleme kaydırmadır; karşılaştırma
  // fareyi gezdirerek (masaüstü) veya anahtarla (mobil) sürer
  if(zoom>1){ dragMode='pan'; f?.classList.add('is-panning'); return; }

  dragMode='idle';
},{passive:true});

viewport.addEventListener('pointermove',e=>{
  if(!isOpen) return;

  /* Masaüstü: düğmeye basmadan fareyi gezdirmek karşılaştırma çizgisini
     sürer. Sürükleme böylece serbest kalır — yakınlaştırılmışken
     sürükleme kaydırma yapar, gezdirme karşılaştırmaya devam eder. */
  if(!coarse && e.buttons===0){
    const it=items[idx];
    if(it&&it.type==='ba'&&e.target.closest('.rmg-frame')){
      const f=activeFrame(); if(f) setBAPos(f,baPctFromX(f,e.clientX),false);
    }
    return;
  }

  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

  if(dragMode==='pinch'&&pointers.size===2&&pinchStart){
    const [a,b]=[...pointers.values()];
    const d=Math.hypot(a.x-b.x,a.y-b.y);
    setZoom(pinchStart.z*(d/pinchStart.d),(a.x+b.x)/2,(a.y+b.y)/2);
    return;
  }
  if(!start) return;
  const dx=e.clientX-start.x, dy=e.clientY-start.y;
  if(Math.abs(dx)>10||Math.abs(dy)>10) start.moved=true;

  if(dragMode==='pan'){ panX+=e.clientX-(start.lx??start.x); panY+=e.clientY-(start.ly??start.y);
    start.lx=e.clientX; start.ly=e.clientY; clampPan(); applyZoom(); return; }

  if(dragMode==='compare'){ const f=activeFrame(); if(f) setBAPos(f,baPctFromX(f,e.clientX),false); return; }

  if(dragMode==='idle'||dragMode==='track'||dragMode==='dismiss'){
    if(dragMode==='idle'){
      if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){ dragMode='track'; clearTimeout(holdTimer); }
      else if(dy>14&&Math.abs(dy)>Math.abs(dx)&&coarse){ dragMode='dismiss'; clearTimeout(holdTimer); }
    }
    if(dragMode==='track'){
      let d=dx;
      if((idx===0&&d>0)||(idx===items.length-1&&d<0)) d*=0.32;   // kenarda lastik
      trackDX=d; track.classList.remove('is-animating'); setTrack(d);
    }
    if(dragMode==='dismiss'){
      dismissDY=Math.max(0,dy);
      lb.style.opacity=String(Math.max(.25,1-dismissDY/420));
      track.style.transform='translate3d(calc('+(-idx*100)+'% ),'+dismissDY+'px,0) scale('+Math.max(.86,1-dismissDY/1400)+')';
    }
  }
},{passive:true});

function endPointer(e){
  pointers.delete(e.pointerId);
  if(dragMode==='pinch'){ if(pointers.size<2){dragMode=null;pinchStart=null; if(zoom<=1.02) setZoom(1);} return; }
  const f=activeFrame(); const it=items[idx];
  clearTimeout(holdTimer);

  if(dragMode==='pan'){
    activeFrame()?.classList.remove('is-panning');
    // kaydırmadan bırakıldıysa bu bir tıklamadır → uzaklaş
    if(start&&!start.moved) setZoom(1);
    dragMode=null; start=null; return;
  }

  if(dragMode==='compare'){ dragMode=null; start=null; return; }

  if(dragMode==='track'){
    track.classList.add('is-animating');
    const dt=Date.now()-(start?.t||0), v=Math.abs(trackDX)/Math.max(dt,1);
    if((Math.abs(trackDX)>viewport.clientWidth*0.18||v>0.5)){ trackDX<0?next():prev(); }
    else setTrack(0);
    dragMode=null; start=null; return;
  }
  if(dragMode==='dismiss'){
    if(dismissDY>110){ closeLB(); }
    else{ lb.style.opacity=''; track.classList.add('is-animating'); setTrack(0); }
    dragMode=null; start=null; return;
  }
  // hareketsiz bırakma = tıklama
  if(start&&!start.moved){
    if(start.onFrame){ if(canZoom()) zoom>1?setZoom(1):setZoom(CLICK_ZOOM,e.clientX,e.clientY); }
    else closeLB();                              // boşluğa tıkla → kapat
  }
  dragMode=null; start=null;
}
viewport.addEventListener('pointerup',endPointer,{passive:true});
viewport.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);clearTimeout(holdTimer);
  if(dragMode==='dismiss'||dragMode==='track'){lb.style.opacity='';track.classList.add('is-animating');setTrack(0);}
  dragMode=null;start=null;},{passive:true});

/* ── fare tekerleği: gezin / yakınken kaydır ── */
let wheelAcc=0, wheelLock=false, wheelTimer=null;
viewport.addEventListener('wheel',e=>{
  if(!isOpen) return;
  e.preventDefault();
  if(e.ctrlKey){ setZoom(zoom*(e.deltaY<0?1.12:0.89),e.clientX,e.clientY); return; }  // trackpad pinch
  if(zoom>1){ panX-=e.deltaX; panY-=e.deltaY; clampPan(); applyZoom(); return; }
  const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
  if(wheelLock) return;
  wheelAcc+=d;
  clearTimeout(wheelTimer); wheelTimer=setTimeout(()=>{wheelAcc=0;},110);
  if(Math.abs(wheelAcc)>WHEEL_STEP){
    wheelAcc>0?next():prev(); wheelAcc=0; wheelLock=true;
    setTimeout(()=>{wheelLock=false;},WHEEL_LOCK);
  }
},{passive:false});

/* ── klavye ── */
document.addEventListener('keydown',e=>{
  if(!isOpen) return;
  const onKnob=document.activeElement?.classList.contains('rmg-ba__knob');
  if(e.key==='Escape'){ e.preventDefault(); zoom>1?setZoom(1):closeLB(); return; }
  if(onKnob&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
    const f=activeFrame(); if(f){
      const cur=parseFloat(f.style.getPropertyValue('--pos'))||50;
      setBAPos(f,cur+(e.key==='ArrowRight'?4:-4),false); e.preventDefault(); }
    return;
  }
  if(e.key==='ArrowRight'){ e.preventDefault(); next(); }
  if(e.key==='ArrowLeft'){ e.preventDefault(); prev(); }
  if(e.key==='Home'){ e.preventDefault(); goTo(0); }
  if(e.key==='End'){ e.preventDefault(); goTo(items.length-1); }
  if(e.key==='+'||e.key==='='){ e.preventDefault(); setZoom(zoom*1.8); }
  if(e.key==='-'){ e.preventDefault(); setZoom(zoom/1.8); }
  if(e.key==='Tab') trapFocus(e);
});
function trapFocus(e){
  const f=[...lb.querySelectorAll('button,a[href],[tabindex]:not([tabindex="-1"])')]
          .filter(el=>el.offsetParent!==null&&!el.disabled);
  if(!f.length) return;
  const first=f[0], last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
}

/* ── kapatma noktaları ── */
closeBtn.addEventListener('click',()=>closeLB());
lb.addEventListener('click',e=>{ if(e.target.hasAttribute('data-close')&&e.target!==viewport) closeLB(); });
prevBtn.addEventListener('click',prev);
nextBtn.addEventListener('click',next);


  var real = {
    open: function(items, opts){ openLB(items, opts||{}); },
    close: function(){ closeLB(); },
    isOpen: function(){ return isOpen; },
    attach: function(selector, resolver){
      document.addEventListener('click', function(e){
        var t=e.target.closest(selector); if(!t) return;
        e.preventDefault();
        var cfg=resolver(t); if(!cfg||!cfg.items||!cfg.items.length) return;
        openLB(cfg.items, {title:cfg.title, startIndex:cfg.startIndex||0, trigger:t});
      });
    }
  };
  var pending = global.RMGallery._q || [];
  Object.keys(real).forEach(function(k){ global.RMGallery[k]=real[k]; });
  global.RMGallery._q = null;
  pending.forEach(function(c){ if(real[c[0]]) real[c[0]].apply(null, c.slice(1)); });
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})(window);
