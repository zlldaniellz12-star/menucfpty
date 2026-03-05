/* ===========================
   PRECIOS / PORCIONES (TU BASE)
   =========================== */
const base = {6:37.99,7:50.99,8:63.99,9:75.99};
const base12Estimado = 114.00;

const harinaAlmendra = {6:6,7:8,8:10,9:12,12:16};

const costos = {
  Chocolate:{6:5,7:7,8:8.5,9:10,12:14},
  Pistacho:{6:3,7:5,8:7,9:10,12:14},
  "Dulce de leche almendra":{6:3,7:5,8:7,9:10,12:14},
  "Dulce de leche vaca":{6:3,7:5,8:7,9:10,12:14}
};

const decoracionCostos = {
  flores:{6:5,7:7,8:9,9:11,12:16},
  frutas:{6:5,7:7,8:9,9:11,12:16},
  frutasflores:{6:5,7:7,8:9,9:11,12:16},
  frutosrojos:{6:7,7:9,8:12,9:15,12:22}
};


// Decoración (cards) — opciones y labels para vista previa
const decoracionLabels = {
  flores: "Flores",
  flores: "Flores",
     frutas: "Frutas Mixtas",
  frutasflores: "Frutas y Flores",
  frutosrojos: "Frutos Rojos"
};

// Render de tarjetas de decoración (se guarda valor en #decoracion)
function initDecoracionCards(){
  if(!decoracionCards || !decoracion) return;

  const opts = Object.keys(decoracionLabels).map(k=>({key:k, label:decoracionLabels[k]}));

  // agrega opción "sin decoración"
  const all = [{key:"", label:"Sin decoración"}, ...opts];

  decoracionCards.innerHTML = "";
  all.forEach(({key,label})=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "decoCard" + (decoracion.value===key ? " selected":"");
    b.dataset.value = key;
    b.innerHTML = `
      <span class="decoChip">${label}</span>
      <span class="decoHint">${key ? "Se suma según tamaño" : "Sin costo extra"}</span>
    `;
    b.addEventListener("click", ()=>{
      decoracion.value = key;
      // marcar seleccionado
      decoracionCards.querySelectorAll(".decoCard").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      updatePreview();
    });
    decoracionCards.appendChild(b);
  });
}


const porciones = {
  6:[6,8],
  7:[8,10],
  8:[12,15],
  9:[16,20],
  12:[28,35]
};

const sabores = ["Vainilla","Chocolate","Zanahoria","Guineo","Marmoleado","Red Velvet","Piña"];

/* ===========================
   RELLENOS / COBERTURAS (LISTAS)
   - Relleno ahora también por piso si 2–3
   =========================== */
const rellenoOptions = [
  {group:"Sencilla", items:["SIN COBERTURA"]},
  {group:"Sin lácteos", items:["vainilla","Maracuya","limón","Dulce de leche de coco"]},
  {group:"Sin lácteos – costo", items:["Chocolate","Pistacho","Dulce de leche almendra" ]},
  {group:"Con lácteos", items:["Yogurt griego con queso crema"]},
  {group:"Con lácteos –  costo", items:["Dulce de leche vaca"]},
];
const coberturaOptions = [
  {group:"Sencilla", items:["SIN COBERTURA"]},
  {group:"Sin lácteos", items:["vainilla","Maracuya","limón","Dulce de leche de coco"]},
  {group:"Sin lácteos – costo", items:["Chocolate","Pistacho","Dulce de leche almendra" ]},
  {group:"Con lácteos", items:["Yogurt griego con queso crema"]},
  {group:"Con lácteos –  costo", items:["Dulce de leche vaca"]},
 
];

/* ===========================
   DOM
   =========================== */
const $ = (id)=>document.getElementById(id);

const cliente = $("cliente");
const clienteTel = $("clienteTel");

const pisos = $("pisos");
const evento = $("evento");

const t1 = $("t1");
const t2 = $("t2");
const t3 = $("t3");
const tier1Wrap = $("tier1Wrap");
const tier2Wrap = $("tier2Wrap");
const tier3Wrap = $("tier3Wrap");

// ---------- Selector visual de tamaños (imágenes) ----------
function setupSizePicker(){
  const picker = document.getElementById("sizePicker");
  if(!picker) return;

  // fallback por si el sistema de archivos no soporta "ñ"
  picker.querySelectorAll("img[data-alt]").forEach(img=>{
    img.addEventListener("error", ()=>{
      const alt = img.getAttribute("data-alt");
      if(alt && img.src.indexOf("tamano") !== -1){
        img.src = alt;
      }
    }, {once:true});
  });

  let activeTier = "t1"; // por defecto piso 1

  function setActiveTier(id){
    activeTier = id;
    [tier1Wrap, tier2Wrap, tier3Wrap].forEach(w=>w && w.classList.remove("tierActive"));
    const wrap = document.getElementById(id==="t1" ? "tier1Wrap" : id==="t2" ? "tier2Wrap" : "tier3Wrap");
    if(wrap) wrap.classList.add("tierActive");
  }

  // cuando el usuario toque un piso, ese piso queda activo
  tier1Wrap?.addEventListener("click", ()=>setActiveTier("t1"));
  tier2Wrap?.addEventListener("click", ()=>setActiveTier("t2"));
  tier3Wrap?.addEventListener("click", ()=>setActiveTier("t3"));

  // si el usuario enfoca el select (tab), también lo marca
  t1?.addEventListener("focus", ()=>setActiveTier("t1"));
  t2?.addEventListener("focus", ()=>setActiveTier("t2"));
  t3?.addEventListener("focus", ()=>setActiveTier("t3"));

  function applySize(size){
    const el = activeTier==="t1" ? t1 : activeTier==="t2" ? t2 : t3;
    if(!el) return;

    // Buscar option que contenga 6/7/8/9/12 (porque el value puede ser "6" o '6"' o "6”")
    const opt = Array.from(el.options).find(o=>{
      const v = (o.value||"").toString();
      const t = (o.textContent||"").toString();
      const s = String(size);
      return v===s || v===s+'"'
        || t.includes(s+'"') || t.includes(s+"”") || t.includes(s+"''") || t.trim()===s;
    });

    if(opt){
      el.value = opt.value;
      el.dispatchEvent(new Event("change", {bubbles:true}));
    }else{
      // fallback: intentar poner el value directo
      el.value = String(size);
      el.dispatchEvent(new Event("change", {bubbles:true}));
    }

    // marcar activo en UI
    picker.querySelectorAll(".sizePickBtn").forEach(b=>b.setAttribute("aria-pressed","false"));
    const btn = picker.querySelector(`.sizePickBtn[data-size="${size}"]`);
    if(btn) btn.setAttribute("aria-pressed","true");

    // Mostrar rinde estimado para este tamaño
    const r = (porciones && porciones[size]) ? porciones[size] : null;
    const rindeEl = document.getElementById("rindeTamano");
    if(rindeEl){
      rindeEl.textContent = r ? `Tamaño ${size}\" · Rinde aprox: ${r[0]}–${r[1]} personas` : `Tamaño ${size}\" seleccionado`;
    }
  }

  picker.addEventListener("click", (e)=>{
    const btn = e.target.closest(".sizePickBtn");
    if(!btn) return;
    applySize(btn.getAttribute("data-size"));
  });

  // inicial
  setActiveTier("t1");
}


const altura = $("altura");
const acabadoCake = $("acabadoCake");
const capasTxt = $("capasTxt");

const porcionesTxt = $("porcionesTxt");
const warnSizes = $("warnSizes");

const saboresSection = $("saboresSection");
const saborUnicoSection = $("saborUnicoSection");
const rowMismoSabor = $("rowMismoSabor");
const mismoSabor = $("mismoSabor");
const sabor1 = $("sabor1");
const sabor2 = $("sabor2");
const sabor3 = $("sabor3");
const saborUnico = $("saborUnico");
const notaSabores = $("notaSabores");
const notaSabores2 = $("notaSabores2");

const sabor1Wrap = $("sabor1Wrap");
const sabor2Wrap = $("sabor2Wrap");
const sabor3Wrap = $("sabor3Wrap");

const harina = $("harina");
const bizcocho = $("bizcocho");

const rellenosSection = $("rellenosSection");
const rowMismoRelleno = $("rowMismoRelleno");
const mismoRelleno = $("mismoRelleno");
const relleno1 = $("relleno1");
const relleno2 = $("relleno2");
const relleno3 = $("relleno3");
const rell1Wrap = $("rell1Wrap");
const rell2Wrap = $("rell2Wrap");
const rell3Wrap = $("rell3Wrap");
const notaRelleno = $("notaRelleno");

const cobertura = $("cobertura");
  const decoracion = $("decoracion");
  const decoracionCards = $("decoracionCards");
const tema = $("tema");
const notaGeneral = $("notaGeneral");
const paletteEl = $("palette");
const colorPastel = $("colorPastel");
const colorPastelTxt = $("colorPastelTxt");

// Barra de tonos (color personalizado)
const hueBar = $("hueBar");
const toneSwatch = $("toneSwatch");
const toneClear = $("toneClear");
const toneTxt = $("toneTxt");

function hslToHex(h, s=85, l=55){
  // h:0-360, s/l:0-100
  s/=100; l/=100;
  const c = (1 - Math.abs(2*l - 1)) * s;
  const x = c * (1 - Math.abs(((h/60) % 2) - 1));
  const m = l - c/2;
  let r=0,g=0,b=0;
  if(h < 60){ r=c; g=x; b=0; }
  else if(h < 120){ r=x; g=c; b=0; }
  else if(h < 180){ r=0; g=c; b=x; }
  else if(h < 240){ r=0; g=x; b=c; }
  else if(h < 300){ r=x; g=0; b=c; }
  else { r=c; g=0; b=x; }
  const toHex = (v)=> Math.round((v+m)*255).toString(16).padStart(2,"0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function setPastelValue(label){
  colorPastel.value = label || "";
  if(colorPastel.value){
    colorPastelTxt.innerHTML = `Seleccionado: <b>${escapeHtml(colorPastel.value)}</b> · <b>POR CONFIRMAR</b>`;
  }else{
    colorPastelTxt.innerHTML = 'Opcional · Si eliges un color, quedará como <b>POR CONFIRMAR</b>.';
  }
  renderPalette();
  updatePreview();
}

function updateToneUI(){
  if(!hueBar || !toneSwatch) return;
  const h = Number(hueBar.value||0);
  const hex = hslToHex(h);
  toneSwatch.style.background = hex;
  const hexEl = $("toneHex");
  if(hexEl) hexEl.textContent = hex;
  if(toneTxt) toneTxt.innerHTML = `Seleccionado: <b>${hex}</b>. Recuerda: el color solo aplica sobre crema blanca (<b>Yogurt griego</b> o <b>Dulce de leche de coco</b>) y queda <b>POR CONFIRMAR</b>.`;
  // Guardamos como "Personalizado #XXXXXX"
  setPastelValue(`Personalizado ${hex}`);
  // Rellenar automáticamente "Tema (texto)" con el color seleccionado (sin borrar lo que el cliente escribió)
  try{
    if(tema){
      const auto = `Color seleccionado: ${hex}`;
      const cur = (tema.value||"").trim();
      if(!cur || cur.startsWith("Color seleccionado:")) tema.value = auto;
    }
  }catch(e){}
}

if(hueBar){
  // No sobreescribir una selección existente al cargar si ya hay valor
  const current = (colorPastel?.value || "");
  if(!current){
    // inicializa swatch sin forzar valor
    const hex = hslToHex(Number(hueBar.value||0));
    if(toneSwatch) toneSwatch.style.background = hex;
  }else{
    // si ya tiene algo, no tocar
    const hex = hslToHex(Number(hueBar.value||0));
    if(toneSwatch) toneSwatch.style.background = hex;
  }

  hueBar.addEventListener("input", ()=>{
    // En móvil, input se siente inmediato y sí “selecciona”
    updateToneUI();
  });
}

if(toneClear){
  toneClear.addEventListener("click", ()=>{
    // Limpia personalizado + botones
    if(hueBar){
      // deja el swatch en el color actual del slider, pero no lo selecciona
      const hex = hslToHex(Number(hueBar.value||0));
      if(toneSwatch) toneSwatch.style.background = hex;
      if(toneTxt) toneTxt.textContent = "Mueve la barra para elegir un color personalizado.";
    }
    setPastelValue("");
  });
}



const lacteoBadge = $("lacteoBadge");

const montoAdicional = $("montoAdicional");

const delivery = $("delivery");
const deliveryMonto = $("deliveryMonto");

const totalCakeEl = $("totalCake");
const totalDeliveryEl = $("totalDelivery");
const totalGeneralEl = $("totalGeneral");
const totalBoxEl = document.querySelector(".totalBox");
const reviewMsgEl = $("reviewMsg");

function setReviewMode(on){
  if(totalBoxEl) totalBoxEl.classList.toggle("isReview", !!on);
  if(reviewMsgEl) reviewMsgEl.hidden = !on;
}
const kpiTotal = $("kpiTotal");

const fechaHora = $("fechaHora");
const anticTxt = $("anticTxt");
const previewMeta = $("previewMeta");
const legend = $("legend");


// Forzar minutos a intervalos de 30 min (00 o 30)
if(fechaHora){
  fechaHora.addEventListener("change", ()=>{
    const v = fechaHora.value;
    if(!v) return;
    const d = new Date(v);
    if(isNaN(d.getTime())) return;
    const m = d.getMinutes();
    const snapped = (m < 15) ? 0 : (m < 45 ? 30 : 0);
    if(m >= 45) d.setHours(d.getHours()+1);
    d.setMinutes(snapped, 0, 0);
    // volver a formato datetime-local: YYYY-MM-DDTHH:MM
    const pad = (n)=>String(n).padStart(2,"0");
    const out = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    fechaHora.value = out;
  });
}

const metodoPago = $("metodoPago");
const linkPago = $("linkPago");
const linkPagoLabel = $("linkPagoLabel");
const linkPagoHelp = $("linkPagoHelp");
const payInfo = $("payInfo");

const tier1El = $("tier1");
const tier2El = $("tier2");
const tier3El = $("tier3");

const label1 = $("label1");
const label2 = $("label2");
const label3 = $("label3");

const flav1 = $("flav1");
const flav2 = $("flav2");
const flav3 = $("flav3");

// Foto referencia
const refImg = $("refImg");
const refPreview = $("refPreview");
let refImageDataUrl = "";

// Modal refs
const refsOverlay = $("refsOverlay");
const refsClose = $("refsClose");
const refsGallery = $("refsGallery");
const btnRefs = $("btnRefs");

// Altura por piso
const alturaPisosWrap = $("alturaPisosWrap");
const alturaPisosChips = $("alturaPisosChips");
let alturaPisosSel = new Set();


/* ===========================
   HELPERS
   =========================== */


// Paleta de colores (pasteles) — editable por ustedes
const pastelPalette = [
  {name:"Rosa pastel", hex:"#F7C8D0"},
  {name:"Lavanda", hex:"#D7C7F6"},
  {name:"Celeste", hex:"#BFE6FF"},
  {name:"Menta", hex:"#CFF3E3"},
  {name:"Amarillo mantequilla", hex:"#FFF0B3"},
  {name:"Durazno", hex:"#FFD1B8"},
  {name:"Beige", hex:"#F1E3D3"},
  {name:"Gris perla", hex:"#E7E9EE"}
];

function renderPalette(){
  if(!paletteEl) return;
  paletteEl.innerHTML = "";
  const current = (colorPastel?.value || "");
  pastelPalette.forEach((c)=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "palBtn";
    b.style.background = c.hex;
    b.title = c.name;
    b.setAttribute("aria-label", c.name);
    b.setAttribute("aria-pressed", (current === c.name) ? "true":"false");
    b.addEventListener("click", ()=>{
      const isSame = (colorPastel.value === c.name);
      colorPastel.value = isSame ? "" : c.name;
      if(colorPastel.value){
        colorPastelTxt.innerHTML = `Seleccionado: <b>${escapeHtml(colorPastel.value)}</b> · <b>POR CONFIRMAR</b>`;
      }else{
        colorPastelTxt.innerHTML = 'Opcional · Si eliges un color, quedará como <b>POR CONFIRMAR</b>.';
      }
      renderPalette();
      updatePreview();
    });
    paletteEl.appendChild(b);
  });
}
function money(n){ return Number(n||0).toFixed(2); }
function escapeHtml(str){
  return String(str||"").replace(/[&<>"']/g, (m)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}
function safeText(v, fallback="—"){
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function fmtEntrega(val){
  if(!val) return "—";
  const d = new Date(val);
  if(isNaN(d.getTime())) return val;
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function requiredHours(){
  const n = Number(pisos.value || 1);
  return (n >= 2) ? 48 : 24;
}

function getBaseSabor(){
  const n = Number(pisos.value || 1);
  if(n <= 1) return (saborUnico && saborUnico.value) ? saborUnico.value : "";
  return (sabor1 && sabor1.value) ? sabor1.value : "";
}


function validateAnticipacion(){
  if(!fechaHora) return true;

  const req = requiredHours();
  if(!fechaHora.value){
    if(anticTxt){
      anticTxt.style.color = "";
      anticTxt.style.fontWeight = "";
      anticTxt.textContent = `Anticipación: CAKE sencillo = 24h · CAKE Elaborado = 48h· Horario: 9:00AM –8:00PM`;
    }
    return true;
  }

  const sel = new Date(fechaHora.value);
  if(isNaN(sel.getTime())){
    if(anticTxt){
      anticTxt.style.color = "#b3261e";
      anticTxt.style.fontWeight = "900";
      anticTxt.textContent = "Verificación de disponibilidad para la hora solicitada";
    }
    return false;
  }

  // reglas de horario/intervalo (ya normalizamos, pero validamos por seguridad)
  const h = sel.getHours(), m = sel.getMinutes();
  const inHours = (h > 9 || (h===9 && m>=0)) && (h < 20 || (h===20 && m===0));
  const inStep = (m === 0 || m === 30);

  const now = new Date();
  const min = new Date(now.getTime() + req*60*60*1000);
  const okLead = sel >= min;

  const ok = okLead && inHours && inStep;

  if(anticTxt){
    if(ok){
      anticTxt.style.color = "#0b7a44";
      anticTxt.style.fontWeight = "900";
      anticTxt.textContent = `Anticipación: OK (mín. ${req}h) · Horario OK`;
    }else{
      anticTxt.style.color = "#b3261e";
      anticTxt.style.fontWeight = "900";
      anticTxt.textContent = "Verificación de disponibilidad para la hora solicitada";
    }
  }
  return ok;
}

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function capasPorPiso(){
  const n = Number(pisos.value) || 1;
  if(altura.value !== "alta") return 3;
  if(n <= 1) return 4;
  // mezcla (hay pisos altos y normales)
  return (alturaPisosSel.size === n) ? 4 : 3;
}
function alturaPriceFactor(){
  if(altura.value !== "alta") return 1;
  const n = Number(pisos.value) || 1;
  if(n <= 1) return 1.5;
  const c = (alturaPisosSel.size || n);
  return 1 + 0.5*(c/n);
}
function alturaPorcionesFactor(){ return 1; }
function isPisoAlto(i){
  const n = Number(pisos.value) || 1;
  if(altura.value !== "alta") return false;
  if(n <= 1) return true;
  return alturaPisosSel.has(String(i));
}
function heightByAltura(i){ return isPisoAlto(i) ? 86 : 74; }
function sizeToWidth(inches){
  const w = 90 + (Number(inches) * 22);
  return clamp(w, 190, 340);
}

/* Estilo visual */
function applyStyleToTier(el){
  const style = acabadoCake.value;
  if(style === "liso"){
    el.style.opacity = "1";
    el.style.filter = "none";
    el.style.boxShadow = "0 22px 28px rgba(0,0,0,.16), 0 2px 0 rgba(255,255,255,.55) inset";
  }else if(style === "naked"){
    // “desnudo”: menos cobertura, más rústico
    el.style.opacity = ".92";
    el.style.filter = "contrast(1.02) saturate(.95)";
    el.style.boxShadow = "0 18px 24px rgba(0,0,0,.14), 0 1px 0 rgba(255,255,255,.45) inset";
  }else{
    // semi-naked
    el.style.opacity = ".97";
    el.style.filter = "contrast(1.04) saturate(1.0)";
    el.style.boxShadow = "0 20px 26px rgba(0,0,0,.15), 0 2px 0 rgba(255,255,255,.50) inset";
  }
}

/* Cobertura -> color 3D */
function setCakeColorsByCobertura(){
  const c = (cobertura.value || "Sencilla").toLowerCase();

  // defaults (crema suave)
  let top="#f6efe7", base="#f3e8de", side="#ead9cd", deep="#d7c1b3";

  const isChocolate = c.includes("chocolate");
  const isPistacho  = c.includes("pistacho");
  const isMaracuya  = c.includes("maracuy");
  const isLimon     = c.includes("limon");
  const isVainilla  = c.includes("vainilla");
  const isDDL       = c.includes("dulce de leche");
  const isYogurt    = c.includes("yogurt");
  const isCoco      = c.includes("coco");

  if(isChocolate){
    top="#4b2b1f"; base="#5a3426"; side="#3f241a"; deep="#2a1711";
  }else if(isPistacho){
    top="#cfe6bf"; base="#bfe0ae"; side="#97c98a"; deep="#76b26c";
  }else if(isMaracuya){
    top="#fff1a6"; base="#ffe77a"; side="#ffd84d"; deep="#f1b929";
  }else if(isLimon){
    // blanco hueso
    top="#f7f5ec"; base="#f2efdf"; side="#e7e2c8"; deep="#d6cfaa";
  }else if(isVainilla){
    top="#fbf1dc"; base="#f6e7c7"; side="#ead8b0"; deep="#d2bb8f";
  }else if(isDDL){
    top="#f2d2a9"; base="#e6bd8c"; side="#d5a56e"; deep="#b8844c";
  }else if(isYogurt || isCoco){
    top="#ffffff"; base="#fbfbfb"; side="#f0f0f0"; deep="#dedede";
  }else{
    // Sencilla / pastelera genérica
    top="#f6efe7"; base="#f3e8de"; side="#ead9cd"; deep="#d7c1b3";
  }

  document.documentElement.style.setProperty("--cake-top", top);
  document.documentElement.style.setProperty("--cake-base", base);
  document.documentElement.style.setProperty("--cake-side", side);
  document.documentElement.style.setProperty("--cake-deep", deep);
}

/* Select fillers */
function fillSelectWithSizes(sel, values, selected){
  sel.innerHTML = "";
  values.forEach(v=>{
    const o = document.createElement("option");
    o.value = String(v);
    o.textContent = `${v}”`;
    if(String(v) === String(selected)) o.selected = true;
    sel.appendChild(o);
  });
}
function fillSabores(select){
  select.innerHTML = "";
  sabores.forEach(s=>{
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    select.appendChild(o);
  });
}
function fillBizcocho(){
  if(!bizcocho) return;
  bizcocho.innerHTML = "";
  sabores.forEach(s=>{
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    bizcocho.appendChild(o);
  });
}
function fillGroupedSelect(select, groups){
  select.innerHTML = "";
  groups.forEach(g=>{
    const og = document.createElement("optgroup");
    og.label = g.group;
    g.items.forEach(it=>{
      const o = document.createElement("option");
      o.value = it;
      o.textContent = it;
      og.appendChild(o);
    });
    select.appendChild(og);
  });
}

/* Mano de obra */
function manoDeObraPorPisos(n){
  if(n===3) return 50;
  if(n===2) return 20;
  return 0;
}

/* Precios */
function getBasePrice(size){
  const s = Number(size);
  if (s === 12){ return base12Estimado;
  }
  return base[s] || 0;
}
function getExtraCost(table, size, key){
  const s = Number(size);
  if (!key || key === "Sin relleno" || key === "Sencilla") return 0;
  if (!table[key]) return 0;
  return Number(table[key][s] || 0);
}
function getPorcionesRange(size){
  const s = Number(size);
  return porciones[s] || [0,0];
}

/* sizes según pisos */
function getSizesArray(){
  const n = Number(pisos.value) || 1;
  const sizes = [];
  if(n >= 1) sizes.push(Number(t1.value));
  if(n >= 2) sizes.push(Number(t2.value));
  if(n >= 3) sizes.push(Number(t3.value));
  return sizes.filter(s=>!!s);
}

/* UI pisos */
function syncPisosUI(){
  // Altura por piso (solo cuando es 2+ pisos y Altura = Alta)
  const buildAlturaChips = ()=>{
    const n = Number(pisos.value) || 1;
    if(altura.value !== "alta" || n <= 1){
      alturaPisosWrap.style.display = "none";
      alturaPisosChips.innerHTML = "";
      alturaPisosSel = new Set();
      return;
    }
    alturaPisosWrap.style.display = "block";
    // default: todos los pisos altos (como antes)
    if(alturaPisosSel.size === 0){
      for(let i=1;i<=n;i++) alturaPisosSel.add(String(i));
    }else{
      // limpia selección fuera de rango
      [...alturaPisosSel].forEach(v=>{ if(Number(v)>n) alturaPisosSel.delete(v); });
      if(alturaPisosSel.size === 0){ for(let i=1;i<=n;i++) alturaPisosSel.add(String(i)); }
    }

    alturaPisosChips.innerHTML = "";
    for(let i=1;i<=n;i++){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chipBtn";
      b.textContent = `Piso ${i}`;
      b.setAttribute("aria-pressed", alturaPisosSel.has(String(i)) ? "true":"false");
      b.addEventListener("click", ()=>{
        const key = String(i);
        if(alturaPisosSel.has(key)) alturaPisosSel.delete(key);
        else alturaPisosSel.add(key);
        // evita 0 seleccionados
        if(alturaPisosSel.size === 0) alturaPisosSel.add(key);
        buildAlturaChips();
        updatePreview();
      });
      alturaPisosChips.appendChild(b);
    }
  };
  buildAlturaChips();

  const n = Number(pisos.value) || 1;

  tier1Wrap.style.display = (n>=1) ? "block" : "none";
  tier2Wrap.style.display = (n>=2) ? "block" : "none";
  tier3Wrap.style.display = (n>=3) ? "block" : "none";

  tier1El.style.display = (n>=1) ? "block" : "none";
  tier2El.style.display = (n>=2) ? "block" : "none";
  tier3El.style.display = (n>=3) ? "block" : "none";

  // Sabores: 1 piso => único
  if(n === 1){
    saboresSection.style.display = "none";
    saborUnicoSection.style.display = "block";
    rowMismoSabor.style.display = "none";
  }else{
    saboresSection.style.display = "block";
    saborUnicoSection.style.display = "none";
    rowMismoSabor.style.display = "flex";
  }

  // Rellenos: 1 piso => solo relleno1 (pero lo mostramos igual, con UI simplificada)
  if(n === 1){
    rowMismoRelleno.style.display = "none";
    rell2Wrap.style.display = "none";
    rell3Wrap.style.display = "none";
    rell1Wrap.style.display = "block";
  }else{
    rowMismoRelleno.style.display = "flex";
    rell1Wrap.style.display = "block";
    rell2Wrap.style.display = "block";
    rell3Wrap.style.display = (n===3) ? "block" : "none";
  }

  // sabores por piso wraps
  sabor1Wrap.style.display = (n>=1) ? "block" : "none";
  sabor2Wrap.style.display = (n>=2) ? "block" : "none";
  sabor3Wrap.style.display = (n>=3) ? "block" : "none";

  // mismo sabor toggle
  if(n > 1){
    if (mismoSabor.checked){
      sabor2.disabled = true;
      sabor3.disabled = true;
    }else{
      sabor2.disabled = false;
      sabor3.disabled = false;
    }
  }

  // mismo relleno toggle
  if(n > 1){
    if (mismoRelleno.checked){
      relleno2.disabled = true;
      relleno3.disabled = true;
    }else{
      relleno2.disabled = false;
      relleno3.disabled = false;
    }
  }
}

function getSaborPiso(i){
  if((Number(pisos.value)||1) === 1) return saborUnico.value;
  if (mismoSabor.checked) return sabor1.value;
  return (i===1) ? sabor1.value : (i===2) ? sabor2.value : sabor3.value;
}
function getRellenoPiso(i){
  if((Number(pisos.value)||1) === 1) return relleno1.value;
  if (mismoRelleno.checked) return relleno1.value;
  return (i===1) ? relleno1.value : (i===2) ? relleno2.value : relleno3.value;
}

function validarTamaños(){
  const n = Number(pisos.value) || 1;
  const s1 = Number(t1.value);
  const s2 = Number(t2.value);
  const s3 = Number(t3.value);

  if(n === 1){
    warnSizes.textContent = "1 piso: selecciona el tamaño que deseas.";
    warnSizes.style.background = "rgba(201,162,77,.16)";
    warnSizes.style.borderColor = "rgba(201,162,77,.28)";
    warnSizes.style.color = "#6a521f";
    return;
  }

  let ok = true;
  if (!(s2 < s1)) ok = false;
  if (n === 3 && !(s3 < s2)) ok = false;

  warnSizes.textContent = ok
    ? "Recomendación: el piso de arriba debe ser más pequeño que el de abajo."
    : "Revisa tamaños: el piso superior debe ser más pequeño que el inferior.";

  warnSizes.style.background = ok ? "rgba(201,162,77,.16)" : "rgba(255, 231, 231, .9)";
  warnSizes.style.borderColor = ok ? "rgba(201,162,77,.28)" : "rgba(215, 120, 120, .5)";
  warnSizes.style.color = ok ? "#6a521f" : "#7a2d2d";
}

function sumPorciones(){
  const n = Number(pisos.value) || 1;
  let min=0, max=0;
  const tiers = [Number(t1.value||0), Number(t2.value||0), Number(t3.value||0)];
  for(let i=1;i<=n;i++){
    const s = tiers[i-1];
    if(!s) continue;
    const [a,b] = getPorcionesRange(s);
    const f = isPisoAlto(i) ? 2 : 1;
    min += a*f; max += b*f;
  }
  return [min, max];
}

function tieneLacteos(){
  // Bizcocho: se toma del sabor seleccionado (no existe "bizcocho base" separado)
  const n = Number(pisos.value) || 1;
  const b1 = getSaborPiso(1);
  const b2 = n>=2 ? getSaborPiso(2) : "";
  const b3 = n===3 ? getSaborPiso(3) : "";

  if ([b1,b2,b3].includes("Red Velvet")) return true;

  // Rellenos
  const r1 = getRellenoPiso(1);
  const r2 = n>=2 ? getRellenoPiso(2) : "";
  const r3 = n===3 ? getRellenoPiso(3) : "";

  const lactList = ["Dulce de leche vaca","Yogurt griego con queso crema"];
  if (lactList.includes(r1) || lactList.includes(r2) || lactList.includes(r3)) return true;

  // Cobertura
  if (lactList.includes(cobertura.value)) return true;

  return false;
}
function actualizarBadges(){
  const lact = tieneLacteos();
  lacteoBadge.textContent = lact ? "Con Lácteos" : "Sin Lácteos";
  lacteoBadge.classList.toggle("warn", lact);
}

/* Regla tamaños */
function enforceSizeRules(){
  const n = Number(pisos.value) || 1;
  if(n === 1) return;

  const s1 = Number(t1.value);
  if(n >= 2){
    const allowedT2 = [12,9,8,7,6].filter(v=>v < s1);
    const currentT2 = Number(t2.value);
    const pick2 = allowedT2.includes(currentT2) ? currentT2 : (allowedT2[0] || 6);
    fillSelectWithSizes(t2, allowedT2.length ? allowedT2 : [6], pick2);
  }

  if(n === 3){
    const s2 = Number(t2.value);
    const allowedT3 = [12,9,8,7,6].filter(v=>v < s2);
    const currentT3 = Number(t3.value);
    const pick3 = allowedT3.includes(currentT3) ? currentT3 : (allowedT3[0] || 6);
    fillSelectWithSizes(t3, allowedT3.length ? allowedT3 : [6], pick3);
  }
}

/* ===========================
   CALC TOTALS (sin desglose en UI)
   =========================== */
function calcularTotales(){
  const n = Number(pisos.value) || 1;
  const sizes = getSizesArray();

  let totalBase = 0;
  sizes.forEach(s=> totalBase += getBasePrice(s));

  let extraHarina = 0;
  if (harina.value === "Almendra"){
    sizes.forEach(s => extraHarina += Number(harinaAlmendra[s] || 0));
  }


// relleno por piso (si mismoRelleno, devuelve igual)
  let extraRelleno = 0;
  if(n === 1){
    extraRelleno += getExtraCost(costos, sizes[0], getRellenoPiso(1));
  }else{
    sizes.forEach((s, idx)=>{
      const piso = idx+1;
      extraRelleno += getExtraCost(costos, s, getRellenoPiso(piso));
    });
  }

  let extraCobertura = 0;
  sizes.forEach(s=>{
    extraCobertura += getExtraCost(costos, s, cobertura.value);
  });

  let extraDecor = 0;
  const largest = sizes.length ? Math.max(...sizes) : 0;
  if (decoracion.value && largest){
    extraDecor = Number((decoracionCostos[decoracion.value] || {})[largest] || 0);
  }

  const manoObra = manoDeObraPorPisos(n);
  const adicional = Number(montoAdicional.value || 0);

  const cakeBaseTotal = totalBase + extraHarina + extraRelleno + extraCobertura + extraDecor + manoObra + adicional;

  // altura factor
  const totalCake = cakeBaseTotal * alturaPriceFactor();

  const del = Math.max(0, Number(deliveryMonto.value || 0));
  const totalGeneral = totalCake + del;

  return { totalCake, delivery: del, totalGeneral };
}


/* ===========================
   PAGO
   =========================== */
function getPagoData(){
  const m = (metodoPago && metodoPago.value) || "";
  const link = (linkPago && linkPago.value || "").trim();

  if(m === "yappy"){
    return {
      metodo:"Yappy",
      img:"img/logos/yappy.jpg",
      lines:[
        "Yappy: 6863-6913",
        "YAPPY PERSONAL – Titular: Ronny Colmenares"
      ],
      link:""
    };
  }
  if(m === "tarjeta"){
    return {
      metodo:"Pago con tarjeta",
      img:"img/logos/cuanto.png",
      lines:[
        "Pago con tarjeta (link de pago)"
      ],
      link: link
    };
  }
  if(m === "ach"){
    return {
      metodo:"Banco General (ACH Express)",
      img:"img/logos/ach.png",
      lines:[
        "Cuenta de Ahorros: 04-05-98-312161-7",
        "Titular: Ronny Colmenares",
        "Únicamente Tipo Express"
      ],
      link:""
    };
  }
  return { metodo:"—", img:"", lines:["METODOS DE PAGO CAKEFIT."], link:"" };
}

function updatePagoUI(){
  const data = getPagoData();

  // toggle link input
  const showLink = (metodoPago.value === "tarjeta");
  if(linkPago){ linkPago.style.display = showLink ? "" : "none"; }
  if(linkPagoLabel){ linkPagoLabel.style.display = showLink ? "" : "none"; }
  if(linkPagoHelp){ linkPagoHelp.style.display = showLink ? "" : "none"; }

  // render info
  if(!payInfo) return;
  const imgHtml = data.img ? `<img class="payImg" src="${data.img}" alt="Pago">` : "";
  const linesHtml = data.lines.map(t=>`<div class="line">${escapeHtml(t)}</div>`).join("");
  const linkHtml = (data.metodo === "Pago con tarjeta")
    ? `<div class="line"><b>Link:</b> ${escapeHtml(data.link || "Pendiente")}</div>`
    : "";
  const important = `
    <div class="line" style="margin-top:10px;color:#7a1111;font-weight:900;">IMPORTANTE</div>
    <div style="margin-top:6px;">
      <div>• El pago debe ser completo</div>
      <div>• El pedido será procesado al recibir el comprobante</div>
      <div style="margin-top:6px;">NO REALIZAMOS DEDICATORIAS</div>
    </div>
  `;

  payInfo.innerHTML = `
    <div class="payInfoRow">
      ${imgHtml}
      <div class="payText">
        <b>${escapeHtml(data.metodo)}</b>
        ${linesHtml}
        ${linkHtml}
        ${important}
      </div>
    </div>
  `;

  const right = document.getElementById("payInfoRight");
  if(right) right.innerHTML = payInfo.innerHTML;
}

/* ===========================
   PREVIEW UPDATE
   =========================== */
function updatePreview(){
  syncPisosUI();
  validarTamaños();
  actualizarBadges();
  setCakeColorsByCobertura();

  const nPisos = Number(pisos.value) || 1;
  capasTxt.textContent = String(capasPorPiso());

  const h1 = heightByAltura(1);
  const h2 = heightByAltura(2);
  const h3 = heightByAltura(3);

  const s1 = Number(t1.value || 0);
  const s2 = Number(t2.value || 0);
  const s3 = Number(t3.value || 0);

  const w1 = s1 ? sizeToWidth(s1) : 240;
  const w2 = s2 ? sizeToWidth(s2) : 210;
  const w3 = s3 ? sizeToWidth(s3) : 190;

  if(nPisos >= 1){
    tier1El.style.width = w1 + "px";
    tier1El.style.height = h1 + "px";
    applyStyleToTier(tier1El);
    label1.textContent = s1 ? `${s1}”` : "—";
    flav1.textContent = getSaborPiso(1) || "—";
  }
  if(nPisos >= 2){
    tier2El.style.width = w2 + "px";
    tier2El.style.height = h2 + "px";
    applyStyleToTier(tier2El);
    label2.textContent = s2 ? `${s2}”` : "—";
    flav2.textContent = getSaborPiso(2) || "—";
  }
  if(nPisos >= 3){
    tier3El.style.width = w3 + "px";
    tier3El.style.height = h3 + "px";
    applyStyleToTier(tier3El);
    label3.textContent = s3 ? `${s3}”` : "—";
    flav3.textContent = getSaborPiso(3) || "—";
  }

  const [min,max] = sumPorciones();
  porcionesTxt.textContent = `${min} a ${max} porciones`;

  const totals = calcularTotales();
  totalCakeEl.textContent = money(totals.totalCake);
  totalDeliveryEl.textContent = money(totals.delivery);
  totalGeneralEl.textContent = money(totals.totalGeneral);
  kpiTotal.textContent = money(totals.totalGeneral);

  const sizesArr = getSizesArray();
  const sizesTxt = sizesArr.length ? sizesArr.map(s=>`${s}”`).join(" / ") : "—";

  const styleTxt =
    (acabadoCake.value === "liso") ? "Liso" :
    (acabadoCake.value === "naked") ? "Naked" : "Semi-Naked";

  previewMeta.textContent = `${nPisos} piso${nPisos>1?"s":""} · Evento: ${evento.value} · Capas: ${capasPorPiso()} · Estilo: ${styleTxt} · Entrega: ${fmtEntrega(fechaHora && fechaHora.value)}`;
  // Vista previa debajo del 3D (sin texto largo)
const decoTxt = decoracion.value ? (decoracionLabels[decoracion.value]||decoracion.value) : "Sin decoración";

const rows = [];
rows.push(["Entrega: ", fmtEntrega(fechaHora && fechaHora.value)]);
rows.push(["Tamaños: ", sizesTxt]);
rows.push(["Rinde: ", porcionesTxt.textContent]);

// Bizcochos
rows.push(["PISO 1: ", getSaborPiso(1) || "—"]);
if(nPisos>=2) rows.push(["PISO 2: ", getSaborPiso(2) || "—"]);
if(nPisos===3) rows.push(["PISO 3: ", getSaborPiso(3) || "—"]);

// Rellenos
rows.push(["Relleno 1:  ", getRellenoPiso(1) || "Sin relleno"]);
if(nPisos>=2) rows.push(["Relleno 2: ", getRellenoPiso(2) || "Sin relleno"]);
if(nPisos===3) rows.push(["Relleno 3: ", getRellenoPiso(3) || "Sin relleno"]);

rows.push(["Cobertura: ", cobertura.value || "Sencilla"]);

// Pago
const pago = getPagoData();
rows.push(["Pago: ", pago.metodo || "—"]);
if(pago.metodo === "Pago con tarjeta") rows.push(["Link de pago", pago.link || "Pendiente"]); 
rows.push(["Decoración: ", decoTxt]);
rows.push(["Estilo: ", styleTxt]);

if(tema.value.trim()) rows.push(["Tema", tema.value.trim()]);

const notaSab = (nPisos===1 ? (notaSabores2.value||"") : (notaSabores.value||"")).trim();
const notaR = (notaRelleno.value||"").trim();
const notaG = (notaGeneral.value||"").trim();

if(notaSab) rows.push(["Nota sabores", notaSab]);
if(notaR) rows.push(["Nota rellenos", notaR]);
if(notaG) rows.push(["Nota general", notaG]);

legend.innerHTML = rows.map(([k,v]) =>
  `<div class="lgRow"><span>${escapeHtml(k)}</span><b>${escapeHtml(String(v||"—"))}</b></div>`
).join("");
  updatePagoUI();
  validateAnticipacion();
}

/* ===========================
   INIT
   =========================== */
function initSizesByPisos(){
  const n = Number(pisos.value) || 1;
  if(n === 1){
    fillSelectWithSizes(t1, [12,9,8,7,6], 8);
  }else if(n === 2){
    fillSelectWithSizes(t1, [12,9,8,7,6], 9);
    fillSelectWithSizes(t2, [9,8,7,6], 7);
  }else{
    fillSelectWithSizes(t1, [12,9,8,7,6], 9);
    fillSelectWithSizes(t2, [9,8,7,6], 7);
    fillSelectWithSizes(t3, [8,7,6], 6);
  }
}
function initSabores(){
  fillSabores(sabor1);
  fillSabores(sabor2);
  fillSabores(sabor3);
  fillSabores(saborUnico);

  sabor1.value = "Vainilla";
  sabor2.value = "Vainilla";
  sabor3.value = "Vainilla";
  saborUnico.value = "Vainilla";
}
function initBizcocho(){
  if(!bizcocho) return;
  fillBizcocho();
  bizcocho.value = "Vainilla";
}
function initRellenosCobertura(){
  fillGroupedSelect(relleno1, rellenoOptions);
  fillGroupedSelect(relleno2, rellenoOptions);
  fillGroupedSelect(relleno3, rellenoOptions);
  fillGroupedSelect(cobertura, coberturaOptions);

  relleno1.value = "Sin relleno";
  relleno2.value = "Sin relleno";
  relleno3.value = "Sin relleno";
  cobertura.value = "Sencilla";
}

// Inicializa cards de decoración
initDecoracionCards();

refImg.addEventListener("change", ()=>{
  const file = refImg.files && refImg.files[0];
  refImageDataUrl = "";
  refPreview.innerHTML = "Vista previa";
  if(!file){ setReviewMode(false); updatePreview(); return; }

  const reader = new FileReader();
  reader.onload = ()=>{
    refImageDataUrl = String(reader.result || "");
    setReviewMode(true);
    const img = document.createElement("img");
    img.src = refImageDataUrl;
    refPreview.innerHTML = "";
    refPreview.appendChild(img);
    if(fechaHora){ fechaHora.addEventListener("input", updatePreview); fechaHora.addEventListener("change", updatePreview); }

if(metodoPago){ metodoPago.addEventListener("change", updatePreview); metodoPago.addEventListener("input", updatePreview); }
if(linkPago){ linkPago.addEventListener("input", updatePreview); linkPago.addEventListener("change", updatePreview); }

updatePreview();
  };
  reader.readAsDataURL(file);
});

/* Modal refs: imágenes en /img/modelos o /img/modelo (modelo1..modelo20)
   - Muestra un menú/galería
   - Al seleccionar: queda como vista previa + se usa en PDF
   - Mantiene opción de subir (si subes, reemplaza la selección)
   NOTA: Antes se validaba con fetch(HEAD). En algunos entornos (ej: abriendo el HTML como archivo)
   eso falla y por eso “no se ven”. Ahora usamos fallback con onerror (más compatible). */
const MODEL_COUNT = 20;

const BASE_CANDIDATES = [
  "../img/modelos/", "../img/modelo/",
  "img/modelos/", "img/modelo/"
];
const EXT_CANDIDATES = ["png","jpg","jpeg","webp"];

// Placeholder si no existe
function missingSvg(name){
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
      <rect width='100%' height='100%' fill='#f4faf7'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-family='Arial' font-size='22' fill='#5b6b62'>${name} no encontrado</text>
    </svg>`
  );
}

function buildCandidates(n){
  const out = [];
  for(const base of BASE_CANDIDATES){
    for(const ext of EXT_CANDIDATES){
      out.push(`${base}modelo${n}.${ext}`);
    }
  }
  return out;
}

// Aplica src con fallback automático (si falla, prueba la siguiente ruta/ext)
function applySrcWithFallback(imgEl, n){
  const candidates = buildCandidates(n);
  let k = 0;

  const tryNext = ()=>{
    if(k >= candidates.length){
      imgEl.dataset.ok = "0";
      imgEl.dataset.url = "";
      imgEl.src = missingSvg(`modelo${n}`);
      imgEl.closest?.(".thumb")?.classList.add("missing");
      return;
    }
    const u = candidates[k];
    imgEl.dataset.url = u;
    imgEl.dataset.ok = "1";
    imgEl.src = u;
    k++;
  };

  imgEl.onerror = tryNext;
  imgEl.onload = ()=>{
    // guarda la que realmente cargó
    imgEl.dataset.ok = "1";
    imgEl.dataset.url = imgEl.currentSrc || imgEl.src;
  };

  tryNext();
}

// Cache/preload: para que al abrir estén más rápidas
let refsPreloadingStarted = false;
function preloadReferenceImages(){
  if(refsPreloadingStarted) return;
  refsPreloadingStarted = true;

  for(let i=1;i<=MODEL_COUNT;i++){
    const im = new Image();
    im.decoding = "async";
    im.loading = "eager";
    applySrcWithFallback(im, i);
  }
}

// Convierte a dataURL: intenta por fetch; si falla (file://, CORS), cae a canvas
async function toDataURLSmart(url, loadedImgEl){
  try{
    return await toDataURL(url);
  }catch(_e){
    // Fallback por canvas
    if(!loadedImgEl || !loadedImgEl.naturalWidth) throw _e;
    const c = document.createElement("canvas");
    c.width = loadedImgEl.naturalWidth;
    c.height = loadedImgEl.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(loadedImgEl, 0, 0);
    return c.toDataURL("image/png");
  }
}

async function openRefs(){
  refsGallery.innerHTML = "";
  refsOverlay.style.display = "flex";
  refsOverlay.classList.add("show");

  preloadReferenceImages();

  for(let i=1;i<=MODEL_COUNT;i++){
    const div = document.createElement("div");
    div.className = "thumb";

    const img = document.createElement("img");
    img.alt = `modelo${i}`;
    img.loading = "lazy";

    const cap = document.createElement("div");
    cap.className = "cap";
    cap.textContent = `modelo${i}`;

    applySrcWithFallback(img, i);

    div.addEventListener("click", async ()=>{
      // si no existe, no hacemos nada
      if(img.dataset.ok !== "1" || !img.dataset.url) return;

      try{
        const chosenUrl = img.dataset.url;

        // si el usuario selecciona un modelo, limpiamos el input de archivo
        refImg.value = "";

        // vista previa inmediata (URL)
        refPreview.innerHTML = "";
        const p = document.createElement("img");
        p.src = chosenUrl;
        p.alt = `modelo${i}`;
        refPreview.appendChild(p);

        // convertir a DataURL para que jsPDF lo pueda incrustar en el PDF
        refImageDataUrl = await toDataURLSmart(chosenUrl, img);
        setReviewMode(true);

        // etiqueta en notas
        const prev = (notaGeneral.value || "").trim();
        const tag = `Referencia: modelo${i}`;
        notaGeneral.value = prev ? (prev + " | " + tag) : tag;

        closeRefs();
        updatePreview();
      }catch(e){
        alert("No se pudo cargar la imagen seleccionada. Revisa la ruta /img/modelo/ y el nombre modelo"+i);
      }
    });

    div.appendChild(img);
    div.appendChild(cap);
    refsGallery.appendChild(div);
  }
}
function closeRefs(){
  refsOverlay.classList.remove("show");
  refsOverlay.style.display = "none";
}

btnRefs.addEventListener("click", ()=>{ openRefs(); });
  const btnRefsDeco = $("btnRefsDeco");
  if(btnRefsDeco) btnRefsDeco.addEventListener("click", ()=>{ openRefs(); });
refsClose.addEventListener("click", closeRefs);
refsOverlay.addEventListener("click", (e)=>{ if(e.target === refsOverlay) closeRefs(); });

/* listeners */
[
  cliente, clienteTel,
  evento, altura, acabadoCake,
  mismoSabor, sabor1, sabor2, sabor3, saborUnico, notaSabores, notaSabores2,
  mismoRelleno, relleno1, relleno2, relleno3, notaRelleno,
  harina, bizcocho, cobertura, decoracion, tema, notaGeneral,
  montoAdicional,
  delivery, deliveryMonto,
  metodoPago, linkPago
].forEach(el => { if(!el) return; el.addEventListener("input", ()=>{ enforceSizeRules(); updatePreview(); }); });


// ===== Fecha/Hora: horario 9:00–20:00 cada 30 min + anticipación 24/48h =====
function pad2(x){ return String(x).padStart(2,"0"); }
function toLocalInputValue(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function roundUpTo30(d){
  const dd = new Date(d.getTime());
  const m = dd.getMinutes();
  const add = (m===0 || m===30) ? 0 : (m<30 ? (30-m) : (60-m));
  dd.setMinutes(m + add, 0, 0);
  return dd;
}
function clampToBusinessHours(d){
  const dd = new Date(d.getTime());
  const openH=9, openM=0, closeH=20, closeM=0;
  const h = dd.getHours(), m = dd.getMinutes();

  // Antes de apertura -> 09:00
  if(h < openH || (h===openH && m<openM)){
    dd.setHours(openH, openM, 0, 0);
    return dd;
  }
  // Después de cierre -> siguiente día 09:00
  if(h > closeH || (h===closeH && m>closeM)){
    dd.setDate(dd.getDate()+1);
    dd.setHours(openH, openM, 0, 0);
    return dd;
  }
  return dd;
}
function normalizeToRules(d){
  // 1) redondear a 30 min
  let x = roundUpTo30(d);
  // 2) horario laboral
  x = clampToBusinessHours(x);
  // 3) si al clamplear cayó en minutos no válidos, re-redondear
  x = roundUpTo30(x);
  // 4) asegurar horario nuevamente (por si redondeo empujó > 20:00)
  x = clampToBusinessHours(x);
  return x;
}
function computeMinDateTime(){
  const req = requiredHours();
  const now = new Date();
  const min = new Date(now.getTime() + req*60*60*1000);
  return normalizeToRules(min);
}
function initDateTimeRules(){
  if(!fechaHora) return;
  // step 30 minutos
  fechaHora.step = "1800";
  // min dinámico por pisos
  const min = computeMinDateTime();
  fechaHora.min = toLocalInputValue(min);

  // si ya hay valor, normalizar (pero no forzar si está vacío)
  if(fechaHora.value){
    const sel = new Date(fechaHora.value);
    if(!isNaN(sel.getTime())){
      const norm = normalizeToRules(sel);
      fechaHora.value = toLocalInputValue(norm);
    }
  }

  // listeners
  const onDtChange = ()=>{
    // recalcular min
    const min2 = computeMinDateTime();
    fechaHora.min = toLocalInputValue(min2);

    if(fechaHora.value){
      const sel = new Date(fechaHora.value);
      if(!isNaN(sel.getTime())){
        const norm = normalizeToRules(sel);
        // no bajar la hora si el usuario eligió una válida; solo normaliza minutos/horario
        fechaHora.value = toLocalInputValue(norm);
      }
    }
    updatePreview();
  };
  fechaHora.addEventListener("change", onDtChange);
  fechaHora.addEventListener("input", onDtChange);
}

if(fechaHora){ initDateTimeRules(); }

pisos.addEventListener("change", ()=>{
  initSizesByPisos();
  syncPisosUI();
  enforceSizeRules();
  if(fechaHora){ initDateTimeRules(); }
  updatePreview();
});

[t1, t2, t3].forEach(el => el.addEventListener("change", ()=>{
  enforceSizeRules();
  updatePreview();
}));

initSizesByPisos();
initSabores();
initBizcocho();
initRellenosCobertura();
syncPisosUI();
enforceSizeRules();
renderPalette();
// Precarga imágenes de referencia en segundo plano
preloadReferenceImages();
updatePreview();
