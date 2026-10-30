'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('../src/physics.js'),Accounts=require('./accounts.cjs');
const vm=require('node:vm'),quizScope={};vm.createContext(quizScope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/quizzes.js'),'utf8')+';globalThis.bank=QUIZZES',quizScope);const QUIZZES=quizScope.bank;
const ROOT=path.resolve(__dirname,'..'),rooms=new Map(),limits=new Map();
const NAMES=['빙이','설이','눈이','동이','콩이'];
const PORT=Number(process.env.PORT)||8767;
const safeName=value=>String(value||'친구').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,12)||'친구';
const key=()=>crypto.randomBytes(24).toString('hex');
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function error(text,status=400){const e=new Error(text);e.status=status;throw e;}
function makeRoom(name){let code;do{code=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));
 const r={code,phase:'waiting',members:[],bodies:[],points:[0,0,0,0,0],levels:[1,1,1,1,1],scores:[0,0,0,0,0],round:1,turn:1,size:P.START_SIZE,stall:0,lastSurvivors:5,plans:new Map(),events:[],seq:0,deadline:0,updated:Date.now(),quizOrder:[...Array(QUIZZES.length).keys()].sort(()=>Math.random()-.5)};
 rooms.set(code,r);const m=addMember(r,name);r.host=m.token;return {r,m};
}
function addMember(r,name){if(r.phase!=='waiting')error('이미 경기 중인 방이에요. 다음 경기는 새 방에서 만나요.');if(r.members.length>=5)error('방이 꽉 찼어요.');const used=new Set(r.members.map(m=>m.slot));let slot=0;while(used.has(slot))slot++;
 const base=safeName(name);let unique=base,n=2;while(r.members.some(p=>p.name===unique))unique=base+' '+n++;
 const m={token:key(),name:unique,slot,stream:null,disconnected:Date.now(),learning:0,correct:0,answers:0,answeredRound:0,readyRound:0,feedback:null};r.members.push(m);r.updated=Date.now();return m;
}
function matchmake(name){
 const now=Date.now();
 const available=[...rooms.values()].find(r=>r.automatic&&r.phase==='waiting'&&r.matchDeadline>now&&r.members.length<5);
 if(available)return {r:available,m:addMember(available,name)};
 if(rooms.size>=100)error('지금은 경기가 많아요. 잠시 후 다시 시도해주세요.',503);
 const result=makeRoom(name);result.r.automatic=true;result.r.matchDeadline=now+8000;return result;
}
function emit(r,type,data={}){r.events.push({seq:++r.seq,type,...data});if(r.events.length>30)r.events.shift();}
function snapshot(r,m){return {solo:!!r.solo,paused:!!r.paused,points:r.points,levels:r.levels,profile:Accounts.byId(m.userId),code:r.code,phase:r.phase,host:r.host===m.token,automatic:!!r.automatic,matchDeadline:r.matchDeadline||0,you:m.slot,members:r.members.map(p=>({slot:p.slot,name:p.name,connected:!!p.stream,host:p.token===r.host})),bodies:r.bodies.map(b=>({id:b.id,name:b.name,x:b.x,z:b.z,vx:b.vx,vz:b.vz,mass:b.mass,alive:b.alive,bot:!r.members.some(p=>p.slot===b.id)})),scores:r.scores,round:r.round,turn:r.turn,size:r.size,events:r.events,deadline:r.deadline,now:Date.now(),ready:[...r.plans.keys()],winner:r.winner??-1,learning:m.learning,correct:m.correct,answers:m.answers,feedback:m.feedback,answered:m.answeredRound===r.round,quiz:r.phase==='quiz'?{q:QUIZZES[r.quizIndices[m.quizStep||0]].q,a:QUIZZES[r.quizIndices[m.quizStep||0]].a,number:(m.quizStep||0)+1,total:3}:null};}
function broadcast(r){for(const m of r.members)if(m.stream&&!m.stream.destroyed){if(m.stream.writableLength>256000){m.stream.destroy();continue;}m.stream.write('data: '+JSON.stringify(snapshot(r,m))+'\n\n');}}
function newRound(r){r.bodies=Array.from({length:r.capacity||5},(_,id)=>{const a=id/5*Math.PI*2+Math.PI/2;return {id,name:r.members.find(m=>m.slot===id)?.name||NAMES[id],x:Math.cos(a)*2.9,z:Math.sin(a)*2.9,vx:0,vz:0,mass:1,alive:true};});r.size=P.START_SIZE;r.turn=1;r.stall=0;r.lastSurvivors=5;r.members.forEach(m=>{m.feedback=null;});newTurn(r);}
function newTurn(r){const n=r.bodies.filter(b=>b.alive).length;if(n<=1){endRound(r);return;}
 if(n<r.lastSurvivors)r.stall=0;else if(r.turn>1)r.stall++;const before=r.size;r.size=P.nextSize(r.bodies,r.size,r.stall);r.lastSurvivors=n;if(r.size<before-.01){emit(r,'shrink',{size:r.size});for(const b of r.bodies)if(b.alive){r.levels[b.id]++;award(r,b.id,10,'shrink');}}
 r.hitPairs=new Set();r.plans=new Map();r.phase='plan';r.deadline=Date.now()+10000;r.drafts=new Map();
}
function everyonePlanned(r){const humans=r.members.filter(m=>r.bodies[m.slot]?.alive);return humans.every(m=>m.stream&&r.plans.has(m.slot));}
function countdown(r){if(r.phase!=='plan')return;
 for(const b of r.bodies)if(b.alive&&!r.plans.has(b.id))r.plans.set(b.id,r.members.some(m=>m.slot===b.id)?r.drafts.get(b.id)||{angle:Math.atan2(-b.z,-b.x),power:.45}:P.aiPlan(b,r.bodies,r.size));
 r.phase='countdown';r.deadline=Date.now()+1200;emit(r,'countdown');
}
function startSimulation(r){for(const b of r.bodies)if(b.alive){const plan=r.plans.get(b.id);P.launch(b,plan.angle,plan.power);}r.phase='simulate';r.simTime=0;r.rest=0;r.acc=0;emit(r,'launch');}
function award(r,slot,points,reason){r.points[slot]+=points;const member=r.members.find(m=>m.slot===slot);if(member)Accounts.award(member.userId,points,r.points[slot],r.levels[slot]);emit(r,'points',{slot,points,reason,score:r.points[slot]});}
function collided(r,a,b,nx,nz,impulse,push){
 emit(r,'collision',{a:a.id,b:b.id,nx,nz,impulse});if(!push)return;
 const plan=r.plans.get(push.pusher),sign=push.pusher===a.id?1:-1,key=push.pusher+':'+push.victim;
 const aimed=plan&&(Math.cos(plan.angle)*nx+Math.sin(plan.angle)*nz)*sign>.5;
 r.hitPairs??=new Set();if(aimed&&!r.hitPairs.has(key)){r.hitPairs.add(key);award(r,push.pusher,15,'hit');}
}
function fell(r,b){emit(r,'fall',{slot:b.id});const member=r.members.find(m=>m.slot===b.id);if(member)saveRun(r,member);}
function saveRun(r,member){if(r.bodies.length)Accounts.record(member.userId,r.code+':'+r.round+':'+member.slot,r.points[member.slot],r.levels[member.slot],r.solo?'solo':'online');}
function endRound(r){if(r.phase==='quiz'||r.phase==='round-end'||r.phase==='finished')return;const live=r.bodies.filter(b=>b.alive);r.winner=live.length===1?live[0].id:-1;if(r.winner>=0){r.scores[r.winner]++;}r.members.forEach(m=>saveRun(r,m));r.phase='round-end';r.deadline=Date.now()+1600;emit(r,'round-end',{winner:r.winner});}
function quiz(r){
 r.quizIndices=[];while(r.quizIndices.length<3){if(!r.quizOrder.length)r.quizOrder=[...Array(QUIZZES.length).keys()].sort(()=>Math.random()-.5);const index=r.quizOrder.pop();if(!r.quizIndices.includes(index))r.quizIndices.push(index);}
 r.phase='quiz';r.deadline=Date.now()+180000;r.members.forEach(m=>{m.quizStep=0;m.feedback=null;m.answeredRound=0;m.readyRound=0;});
}
function afterQuiz(r){r.phase='finished';r.deadline=0;}
function removeMember(r,m){saveRun(r,m);if(m.stream){m.stream.end();m.stream=null;}r.members=r.members.filter(p=>p!==m);if(r.host===m.token)r.host=r.members[0]?.token;
 if(r.bodies[m.slot])r.bodies[m.slot].name=NAMES[m.slot];emit(r,'left',{slot:m.slot});if(!r.members.length)rooms.delete(r.code);else broadcast(r);
}
function action(r,m,body){r.updated=Date.now();
 switch(body.type){
 case 'start':if(r.host!==m.token)error('방장만 시작할 수 있어요.',403);if(!['waiting','finished'].includes(r.phase))error('이미 경기 중이에요.');r.scores.fill(0);r.points.fill(0);r.levels.fill(1);r.round=1;r.members.forEach(p=>{p.learning=0;p.correct=0;p.answers=0;p.answeredRound=0;p.readyRound=0;});newRound(r);break;
 case 'pause':if(!r.solo)error('함께하는 경기는 멈출 수 없어요.');r.paused=!r.paused;break;
 case 'draft':if(r.phase==='plan'&&!r.paused&&body.turn===r.turn&&r.bodies[m.slot]?.alive&&!r.plans.has(m.slot)&&Number.isFinite(body.angle)&&Number.isFinite(body.power))r.drafts.set(m.slot,{angle:body.angle%(Math.PI*2),power:Math.max(.1,Math.min(1,body.power))});return;
 case 'plan':if(r.phase!=='plan'||!r.bodies[m.slot]?.alive)error('지금은 조준할 수 없어요.');if(r.plans.has(m.slot))error('이미 방향을 확정했어요.');if(!Number.isFinite(body.angle)||!Number.isFinite(body.power))error('방향이나 세기가 올바르지 않아요.');r.plans.set(m.slot,{angle:body.angle%(Math.PI*2),power:Math.max(.1,Math.min(1,body.power))});if(everyonePlanned(r))countdown(r);break;
 case 'answer':if(r.phase!=='quiz'||m.feedback)error('이미 퀴즈를 풀었거나 퀴즈 시간이 아니에요.');if(!Number.isInteger(body.answer)||body.answer<0||body.answer>2)error('답을 골라주세요.');const q=QUIZZES[r.quizIndices[m.quizStep||0]],ok=body.answer===q.ok;m.answers++;if(m.quizStep===2)m.answeredRound=r.round;if(ok){m.correct++;}m.feedback={ok,answer:body.answer,correct:q.ok,why:q.why};break;
 case 'continue':if(r.phase!=='quiz'||!m.feedback)error('퀴즈를 먼저 풀어주세요.');if(m.quizStep<2){m.quizStep++;m.feedback=null;break;}m.readyRound=r.round;if(r.members.filter(p=>p.stream).every(p=>p.readyRound===r.round))afterQuiz(r);break;
 case 'leave':removeMember(r,m);return;
 default:error('알 수 없는 요청이에요.');
 }broadcast(r);
}
let previous=Date.now(),broadcastTicks=0;
const timer=setInterval(()=>{const now=Date.now(),dt=Math.min((now-previous)/1000,.1);previous=now;
 for(const r of rooms.values()){
  for(const m of [...r.members])if(!m.stream&&now-m.disconnected>30000)removeMember(r,m);
  if(!rooms.has(r.code))continue;
  if(now-r.updated>2*60*60*1000){r.members.forEach(m=>m.stream?.end());rooms.delete(r.code);continue;}
  if(r.paused){if(r.deadline)r.deadline+=dt*1000;if(broadcastTicks%3===0)broadcast(r);continue;}
  if(r.phase==='waiting'&&r.automatic){const connected=r.members.filter(m=>m.stream);if(connected.length===5||(now>=r.matchDeadline&&connected.length)){for(const m of [...r.members])if(!m.stream)removeMember(r,m);if(rooms.has(r.code))newRound(r);}}
  if(r.phase==='plan'&&((r.deadline&&now>=r.deadline)||everyonePlanned(r)))countdown(r);
  else if(r.phase==='countdown'&&now>=r.deadline)startSimulation(r);
  else if(r.phase==='simulate'){
   r.acc+=dt;while(r.acc>=1/120){r.acc-=1/120;r.simTime+=1/120;P.step(r.bodies,1/120,r.size,(a,b,nx,nz,impulse,push)=>collided(r,a,b,nx,nz,impulse,push),b=>fell(r,b));}
   const moving=r.bodies.some(b=>b.alive&&Math.hypot(b.vx,b.vz)>.06);if(!moving||r.bodies.filter(b=>b.alive).length<=1)r.rest+=dt;else r.rest=0;
   if(r.rest>1||r.simTime>7){r.bodies.forEach(b=>b.vx=b.vz=0);if(r.bodies.filter(b=>b.alive).length<=1)endRound(r);else{r.turn++;newTurn(r);}}
  }else if(r.phase==='round-end'&&now>=r.deadline)quiz(r);
  else if(r.phase==='quiz'&&now>=r.deadline)afterQuiz(r);
  if(broadcastTicks%3===0)broadcast(r);
 }
 broadcastTicks++;
},30);
async function readBody(req){let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)error('요청이 너무 커요.',413);}try{return JSON.parse(data||'{}');}catch{error('요청 형식이 올바르지 않아요.');}}
const allowed=new Map([['/','얼음땡.html'],['/src/index.html','src/index.html'],['/src/style.css','src/style.css'],['/src/game.js','src/game.js'],['/src/online.js','src/online.js'],['/src/account.js','src/account.js'],['/src/physics.js','src/physics.js'],['/src/quizzes.js','src/quizzes.js'],['/vendor/three.min.js','vendor/three.min.js'],['/얼음땡.html','얼음땡.html']]);
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
 try{
  const url=new URL(req.url,'http://localhost'),route=decodeURIComponent(url.pathname);
  if(route==='/api/auth/me'&&req.method==='GET')return json(res,200,{user:Accounts.profile(Accounts.current(req))});
  if(route==='/api/personal-ranking'&&req.method==='GET')return json(res,200,{records:Accounts.personal(Accounts.requireUser(req).id)});
  if(route==='/api/ranking'&&req.method==='GET')return json(res,200,{ranking:Accounts.ranking()});
  if(route==='/api/health')return json(res,200,{ok:true,version:2});
  if(route.startsWith('/api/')){
   const ip=req.socket.remoteAddress,now=Date.now();let limit=limits.get(ip);if(!limit||now-limit.since>60000){limit={since:now,count:0};limits.set(ip,limit);}if(++limit.count>240)return json(res,429,{error:'잠시 후 다시 시도해주세요.'});
   if(route==='/api/events'&&req.method==='GET'){
    const r=rooms.get(url.searchParams.get('room')),m=r?.members.find(p=>p.token===url.searchParams.get('token'));if(!m||m.userId!==Accounts.requireUser(req).id)error('경기 연결이 만료됐어요. 다시 참가해주세요.',403);
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');if(m.stream)m.stream.end();m.stream=res;m.disconnected=0;r.updated=now;
    req.on('close',()=>{if(m.stream===res){m.stream=null;m.disconnected=Date.now();broadcast(r);}});broadcast(r);return;
   }
   if(req.method!=='POST')error('지원하지 않는 요청이에요.',405);
   // Anonymous game actions must originate on this same game origin.
   if(req.headers.origin){const origin=new URL(req.headers.origin);const host=req.headers['x-forwarded-host']||req.headers.host;const publicHost=process.env.PUBLIC_URL?new URL(process.env.PUBLIC_URL).host:'';if(origin.host!==host&&origin.host!==publicHost)error('게임 화면에서 다시 시도해주세요.',403);}
   const body=await readBody(req);
   if(route.startsWith('/api/auth/')){const result=await Accounts.handle(route,body,req,res);if(result)return json(res,200,result);error('없는 주소예요.',404);}
   const user=Accounts.requireUser(req);
   if(route==='/api/solo'){const {r,m}=makeRoom(user.nickname);m.userId=user.id;r.solo=true;r.capacity=body.count===4?4:5;newRound(r);return json(res,200,{code:r.code,token:m.token});}
   if(route==='/api/match'){const {r,m}=matchmake(user.nickname);m.userId=user.id;broadcast(r);return json(res,200,{code:r.code,token:m.token});}
   if(route==='/api/rooms'){if(rooms.size>=100)error('현재 방이 많아요. 잠시 후 다시 시도해주세요.',503);const {r,m}=makeRoom(user.nickname);m.userId=user.id;return json(res,201,{code:r.code,token:m.token});}
   if(route==='/api/join'){const r=rooms.get(String(body.code).toUpperCase());if(!r)error('방 코드를 찾을 수 없어요.',404);const m=addMember(r,user.nickname);m.userId=user.id;broadcast(r);return json(res,200,{code:r.code,token:m.token});}
   if(route==='/api/action'){const r=rooms.get(String(body.code).toUpperCase()),m=r?.members.find(p=>p.token===body.token);if(!m||m.userId!==user.id)error('경기 연결이 만료됐어요.',403);action(r,m,body);return json(res,200,{ok:true});}
   error('없는 주소예요.',404);
  }
  if(req.method!=='GET'&&req.method!=='HEAD')error('지원하지 않는 요청이에요.',405);
  const file=allowed.get(route);if(!file)error('없는 주소예요.',404);
  const ext=path.extname(file),type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[ext];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(path.join(ROOT,file)).pipe(res);
 }catch(e){if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'서버 처리 중 문제가 생겼어요.'});else res.end();}
});
if(require.main===module)Accounts.ready.then(()=>server.listen(PORT,'0.0.0.0',()=>console.log('얼음땡 서버 준비 완료 · port '+PORT))).catch(()=>{console.error('데이터베이스 연결 또는 초기화에 실패했습니다.');process.exit(1);});
server.on('close',()=>clearInterval(timer));
module.exports={server,rooms,matchmake,makeRoom,addMember,action,snapshot,newRound,newTurn,afterQuiz,award,collided,fell};
