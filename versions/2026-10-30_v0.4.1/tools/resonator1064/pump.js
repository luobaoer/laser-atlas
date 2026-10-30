/* Laser Atlas / End-pump relay and overlap module v0.4.1
   Separate optical path: pump source -> f1 -> f2 -> Nd:YVO4.
   Second-moment paraxial Gaussian-equivalent propagation, independent x/y M^2.
   This is NOT an actual multimode near-field/heat/laser threshold solver.
*/
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LaserAtlasPump=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DEFAULT={
   wavelengthNm:808, powerW:20, waistXUm:75, waistYUm:65, m2x:10, m2y:12,
   sourceToF1Mm:25,f1Mm:25,f1ToF2Mm:120,f2Mm:75,f2ToGainMm:65,
   transmission:0.90,nPump:2.18,absorptionPerMm:0.18,offsetXUm:0,offsetYUm:0
 };
 const clone=x=>JSON.parse(JSON.stringify(x));
 function validate(input){const x={...DEFAULT,...input};for(const [k,lo,hi] of [
   ['wavelengthNm',700,1000],['powerW',0,500],['waistXUm',5,2000],['waistYUm',5,2000],
   ['m2x',1,500],['m2y',1,500],['sourceToF1Mm',0,800],['f1Mm',-1500,1500],
   ['f1ToF2Mm',0,800],['f2Mm',-1500,1500],['f2ToGainMm',0,800],
   ['transmission',0,1],['nPump',1.01,4],['absorptionPerMm',0,5],
   ['offsetXUm',-5000,5000],['offsetYUm',-5000,5000]
 ]){if(!Number.isFinite(Number(x[k]))||Number(x[k])<lo||Number(x[k])>hi)throw Error('泵浦参数 '+k+' 应在 '+lo+'–'+hi+' 范围内');x[k]=Number(x[k]);}
 if(Math.abs(x.f1Mm)<1||Math.abs(x.f2Mm)<1)throw Error('f₁ 和 f₂ 焦距绝对值需不小于 1 mm');
 return x;}
 // Covariance of second-moment-equivalent width and slope. In air, effective
 // far-field half-angle M^2*lambda/(pi*w0). M^2=1 reproduces TEM00 propagation.
 function waistSigma(wUm,m2,wavelengthNm){const w=wUm*1e-6,th=m2*wavelengthNm*1e-9/(Math.PI*w);return {xx:w*w,xt:0,tt:th*th};}
 function transform(S,M){const [A,B,C,D]=M;return {xx:A*A*S.xx+2*A*B*S.xt+B*B*S.tt,
   xt:A*C*S.xx+(A*D+B*C)*S.xt+B*D*S.tt,
   tt:C*C*S.xx+2*C*D*S.xt+D*D*S.tt};}
 function free(S,mm,n=1){return transform(S,[1,mm/(1000*n),0,1]);}
 function lens(S,fmm){return transform(S,[1,0,-1000/fmm,1]);}
 const widthUm=S=>Math.sqrt(Math.max(0,S.xx))*1e6;
 const divergenceMr=S=>Math.sqrt(Math.max(0,S.tt))*1e3;
 function collinear(r,curve,z){if(!r?.allStable)return null;
   const arr=r.axes.T.field?.curve;if(!arr?.length)return null;
   const axisKey=curve==='T'?'T':'S',a=r.axes[axisKey].field.curve;
   let lo=0,hi=a.length-1;
   if(z<=a[0].zmm)return a[0].wUm;
   if(z>=a[hi].zmm)return a[hi].wUm;
   while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(a[mid].zmm<z)lo=mid;else hi=mid;}
   const x1=a[lo].zmm,x2=a[hi].zmm,t=x2===x1?0:(z-x1)/(x2-x1);return a[lo].wUm+(a[hi].wUm-a[lo].wUm)*t;
 }
 // The squared Bhattacharyya coefficient (BC^2) of two normalized, coaxial
 // elliptic intensity distributions. This is a shape matching index, not an
 // absorbed-pump utilization efficiency or lasing extraction efficiency.
 function overlap(wpx,wpy,wLx,wLy,dxUm=0,dyUm=0){
   if(![wpx,wpy,wLx,wLy].every(x=>Number.isFinite(x)&&x>0))return null;
   const xx=wpx*wpx+wLx*wLx,yy=wpy*wpy+wLy*wLy;
   return Math.max(0,Math.min(1,
     (2*wpx*wLx/xx)*(2*wpy*wLy/yy)*Math.exp(-2*dxUm*dxUm/xx-2*dyUm*dyUm/yy)));
 }
 function compute(raw,r){const x=validate(raw),g=r?.params?.material?.gain;if(!g)throw Error('请先建立 1064 nm 腔模');
   const launchX=waistSigma(x.waistXUm,x.m2x,x.wavelengthNm),launchY=waistSigma(x.waistYUm,x.m2y,x.wavelengthNm);
   const length=g.length,relay=[],gain=[];let sX=launchX,sY=launchY,z=0;
   const pushRelay=(label)=>{relay.push({zmm:z,label,xUm:widthUm(sX),yUm:widthUm(sY),sX:{...sX},sY:{...sY}});};
   const propagate=(length,n=1,steps=25)=>{const startX={...sX},startY={...sY},begin=z;
      for(let i=1;i<=steps;i++){const u=length*i/steps;relay.push({zmm:begin+u,xUm:widthUm(free(startX,u,n)),yUm:widthUm(free(startY,u,n)),label:''});}
      sX=free(sX,length,n);sY=free(sY,length,n);z=begin+length;
   };
   pushRelay('等效输入腰面');propagate(x.sourceToF1Mm,1,20);pushRelay('f₁ 前');sX=lens(sX,x.f1Mm);sY=lens(sY,x.f1Mm);pushRelay('f₁ 后');
   propagate(x.f1ToF2Mm,1,32);pushRelay('f₂ 前');sX=lens(sX,x.f2Mm);sY=lens(sY,x.f2Mm);pushRelay('f₂ 后');
   propagate(x.f2ToGainMm,1,20);pushRelay('Nd 前表面');
   const frontX={...sX},frontY={...sY},frontMm=z;
   const gFront=r.rows.find(row=>row.key==='gainFront');if(!gFront)throw Error('缺少 Nd:YVO₄ 前表面的 1064 参考面');
   const steps=80;let numer=0,denom=0;
   for(let i=0;i<=steps;i++){
     const zz=length*i/steps,px=free(frontX,zz,x.nPump),py=free(frontY,zz,x.nPump);
     const wpx=widthUm(px),wpy=widthUm(py);
     const wz=gFront.zmm+zz,wLT=collinear(r,'T',wz),wLS=collinear(r,'S',wz);
     const match=overlap(wpx,wpy,wLT,wLS,x.offsetXUm,x.offsetYUm);
     const absorptionWeight=x.absorptionPerMm*Math.exp(-x.absorptionPerMm*zz);
     const wt=i===0||i===steps?0.5:1;
     if(match!==null){numer+=wt*absorptionWeight*match;denom+=wt*absorptionWeight;}
     gain.push({zmm:zz,pXUm:wpx,pYUm:wpy,wLTUm:wLT,wLSUm:wLS,match,absorptionWeight,
       absorbedWPerMm:x.powerW*x.transmission*absorptionWeight});
   }
   // trapezoidal weights cancel in the ratio; the actual absorbed power uses the exact Beer-Lambert formula.
   const absorbedFraction=-Math.expm1(-x.absorptionPerMm*length);
   const incidentOnGainW=x.powerW*x.transmission,absorbedW=incidentOnGainW*absorbedFraction;
   const quantumDefect=Math.max(0,1-x.wavelengthNm/r.params.lambdaNm);
   const sample=(f)=>gain[Math.round(f*steps)];
   return {params:x,relay,gain,frontMm,lengthMm:length,
     planes:{front:sample(0),center:sample(0.5),back:sample(1)},
     power:{sourceW:x.powerW,incidentW:incidentOnGainW,absorbedW,absorbedFraction,
       lowerBoundQuantumDefectW:absorbedW*quantumDefect,quantumDefect},
     weightedMatch:denom>0?numer/denom:null,
     stable:!!r.allStable,initialHalfAngleXMr:divergenceMr(launchX),initialHalfAngleYMr:divergenceMr(launchY),
     invariantX:Math.sqrt(Math.max(0,sX.xx*sX.tt-sX.xt*sX.xt))*Math.PI/(x.wavelengthNm*1e-9),
     invariantY:Math.sqrt(Math.max(0,sY.xx*sY.tt-sY.xt*sY.xt))*Math.PI/(x.wavelengthNm*1e-9)};
 }
 function numericCheck(){
   const laser={params:{lambdaNm:1064,material:{gain:{length:8}}},allStable:true,
     rows:[{key:'gainFront',zmm:0}],axes:{T:{field:{curve:[{zmm:0,wUm:200},{zmm:8,wUm:200}]}},S:{field:{curve:[{zmm:0,wUm:200},{zmm:8,wUm:200}]}}}};
   let s=waistSigma(200,1,808);let p=free(s,100);let expected=Math.sqrt((200e-6)**2+(808e-9*0.1/(Math.PI*200e-6))**2);
   if(Math.abs(widthUm(p)-expected*1e6)>1e-8)throw Error('泵浦自由传播 M² 检验失败');
   s=lens(s,200);const back=lens(s,-200);if(Math.abs(back.xx-waistSigma(200,1,808).xx)>1e-18)throw Error('薄透镜逆变换失败');
   if(Math.abs(overlap(200,200,200,200)-1)>1e-13)throw Error('模式匹配标准化错误');
   if(overlap(100,100,200,200)>=1||overlap(200,200,200,200,300,0)>=1)throw Error('失配测试失败');
   const r=compute(DEFAULT,laser), f=1-Math.exp(-DEFAULT.absorptionPerMm*8);
   if(Math.abs(r.power.absorbedFraction-f)>1e-12)throw Error('泵浦吸收错误');
   if(Math.abs(r.invariantX-DEFAULT.m2x)>1e-7||Math.abs(r.invariantY-DEFAULT.m2y)>1e-7)throw Error('二阶矩 M² 不守恒');
   const unstable=clone(laser);unstable.allStable=false;
   if(compute(DEFAULT,unstable).weightedMatch!==null)throw Error('失稳腔不能计算匹配度');
   return {pass:true,absorbedFraction:f,match:r.weightedMatch,sourceM2:[r.invariantX,r.invariantY]};
 }
 return {DEFAULT,clone,validate,waistSigma,transform,free,lens,widthUm,overlap,compute,numericCheck};
});