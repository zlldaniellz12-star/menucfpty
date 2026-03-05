// ui-cards.js (patched) — mantiene tu UI pero ahora recalcula total al seleccionar decoración
document.addEventListener('DOMContentLoaded', () => {
  // Decoración (cards)
  document.querySelectorAll('.optionCard').forEach(card=>{
    card.addEventListener('click', function(){
      // Solo afecta a cards dentro del contenedor de decoración si existe
      const decoWrap = this.closest('#decoracionCards') || this.closest('[data-decoracion-cards]') || null;

      // Si hay contenedor específico, limpia solo ahí. Si no, mantiene el comportamiento anterior.
      const scope = decoWrap ? decoWrap.querySelectorAll('.optionCard') : document.querySelectorAll('.optionCard');
      scope.forEach(c=>c.classList.remove('active'));
      this.classList.add('active');

      const decoInput = document.getElementById('decoracion');
      if(decoInput){
        decoInput.value = this.dataset.value || '';
        // Dispara eventos para que app-cotizador recalcule
        decoInput.dispatchEvent(new Event('input', {bubbles:true}));
        decoInput.dispatchEvent(new Event('change', {bubbles:true}));
      }

      // Llama updatePreview si existe (es el motor del total y cake 3D)
      if(typeof window.updatePreview === 'function'){
        window.updatePreview();
      }
    });
  });

  /* ====== STEPPER UI (progreso + secciones por orden) ====== */
  (function(){
    const sections = Array.from(document.querySelectorAll('.content .stepSection'));
    const stepBar = document.getElementById('stepBar');
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    if(!sections.length || !stepBar || !btnPrev || !btnNext) return;

    const steps = sections.map((sec, idx) => {
      const h2 = sec.querySelector('.sectionTitle h2');
      const title = h2 ? h2.textContent.trim() : `Paso ${idx+1}`;
      return {sec, title};
    });

    stepBar.innerHTML = steps.map((s,i)=>`
      <button type="button" class="stepDot" data-step="${i}" aria-label="${s.title}">
        <span class="dot"></span>
        <span class="label">${s.title}</span>
      </button>
    `).join('');

    let current = 0;

    function setActive(i){
      current = Math.max(0, Math.min(i, steps.length-1));

      steps.forEach((s, idx)=>{
        s.sec.classList.toggle('isActive', idx===current);
        s.sec.classList.toggle('isHidden', idx!==current);
        if(idx===current){
          s.sec.classList.remove('enter');
          void s.sec.offsetWidth;
          s.sec.classList.add('enter');
        }
      });

      const dots = Array.from(stepBar.querySelectorAll('.stepDot'));
      dots.forEach((d, idx)=>{
        d.classList.toggle('active', idx===current);
        d.classList.toggle('done', idx<current);
      });

      btnPrev.disabled = current===0;
      btnNext.textContent = (current===steps.length-1) ? 'Finalizar' : 'Siguiente';

      const card = document.querySelector('.card');
      if(card) card.scrollIntoView({behavior:'smooth', block:'start'});
    }

    stepBar.addEventListener('click', (e)=>{
      const btn = e.target.closest('.stepDot');
      if(!btn) return;
      const idx = parseInt(btn.dataset.step,10);
      if(Number.isFinite(idx)) setActive(idx);
    });

    btnPrev.addEventListener('click', ()=> setActive(current-1));
    btnNext.addEventListener('click', ()=> {
      if(current < steps.length-1) setActive(current+1);
      else {
        const finalBtns = document.getElementById('accionesFinales');
        if(finalBtns) finalBtns.scrollIntoView({behavior:'smooth', block:'center'});
      }
    });

    setActive(0);
  })();
});
