/* Laser Atlas / Gaussian Resonator Core v1.0
   Static first-order 1064 nm resonator solver.
   Coordinate: r=[y,n*theta], scalar reduced q=physical_q/n.
   Lens and mirror sign convention: concave positive R in unfolded path.
   No thermal gain, SHG/SFG coupling or thermal lens prediction.
*/
(function(root,make){
  const api=make();
  if(typeof module==='object' && module.exports) module.exports=api;
  root.LaserAtlasResonator=api;
})(typeof globalThis !== 'undefined' ? globalThis : this,function(){
  'use strict';
  const I=[1,0,0,1];
  const DEFAULT={
    lambdaNm:1064, gap:{d1:16,d2:23,d3:27,d4:22,d5:14,d6:20},
    material:{gain:{length:8,n:2.14,aperture:3},aom:{length:18,n:1.50,aperture:1.5},thg:{length:13,n:1.61,aperture:3},shg:{length:10,n:1.61,aperture:3}},
    mirror:{M1:0,M2:300,M3:0,angle:6,aperture:6},
    thermal:{fmm:350,atPercent:50},
    extraLens:{enabled:false,gapKey:'d3',offset:10,fmm:250,aperture:5},
    scan:{min:80,max:600,count:65}
  };
  function clone(x){return JSON.parse(JSON.stringify(x));}
  const mul=(X,Y)=>[
    X[0]*Y[0]+X[1]*Y[2], X[0]*Y[1]+X[1]*Y[3],
    X[2]*Y[0]+X[3]*Y[2], X[2]*Y[1]+X[3]*Y[3]
  ];
  const prop=(mm,n)=>[1,mm/(1000*n),0,1];
  const thin=(fmm)=> !fmm?[...I]:[1,0,-1000/fmm,1];
  const mirror=(Rmm)=>!Rmm?[...I]:[1,0,-2000/Rmm,1];
  function validate(a){
    if(!a||typeof a!=='object')throw new Error('缺少光路参数');
    const v=(value,label,min,max,incMin=true)=>{const x=Number(value);if(!Number.isFinite(x)||(incMin?x<min:x<=min)||x>max)throw Error(`${label} 应在 ${min}–${max} 范围内`);return x;};
    v(a.lambdaNm,'基频波长（nm）',300,3000);
    for(let k=1;k<=6;k++)v(a.gap['d'+k],'d'+k+'（mm）',0.1,500);
    for(const [name,m] of Object.entries(a.material)){
      v(m.length,name+' 厚度（mm）',0.1,100);
      v(m.n,name+' 折射率',1,4);
      v(m.aperture,name+' 有效孔径直径（mm）',0.1,100);
    }
    for(const key of ['M1','M2','M3'])v(a.mirror[key],key+' 曲率半径（mm）',-20000,20000);
    v(a.mirror.angle,'M2 入射角（°）',0,35);
    v(a.mirror.aperture,'腔镜有效孔径直径（mm）',0.1,100);
    v(a.thermal.fmm,'热透镜焦距（mm；0 表示关闭）',-5000,5000);
    v(a.thermal.atPercent,'热透镜在增益晶体内的位置（%）',0,100);
    if(!a.extraLens||typeof a.extraLens!=='object')throw Error('腔内可选薄透镜参数缺失');
    if(typeof a.extraLens.enabled!=='boolean')throw Error('腔内薄透镜开关需要是布尔值');
    if(!/^d[1-6]$/.test(a.extraLens.gapKey))throw Error('额外薄透镜应指定 d1–d6 的一个间隙');
    v(a.extraLens.offset,'可选薄透镜离间隙前端距离（mm）',0,a.gap[a.extraLens.gapKey]);
    v(a.extraLens.fmm,'可选薄透镜焦距（mm）',-5000,5000);
    v(a.extraLens.aperture,'可选薄透镜孔径（mm）',0.1,100);
    v(a.scan.min,'热焦距扫描起点（mm）',20,4000);
    v(a.scan.max,'热焦距扫描终点（mm）',20,5000);
    if(a.scan.max<=a.scan.min)throw Error('热焦距扫描终点需要大于起点');
    v(a.scan.count,'热焦距扫描采样数',8,250);
    return a;
  }
  function compile(a,axis){
    const events=[],marks=[];
    let z=0,n=1;
    const mark=(key,name,owner='',face='center')=>{marks.push({key,name,zmm:z,n,owner,face,eventIndex:events.length});};
    const move=(mm,idx=1)=>{events.push({type:'prop',mm,n:idx,z0:z,z1:z+mm});z+=mm;n=idx;};
    const optic=(kind,ap)=>{events.push({type:'optic',kind,aperture:ap,z0:z,z1:z});};
    const gap=(key)=>{
      const d=a.gap[key],el=a.extraLens;
      if(el.enabled&&el.gapKey===key){
        move(el.offset,1);
        mark('extraLens','额外薄透镜（'+key+'）','extra','lens');
        optic('extraLens',el.aperture);
        move(d-el.offset,1);
      }else move(d,1);
    };
    const crystal=(kind,title)=>{
      const m=a.material[kind];
      mark(kind+'Front',title+' 前表面',kind,'front');
      if(kind==='gain'){
        const at=m.length*a.thermal.atPercent/100;
        const tasks=[{offset:m.length/2,kind:'mark'},{offset:at,kind:'lens'}].sort((a,b)=>a.offset-b.offset||(a.kind==='mark'?-1:1));
        let x=0;
        for(const task of tasks){move(task.offset-x,m.n);x=task.offset;
          if(task.kind==='mark')mark('gainCenter',title+' 中心',kind,'center');
          else optic('thermal',null);
        }
        move(m.length-x,m.n);
      }else{
        move(m.length/2,m.n);
        mark(kind+'Center',title+' 中心',kind,'center');
        move(m.length/2,m.n);
      }
      mark(kind+'Back',title+' 后表面',kind,'back');
      n=1;
    };
    const cf=Math.cos(a.mirror.angle*Math.PI/180);
    const R2=a.mirror.M2 === 0 ? 0 : a.mirror.M2 * (axis==='T'?cf:1/cf);
    mark('M1','M1 腔镜','mirror','mirror');
    gap('d1');
    crystal('gain','Nd:YVO₄');
    gap('d2');
    crystal('aom','AOM');
    gap('d3');
    mark('M2','M2 折叠镜','mirror','mirror');
    optic('M2',a.mirror.aperture);
    gap('d4');
    crystal('thg','THG (SFG)');
    gap('d5');
    crystal('shg','SHG');
    gap('d6');
    mark('M3','M3 端镜','mirror','mirror');
    return {events,marks,length:z,reflectedRadius:R2};
  }
  function opMatrix(e,a,axis){
    if(e.type==='prop')return prop(e.mm,e.n);
    if(e.kind==='thermal')return thin(a.thermal.fmm);
    if(e.kind==='extraLens')return thin(a.extraLens.fmm);
    if(e.kind==='M2'){
      const cf=Math.cos(a.mirror.angle*Math.PI/180);
      return mirror(a.mirror.M2===0?0:a.mirror.M2*(axis==='T'?cf:1/cf));
    }
    throw Error('未知光学元件 '+e.kind);
  }
  function fullMatrix(a,axis,compiled){
    const e=compiled.events;
    let M=[...I];
    const forward=e.map(op=>opMatrix(op,a,axis));
    const steps=[...forward,mirror(a.mirror.M3),...forward.slice().reverse(),mirror(a.mirror.M1)];
    for(const m of steps)M=mul(m,M);
    return M;
  }
  function solveEigen(M,wl){
    const [A,B,C,D]=M;
    const det=A*D-B*C,trace=A+D,t=trace/2;
    const stable=Number.isFinite(t)&&Math.abs(t)<1-1e-9&&Math.abs(C)>1e-14&&Math.abs(det-1)<1e-5;
    if(!stable)return {stable:false,det,t,trace,matrix:M,q:null};
    const imag=Math.sqrt(Math.max(0,4*det-trace*trace))/(2*Math.abs(C));
    const real=(A-D)/(2*C);
    const q={re:real,im:imag};
    const s=real*real+imag*imag;
    const w=Math.sqrt(wl*s/(Math.PI*imag));
    if(!Number.isFinite(w)||!(w>0))return {stable:false,det,t,trace,matrix:M,q:null};
    const Qnext=mobius(q,M);
    const qError=Math.hypot(Qnext.re-q.re,Qnext.im-q.im);
    return {stable:true,det,t,trace,matrix:M,q,w,stableMargin:1-Math.abs(t),qError};
  }
  const zAdd=(a,b)=>({re:a.re+b.re,im:a.im+b.im});
  const zMul=(a,b)=>({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re});
  const zDiv=(a,b)=>{const d=b.re*b.re+b.im*b.im;return {re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};};
  function mobius(q,M){return zDiv({re:M[0]*q.re+M[1],im:M[0]*q.im},{re:M[2]*q.re+M[3],im:M[2]*q.im});}
  function beam(q,n,lambdaM){
    const re=q.re,im=q.im,den=re*re+im*im;
    const w=Math.sqrt(lambdaM*den/(Math.PI*im));
    const Rmm=Math.abs(re)<1e-12?Infinity:1000*n*den/re;
    return {qReMm:1000*re,qImMm:1000*im,wUm:1e6*w,Rmm,zRayleighMm:1000*n*im,zToWaistMm:-1000*n*re};
  }
  function step(q,e,a,axis){return mobius(q,opMatrix(e,a,axis));}
  function evalAxis(a,axis,compiled,root){
    if(!root.stable)return null;
    const lambdaM=a.lambdaNm*1e-9;
    let q={...root.q};
    const samples=[],curve=[];
    let next=0;
    const pushMark=(m)=>{samples.push({...m,axis,...beam(q,m.n,lambdaM)});};
    const markNow=(idx)=>{while(next<compiled.marks.length&&compiled.marks[next].eventIndex===idx){pushMark(compiled.marks[next]);next++;}};
    markNow(0);
    curve.push({zmm:0,...beam(q,1,lambdaM)});
    for(let i=0;i<compiled.events.length;i++){
      const e=compiled.events[i];
      if(e.type==='prop'){
        const count=Math.max(2,Math.ceil(e.mm/2));
        const q0={...q};
        for(let j=1;j<=count;j++){
          const part=e.mm*j/count;
          const qp=step(q0,{type:'prop',mm:part,n:e.n},a,axis);
          curve.push({zmm:e.z0+part,...beam(qp,e.n,lambdaM)});
        }
      }
      q=step(q,e,a,axis);
      markNow(i+1);
    }
    const end=compiled.marks.find(m=>m.key==='M3');
    const qBackStart=mobius(q,mirror(a.mirror.M3));
    // The end mirror changes wavefront curvature but not instantaneous beam radius.
    const endW=beam(q,end.n,lambdaM).wUm,backW=beam(qBackStart,end.n,lambdaM).wUm;
    return {samples,curve,qEnd:q,endMirrorContinuity:Math.abs(endW-backW)};
  }
  function solve(p){
    const a=validate(clone(p)),lambdaM=a.lambdaNm*1e-9;
    const cT=compile(a,'T'),cS=compile(a,'S');
    const axes={};
    axes.T=solveEigen(fullMatrix(a,'T',cT),lambdaM);
    axes.S=solveEigen(fullMatrix(a,'S',cS),lambdaM);
    axes.T.field=evalAxis(a,'T',cT,axes.T);
    axes.S.field=evalAxis(a,'S',cS,axes.S);
    const rows=cT.marks.map((m,i)=>{
      const t=axes.T.field?.samples[i],s=axes.S.field?.samples[i];
      const wMax=t&&s?Math.max(t.wUm,s.wUm):NaN;
      const apt=m.owner==='mirror'?a.mirror.aperture:m.owner==='extra'?a.extraLens.aperture:m.owner?a.material[m.owner]?.aperture:NaN;
      const ratio=Number.isFinite(wMax)&&apt? (apt*1000/2)/wMax : NaN;
      const clipped=Number.isFinite(ratio)?Math.exp(-2*ratio*ratio):NaN;
      return {key:m.key,name:m.name,zmm:m.zmm,n:m.n,owner:m.owner,face:m.face,
        T:t||null,S:s||null,maxWUm:wMax,apertureMm:apt||null,clearance:ratio,clipFraction:clipped,
        apertureState:Number.isFinite(ratio)?ratio<2?'near':ratio<2.5?'watch':'ok':'unavailable'};
    });
    return {params:a,axes,rows,lengthMm:cT.length,allStable:axes.T.stable&&axes.S.stable,compiled:{T:cT,S:cS}};
  }
  function thermalScan(params){
    const p=validate(clone(params));
    const count=Math.max(8,Math.round(p.scan.count)),res=[];
    for(let i=0;i<count;i++){
      const f=p.scan.min+(p.scan.max-p.scan.min)*i/(count-1);
      p.thermal.fmm=f;
      const v=solve(p);
      const row=(key)=>v.rows.find(m=>m.key===key);
      const w=(key)=>{const r=row(key);return v.allStable?r.maxWUm:null};
      res.push({fmm:f,stable:v.allStable,t:v.axes.T.t,s:v.axes.S.t,gain:w('gainCenter'),aom:w('aomCenter'),thg:w('thgCenter'),shg:w('shgCenter')});
    }
    return res;
  }
  function numericCheck(){
    const m=mul(prop(100,1),mul(thin(200),prop(100,1)));
    const expected=[.5,.15,-5,.5];
    if(m.some((x,i)=>Math.abs(x-expected[i])>1e-10))throw Error('基本连乘检验失败');
    const input=clone(DEFAULT),v=solve(input);
    if(!v.allStable)throw Error('默认腔型需要是稳定腔');
    if(v.rows.length!==15)throw Error('默认元件面数必须为15，实际是 '+v.rows.length);
    for(const ax of ['T','S']){
      if(Math.abs(v.axes[ax].det-1)>1e-7)throw Error(ax+' 往返矩阵行列式错误');
      if(v.axes[ax].qError>1e-9)throw Error(ax+' 腔模不自洽');
      if(v.axes[ax].field.endMirrorContinuity>1e-8)throw Error(ax+' 镜面 w 不连续');
    }
    return {pass:true,sampleM:m,defaultStability:{T:v.axes.T.t,S:v.axes.S.t},rows:v.rows.length};
  }
  return {DEFAULT,clone,mul,prop,thin,mirror,validate,compile,fullMatrix,solveEigen,mobius,beam,solve,thermalScan,numericCheck};
});