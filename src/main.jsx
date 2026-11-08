import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function MugPreview({ mug, designUrl, backgroundMode, backgroundColor, backgroundUrl, onSelect, selected }) {
  return <button className={`mug-card ${selected ? "selected" : ""}`} onClick={onSelect} title={`Seleccionar taza ${mug.id}`}>
    <div className="mug-scene" style={{
      background: backgroundMode === "color" ? backgroundColor : backgroundMode === "image" && backgroundUrl ? `center/cover url(${backgroundUrl})` : "linear-gradient(135deg,#f2f0eb,#d9d5ce)"
    }}>
      <div className="mug-shadow" />
      <div className="mug">
        <div className="mug-handle" />
        <div className="mug-body">
          <div className="mug-rim" />
          {designUrl && <div className="print-area">
            <img src={designUrl} alt="Diseño aplicado" />
          </div>}
          <div className="mug-gloss" />
          <div className="mug-base" />
        </div>
      </div>
    </div>
    <span className="mug-caption">TAZA {mug.id}</span>
  </button>;
}

function App() {
  const [mugs, setMugs] = useState([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const [selectedId, setSelectedId] = useState(1);
  const [designUrl, setDesignUrl] = useState("");
  const [designName, setDesignName] = useState("");
  const [backgroundMode, setBackgroundMode] = useState("studio");
  const [backgroundColor, setBackgroundColor] = useState("#e8e5df");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [splitCount, setSplitCount] = useState(1);
  const [fit, setFit] = useState("cover");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [exporting, setExporting] = useState(false);
  const designInput = useRef(null);
  const bgInput = useRef(null);

  const selectedMug = mugs.find(m => m.id === selectedId) || mugs[0];
  const addMug = () => {
    const next = Math.max(0, ...mugs.map(m => m.id)) + 1;
    setMugs(prev => [...prev, { id: next }]);
    setSelectedId(next);
  };
  const removeMug = () => {
    if (mugs.length <= 1) return;
    const next = mugs.filter(m => m.id !== selectedId);
    setMugs(next);
    setSelectedId(next[0].id);
  };
  const loadImage = (file, setter, nameSetter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
    if (nameSetter) nameSetter(file.name);
  };
  const visibleDesign = useMemo(() => {
    if (!designUrl) return "";
    return designUrl;
  }, [designUrl]);

  async function exportPNG() {
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      const cols = Math.min(3, mugs.length);
      const rows = Math.ceil(mugs.length / cols);
      const cellW = 1200, cellH = 900;
      canvas.width = cols * cellW; canvas.height = rows * cellH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = backgroundMode === "color" ? backgroundColor : "#eeeae3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (backgroundMode === "image" && backgroundUrl) {
        const bg = await imageFrom(backgroundUrl);
        for (let y=0; y<canvas.height; y+=cellH) for (let x=0; x<canvas.width; x+=cellW) ctx.drawImage(bg,x,y,cellW,cellH);
      }
      const art = designUrl ? await imageFrom(designUrl) : null;
      mugs.forEach((m, i) => {
        const x = (i % cols) * cellW, y = Math.floor(i / cols) * cellH;
        drawMug(ctx, x, y, cellW, cellH, art, i, mugs.length, splitCount, fit, zoom, rotation, brightness);
      });
      const a = document.createElement("a");
      a.download = "zafrik-mockup-tazas-pro.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (e) {
      alert("No se pudo exportar la imagen. Comprueba que los archivos cargados sean válidos.");
    } finally { setExporting(false); }
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-mark">Z<span>✳</span></div>
      <div className="brand-copy"><strong>ZAFRIK <em>STUDIO</em></strong><small>MOCKUP TAZAS PRO</small></div>
      <div className="top-spacer" />
      <span className="local-badge"><i /> PRO EDITOR</span>
    </header>

    <section className="intro">
      <div><p className="eyebrow">ESTUDIO DE PERSONALIZACIÓN</p><h1>Diseña. Distribuye.<br/><span>Impresiona.</span></h1>
      <p className="intro-text">Crea composiciones profesionales con una o varias tazas, prepara diseños panorámicos y personaliza el escenario.</p></div>
      <div className="intro-stat"><strong>{mugs.length}</strong><span>TAZAS EN ESCENA</span></div>
    </section>

    <div className="workspace">
      <aside className="panel controls">
        <div className="panel-heading"><div><span className="step">01</span><h2>Composición</h2></div><span className="subtle">ESCENA</span></div>
        <div className="control-block">
          <label>CANTIDAD DE TAZAS</label>
          <div className="quantity-row">
            <button className="icon-btn" onClick={removeMug} disabled={mugs.length <= 1}>−</button>
            <strong>{mugs.length}</strong>
            <button className="icon-btn plus" onClick={addMug}>+</button>
          </div>
          <div className="quick-counts">{[1,2,3,4,5,6].map(n => <button className={mugs.length===n?"active":""} key={n} onClick={()=>{setMugs(Array.from({length:n},(_,i)=>({id:i+1})));setSelectedId(1)}}>{n}</button>)}</div>
          <p className="hint">Usa + para agregar más tazas sin límite práctico.</p>
        </div>

        <div className="panel-heading separated"><div><span className="step">02</span><h2>Diseño</h2></div></div>
        <div className="control-block">
          <label>ARCHIVO DE IMPRESIÓN</label>
          <input ref={designInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>loadImage(e.target.files?.[0],setDesignUrl,setDesignName)} />
          <button className="upload-btn" onClick={()=>designInput.current?.click()}><span>＋</span><div><b>Subir diseño</b><small>PNG, JPG o WEBP</small></div></button>
          {designName && <p className="file-name">✓ {designName}</p>}
        </div>
        <div className="control-block">
          <label>DIVIDIR DISEÑO ENTRE</label>
          <select value={splitCount} onChange={e=>setSplitCount(Number(e.target.value))}>
            {Array.from({length:Math.max(8,mugs.length)},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {n===1?"taza":"tazas"}</option>)}
          </select>
          <p className="hint">La división panorámica se prepara como siguiente módulo; aquí puedes configurar el número de segmentos.</p>
        </div>
        <div className="control-block">
          <label>AJUSTE DEL DISEÑO</label>
          <select value={fit} onChange={e=>setFit(e.target.value)}><option value="cover">Rellenar área</option><option value="contain">Mostrar completo</option></select>
          <div className="range-label"><span>Zoom</span><b>{zoom}%</b></div>
          <input type="range" min="50" max="180" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/>
          <div className="range-label"><span>Rotación</span><b>{rotation}°</b></div>
          <input type="range" min="-30" max="30" value={rotation} onChange={e=>setRotation(Number(e.target.value))}/>
          <div className="range-label"><span>Brillo</span><b>{brightness}%</b></div>
          <input type="range" min="60" max="140" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/>
        </div>

        <div className="panel-heading separated"><div><span className="step">03</span><h2>Fondo</h2></div></div>
        <div className="control-block">
          <div className="segmented">
            <button className={backgroundMode==="studio"?"active":""} onClick={()=>setBackgroundMode("studio")}>Estudio</button>
            <button className={backgroundMode==="color"?"active":""} onClick={()=>setBackgroundMode("color")}>Color</button>
            <button className={backgroundMode==="image"?"active":""} onClick={()=>setBackgroundMode("image")}>Imagen</button>
          </div>
          {backgroundMode==="color" && <div className="color-line"><input type="color" value={backgroundColor} onChange={e=>setBackgroundColor(e.target.value)}/><span>{backgroundColor.toUpperCase()}</span></div>}
          {backgroundMode==="image" && <>
            <input ref={bgInput} type="file" accept="image/*" hidden onChange={e=>loadImage(e.target.files?.[0],setBackgroundUrl)}/>
            <button className="upload-btn compact" onClick={()=>bgInput.current?.click()}>＋ Subir imagen de fondo</button>
            {backgroundUrl && <button className="text-btn" onClick={()=>setBackgroundUrl("")}>Quitar imagen</button>}
          </>}
        </div>
      </aside>

      <section className="panel stage-panel">
        <div className="stage-header"><div><span className="step">VISTA PREVIA</span><h2>Tu composición</h2></div><span className="live-dot">EN VIVO</span></div>
        <div className="stage" style={{background:backgroundMode==="color"?backgroundColor:backgroundMode==="image"&&backgroundUrl?`center/cover url(${backgroundUrl})`:undefined}}>
          <div className="mug-grid" style={{gridTemplateColumns:`repeat(${Math.min(3,mugs.length)}, minmax(0,1fr))`}}>
            {mugs.map(m=><MugPreview key={m.id} mug={m} designUrl={visibleDesign} backgroundMode="studio" backgroundColor={backgroundColor} backgroundUrl="" selected={selectedId===m.id} onSelect={()=>setSelectedId(m.id)}/>)}
          </div>
          {!designUrl && <div className="empty-tip"><span>＋</span><b>Tu diseño aparecerá aquí</b><small>Sube una imagen para comenzar</small></div>}
        </div>
        <div className="stage-footer"><span>Seleccionada: <b>Taza {selectedId}</b></span><span>{mugs.length} unidades · Vista previa</span></div>
        <div className="export-row"><div><b>Exportación de composición</b><small>PNG · Alta resolución · Procesamiento local</small></div><button className="export-btn" onClick={exportPNG} disabled={exporting}>{exporting?"Preparando…":"↓ Exportar PNG"}</button></div>
      </section>
    </div>
    <footer>© ZAFRIK STUDIO · MOCKUP TAZAS PRO <span>CREATIVIDAD SIN LÍMITES</span></footer>
  </main>;
}

function imageFrom(src) {
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
}

function drawMug(ctx,x,y,w,h,art,index,total,splitCount,fit,zoom,rotation,brightness) {
  const cx=x+w/2, cy=y+h/2+20, mugW=440, mugH=390;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.13)";ctx.beginPath();ctx.ellipse(cx,cy+190,260,35,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#e6e4df";ctx.lineWidth=42;ctx.beginPath();ctx.ellipse(cx+245,cy+5,92,130,-Math.PI/2,Math.PI/2,Math.PI*1.5);ctx.stroke();
  const g=ctx.createLinearGradient(cx-mugW/2,0,cx+mugW/2,0);g.addColorStop(0,"#bdbdbb");g.addColorStop(.12,"#fff");g.addColorStop(.52,"#f7f7f5");g.addColorStop(.88,"#fff");g.addColorStop(1,"#b8b8b5");
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(cx-mugW/2,cy-mugH/2);ctx.quadraticCurveTo(cx,cy-mugH/2-18,cx+mugW/2,cy-mugH/2);ctx.lineTo(cx+mugW/2-24,cy+mugH/2-35);ctx.quadraticCurveTo(cx,cy+mugH/2+15,cx-mugW/2+24,cy+mugH/2-35);ctx.closePath();ctx.fill();
  ctx.save();ctx.beginPath();ctx.moveTo(cx-mugW/2+20,cy-mugH/2+15);ctx.quadraticCurveTo(cx,cy-mugH/2+30,cx+mugW/2-20,cy-mugH/2+15);ctx.lineTo(cx+mugW/2-38,cy+mugH/2-48);ctx.quadraticCurveTo(cx,cy+mugH/2-5,cx-mugW/2+38,cy+mugH/2-48);ctx.closePath();ctx.clip();
  if(art){
    const segment = splitCount>1 ? index%splitCount : 0;
    const sx=art.width*segment/splitCount, sw=art.width/splitCount;
    const areaW=mugW-75, areaH=mugH-110;
    let dw=areaW*zoom/100, dh=areaH*zoom/100;
    if(fit==="contain"){const scale=Math.min(areaW/art.width,areaH/art.height)*zoom/100;dw=art.width*scale;dh=art.height*scale;}
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation*Math.PI/180);ctx.filter=`brightness(${brightness}%)`;
    ctx.drawImage(art,sx,0,sw,art.height,-dw/2,-dh/2,dw,dh);ctx.restore();
  } else {ctx.fillStyle="#fff";ctx.fillRect(cx-mugW/2,cy-mugH/2,mugW,mugH);}
  const shade=ctx.createLinearGradient(cx-mugW/2,0,cx+mugW/2,0);shade.addColorStop(0,"rgba(0,0,0,.18)");shade.addColorStop(.18,"rgba(255,255,255,.10)");shade.addColorStop(.8,"rgba(255,255,255,.05)");shade.addColorStop(1,"rgba(0,0,0,.15)");ctx.fillStyle=shade;ctx.fillRect(cx-mugW/2,cy-mugH/2,mugW,mugH);
  ctx.restore();
  ctx.strokeStyle="rgba(255,255,255,.9)";ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(cx,cy-mugH/2+2,mugW/2-4,15,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}

createRoot(document.getElementById("root")).render(<App />);
