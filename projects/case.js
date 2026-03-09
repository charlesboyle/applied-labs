/* Applied Labs — shared case study JS */
const ring = document.getElementById('cursorRing'), dot = document.getElementById('cursorDot');
document.documentElement.style.cursor = 'none';
let mx=-100,my=-100,rx=-100,ry=-100;
document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });
(function lerpRing(){ rx+=(mx-rx)*.12; ry+=(my-ry)*.12; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(lerpRing); })();
document.querySelectorAll('a,button').forEach(el=>{ el.addEventListener('mouseenter',()=>ring.classList.add('hovering')); el.addEventListener('mouseleave',()=>ring.classList.remove('hovering')); });
document.addEventListener('mouseleave',()=>{ ring.style.opacity='0'; dot.style.opacity='0'; });
document.addEventListener('mouseenter',()=>{ ring.style.opacity=''; dot.style.opacity=''; });

const io = new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } }); },{ threshold:.08 });
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));

['caseVisual','caseCta'].forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  new IntersectionObserver(entries=>{ entries.forEach(e=>{ if(e.isIntersecting){ el.classList.add('visible'); if(id==='caseVisual' && window.onVisualReveal) window.onVisualReveal(); } }); },{ threshold:.1 }).observe(el);
});
