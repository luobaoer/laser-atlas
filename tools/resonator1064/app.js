/* Laser Atlas 1064 nm resonator UI. All numeric optics in core.js. */
(function(){
  'use strict';
  const core=window.LaserAtlasResonator,$=id=>document.getElementById(id);
  const KEY='laser-atlas-1064-resonator-v1';
  let state=core.clone(core.DEFAULT),result=null,selected='gainCenter',sortReverse=false;
  const value=(x,d=1)=>Number.isFinite(x)?Number(x).toFixed(d).replace(/^-0\.0+$/,'0'): '—';
  const curv=x=>Number.isFinite(x)?value(x,1):'∞';
  const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function deepSet(obj,path,num){const parts=path.split('.');let k=obj;for(let i=0;i<parts.length-1;i++)k=k[parts[i]];k[parts.at(-1)]=num;}
  function deepGet(obj,path){return path.split('.').reduce((a,k)=>a[k],obj);}
  function fillForm(){document.querySelectorAll('[data-path]').forEach(el=>{const v=deepGet(state,el.dataset.path);if(el.type==='checkbox')el.checked=v;else el.value=v;});$('fRange').value=Math.max(80,Math.min(600,state.thermal.fmm||80));$('fRangeOut').textContent=value(state.thermal.fmm,0)+' mm';}
  function readForm(){const x=core.clone(state);document.querySelectorAll('[data-path]').forEach(el=>{
      if(el.type==='checkbox'){deepSet(x,el.dataset.path,el.checked);return;}
      const v=el.value.trim();if(v==='')throw Error('请填写所有参数：'+(el.closest('.field')?.innerText||el.dataset.path));
      deepSet(x,el.dataset.path,el.tagName==='SELECT'?v:Number(v));
    }); return core.validate(x);
  }
  const download=(name,text,type)=>{const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='✓ 已自动保存到本浏览器';}catch(e){$('saveStatus').textContent='无法保存：浏览器限制本地存储';}}
  function restore(){try{const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data){core.validate(data);return data;}}catch(e){}return core.clone(core.DEFAULT);}
  const matrixHTML=M=>{if(!M)return '—';const cells=[value(M[0],4),value(M[1],5)+' m',value(M[2],3)+' m⁻¹',value(M[3],4)].map(t=>`<span>${escapeHtml(t)}</span>`).join('');return `<span class="mat-wrap"><span class="mat">${cells}</span></span>`;};
  function renderMetrics(r){const axes=r.axes,st=r.allStable;const t=axes.T,s=axes.S;
    $('metrics').innerHTML=`<div class="metric ${st?'good':'bad'}"><span class="lab">双轴腔稳定性</span><strong>${st?'稳定':'不稳定 / 边界'}</strong><small>${st?'可计算自洽高斯模':'不提供虚假的光斑结果'}</small></div><div class="metric"><span class="lab">展开单程几何长度</span><strong>${value(r.lengthMm,1)} mm</strong><small>含所有晶体实体厚度</small></div><div class="metric"><span class="lab">切向 ½tr(M)</span><strong>${value(t.t,4)}</strong><small>裕量 1−|½tr| = ${value(t.stable?1-Math.abs(t.t):NaN,4)}</small></div><div class="metric"><span class="lab">弧矢 ½tr(M)</span><strong>${value(s.t,4)}</strong><small>裕量 1−|½tr| = ${value(s.stable?1-Math.abs(s.t):NaN,4)}</small></div>`;
  }
  function topologySVG(r){const p=r.params;const selectedKey=selected;
    const hit=(x,y,label,key)=>`<g data-select="${key}" tabindex="0" role="button" aria-label="查看${label}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="23" fill="#fff" fill-opacity=".01" stroke="${selectedKey===key?'#df8a45':'transparent'}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="${selectedKey===key?'#df8a45':'#277e62'}"/></g>`;
    const posRange={d1:[[80,108],[201,108]],d2:[[279,108],[394,108]],d3:[[479,108],[665,108]],d4:[[665,108],[604,135]],d5:[[533,168],[445,215]],d6:[[365,242],[255,293]]};
    let extraSvg='';
    if(p.extraLens.enabled){
      const l=p.extraLens,pts=posRange[l.gapKey],ratio=l.offset/p.gap[l.gapKey],x=pts[0][0]+(pts[1][0]-pts[0][0])*ratio,y=pts[0][1]+(pts[1][1]-pts[0][1])*ratio;
      const angle=Math.atan2(pts[1][1]-pts[0][1],pts[1][0]-pts[0][0])*180/Math.PI;
      extraSvg=`<g data-select="extraLens" role="button" tabindex="0" aria-label="查看腔内额外透镜" style="cursor:pointer" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})"><path d="M-4 -17 Q2 0 -4 17 L4 17 Q-2 0 4 -17Z" fill="#e5dafa" stroke="#9e81c5" stroke-width="2"/><circle cx="0" cy="0" r="19" fill="none" stroke="${selectedKey==='extraLens'?'#df8a45':'transparent'}" stroke-width="2"/><text x="0" y="-23" text-anchor="middle" font-size="11" fill="#835aaf" font-weight="bold" transform="rotate(${-angle.toFixed(1)})">L</text></g>`;
    }
    const thermX=201+(279-201)*p.thermal.atPercent/100;
    return `<svg viewBox="0 0 860 345" role="img" aria-label="M1 经 Nd:YVO4 AOM M2 THG SHG 到 M3 的三镜折叠1064纳米腔结构"><defs><marker id="ar1064" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#c56d45"/></marker></defs><rect x="0" y="0" width="860" height="345" rx="12" fill="#fcfdfc"/>
      <path d="M80 108L665 108 255 293" stroke="#c56d45" stroke-width="3.5" fill="none"/><path d="M255 293L665 108 80 108" stroke="#e6af8c" stroke-width="2" stroke-dasharray="9 7" fill="none"/>
      <path d="M125 108H174 M305 108H358 M510 108H587" stroke="#c56d45" stroke-width="3" marker-end="url(#ar1064)"/>
      <path d="M622 128L555 161 M408 221L350 250" stroke="#c56d45" stroke-width="3" marker-end="url(#ar1064)"/>
      <g stroke="#53695f" stroke-width="7" stroke-linecap="round"><path d="M72 84L88 132"/><path d="M655 88L676 132"/><path d="M245 270L262 315"/></g>
      <g stroke="#86ae99" stroke-width="1.5" fill="#e4f1e8"><rect x="201" y="91" width="78" height="34" rx="4"/><rect x="394" y="93" width="85" height="30" rx="4"/><rect x="533" y="143" width="78" height="25" rx="4" transform="rotate(-24 572 156)"/><rect x="365" y="217" width="80" height="25" rx="4" transform="rotate(-24 405 229)"/></g>
      <g font-family="sans-serif" font-weight="650" fill="#274c3d" font-size="14"><text x="60" y="69">M1</text><text x="214" y="81">Nd:YVO₄</text><text x="412" y="82">AOM</text><text x="673" y="91">M2</text><text x="556" y="187">THG</text><text x="390" y="257">SHG</text><text x="228" y="334">M3</text></g>
      <g font-family="sans-serif" fill="#6b8878" font-size="12"><text x="124" y="92">d₁=${value(p.gap.d1,0)}</text><text x="313" y="89">d₂=${value(p.gap.d2,0)}</text><text x="528" y="90">d₃=${value(p.gap.d3,0)}</text><text x="610" y="191">d₄=${value(p.gap.d4,0)}</text><text x="466" y="240">d₅=${value(p.gap.d5,0)}</text><text x="297" y="288">d₆=${value(p.gap.d6,0)}</text><text x="33" y="29" font-size="12">沿光路 M1 → M2 → M3（返程沿原路），单位 mm · 示意不按比例</text></g>
      <line x1="${thermX}" y1="85" x2="${thermX}" y2="131" stroke="#d5a24f" stroke-dasharray="3 3" stroke-width="2"/><text x="${thermX}" y="144" text-anchor="middle" font-size="10" fill="#9b7040">fth</text>
      ${extraSvg}
      ${hit(80,108,'M1','M1')}${hit(238,108,'Nd中心','gainCenter')}${hit(436,108,'AOM中心','aomCenter')}${hit(664,108,'M2','M2')}${hit(567,152,'THG中心','thgCenter')}${hit(405,229,'SHG中心','shgCenter')}${hit(254,293,'M3','M3')}
    </svg>`;
  }
  function renderTopology(r){$('topology').innerHTML=topologySVG(r);}
  const L={l:64,r:30,t:28,b:40,W:900,H:330};
  const scales=(min,max,mi,ma,v)=>mi+(v-min)/(max-min)*(ma-mi);
  const fmtpts=(curve,x,y)=>curve.map(d=>`${x(d)},${y(d)}`).join(' ');
  function envelopeSVG(r){if(!r.allStable)return `<div class="failed"><h3>当前至少有一个方向不稳定</h3><p>请调节 f<sub>th</sub>、M2 曲率或各段腔长。稳定腔才能计算有限的自洽光束半径。</p></div>`;
    const A=r.axes.T.field.curve,B=r.axes.S.field.curve,p={...L};
    const full=r.lengthMm,x=z=>scales(0,full,p.l,p.W-p.r,z).toFixed(2);
    const ymax=Math.max(...A.map(v=>v.wUm),...B.map(v=>v.wUm))*1.20,y=w=>(p.H-p.b-(w/ymax)*(p.H-p.b-p.t)).toFixed(2);
    const ticks=[0,1,2,3,4].map(i=>{const v=ymax*i/4,yy=y(v);return `<line x1="${p.l}" y1="${yy}" x2="${p.W-p.r}" y2="${yy}" stroke="#e6eee8"/><text x="${p.l-12}" y="${Number(yy)+4}" text-anchor="end" fill="#768f7d" font-size="11">${value(v,0)}</text>`;}).join('');
    const labels=['M1','gainCenter','aomCenter','extraLens','M2','thgCenter','shgCenter','M3'];
    const zmarks=r.rows.filter(i=>labels.includes(i.key)).map((d,i)=>{const xx=x(d.zmm);return `<line x1="${xx}" x2="${xx}" y1="${p.t}" y2="${p.H-p.b}" stroke="#d5e4dc" stroke-dasharray="3 5"/><text x="${xx}" y="${i%2?18:31}" text-anchor="middle" fill="#547e68" font-size="11">${d.key==='gainCenter'?'Nd中心':d.key==='aomCenter'?'AOM':d.key==='thgCenter'?'THG':d.key==='shgCenter'?'SHG':d.key==='extraLens'?'Lens':d.key}</text>`;}).join('');
    const band=(key,col)=>{const i=r.rows.find(i=>i.key===key+'Front'),j=r.rows.find(i=>i.key===key+'Back');return `<rect x="${x(i.zmm)}" y="${p.t}" width="${Math.max(2,Number(x(j.zmm))-Number(x(i.zmm)))}" height="${p.H-p.b-p.t}" fill="${col}" opacity="0.08"/>`;};
    const lineA=A.map(d=>`${x(d.zmm)},${y(d.wUm)}`).join(' '),lineB=B.map(d=>`${x(d.zmm)},${y(d.wUm)}`).join(' ');
    const selectedRow=r.rows.find(i=>i.key===selected),selx=selectedRow?x(selectedRow.zmm):null;
    return `<svg viewBox="0 0 ${p.W} ${p.H}" role="img" aria-label="沿展开光路的切向与弧矢方向本征光斑半径曲线"><text x="${p.l}" y="12" font-size="12" fill="#647b6c">w / μm</text>${ticks}${band('gain','#42ab75')}${band('aom','#9cb5ca')}${band('thg','#d9ad74')}${band('shg','#c0a7d4')}${zmarks}<polyline points="${lineA}" fill="none" stroke="#118264" stroke-width="3" stroke-linejoin="round"/><polyline points="${lineB}" fill="none" stroke="#d47e45" stroke-width="2.4" stroke-linejoin="round"/>${selx?`<line x1="${selx}" x2="${selx}" y1="${p.t}" y2="${p.H-p.b}" stroke="#8d6abd" stroke-width="2.2" stroke-dasharray="5 3"/>`:''}<line x1="${p.l}" y1="${p.H-p.b}" x2="${p.W-p.r}" y2="${p.H-p.b}" stroke="#a8c4ae"/>${[0,1,2,3,4,5].map(i=>{const zz=full*i/5;return `<text x="${x(zz)}" y="${p.H-15}" text-anchor="middle" fill="#729180" font-size="12">${value(zz,0)}</text>`;}).join('')}<text x="${p.W/2}" y="${p.H-1}" fill="#698879" text-anchor="middle" font-size="11">沿 M1 → M3 展开路径的几何位置 z / mm</text></svg>`;
  }
  function renderEnvelope(r){$('envelope').innerHTML=envelopeSVG(r);$('stableHint').textContent=r.allStable?'紫色虚线为当前选定参考面；晶体色带对应实际厚度位置。':'图中未计算波长转换与增益。';}
  function thermalSVG(p,scan){const W=900,H=320,l=64,b=42,t=25,rx=W-26,by=H-b;
    const vals=scan.flatMap(s=>[s.gain,s.aom,s.thg,s.shg]).filter(v=>Number.isFinite(v));
    const ymax=vals.length?Math.max(...vals)*1.15:1;
    const x=f=>scales(p.scan.min,p.scan.max,l,rx,f).toFixed(2),y=v=>(by-(v/ymax)*(by-t)).toFixed(2);
    const axes=[0,1,2,3,4].map(i=>{const yy=y(ymax*i/4);return `<line x1="${l}" x2="${rx}" y1="${yy}" y2="${yy}" stroke="#e7eee8"/><text x="${l-10}" y="${Number(yy)+4}" font-size="11" text-anchor="end" fill="#7c9585">${value(ymax*i/4,0)}</text>`;}).join('');
    const gaps=scan.filter(s=>!s.stable).map(s=>`<rect x="${Number(x(s.fmm))-(rx-l)/(scan.length-1)/2}" y="${t}" width="${(rx-l)/(scan.length-1)+1}" height="${by-t}" fill="#ffefed"/>`).join('');
    const line=(key,color)=>{let parts=[],part=[];for(const p of scan){if(p.stable&&Number.isFinite(p[key])){part.push(`${x(p.fmm)},${y(p[key])}`);}else if(part.length){parts.push(part);part=[];}}if(part.length)parts.push(part);return parts.map(z=>`<polyline points="${z.join(' ')}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('');};
    const fth=p.thermal.fmm,loc=fth>=p.scan.min&&fth<=p.scan.max?`<line x1="${x(fth)}" x2="${x(fth)}" y1="${t}" y2="${by}" stroke="#254b40" stroke-width="2" stroke-dasharray="5 4"/>`:'';
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="热透镜扫描下四个器件中心的最大光斑半径变化图"><text x="${l}" y="12" font-size="12" fill="#667f70">max(wT,wS) / μm</text>${gaps}${axes}${line('gain','#118264')}${line('aom','#5686bc')}${line('thg','#d47e45')}${line('shg','#8b78b8')}${loc}<line x1="${l}" y1="${by}" x2="${rx}" y2="${by}" stroke="#b6d0ba"/>${[0,1,2,3,4,5].map(i=>{let f=p.scan.min+(p.scan.max-p.scan.min)*i/5;return `<text x="${x(f)}" y="${H-18}" font-size="11" fill="#788e7c" text-anchor="middle">${value(f,0)}</text>`;}).join('')}<text x="${W/2}" y="${H-2}" font-size="12" fill="#667d71" text-anchor="middle">fth / mm（粉色带表示至少一个轴不稳定）</text></svg>`;
  }
  function renderThermal(r){let scan=core.thermalScan(r.params);$('thermalPlot').innerHTML=thermalSVG(r.params,scan);$('fRangeOut').textContent=value(state.thermal.fmm,0)+' mm';}
  function renderMatrix(r){$('matrixArea').innerHTML=['T','S'].map(ax=>{
      const x=r.axes[ax];return `<div class="matrixcard"><h3>${ax==='T'?'切向 T':'弧矢 S'}</h3>${matrixHTML(x.matrix)}<div class="stat">det M = ${value(x.det,6)}；½tr = ${value(x.t,6)}；${x.stable?'稳定':'不稳定'}</div>${x.stable?`<div class="stat">q̃(M1) = ${value(x.q.re*1000,3)} + i·${value(x.q.im*1000,3)} mm</div>`:'<div class="warningText">无有限自洽 q</div>'}</div>`;
    }).join('');}
  const statusClass=x=>x==='near'?'bad':x==='watch'?'warn':'';
  function renderPlanes(r){const rows=sortReverse?r.rows.slice().reverse():r.rows;
    $('planeBody').innerHTML=rows.map(row=>{
      const cls=row.apertureState;
      return `<tr class="${selected===row.key?'selected':''}" data-select="${row.key}" tabindex="0" aria-label="查看${row.name}"><td>${escapeHtml(row.name)}</td><td>${value(row.zmm,2)}</td><td>${value(row.n,3)}</td><td>${row.T?value(row.T.wUm,1):'—'}</td><td>${row.S?value(row.S.wUm,1):'—'}</td><td>${row.T?curv(row.T.Rmm):'—'}</td><td>${row.S?curv(row.S.Rmm):'—'}</td><td>${value(row.clearance,2)}</td><td><span class="pill ${statusClass(cls)}">${cls==='near'?'接近孔径':cls==='watch'?'注意':'正常'}</span></td></tr>`;
    }).join('');}
  function spotSVG(r){const row=r.rows.find(x=>x.key===selected)||r.rows[0],a=row.apertureMm;
    if(!row.T||!row.S)return `<div class="failed" style="grid-column:1/-1">当前光路没有自洽模，无法显示对应光斑。</div>`;
    const clipRadius=a*1000/2,rx=Math.min(140,92*row.T.wUm/clipRadius),ry=Math.min(140,92*row.S.wUm/clipRadius);
    const frac=row.clipFraction;
    const apLabel=a?`有效孔径 Ø ${value(a,2)} mm`:'未定义口径';
    return `<svg viewBox="0 0 210 210" role="img" aria-label="${row.name} 的切向弧矢1/e2高斯光斑椭圆图"><rect width="210" height="210" rx="13" fill="#f8fbf8"/><line x1="105" y1="10" x2="105" y2="200" stroke="#d5e4db" stroke-dasharray="5 5"/><line x1="10" y1="105" x2="200" y2="105" stroke="#d5e4db" stroke-dasharray="5 5"/><circle cx="105" cy="105" r="92" fill="none" stroke="#92b59d" stroke-width="2" stroke-dasharray="5 4"/><ellipse cx="105" cy="105" rx="${value(rx,2)}" ry="${value(ry,2)}" fill="#53a78d" fill-opacity=".22" stroke="#158668" stroke-width="2.5"/><circle cx="105" cy="105" r="3" fill="#28745e"/><text x="103" y="18" text-anchor="middle" fill="#769083" font-size="10">S</text><text x="194" y="99" fill="#769083" font-size="10">T</text></svg>
    <div class="spotdetails"><h3>${escapeHtml(row.name)}</h3><div class="tiny">z=${value(row.zmm,2)} mm · n=${value(row.n,3)}</div>
     <div class="row"><span>w<sub>T</sub> / w<sub>S</sub></span><strong>${value(row.T.wUm,1)} / ${value(row.S.wUm,1)} μm</strong></div>
     <div class="row"><span>q̃<sub>T</sub>（约化参数）</span><strong>${value(row.T.qReMm,2)} + i${value(row.T.qImMm,2)} mm</strong></div>
     <div class="row"><span>q̃<sub>S</sub></span><strong>${value(row.S.qReMm,2)} + i${value(row.S.qImMm,2)} mm</strong></div>
     <div class="row"><span>R<sub>w,T</sub> / R<sub>w,S</sub></span><strong>${curv(row.T.Rmm)} / ${curv(row.S.Rmm)} mm</strong></div>
     <div class="row"><span>同介质内局部束腰相对距离 T / S</span><strong>${value(row.T.zToWaistMm,1)} / ${value(row.S.zToWaistMm,1)} mm</strong></div>
     <div class="row"><span>${apLabel} · a / w<sub>max</sub></span><strong>${value(row.clearance,2)}</strong></div>
     <p class="tiny" style="margin:8px 0 0">绿色椭圆表示 1/e² 强度等值线；虚线圆是有效孔径。此图按物理比例绘制，但不代表真实横模测量图。</p></div>`;
  }
  function renderSpot(r){$('spot').innerHTML=spotSVG(r);}
  function renderAll(){try{
      const x=core.solve(state);result=x;
      renderMetrics(x);renderTopology(x);renderEnvelope(x);renderMatrix(x);renderPlanes(x);renderSpot(x);renderThermal(x);
      $('saveStatus').textContent='✓ 当前参数有效 · 自动保存';
    }catch(e){$('saveStatus').textContent='参数有误：'+e.message;
      $('metrics').innerHTML=`<div class="failed" style="grid-column:1/-1">${escapeHtml(e.message)}</div>`;}
  }
  let pending=0;
  function recalc(){try{state=readForm();save();window.clearTimeout(pending);pending=window.setTimeout(renderAll,65);}catch(e){$('saveStatus').textContent='参数有误：'+e.message;}}
  document.addEventListener('input',e=>{
    if(e.target.matches('[data-path]')){
      if(e.target.id==='fth'){$('fRange').value=Math.max(80,Math.min(600,Number(e.target.value)||80));$('fRangeOut').textContent=(e.target.value||'—')+' mm';}
      recalc();
    } else if(e.target.id==='fRange'){$('fth').value=e.target.value;$('fRangeOut').textContent=e.target.value+' mm';recalc();}
  });
  document.addEventListener('change',e=>{if(e.target.matches('[data-path]'))recalc();});
  document.addEventListener('click',e=>{
    const line=e.target.closest('[data-select]');if(line){selected=line.dataset.select;if(result){renderPlanes(result);renderSpot(result);renderEnvelope(result);renderTopology(result);}return;}
    if(e.target.id==='reset'){state=core.clone(core.DEFAULT);selected='gainCenter';fillForm();save();renderAll();}
    if(e.target.id==='sortZ'){sortReverse=!sortReverse;e.target.textContent=sortReverse?'倒序显示（点此正序）':'按位置排序';if(result)renderPlanes(result);}
    if(e.target.id==='exportJson'){const obj={kind:'LaserAtlas-1064-Design',schemaVersion:1,exported:new Date().toISOString(),params:state};download('laser-atlas-1064-design.json',JSON.stringify(obj,null,2),'application/json;charset=utf-8');}
    if(e.target.id==='exportCsv'&&result){const rows=[['面','位置_mm','介质折射率','w_T_um','w_S_um','Rw_T_mm','Rw_S_mm','qReduced_T_real_mm','qReduced_T_imag_mm','qReduced_S_real_mm','qReduced_S_imag_mm','孔径直径_mm','a/w_max']];
      for(const r of result.rows)rows.push([r.name,r.zmm,r.n,r.T?.wUm??'',r.S?.wUm??'',r.T?.Rmm??'',r.S?.Rmm??'',r.T?.qReMm??'',r.T?.qImMm??'',r.S?.qReMm??'',r.S?.qImMm??'',r.apertureMm??'',r.clearance??'']);
      const csv='\ufeff'+rows.map(x=>x.map(y=>`"${String(y).replace(/"/g,'""')}"`).join(',')).join('\r\n');download('laser-atlas-1064-planes.csv',csv,'text/csv;charset=utf-8');
    }
  });
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-select]')){e.preventDefault();e.target.click();}});
  $('importJson').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.kind!=='LaserAtlas-1064-Design'||!data.params)throw Error('不是本工具的设计参数文件');core.validate(data.params);state=data.params;fillForm();save();renderAll();}catch(err){$('saveStatus').textContent='导入失败：'+err.message;}e.target.value='';});
  core.numericCheck();state=restore();fillForm();renderAll();
})();