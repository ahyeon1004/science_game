/* Shared square-rink physics. Server and offline game use the same rules. */
(function(root){
 'use strict';
 const R=.48,START_SIZE=5.4;
 function outside(b,size){return Math.abs(b.x)>size+.12||Math.abs(b.z)>size+.12;}
 function step(bodies,dt,size,onCollision,onFall){
  for(const b of bodies){if(!b.alive)continue;b.x+=b.vx*dt;b.z+=b.vz*dt;
   const s=Math.hypot(b.vx,b.vz),next=Math.max(0,s-1.75*dt);if(s){b.vx*=next/s;b.vz*=next/s;}}
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
   const a=bodies[i],b=bodies[j];if(!a.alive||!b.alive)continue;
   const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=R*2)continue;
   const nx=d>1e-5?dx/d:1,nz=d>1e-5?dz/d:0,ia=1/a.mass,ib=1/b.mass,overlap=R*2-d;
   a.x-=nx*overlap*ia/(ia+ib);a.z-=nz*overlap*ia/(ia+ib);b.x+=nx*overlap*ib/(ia+ib);b.z+=nz*overlap*ib/(ia+ib);
   const relative=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;if(relative>=0)continue;
   const approachA=a.vx*nx+a.vz*nz,approachB=-b.vx*nx-b.vz*nz;
   const push=Math.abs(approachA-approachB)>.15?{pusher:approachA>approachB?a.id:b.id,victim:approachA>approachB?b.id:a.id}:null;
   const impulse=-(1+.82)*relative/(ia+ib);
   a.vx-=impulse*nx*ia;a.vz-=impulse*nz*ia;b.vx+=impulse*nx*ib;b.vz+=impulse*nz*ib;
   if(impulse>.25&&onCollision)onCollision(a,b,nx,nz,impulse,push);
  }
  for(const b of bodies)if(b.alive&&outside(b,size)){b.alive=false;b.vx*=.45;b.vz*=.45;b.fall=0;if(onFall)onFall(b);}
 }
 function launch(b,angle,power){const speed=1.6+Math.max(.1,Math.min(1,power))*4.8;b.vx=Math.cos(angle)*speed;b.vz=Math.sin(angle)*speed;}
 function nextSize(bodies,current,stall=0){
  const alive=bodies.filter(b=>b.alive),desired=Math.max(2.4,START_SIZE-(5-alive.length)*.65-Math.max(0,stall-2)*.12);
  // Never remove the ice directly under a surviving penguin between turns.
  const safe=Math.max(0,...alive.map(b=>Math.max(Math.abs(b.x),Math.abs(b.z))+.52));
  return Math.min(current,Math.max(desired,safe));
 }
 function aiPlan(b,bodies,size,random=Math.random){
  const targets=bodies.filter(p=>p.alive&&p!==b);if(!targets.length)return {angle:0,power:.1};
  const target=targets.sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z))[0];
  const edge=Math.max(Math.abs(b.x),Math.abs(b.z))>size*.88,choice=random();let dx,dz,power;
  if(edge&&choice<.65){dx=-b.x;dz=-b.z;power=.28+random()*.2;}
  else if(choice<.12){const dir=random()<.5?1:-1;dx=-(target.z-b.z)*dir-b.x*.3;dz=(target.x-b.x)*dir-b.z*.3;power=.22+random()*.2;}
  else if(choice<.23){dx=-b.x+(random()-.5)*3;dz=-b.z+(random()-.5)*3;power=.18+random()*.22;}
  else{dx=target.x-b.x;dz=target.z-b.z;const distance=Math.hypot(dx,dz);power=Math.min(1,Math.max(.55,(Math.sqrt(3.5*(distance+2.5))-1.6)/4.8));}
  return {angle:Math.atan2(dz,dx)+(random()-.5)*.55,power};
 }
 const api={step,launch,aiPlan,nextSize,outside,R,START_SIZE};if(typeof module!=='undefined')module.exports=api;root.IcePhysics=api;
})(typeof window!=='undefined'?window:globalThis);
