/* Laser Atlas v0.4.1 - end-pump relay visualizer, independent of resonator ray path */
(function(){
 'use strict';
 const pump=window.LaserAtlasPump,$=id=>document.getElementById(id);
 const KEY='laser-atlas-pump-relay-v1';
 let state=pump.clone(pump.DEFAULT),lastCavity=null,lastPump=null,timer,errorMessage=null;
 const num=(v,n=1)=>Number.isFinite(v)?Number(v).toFixed(n):'—';
 function load(){try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(p)state=pump.validate(p);}catch(_){} }
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){} }
 function fill(){document.querySelectorAll('[data-pump]').forEach(el=>el.value=state[el.dataset.pump]);}
 function read(){const o=pump.clone(state);document.querySelectorAll('[data-pump]').forEach(el=>{if(el.value.trim()==='')throw Error('泵浦参数未填写：'+el.dataset.pump);o[el.dataset.pump]=Number(el.value);});return pump.validate(o);}
 const line=(pts,x,y)=>pts.filter(p=>p&&Number.isFinite(x(p))&&Number.isFinite(y(p))).map(p=>`${x(p).toFixed(2)},${y(p).toFixed(2)}`).join(' ');
 const fmtLegend=(l,c)=>`<span style="display:inline-flex;gap:4px;align-items:center;margin-right:10px;font-size:11px;color:#5d806d"><i style="display:inline-block;width:15px;height:3px;background:${c};border-radius:4px"></i>${l}</span>`;
 function plot(relay,opts){const W=820,H=270,L=65,R=18,T=32,B=42;
   const xs=opts.xMax,x=z=>L+(W-L-R)*z/xs;
   let wmax=Math.max(1,...opts.lines.flatMap(q=>q.data.map(d=>d[q.key]||0)))*1.15;
   const y=v=>H-B-(H-B-T)*v/wmax;
   const hTicks=[0,1,2,3,4].map(k=>{const v=k*wmax/4;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e0eae4"/><text x="${L-10}" y="${y(v)+4}" text-anchor="end" fill="#799388" font-size="12">${num(v,0)}</text>`;}).join('');
   const labels=opts.markers.map((e,i)=>`<line x1="${x(e.z)}" x2="${x(e.z)}" y1="${T}" y2="${H-B}" stroke="#b5cfc0" stroke-dasharray="4 5"/><text x="${x(e.z)}" y="${i%2?29:16}" fill="#4a785f" font-size="12" text-anchor="middle">${e.name}</text>`).join('');
   const traces=opts.lines.map(q=>`<polyline points="${line(q.data,d=>x(d[opts.xKey]),d=>y(d[q.key]))}" fill="none" stroke="${q.color}" stroke-width="2.7" stroke-linejoin="round"/>`).join('');
   const ticks=[0,1,2,3,4,5].map(i=>{const z=xs*i/5;return `<text x="${x(z)}" y="${H-20}" font-size="11" text-anchor="middle" fill="#668474">${num(z,1)}</text>`;}).join('');
   const legend=opts.lines.map(q=>fmtLegend(q.label,q.color)).join('');
   return `<div style="padding:4px 8px">${legend}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label}"><text x="${L}" y="11" font-size="11" fill="#577665">二阶矩等效半径 w / μm</text>${hTicks}${labels}${traces}<line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="#98b5a2"/>${ticks}<text x="${W/2}" y="${H-1}" text-anchor="middle" font-size="11" fill="#738a7d">${opts.xLabel}</text></svg>`;
 }
 function pumpRelaySVG(q){const x=q.params,marks=[{z:x.sourceToF1Mm,name:'f₁'},{z:x.sourceToF1Mm+x.f1ToF2Mm,name:'f₂'},{z:q.frontMm,name:'Nd 前表面'}];
   return plot(q.relay,{xMax:q.frontMm,markers:marks,xKey:'zmm',xLabel:'从等效泵浦输入腰面起的传播距离 / mm',label:'泵浦光路的两轴等效光斑半径和 f1 f2 元件位置',lines:[{label:'X 轴 wₚ,x',data:q.relay,key:'xUm',color:'#168969'},{label:'Y 轴 wₚ,y',data:q.relay,key:'yUm',color:'#c7864a'}]});}
 function gainSVG(q){return plot(q.gain,{xMax:q.lengthMm,markers:[{z:0,name:'入射面'},{z:q.lengthMm/2,name:'Nd 中心'},{z:q.lengthMm,name:'出射面'}],xKey:'zmm',xLabel:'Nd:YVO₄ 内部深度 z / mm',label:'增益晶体内部泵浦双轴半径与1064基频本征腔模半径',lines:[{label:'泵浦 X',data:q.gain,key:'pXUm',color:'#158c6b'},{label:'泵浦 Y',data:q.gain,key:'pYUm',color:'#d78445'},{label:'1064 T',data:q.gain,key:'wLTUm',color:'#4b79c0'},{label:'1064 S',data:q.gain,key:'wLSUm',color:'#b46db1'}]});}
 const pct=x=>Number.isFinite(x)?(100*x).toFixed(1)+'%':'—';
 function render(q){lastPump=q;
   const power=q.power;
   const metrics=[['Nd 入射泵浦功率',num(power.incidentW,2)+' W',`光学透过率 ${pct(q.params.transmission)}`],
     ['Nd 体吸收功率',num(power.absorbedW,2)+' W',`吸收份额 ${pct(power.absorbedFraction)}`],
     ['吸收加权形状匹配',pct(q.weightedMatch),'仅指两束归一化强度分布'],
     ['量子亏损热下限',num(power.lowerBoundQuantumDefectW,2)+' W','不是总热负荷，也不会自动决定 fth']];
   $('pumpMetrics').innerHTML=metrics.map(v=>`<div class="pump-metric"><small>${v[0]}</small><strong>${v[1]}</strong><span>${v[2]}</span></div>`).join('');
   $('pumpRelay').innerHTML=pumpRelaySVG(q);$('pumpGain').innerHTML=gainSVG(q);
   $('pumpPlanes').innerHTML=[['前表面',q.planes.front],['中心',q.planes.center],['后表面',q.planes.back]].map(([label,p])=>`<tr><td>${label}</td><td>${num(p.zmm,2)}</td><td>${num(p.pXUm,1)}</td><td>${num(p.pYUm,1)}</td><td>${num(p.wLTUm,1)}</td><td>${num(p.wLSUm,1)}</td><td>${pct(p.match)}</td></tr>`).join('');
   const warnings=[];
   if(!q.stable)warnings.push('1064 nm 腔不稳定：泵浦几何半径和吸收仍可显示，模式匹配度必须为空，不能凭泵浦自动判定起振。');
   if(q.initialHalfAngleXMr>200||q.initialHalfAngleYMr>200)warnings.push('等效源面某轴发散半角超过 200 mrad：近轴/二阶矩高斯等效的误差可能很大。请先获取实际快慢轴分布并考虑 FAC/SAC。');
   if(q.weightedMatch!==null&&q.weightedMatch<0.8)warnings.push('泵浦与基频强度分布存在明显形状不匹配；优先调整 f₁/f₂ 间距、聚焦位置、输入光束质量与偏心量。');
   if(q.params.offsetXUm||q.params.offsetYUm)warnings.push('当前引入泵浦/腔模偏心；模型没有包含偏心诱导的热透镜像差。');
   warnings.push('该模块没有把吸收功率或空间匹配指数直接转换为 1064/355 nm 功率；热透镜必须由实测或完整热模型回填。');
   $('pumpWarnings').innerHTML=warnings.map(w=>`<p>• ${w}</p>`).join('');
 }
 function update(r){lastCavity=r;if(errorMessage){$('pumpMetrics').innerHTML=`<div class="failed" style="grid-column:1/-1">泵浦输入异常：${errorMessage}</div>`;return;}try{render(pump.compute(state,r));}catch(e){$('pumpMetrics').innerHTML=`<div class="failed" style="grid-column:1/-1">泵浦模型：${e.message}</div>`;}}
 function init(){load();fill();document.addEventListener('input',e=>{if(!e.target.matches('[data-pump]'))return;
     try{state=read();errorMessage=null;save();clearTimeout(timer);timer=setTimeout(()=>{if(lastCavity)update(lastCavity);},35);}catch(err){errorMessage=err.message;clearTimeout(timer);$('pumpMetrics').innerHTML=`<div class="failed" style="grid-column:1/-1">泵浦输入异常：${err.message}</div>`;}
   });
   const csvButton=$('exportPumpCsv');if(csvButton)csvButton.addEventListener('click',()=>{if(!lastPump)return;const q=lastPump,rows=[['晶体深度(mm)','泵浦X(um)','泵浦Y(um)','1064T(um)','1064S(um)','BC平方形状匹配','局部吸收功率密度(W/mm)'],...q.gain.map(p=>[p.zmm,p.pXUm,p.pYUm,p.wLTUm??'',p.wLSUm??'',p.match??'',p.absorbedWPerMm])];const txt='\ufeff'+rows.map(row=>row.map(s=>'"'+String(s).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob([txt],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='LaserAtlas-pump-vs-1064.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);});
 }
 window.LaserAtlasPumpUI={init,update,getState:()=>pump.clone(state),setState:(s)=>{state=pump.validate(s);errorMessage=null;fill();save();if(lastCavity)update(lastCavity);},reset:()=>{state=pump.clone(pump.DEFAULT);errorMessage=null;fill();save();if(lastCavity)update(lastCavity);}};
 init();
})();