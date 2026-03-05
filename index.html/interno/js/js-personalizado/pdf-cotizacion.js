async function toDataURL(url){
  const res = await fetch(url, {cache:"no-store"});
  if(!res.ok) throw new Error("No se pudo cargar: " + url);
  const blob = await res.blob();
  return await new Promise((resolve)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
function pickImageTypeFromDataUrl(dataUrl){
  const m = String(dataUrl||"").match(/^data:image\/(png|jpeg|jpg);/i);
  if(!m) return "PNG";
  const t = m[1].toLowerCase();
  return (t === "jpeg" || t === "jpg") ? "JPEG" : "PNG";
}

function estiloTxt(){
  if(acabadoCake.value === "naked") return "Naked";
  if(acabadoCake.value === "seminaked") return "Semi-Naked";
  return "Liso";
}

function buildFlavorsPdfLines(){
  const n = Number(pisos.value) || 1;
  if(n === 1){
    return [
      `Bizcocho: ${safeText(saborUnico.value)}`,
      `Relleno: ${safeText(relleno1.value, "Sin relleno")}`,
      `Cobertura: ${safeText(cobertura.value, "Sencilla")}`
    ];
  }
  return [
    `Bizcocho P1: ${safeText(getSaborPiso(1))}`,
    `Bizcocho P2: ${safeText(getSaborPiso(2))}`,
    ...(n===3 ? [`Bizcocho P3: ${safeText(getSaborPiso(3))}`] : []),
    `Relleno P1: ${safeText(getRellenoPiso(1), "Sin relleno")}`,
    `Relleno P2: ${safeText(getRellenoPiso(2), "Sin relleno")}`,
    ...(n===3 ? [`Relleno P3: ${safeText(getRellenoPiso(3), "Sin relleno")}`] : []),
    `Cobertura: ${safeText(cobertura.value, "Sencilla")}`,
  ];
}

document.getElementById("btnPDF").addEventListener("click", async ()=>{
  const n = Number(pisos.value) || 1;
  const sizesArr = getSizesArray();
  if(!sizesArr.length){
    alert("Selecciona tamaños para generar el PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"a4"});

  const pageW = 210;
  const pageH = 297;
  const margen = 14;

  const verde = [47,125,87];
  const dorado = [201,162,77];
  const gris = [90,105,98];
  const negro = [20,20,20];

  const totals = calcularTotales();
  const [pMin, pMax] = sumPorciones();
  const rinde = `${pMin} a ${pMax} porciones`;

  const sizesTxt = sizesArr.map(s=>`${s}”`).join(" / ");
  const fecha = new Date().toLocaleDateString("es-PA", {year:"numeric", month:"2-digit", day:"2-digit"});

  const nombreC = safeText(cliente.value, "Cliente");
  const telC = safeText(clienteTel.value, "—");

  // HEADER “factura”
  doc.setFillColor(...verde);
  doc.rect(0,0,pageW,28,"F");

  try{
    const logoData = await (async ()=>{
      const tries = ["../img/logo.png","../img/logo.jpg","img/logo.png","img/logo.jpg"];
      for(const u of tries){ try{ return await toDataURL(u); }catch(e){} }
      throw new Error("logo");
    })();
    doc.addImage(logoData, "PNG", margen, 4, 20, 20);
  }catch(e){}

  doc.setFont("helvetica","bold");
  doc.setFontSize(14);
  doc.setTextColor(255,255,255);
  doc.text("COTIZACIÓN", pageW/2, 12, {align:"center"});

  doc.setFont("helvetica","normal");
  doc.setFontSize(10);
  doc.text("CAKE FIT", pageW/2, 20, {align:"center"});

  // Caja info superior (como factura)
  let y = 34;
  doc.setDrawColor(220,220,220);
  doc.roundedRect(margen, y, pageW-margen*2, 28, 3, 3, "S");

  doc.setFont("helvetica","bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...gris);
  doc.text("Cliente:", margen+4, y+8);
  doc.text("Teléfono:", margen+4, y+16);
  doc.text("Fecha:", pageW/2 + 6, y+8);
  doc.text("Tipo:", pageW/2 + 6, y+16);

  doc.setFont("helvetica","normal");
  doc.setTextColor(...negro);
  doc.text(nombreC, margen+25, y+8, {maxWidth: 80});
  doc.text(telC, margen+25, y+16, {maxWidth: 80});
  const entregaTxt = fmtEntrega(fechaHora && fechaHora.value);
  doc.text(`Entrega: ${entregaTxt}`, margen+25, y+23, {maxWidth: 95});
  doc.text(fecha, pageW/2 + 22, y+8);
  doc.text(`Cake ${n} piso${n>1?"s":""}`, pageW/2 + 22, y+16);

  // Detalles (col izquierda)
  y = 72;
  doc.setFont("helvetica","bold");
  doc.setFontSize(11);
  doc.setTextColor(...verde);
  doc.text("Detalles del pedido", margen, y);

  y += 6;
  doc.setDrawColor(225,225,225);
  doc.line(margen, y, pageW-margen, y);

  y += 6;
  doc.setFont("helvetica","normal");
  doc.setFontSize(10);
  doc.setTextColor(...negro);

  const details = [
    ["Evento", safeText(evento.value)],
    ["Tamaños", safeText(sizesTxt)],
    ["Rinde aprox.", rinde],
    ["Altura", safeText(altura.options[altura.selectedIndex].text)],
    ["Capas por piso", `${capasPorPiso()} bizcochos`],
    ["Estilo", estiloTxt()],
    ["Harina", safeText(harina.value)],
    ["Bizcocho", safeText(getBaseSabor())],
    ["Decoración", decoracion.value ? (decoracionLabels[decoracion.value]||decoracion.value) : "Sin decoración"],
    ["Tema", safeText(tema.value, "—")],
    ["Nota general", safeText(notaGeneral.value, "—")]
  ];

  let leftX = margen;
  let leftY = y;
  const rowH = 6.2;

  details.forEach(([k,v])=>{
    doc.setTextColor(...gris);
    doc.setFont("helvetica","bold");
    doc.text(`${k}:`, leftX, leftY);
    doc.setTextColor(...negro);
    doc.setFont("helvetica","normal");
    doc.text(String(v), leftX+40, leftY, {maxWidth: 86});
    leftY += rowH;
  });

  // Sabores + Foto pequeña (lado derecho)
  const boxX = pageW - margen - 78;
  const boxY = 68;
  const boxW = 78;
  const boxH = 86;

  doc.setDrawColor(220,220,220);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "S");

  doc.setFont("helvetica","bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...verde);
  doc.text("Sabores", boxX+4, boxY+8);

  doc.setFont("helvetica","normal");
  doc.setFontSize(9.2);
  doc.setTextColor(...negro);

  const lines = buildFlavorsPdfLines();
  let ly = boxY+16;
  const maxW = boxW - 8;

  lines.forEach((l)=>{
    const wrapped = doc.splitTextToSize(l, maxW);
    doc.text(wrapped, boxX+4, ly);
    ly += (wrapped.length * 4.2) + 1.2;
  });

  // Foto pequeña a la derecha/abajo dentro del box
  const imgAreaY = boxY + boxH - 30;
  const imgAreaX = boxX + boxW - 30;
  const imgSize = 30;

  if(refImageDataUrl){
    try{
      const imgType = pickImageTypeFromDataUrl(refImageDataUrl);
      doc.setDrawColor(225,225,225);
      doc.roundedRect(imgAreaX, imgAreaY, imgSize, imgSize, 2, 2, "S");
      doc.addImage(refImageDataUrl, imgType, imgAreaX+1, imgAreaY+1, imgSize-2, imgSize-2, undefined, "FAST");
    }catch(e){}
  }else{
    doc.setTextColor(...gris);
    doc.setFontSize(8.5);
    doc.text("Sin foto", imgAreaX+6, imgAreaY+16);
  }

  // Características (sin gluten/azúcar/lácteos)
  let yCar = Math.max(leftY, boxY + boxH) + 10;
  doc.setFont("helvetica","bold");
  doc.setFontSize(11);
  doc.setTextColor(...verde);
  doc.text("Características", margen, yCar);

  yCar += 6;
  doc.setDrawColor(225,225,225);
  doc.line(margen, yCar, pageW-margen, yCar);
  yCar += 7;

  doc.setFont("helvetica","normal");
  doc.setFontSize(10);
  doc.setTextColor(...negro);
  const sinLact = tieneLacteos() ? "Sin" : "Contiene";
  doc.text(`- Sin Gluten`, margen, yCar); yCar += 6;
  doc.text(`- Sin Azúcar`, margen, yCar); yCar += 6;
  doc.text(`- ${sinLact} Lácteos: `, margen, yCar); yCar += 6;
// Totales (SOLO)
let yTot = yCar + 8;

// Fondo verde (base)
doc.setFillColor(...verde);
doc.roundedRect(margen, yTot, pageW - margen*2, 28, 6, 6, "F");

// Textos dentro del verde
doc.setTextColor(255,255,255);
doc.setFont("helvetica","bold");
doc.setFontSize(11);

doc.text("TOTAL DEL CAKE", margen+10, yTot+11);
doc.text(`$${money(totals.totalCake)}`, pageW-margen-10, yTot+11, {align:"right"});

doc.text("DELIVERY", margen+10, yTot+22);
doc.text(`$${money(totals.delivery)}`, pageW-margen-10, yTot+22, {align:"right"});

// Bloque dorado arriba (para TOTAL GENERAL)
doc.setFillColor(...dorado);
doc.roundedRect(margen, yTot-12, pageW - margen*2, 18, 6, 6, "F");

// Texto dentro del dorado (NO abajo)
doc.setTextColor(30,25,16);
doc.setFont("helvetica","bold");
doc.setFontSize(12);
doc.text("TOTAL GENERAL", margen+10, yTot-2);

doc.setFontSize(16);
doc.text(`$${money(totals.totalGeneral)}`, pageW-margen-10, yTot-2, {align:"right"});

// Avanza el cursor para que lo de pago salga debajo sin montarse
yCar = yTot + 35;

  // Pago (según selección)
  const pago = getPagoData();
  const yPay = pageH - 42;
  doc.setDrawColor(220,220,220);
  doc.line(margen, yPay-10, pageW-margen, yPay-10);

  doc.setFont("helvetica","bold");
  doc.setFontSize(10);
  doc.setTextColor(...verde);
  doc.text("MÉTODO DE PAGO", margen, yPay);

  // Icono (si existe)
  try{
    const payIcon = pago.img ? await toDataURL(pago.img) : null;
    if(payIcon){
      const t = pickImageTypeFromDataUrl(payIcon);
      doc.addImage(payIcon, t, pageW-margen-16, yPay-6, 12, 12, undefined, "FAST");
    }
  }catch(e){}

  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  doc.setTextColor(...gris);

  let py = yPay + 6;
  doc.text(`${pago.metodo}`, margen, py); py += 5;
  (pago.lines || []).forEach((ln)=>{
    doc.text(String(ln), margen, py, {maxWidth: pageW-margen*2}); py += 4.8;
  });
  if(pago.metodo === "Pago con tarjeta"){
    doc.setTextColor(...negro);
    doc.text(`Link: ${pago.link || "Pendiente"}`, margen, py, {maxWidth: pageW-margen*2}); py += 5.2;
    doc.setTextColor(...gris);
  }

  // Importante
  doc.setTextColor(122,17,17);
  doc.setFont("helvetica","bold");
  doc.text("IMPORTANTE:", margen+80, yPay);
  doc.setFont("helvetica","normal");
  doc.setTextColor(...gris);
  doc.text("Pago completo · Procesamos al recibir comprobante · No realizamos dedicatorias", margen+80, yPay+6, {maxWidth: (pageW-margen) - (margen+80)});

  doc.save("CakeFit_"+cliente.value+".pdf");
});
// ===== PDF tipo factura 80mm (térmico) =====
document.getElementById("btnPDF80").addEventListener("click", async ()=>{
  const n = Number(pisos.value) || 1;
  const sizesArr = getSizesArray();
  if(!sizesArr.length){
    alert("Selecciona tamaños para generar el PDF 80mm.");
    return;
  }

  const { jsPDF } = window.jspdf;
  // 80mm de ancho. Altura suficiente para ticket (se puede recortar en impresora)
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:[80, 280]});

  const margenX = 4;
  let y = 6;

  const totals = calcularTotales();
  const [pMin, pMax] = sumPorciones();
  const rindeTxt = `${pMin} a ${pMax} porciones`;
  const sizesTxt = sizesArr.map(s=>`${s}”`).join(" / ");
  const entregaTxt = fmtEntrega(fechaHora && fechaHora.value);

  // Header
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.text("CAKE FIT", 40, y, {align:"center"}); y += 6;

  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  doc.text("Cotización / Factura", 40, y, {align:"center"}); y += 5;

  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(margenX, y, 80-margenX, y); y += 4;

  const line = (k,v)=>{
    doc.setFont("helvetica","bold"); doc.text(k, margenX, y);
    doc.setFont("helvetica","normal"); doc.text(String(v||"—"), 80-margenX, y, {align:"right"});
    y += 4.5;
  };

  line("Cliente", safeText(cliente.value,"—"));
  line("Tel", safeText(clienteTel.value,"—"));
  line("Entrega", entregaTxt);
  line("Evento", safeText(evento.value,"—"));
  line("Pisos", String(n));
  line("Tamaños", sizesTxt);
  line("Rinde", rindeTxt);
  line("Altura", altura.options[altura.selectedIndex]?.text || "—");
  line("Estilo", estiloTxt());
  line("Harina", safeText(harina.value,"—"));
  line("Cobertura", safeText(cobertura.value,"Sencilla"));
  line("Decoración", decoracion.value ? (decoracionLabels[decoracion.value]||decoracion.value) : "Sin decoración");

  // Sabores / rellenos (compacto)
  y += 1;
  doc.line(margenX, y, 80-margenX, y); y += 4;
  doc.setFont("helvetica","bold"); doc.text("Sabores y rellenos", margenX, y); y += 4.5;
  doc.setFont("helvetica","normal");

  const lines = buildFlavorsPdfLines();
  lines.forEach((l)=>{
    const wrapped = doc.splitTextToSize(l, 80 - margenX*2);
    doc.text(wrapped, margenX, y);
    y += wrapped.length * 4.2;
  });

  // Totales
  y += 2;
  doc.line(margenX, y, 80-margenX, y); y += 4;

  doc.setFont("helvetica","bold");
  line("Total cake", `$${money(totals.totalCake)}`);
  line("Delivery", `$${money(totals.delivery)}`);

  doc.setFontSize(11);
  doc.setFont("helvetica","bold");
  doc.text("TOTAL", margenX, y);
  doc.text(`$${money(totals.totalGeneral)}`, 80-margenX, y, {align:"right"});
  y += 6;

  // Pago
  doc.setFontSize(9);
  doc.line(margenX, y, 80-margenX, y); y += 4;

  const pago = getPagoData();
  doc.setFont("helvetica","bold");
  doc.text("Método de pago", margenX, y); y += 4.5;
  doc.setFont("helvetica","normal");
  doc.text(pago.metodo || "—", margenX, y); y += 4.5;

  (pago.lines || []).forEach((ln)=>{
    const wrapped = doc.splitTextToSize(String(ln), 80 - margenX*2);
    doc.text(wrapped, margenX, y);
    y += wrapped.length * 4.2;
  });

  if(pago.metodo === "Pago con tarjeta"){
    const linkTxt = (pago.link || "").trim();
    const wrapped = doc.splitTextToSize(`Link: ${linkTxt || "Pendiente"}`, 80 - margenX*2);
    doc.text(wrapped, margenX, y);
    y += wrapped.length * 4.2;

    // QR en ticket 80mm (solo si hay link)
    if(linkTxt){
      y += 2;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(linkTxt)}`;
      const qrDataUrl = await fetchAsDataURL(qrUrl);
      if(qrDataUrl){
        const qrSize = 38;
        const x = (80 - qrSize) / 2;
        // si se va a salir, agrega página
        if(y + qrSize + 10 > 280){
          doc.addPage([80, 280], "portrait");
          y = 10;
        }
        doc.addImage(qrDataUrl, "PNG", x, y, qrSize, qrSize);
        y += qrSize + 4;
        doc.setFontSize(7);
        doc.setFont("helvetica","normal");
        const linkWrap = doc.splitTextToSize(linkTxt, 80 - margenX*2);
        doc.text(linkWrap, margenX, y);
        y += linkWrap.length * 3.6;
      }else{
        // Si falla el QR, al menos deja el link
        doc.setFontSize(8);
        const linkWrap = doc.splitTextToSize(linkTxt, 80 - margenX*2);
        doc.text(linkWrap, margenX, y);
        y += linkWrap.length * 4.0;
      }
      doc.setFontSize(9);
    }
  }

  y += 2;
  doc.setFont("helvetica","bold");
  doc.text("IMPORTANTE", margenX, y); y += 4.5;
  doc.setFont("helvetica","normal");
  const imp = "Pago completo. Procesamos al recibir comprobante. No realizamos dedicatorias.";
  doc.text(doc.splitTextToSize(imp, 80 - margenX*2), margenX, y);

  doc.save("Factura_80mm_CakeFit.pdf");
});


// ===== Inicializar selects en blanco (placeholders) =====
function ensurePlaceholder(sel, label){
  if(!sel) return;
  const first = sel.options && sel.options[0];
  if(first && first.value === "") { sel.value = ""; return; }
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = label || "Selecciona…";
  sel.insertBefore(opt, sel.firstChild);
  sel.value = "";
}
function initBlankSelections(){
  // Dejar todo en blanco para que el cliente seleccione
  ensurePlaceholder(pisos, "Selecciona pisos…");
  ensurePlaceholder(evento, "Selecciona evento…");
  ensurePlaceholder(t1, "Selecciona tamaño…");
  ensurePlaceholder(t2, "Selecciona tamaño…");
  ensurePlaceholder(t3, "Selecciona tamaño…");
  ensurePlaceholder(altura, "Selecciona altura…");
  ensurePlaceholder(acabadoCake, "Selecciona estilo…");
  ensurePlaceholder(harina, "Selecciona harina…");
  // Bizcocho base ya no se usa; si existe, lo dejamos en blanco
  if(bizcocho) ensurePlaceholder(bizcocho, "—");
  ensurePlaceholder(saborUnico, "Selecciona sabor…");
  ensurePlaceholder(sabor1, "Selecciona sabor…");
  ensurePlaceholder(sabor2, "Selecciona sabor…");
  ensurePlaceholder(sabor3, "Selecciona sabor…");
  ensurePlaceholder(relleno1, "Selecciona crema…");
  ensurePlaceholder(relleno2, "Selecciona crema…");
  ensurePlaceholder(relleno3, "Selecciona crema…");
  ensurePlaceholder(cobertura, "Selecciona cobertura…");
  ensurePlaceholder(decoracion, "Selecciona decoración…");
  // Pago
  ensurePlaceholder(metodoPago, "Selecciona método…");
  if(linkPago) linkPago.value = "";
  // Fecha/hora en blanco
  if(fechaHora) fechaHora.value = "";
}
// Inicializa en blanco al cargar
  setupSizePicker();
try{ initBlankSelections(); }catch(e){}

// ENVIAR CLIENTE: WhatsApp al número del cliente
document.getElementById("btnEnviarCliente").addEventListener("click", ()=>{
  const n = Number(pisos.value) || 1;
  const sizesArr = getSizesArray();
  const sizesTxt = sizesArr.map(s=>`${s}”`).join(" / ");
  const [pMin, pMax] = sumPorciones();
  const rindeTxt = `${pMin} a ${pMax} porciones`;
  const totals = calcularTotales();
  const nombreCliente = (cliente.value || "").trim() || "Cliente";
  const telCliente = (clienteTel.value || "").trim();
  const entregaTxt = fmtEntrega(fechaHora && fechaHora.value);
  const alturaTxt = altura.options[altura.selectedIndex].text;
  const styleTxt = estiloTxt();
  const decoTxt = decoracion.value ? (decoracionLabels[decoracion.value]||decoracion.value) : "Sin decoración";
  const notaSab = (n===1 ? (notaSabores2.value||"") : (notaSabores.value||"")).trim();
  const notaR = (notaRelleno.value||"").trim();
  const notaG = (notaGeneral.value||"").trim();
  const sinLact = tieneLacteos() ? "Sin" : "Contiene";
  let saboresMsg = "";
  if(n === 1){
    saboresMsg += `Bizcocho: ${safeText(saborUnico.value)}%0A`;
    saboresMsg += `Relleno: ${safeText(relleno1.value, "Sin relleno")}%0A`;
  }else{
    saboresMsg += `Bizcocho P1: ${safeText(getSaborPiso(1))}%0A`;
    saboresMsg += `Bizcocho P2: ${safeText(getSaborPiso(2))}%0A`;
    if(n===3) saboresMsg += `Bizcocho P3: ${safeText(getSaborPiso(3))}%0A`;
    saboresMsg += `%0A`;
    saboresMsg += `Relleno P1: ${safeText(getRellenoPiso(1), "Sin relleno")}%0A`;
    saboresMsg += `Relleno P2: ${safeText(getRellenoPiso(2), "Sin relleno")}%0A`;
    if(n===3) saboresMsg += `Relleno P3: ${safeText(getRellenoPiso(3), "Sin relleno")}%0A`;
  }
  const pago = getPagoData();
  const msg =
    `*COTIZACIÓN CAKE FIT*%0A%0A` +
    `*Cliente:* ${encodeURIComponent(nombreCliente)}%0A` +
    `*Teléfono:* ${encodeURIComponent(telCliente)}%0A` +
    `*Entrega:* ${encodeURIComponent(entregaTxt)}%0A%0A` +
    `*Evento:* ${encodeURIComponent(evento.value)}%0A` +
    `*Pisos:* ${n}%0A` +
    `*Tamaño:* ${encodeURIComponent(sizesTxt || "—")}%0A` +
    `*Altura:* ${encodeURIComponent(alturaTxt)}%0A` +
    `*Rinde aprox:* ${encodeURIComponent(rindeTxt)}%0A` +
    `*Estilo:* ${encodeURIComponent(styleTxt)}%0A` +
    `*Cobertura:* ${encodeURIComponent(cobertura.value || "Sencilla")}%0A` +
    `*Decoración:* ${encodeURIComponent(decoTxt)}%0A` +
    (tema.value.trim() ? `*Tema:* ${encodeURIComponent(tema.value.trim())}%0A` : ``) +
    `%0A` +
    `*Sabores y rellenos*%0A` +
    saboresMsg +
    (notaSab ? `%0A*Nota sabores:* ${encodeURIComponent(notaSab)}%0A` : ``) +
    (notaR ? `*Nota rellenos:* ${encodeURIComponent(notaR)}%0A` : ``) +
    (notaG ? `*Nota general:* ${encodeURIComponent(notaG)}%0A` : ``) +
    `%0A` +
    `*Características*%0A` +
    `Sin gluten: Sí%0A` +
    `Sin azúcar: Sí%0A` +
    `${encodeURIComponent(sinLact)} lácteos: %0A%0A` +
    `*Totales*%0A` +
    `*Total del cake:* $${money(totals.totalCake)}%0A` +
    `*Delivery:* $${money(totals.delivery)}%0A` +
    `*Total general:* $${money(totals.totalGeneral)}%0A%0A` +
    `*Método de pago:* ${encodeURIComponent(pago.metodo)}%0A` +
    (pago.metodo === "Pago con tarjeta"
      ? `*Link de pago:* ${encodeURIComponent(pago.link || "Pendiente")}%0A`
      : ``) +
    `%0A` +
    `Quedo atento para confirmar disponibilidad y fecha de entrega.`;
  // Solo si el número es válido
  let tel = telCliente.replace(/[^\d]/g, "");
  if(tel.length >= 8){
    window.open(`https://wa.me/507${tel}?text=${msg}`, "_blank");
  }else{
    alert("Número de cliente inválido.");
  }
});
/* ===========================
   WHATSAPP (sin emojis, con negritas + cliente + teléfono)
   =========================== */
document.getElementById("btnEnviar").addEventListener("click", ()=>{
  const n = Number(pisos.value) || 1;
  const sizesArr = getSizesArray();
  const sizesTxt = sizesArr.map(s=>`${s}”`).join(" / ");

  const [pMin, pMax] = sumPorciones();
  const rindeTxt = `${pMin} a ${pMax} porciones`;

  const totals = calcularTotales();

  const nombreCliente = (cliente.value || "").trim() || "Cliente";
  const telCliente = (clienteTel.value || "").trim() || "—";
  const entregaTxt = fmtEntrega(fechaHora && fechaHora.value);

  const alturaTxt = altura.options[altura.selectedIndex].text;
  const styleTxt = estiloTxt();
  const decoTxt = decoracion.value ? (decoracionLabels[decoracion.value]||decoracion.value) : "Sin decoración";

  const notaSab = (n===1 ? (notaSabores2.value||"") : (notaSabores.value||"")).trim();
  const notaR = (notaRelleno.value||"").trim();
  const notaG = (notaGeneral.value||"").trim();

  const sinLact = tieneLacteos() ? "Sin" : "Contiene";

  let saboresMsg = "";
  if(n === 1){
    saboresMsg += `Bizcocho: ${safeText(saborUnico.value)}%0A`;
    saboresMsg += `Relleno: ${safeText(relleno1.value, "Sin relleno")}%0A`;
  }else{
    saboresMsg += `Bizcocho P1: ${safeText(getSaborPiso(1))}%0A`;
    saboresMsg += `Bizcocho P2: ${safeText(getSaborPiso(2))}%0A`;
    if(n===3) saboresMsg += `Bizcocho P3: ${safeText(getSaborPiso(3))}%0A`;
    saboresMsg += `%0A`;
    saboresMsg += `Relleno P1: ${safeText(getRellenoPiso(1), "Sin relleno")}%0A`;
    saboresMsg += `Relleno P2: ${safeText(getRellenoPiso(2), "Sin relleno")}%0A`;
    if(n===3) saboresMsg += `Relleno P3: ${safeText(getRellenoPiso(3), "Sin relleno")}%0A`;
  }
const pago = getPagoData();

const msg =
  `*COTIZACIÓN CAKE FIT*%0A%0A` +
  `*Cliente:* ${encodeURIComponent(nombreCliente)}%0A` +
  `*Teléfono:* ${encodeURIComponent(telCliente)}%0A` +
  `*Entrega:* ${encodeURIComponent(entregaTxt)}%0A%0A` +
  `*Evento:* ${encodeURIComponent(evento.value)}%0A` +
  `*Pisos:* ${n}%0A` +
  `*Tamaño:* ${encodeURIComponent(sizesTxt || "—")}%0A` +
  `*Altura:* ${encodeURIComponent(alturaTxt)}%0A` +
  `*Rinde aprox:* ${encodeURIComponent(rindeTxt)}%0A` +
  `*Estilo:* ${encodeURIComponent(styleTxt)}%0A` +
  `*Cobertura:* ${encodeURIComponent(cobertura.value || "Sencilla")}%0A` +
  `*Decoración:* ${encodeURIComponent(decoTxt)}%0A` +
  (tema.value.trim() ? `*Tema:* ${encodeURIComponent(tema.value.trim())}%0A` : ``) +
  `%0A` +
  `*Sabores y rellenos*%0A` +
  saboresMsg +
  (notaSab ? `%0A*Nota sabores:* ${encodeURIComponent(notaSab)}%0A` : ``) +
  (notaR ? `*Nota rellenos:* ${encodeURIComponent(notaR)}%0A` : ``) +
  (notaG ? `*Nota general:* ${encodeURIComponent(notaG)}%0A` : ``) +
  `%0A` +
  `*Características*%0A` +
  `Sin gluten: Sí%0A` +
  `Sin azúcar: Sí%0A` +
  `${encodeURIComponent(sinLact)}%0A%0A lácteos: ` +
  `*Totales*%0A` +
  `*Total del cake:* $${money(totals.totalCake)}%0A` +
  `*Delivery:* $${money(totals.delivery)}%0A` +
  `*Total general:* $${money(totals.totalGeneral)}%0A%0A` +
  `*Método de pago:* ${encodeURIComponent(pago.metodo)}%0A` +
  (pago.metodo === "Pago con tarjeta"
    ? `*Link de pago:* ${encodeURIComponent(pago.link || "Pendiente")}%0A`
    : ``) +
  `%0A` +
  `Quedo atento para confirmar disponibilidad y fecha de entrega.`;

window.open(`https://wa.me/50768636913?text=${msg}`, "_blank");
});

// --- Helper: fetch image URL as DataURL (for QR PNG) ---
async function fetchAsDataURL(url){
  try{
    const res = await fetch(url, {mode:"cors", cache:"no-store"});
    if(!res.ok) throw new Error("HTTP "+res.status);
    const blob = await res.blob();
    return await new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onload = ()=> resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }catch(e){
    console.warn("QR fetch failed:", e);
    return null;
  }
}
