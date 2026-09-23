const q=s=>document.querySelector(s), qa=s=>document.querySelectorAll(s);
const nav=q('.nav'), menu=q('.menu'), orbit=q('#orbit'), glow=q('.cursor-glow');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;

/* mobile navigation */
menu?.addEventListener('click',()=>nav.classList.toggle('open'));
qa('.nav nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));


/* V9 LAYERED ORBIT
   Five capabilities use different orbital layers/planes rather than a
   single pentagon. Each has its own elliptical path, depth cycle and phase.
   The animation is intentionally slow and continuous. */
const orbitNodes=[...qa('.orbit-node')];
const orbitTrack=q('.orbit-track');

const orbitLayers=[
  {rx:.405, ry:.255, phase:-1.20, speed:.88, depth:.22}, // AI — wide outer layer
  {rx:.315, ry:.390, phase:.55,  speed:.72, depth:.34}, // WEB — tall layer
  {rx:.245, ry:.245, phase:2.30,  speed:1.00, depth:.42}, // LEAD — inner layer
  {rx:.370, ry:.205, phase:3.65, speed:.64, depth:.27}, // DATA — shallow outer layer
  {rx:.285, ry:.340, phase:4.75, speed:.81, depth:.36}  // DESIGN — diagonal layer
];

// One revolution is now deliberately slow: ~42 seconds.
const ORBIT_PERIOD=42;
let orbitLast=performance.now();
let orbitPhase=0;

function animateOrbit(now){
  if(orbitTrack && orbitNodes.length){
    const dt=Math.min(50,Math.max(0,now-orbitLast));
    orbitLast=now;

    if(document.visibilityState!=="hidden"){
      orbitPhase += (Math.PI*2/ORBIT_PERIOD)*(dt/1000);
    }

    const r=orbitTrack.getBoundingClientRect();
    const cx=r.width/2;
    const cy=r.height/2;
    const base=Math.min(r.width,r.height);

    orbitNodes.forEach((node,i)=>{
      const o=orbitLayers[i];
      const a=o.phase + orbitPhase*o.speed;

      // Different rx/ry values create separate orbital planes/layers.
      const x=cx + Math.cos(a)*base*o.rx;
      const y=cy + Math.sin(a)*base*o.ry;

      // Simulated depth: nodes subtly grow when closer to the viewer.
      const depth=Math.sin(a+Math.PI/2);
      const scale=0.84 + (depth+1)*0.09*o.depth/0.42;
      const opacity=0.66 + (depth+1)*0.17;

      node.style.left=x.toFixed(2)+'px';
      node.style.top=y.toFixed(2)+'px';
      node.style.transform=`translate3d(-50%,-50%,0) scale(${scale.toFixed(3)})`;
      node.style.opacity=opacity.toFixed(3);
      node.style.zIndex=String(20+Math.round((depth+1)*10));
    });
  }
  requestAnimationFrame(animateOrbit);
}
requestAnimationFrame(animateOrbit);

/* cursor proximity glow — orbit nodes are intentionally not clickable */
if(fine && !reduceMotion && glow){
  let mx=innerWidth/2,my=innerHeight/2,gx=mx,gy=my;
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});
  function glowLoop(){gx+=(mx-gx)*.16;gy+=(my-gy)*.16;glow.style.left=gx+'px';glow.style.top=gy+'px';requestAnimationFrame(glowLoop)}
  glowLoop();
  qa('a,button,.project,.skill-cloud span').forEach(el=>{
    el.addEventListener('pointerenter',()=>glow.classList.add('active'));
    el.addEventListener('pointerleave',()=>glow.classList.remove('active'));
  });
  q('.tedx-card')?.addEventListener('pointerenter',()=>glow.classList.add('coral'));
  q('.tedx-card')?.addEventListener('pointerleave',()=>glow.classList.remove('coral'));
  addEventListener('pointermove',e=>{
    let near=false;
    orbitNodes.forEach(n=>{
      const r=n.getBoundingClientRect();
      const d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));
      const active=d<95;
      n.classList.toggle('glow',active); near ||= active;
    });
    if(near)glow.classList.add('active');
  });
}

/* preloader — deliberately stays visible for exactly 2 seconds */
document.body.classList.add('locked');
const loader=q('.loader');
let pageRevealed=false;
function revealPage(){
  if(pageRevealed)return;
  pageRevealed=true;
  document.body.classList.remove('locked');
  loader?.classList.add('done');
  document.body.classList.add('js-ready');
  setTimeout(()=>loader?.remove(),850);
}
setTimeout(revealPage,2000);

/* smooth anchors */
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function scrollToY(y,d=850){
  if(reduceMotion){scrollTo(0,y);return}
  const s=scrollY, diff=y-s, st=performance.now();
  function f(now){const t=Math.min(1,(now-st)/d);scrollTo(0,s+diff*ease(t));if(t<1)requestAnimationFrame(f)}
  requestAnimationFrame(f);
}
qa('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el=q(a.getAttribute('href')); if(!el)return;
  e.preventDefault(); scrollToY(el.getBoundingClientRect().top+scrollY-70);
}));

/* V8 REVEAL — reveal complete visual blocks, not every text line */
const io=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    entry.target.classList.add('visible');
    io.unobserve(entry.target);
  });
},{threshold:.10,rootMargin:'0px 0px -10% 0px'});

const revealTargets=[
  '.work-head',
  '.project',
  '.about-layout',
  '.journey-intro',
  '.time-item',
  '.skills-layout',
  '.skill-groups',
  '.tedx-card',
  '.principles',
  '.contact-inner'
];
qa(revealTargets.join(',')).forEach((el,i)=>{
  el.classList.add('reveal');
  el.style.transitionDelay=Math.min((i%4)*.09,.27)+'s';
  io.observe(el);
});

/* scroll progress, nav depth, subtle hero parallax */
let lastY=-1;
function frame(){
  const y=scrollY;
  if(y!==lastY){
    lastY=y;
    nav?.classList.toggle('scrolled',y>10);
    const max=document.documentElement.scrollHeight-innerHeight;
    q('.scroll-progress').style.width=(max>0?y/max*100:0)+'%';
    if(!reduceMotion){
      const hg=q('.hero-grid');
      if(hg)hg.style.transform=`translate3d(0,${y*.10}px,0)`;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* magnetic hero buttons */
if(fine && !reduceMotion){
  const magnets=[...qa('.button,.nav-cta')].map(el=>({el,tx:0,ty:0,cx:0,cy:0}));
  magnets.forEach(m=>m.el.addEventListener('mousemove',e=>{
    const r=m.el.getBoundingClientRect();
    m.tx=(e.clientX-r.left-r.width/2)*.22;m.ty=(e.clientY-r.top-r.height/2)*.32;
  }));
  magnets.forEach(m=>m.el.addEventListener('mouseleave',()=>{m.tx=0;m.ty=0}));
  function mag(){magnets.forEach(m=>{m.cx+=(m.tx-m.cx)*.18;m.cy+=(m.ty-m.cy)*.18;m.el.style.transform=`translate(${m.cx}px,${m.cy}px)`});requestAnimationFrame(mag)} mag();
}

/* Project cards use CSS hover effects only.
   No JS transform loop here, so reveal/fade animations stay smooth. */

/* copy email */
qa('.copy-link').forEach(btn=>btn.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(btn.dataset.copy);q('.toast').classList.add('show');setTimeout(()=>q('.toast').classList.remove('show'),1600)}catch{}
}));

/* background particle field */
const c=q('#particles'),ctx=c.getContext('2d');let W,H,pts=[];
function size(){
  const d=devicePixelRatio||1; W=innerWidth;H=innerHeight;c.width=W*d;c.height=H*d;c.style.width=W+'px';c.style.height=H+'px';ctx.setTransform(d,0,0,d,0,0);
  pts=Array.from({length:75},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*1.2+.35}));
}
function draw(){
  ctx.clearRect(0,0,W,H);
  for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;ctx.fillStyle='rgba(202,255,71,.24)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}
  requestAnimationFrame(draw);
}
size();draw();addEventListener('resize',size);
