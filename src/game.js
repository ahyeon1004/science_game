/* 얼음땡 — local, offline 3D game. Geometry is original and generated in code. */
(function(){
'use strict';
const $=id=>document.getElementById(id),world=$('world');
if(!window.THREE){$('loading').textContent='3D 파일을 불러오지 못했어요. 최종 실행 파일 ‘얼음땡.html’을 다시 열어주세요.';return;}
const T=THREE,P=IcePhysics;
const PALETTE=['#e94e53','#f1c549','#79a74e','#f0a0bb','#8bcdfa'];
const NAMES=['땡이','빙이','설이','눈이','동이'];
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('loading').textContent='3D 화면을 열 수 없어요. Chrome 또는 Safari에서 하드웨어 가속을 켠 뒤 다시 열어주세요.';$('start').disabled=$('friends').disabled=true;return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
world.appendChild(renderer.domElement);$('loading').hidden=true;
const scene=new T.Scene();scene.background=new T.Color('#91d9ff');scene.fog=new T.Fog('#bbebff',45,130);
const camera=new T.PerspectiveCamera(35,1,.06,180);
scene.add(new T.HemisphereLight('#f7ffff','#829dba',2.5));
const sun=new T.DirectionalLight('#fff8e7',3);sun.position.set(-8,19,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.04;scene.add(sun);
const mat=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
const dark=mat('#303441',.52),cream=mat('#fffaf3',.66),beak=mat('#ffa82c',.4),eyeMat=mat('#152d3a'),glint=mat('#ffffff'),blush=mat('#efbbaf');
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(parent,material,x,y,z,sx,sy,sz){const m=mesh(new T.SphereGeometry(1,24,18),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function penguin(color){
 const g=new T.Group(),torso=new T.Group();g.add(torso);
 ball(torso,dark,0,.77,0,.64,.73,.53);
 ball(torso,cream,0,.66,.385,.5,.54,.19);
 ball(torso,dark,0,1.26,0,.64,.61,.53);
 ball(torso,cream,-.22,1.24,.385,.335,.4,.18);ball(torso,cream,.22,1.24,.385,.335,.4,.18);
 for(const x of [-.24,.24]){ball(torso,eyeMat,x,1.35,.544,.079,.095,.05);ball(torso,glint,x-.022,1.384,.579,.025,.029,.016);ball(torso,blush,x*1.55,1.19,.535,.105,.057,.016);}
 ball(torso,beak,0,1.19,.595,.16,.086,.155);
 const lip=mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.14,1.18,.654),new T.Vector3(0,1.17,.748),new T.Vector3(.14,1.18,.654)]),12,.009,5,false),mat('#d27925'),torso);
 const left=ball(torso,dark,-.62,.72,0,.16,.41,.22),right=ball(torso,dark,.62,.72,0,.16,.41,.22);left.rotation.z=-.3;right.rotation.z=.3;
 for(const x of [-.29,.29])for(let toe=-1;toe<=1;toe++)ball(g,beak,x+toe*.09,.12,.19,.105,.11,.24-Math.abs(toe)*.025);
 const scarf=mat(color,.95);const neck=mesh(new T.TorusGeometry(.53,.105,12,48),scarf,torso,0,1,.025);neck.scale.z=1.12;neck.rotation.x=Math.PI/2;
 const tail=mesh(new T.CapsuleGeometry(.095,.24,5,12),scarf,torso,.35,.8,.53);tail.scale.x=1.45;tail.rotation.z=-.14;
 for(let i=0;i<4;i++)ball(torso,scarf,.25+i*.065,.55,.56,.032,.09,.035);
 g.userData={torso,left,right};return g;
}
const ocean=mesh(new T.PlaneGeometry(240,240),mat('#32b5e6',.35),scene,0,-1.28,0);ocean.rotation.x=-Math.PI/2;ocean.castShadow=false;
const iceGroup=new T.Group();scene.add(iceGroup);
const ICE_SIZE=5.4;
mesh(new T.BoxGeometry(10.8,.65,10.8),mat('#88cfee'),iceGroup,0,-.34,0);
mesh(new T.BoxGeometry(10.8,.13,10.8),mat('#e6f8ff'),iceGroup,0,.025,0);
mesh(new T.BoxGeometry(10.45,.18,10.45),mat('#55b6df'),iceGroup,0,-.74,0);
const lineMat=new T.LineBasicMaterial({color:'#c8dfdf'});
const border=new T.BufferGeometry().setFromPoints([new T.Vector3(-4.95,.1,-4.95),new T.Vector3(4.95,.1,-4.95),new T.Vector3(4.95,.1,4.95),new T.Vector3(-4.95,.1,4.95)]);
iceGroup.add(new T.LineLoop(border,lineMat));
for(let i=0;i<80;i++){const x=((i*47)%101)/101*9.7-4.85,z=((i*67)%103)/103*9.7-4.85;const snow=mesh(new T.CircleGeometry(.025+(i%5)*.009,6),mat(i%3?'#dfeeed':'#ffffff'),iceGroup,x,.098,z);snow.rotation.x=-Math.PI/2;snow.castShadow=false;}
function textTexture(text,color='#8ab5b9'){const c=document.createElement('canvas');c.width=1024;c.height=256;const cx=c.getContext('2d');cx.fillStyle=color;cx.font='700 94px sans-serif';cx.textAlign='center';cx.fillText(text,512,150);return new T.CanvasTexture(c);}
const stamp=mesh(new T.PlaneGeometry(5.5,1.38),new T.MeshBasicMaterial({map:textTexture(''),transparent:true,depthWrite:false,opacity:0}),iceGroup,0,.08,.5);stamp.rotation.x=-Math.PI/2;stamp.castShadow=false;
function island(x,z,size){
 const g=new T.Group();g.position.set(x,-1.05,z);scene.add(g);
 mesh(new T.CylinderGeometry(size,size*.87,.9,7),mat('#94d6f4'),g,0,0,0);
 for(let i=0;i<3;i++){
 const rock=mesh(new T.CylinderGeometry(size*.2,size*(.4+i*.11),size*(.9+i*.28),5),mat(i%2?'#b8e7fc':'#e6f7ff'),g,(i-1)*size*.45,size*(.5+i*.15),i%2*size*.18);rock.rotation.y=i;
 const cap=mesh(new T.CylinderGeometry(size*(.08+i*.02),size*(.22+i*.055),size*(.43+i*.11),5),mat('#f8fdff'),g,(i-1)*size*.45,size*(.96+i*.24),i%2*size*.18);cap.rotation.y=i;
 }
 return g;
}
for(let i=0;i<14;i++){const a=i/14*Math.PI*2;island(Math.cos(a)*38,Math.sin(a)*38,3.7+(i%4)*1.3);}
for(let i=0;i<26;i++){const a=i*2.399,r=13+i%5*3;const chunk=mesh(new T.CylinderGeometry(.6+(i%3)*.4,.65,.38,6),mat('#e7f8ff'),scene,Math.cos(a)*r,-1.04,Math.sin(a)*r);chunk.rotation.y=a;chunk.castShadow=false;}
for(let i=0;i<13;i++){const cloud=new T.Group(),a=i/13*Math.PI*2;cloud.position.set(Math.cos(a)*57,8+(i%3)*2,Math.sin(a)*57);scene.add(cloud);for(let j=0;j<4;j++)ball(cloud,mat('#f4fcff'),j*2-3,Math.sin(j)*.8,0,2.7,1.5+j%2,1.7);}
for(let i=0;i<42;i++){const a=i*2.399,r=1+((i*43)%100)/100*4.1;const patch=mesh(new T.CircleGeometry(.22+(i%4)*.12,3),new T.MeshBasicMaterial({color:i%2?'#c6eaff':'#effcff',transparent:true,opacity:.55}),iceGroup,Math.cos(a)*r,.103,Math.sin(a)*r);patch.rotation.x=-Math.PI/2;patch.rotation.z=a;patch.castShadow=false;}
const waves=[];for(let i=0;i<14;i++){const ring=mesh(new T.TorusGeometry(.6+(i%3)*.4,.015,4,40),new T.MeshBasicMaterial({color:'#d5e9e7',transparent:true,opacity:.45}),scene,Math.cos(i*2.4)*(9+i%3*4),-1.19,Math.sin(i*2.4)*(9+i%3*4));ring.rotation.x=Math.PI/2;ring.scale.y=.45;ring.castShadow=false;waves.push(ring);}
const snowGeo=new T.BufferGeometry(),snowArray=new Float32Array(110*3);for(let i=0;i<110;i++){snowArray[i*3]=(Math.random()-.5)*45;snowArray[i*3+1]=3+Math.random()*13;snowArray[i*3+2]=(Math.random()-.5)*35;}snowGeo.setAttribute('position',new T.BufferAttribute(snowArray,3));const flakes=new T.Points(snowGeo,new T.PointsMaterial({color:'#ffffff',size:.055,transparent:true,opacity:.7}));scene.add(flakes);
const aimArrow=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(0,.17,0),3,'#177c79',.48,.3);scene.add(aimArrow);
const playerRing=mesh(new T.TorusGeometry(.68,.025,6,48),new T.MeshBasicMaterial({color:'#177c79'}),scene,0,.1,0);playerRing.rotation.x=Math.PI/2;playerRing.castShadow=false;
let cameraYaw=-Math.PI/2;
let onboardingDone=false,introQuizIndex=0,lastCollisionTurn='',collisionNoticeTimer;
let deathPending=false,deathShown=false,deathPopupActive=false,deathDelay=0;
let roomRenderKey='',quizRenderKey='',onlineDisconnectNotice=0;
let stalledTurns=0,lastSurvivors=5,online=null,onlineState=null,onlineOrder=[],onlineLocked=false,onlineRound=0,onlineTurn=0,onlineEvent=0,onlineQuizRound=0;
let bodies=[],labels=[],sparks=[],forceArrows=[],rippleEffects=[],phase='lobby',paused=false,phaseBeforeModal='',practice=false,practiceHit=false,round=1,turn=1,radius=5.4,scarfIndex=0,count=5,scores=[0,0,0,0,0],learning=0,correct=0,answeredCount=0,deck=[],angle=-Math.PI/2,power=.5,aimed=false,drag=null,simTime=0,restTime=0,phaseTimer=0,clock=0,accumulator=0,last=performance.now(),collisions=0,currentWinner=-1,muted=true,audio=null,lastSound=0,toastTimer;
const projected=new T.Vector3();
function notify(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
function sound(freq=480,duration=.1){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+duration);gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch(e){muted=true;$('sound').textContent='소리 꺼짐';}}
function colorFor(i){if(online&&onlineState)return PALETTE[onlineOrder[i]??i];return PALETTE[(scarfIndex+i)%PALETTE.length];}
function removeEffects(){for(const a of forceArrows){scene.remove(a.mesh);a.mesh.dispose();}forceArrows=[];for(const p of sparks){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();}sparks=[];}
function createBodies(n,demo=false){
 deathPending=false;deathShown=false;deathPopupActive=false;deathDelay=0;clearTimeout(collisionNoticeTimer);$('collision-notice').hidden=true;lastCollisionTurn='';
 bodies.forEach(b=>{scene.remove(b.model);if(b.model.userData.direction){scene.remove(b.model.userData.direction);b.model.userData.direction.dispose();}b.model.traverse(o=>{if(o.geometry)o.geometry.dispose();});});labels.forEach(l=>l.remove());labels=[];removeEffects();
 bodies=Array.from({length:n},(_,i)=>{
 const a=i/n*Math.PI*2+Math.PI/2,r=demo?2.9:2.9;
 const g=penguin(colorFor(i));scene.add(g);const direction=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(0,.15,0),1.5,colorFor(i),.32,.2);direction.visible=false;scene.add(direction);g.userData.direction=direction;
 const b={id:i,name:NAMES[i],x:Math.cos(a)*r,z:Math.sin(a)*r,vx:0,vz:0,mass:1,alive:true,fall:0,model:g};
 g.position.set(b.x,0,b.z);g.rotation.y=demo?.35:Math.atan2(-b.x,-b.z);
 const l=document.createElement('div');l.className='p-label'+(i===0?' mine':'');l.textContent=i===0?'나 · 땡이':b.name;$('labels').appendChild(l);labels.push(l);return b;
 });
}
function resize(){const w=world.clientWidth,h=world.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;const mobile=w<600;camera.position.set(mobile?11:12,mobile?20:17,mobile?19:20);camera.fov=mobile?44:35;camera.lookAt(0,0,0);camera.updateProjectionMatrix();}
scene.add(camera);
function updateCamera(dt){
 const following=phase!=='lobby'&&bodies[0]?.alive;
 $('view-hint').hidden=!following;bodies.forEach(b=>b.model.visible=true);
 if(following){
  const b=bodies[0],diff=Math.atan2(Math.sin(angle-cameraYaw),Math.cos(angle-cameraYaw));cameraYaw+=diff*Math.min(1,dt*10);
  const x=Math.cos(cameraYaw),z=Math.sin(cameraYaw);camera.fov=72;
  camera.position.set(b.x-x*5.5,5.7,b.z-z*5.5);camera.lookAt(b.x+x*2.4,.4,b.z+z*2.4);
  if(phase==='plan')b.model.rotation.y=Math.atan2(x,z);
 }else{camera.fov=world.clientWidth<600?44:35;camera.position.set(12,17,20);camera.lookAt(0,0,0);}
 camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(world);resize();
function setState(next){phase=next;refreshControls();}
function refreshControls(){const planning=phase==='plan'&&!paused&&(!online||!onlineLocked),spectating=planning&&!bodies[0]?.alive;$('launch').disabled=!planning||(!aimed&&!spectating);$('power').disabled=!planning||spectating;$('launch').innerHTML=spectating?'다음 턴 <span>→</span>':'돌진 확정 <span>↗</span>';$('control-label').textContent=practice?'PRACTICE':spectating?'SPECTATING':phase==='simulate'?'ON THE ICE':'YOUR MOVE';$('aim-status').textContent=phase==='simulate'?'미끄러지는 중…':phase==='countdown'?'다 같이, 하나 둘 셋!':spectating?'친구들의 승부를 지켜봐!':aimed?'방향 준비 완료!':'빙판을 드래그해서 조준해!';$('control-help').textContent=spectating?'다음 턴은 자동으로 진행돼요.':'좌우 드래그로 방향 · 위아래로 세기';aimArrow.visible=planning&&bodies[0]?.alive;playerRing.visible=phase!=='lobby'&&bodies[0]?.alive;}
function scoreUI(){$('round-label').textContent=practice?'충돌 연습':`LEVEL ${onlineState?.levels?.[onlineState.you]||round}`;$('turn-label').textContent=`TURN ${String(turn).padStart(2,'0')}`;}
function openModal(kicker,title,html,actions){phaseBeforeModal=phase;paused=true;$('pause').textContent='일시정지';$('modal-kicker').textContent=kicker;$('modal-title').textContent=title;$('modal-content').innerHTML=html;$('modal-actions').replaceChildren();for(const act of actions){const b=document.createElement('button');b.className=act.secondary?'text-btn':act.large?'primary replay-button':'primary';b.textContent=act.label;b.onclick=act.click;$('modal-actions').appendChild(b);}$('modal').hidden=false;setTimeout(()=>$('modal').querySelector('button:not(:disabled)')?.focus(),0);}
function closeModal(){ $('modal').hidden=true;paused=false;refreshControls();}
function showConcept(step=0){
 const lessons=[
  ['힘은 서로 주고받아요.','한 펭귄이 다른 펭귄을 밀면, 상대 펭귄도 동시에 나에게 힘을 가해요. 이것을 <strong>작용·반작용</strong>이라고 해요.'],
  ['크기는 같고, 방향은 반대예요.','내가 상대를 10 N으로 밀면 상대도 나를 <strong>10 N</strong>으로 밀어요. 두 힘의 크기는 같고 방향은 반대예요.'],
  ['서로 다른 펭귄에 작용해요.','내가 가하는 힘은 <strong>상대에게</strong>, 상대가 가하는 힘은 <strong>나에게</strong> 작용해요. 서로 다른 물체에 작용하므로 한 물체에서 서로 상쇄되지 않아요.'],
  ['움직임이 꼭 같지는 않아요.','같은 크기의 힘을 받아도 질량이나 충돌 전 속도에 따라 움직임은 달라질 수 있어요. 게임에서는 <strong>주황색 힘 화살표</strong>로 작용·반작용을 확인해봐요.']
 ];
 const [title,text]=lessons[step];
 openModal(`작용·반작용 개념 ${step+1} / ${lessons.length}`,title,`<div class="lesson-art">← <span>●　●</span> →</div><p>${text}</p>`,[
 {label:step===lessons.length-1?'퀴즈 3개 풀어보기 →':'다음 개념 →',click:()=>{if(step<lessons.length-1)showConcept(step+1);else{introQuizIndex=0;showIntroQuiz();}}},
 ...(step?[{label:'이전 개념',secondary:true,click:()=>showConcept(step-1)}]:[])
 ]);
}
function quizAnswers(q,onAnswer){
 for(const button of $('modal-content').querySelectorAll('[data-answer]'))button.onclick=()=>{
  const selected=Number(button.dataset.answer),ok=selected===q.ok;
  for(const option of $('modal-content').querySelectorAll('[data-answer]')){option.disabled=true;if(Number(option.dataset.answer)===q.ok)option.classList.add('correct');}
  if(!ok)button.classList.add('wrong');sound(ok?760:230,.14);
  $('quiz-feedback').innerHTML=`<strong>${ok?'정답이에요!':'정답을 확인해봐요.'}</strong><br>${escapeHTML(q.why)}`;
  onAnswer(ok);
 };
}
function questionMarkup(q){return `<div class="quiz-answers">${q.a.map((text,i)=>`<button class="quiz-option" data-answer="${i}">${i+1}. ${escapeHTML(text)}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>`;}
function showIntroQuiz(){
 const q=QUIZZES[introQuizIndex];
 openModal(`개념 확인 ${introQuizIndex+1} / 3`,q.q,questionMarkup(q),[]);
 quizAnswers(q,()=>{const next=document.createElement('button');next.className='primary';next.textContent=introQuizIndex===2?'게임 준비하기 →':'다음 문제 →';next.onclick=()=>{introQuizIndex++;if(introQuizIndex<3)showIntroQuiz();else{onboardingDone=true;closeModal();}};$('modal-actions').appendChild(next);next.focus();});
}
function showHelp(){const wasPaused=paused;openModal('HOW TO PLAY / 남극 생존 안내','방향을 정하고, 함께 돌진!',`<p><strong>1.</strong> 좌우로 드래그하거나 방향키를 눌러 바라볼 방향을 정해요. 위아래로 드래그하면 돌진 세기가 달라져요. 힘은 아래 슬라이더로도 바꿀 수 있어요.</p><p><strong>2.</strong> ‘돌진 확정’을 누르면 모두 동시에 출발해요. 움직임이 멈추면 다음 턴이에요.</p><p><strong>3.</strong> 마지막까지 남으면 라운드 승리! 모두 떨어지면 무승부예요. 라운드가 끝나면 퀴즈 3개를 풀고 홈으로 돌아가요. 탈락자가 생기면 다음 턴부터 사각 빙판이 작아져요. 오랫동안 승부가 안 나도 조금씩 줄어요.</p><p><strong>뉴턴 제3법칙</strong> · 충돌 때의 주황색 화살표는 두 펭귄에 작용하는 같은 크기의 반대 방향 힘이에요. 조준 중에는 내 화살표만 보여요. 출발하면 모두의 이동 방향을 목도리 색 화살표로 표시해요.</p><p>키보드: ← → 방향 회전 · ↑ ↓ 힘 조절 · Enter 돌진 · P 일시정지</p>`,[{label:'알겠어, 계속할게',click:()=>{closeModal();if(wasPaused)pauseGame();}}]);}
function beginInterface(){document.body.classList.remove('lobby-view');$('lobby').hidden=true;$('game-ui').hidden=false;$('pause').hidden=$('restart').hidden=false;count=Number($('players').value);requestAnimationFrame(resize);}
async function startMatch(){
 if(!onboardingDone){showConcept();return;}if(!await ensureLogin(startMatch))return;
 if(online){online.leave();online=null;onlineState=null;}openModal('혼자 하기','남극 경기장을 준비하고 있어요.',`<p>기록은 로그인한 계정에 자동 저장돼요.</p>`,[]);connectRoom(true);
}
async function ensureLogin(after){await IceAccount.ready;if(IceAccount.user)return true;notify('게임 시작 전에 로그인해주세요.');showAuth(false,after);return false;}
async function showAuth(register=false,after){
 await IceAccount.ready;
 openModal('나의 남극 기록',register?'닉네임으로 회원가입':'로그인하고 기록을 이어가요.',`<div class="room-fields"><label>닉네임<input id="auth-name" maxlength="12" autocomplete="username" placeholder="2~12자"></label><label>비밀번호<input id="auth-password" type="password" minlength="6" maxlength="128" autocomplete="${register?'new-password':'current-password'}" placeholder="6자 이상"></label></div><p id="auth-error" class="room-error" role="status"></p>`,[
 {label:register?'회원가입하고 시작':'로그인',click:async()=>{const nickname=$('auth-name').value,password=$('auth-password').value;Array.from($('modal-actions').children).forEach(b=>b.disabled=true);try{const result=await IceAccount.request('/api/auth/'+(register?'register':'login'),{nickname,password});IceAccount.update(result.user);closeModal();if(after)after();}catch(e){$('auth-error').textContent=e.message;Array.from($('modal-actions').children).forEach(b=>b.disabled=false);}}},
 {label:register?'로그인으로':'회원가입',secondary:true,click:()=>showAuth(!register,after)},
 {label:'닫기',secondary:true,click:closeModal}
 ]);
}
function showAccount(){if(!IceAccount.user){showAuth();return;}const u=IceAccount.user;openModal('나의 기록',escapeHTML(u.nickname),`<div class="result-line"><span>최고기록</span><strong>${u.best}점</strong></div><div class="result-line"><span>누적 점수</span><strong>${u.total}점</strong></div><div class="result-line"><span>최고 레벨</span><strong>${u.level}</strong></div><p>빙판 축소 +10점 · 조준해서 충돌하면 +15점<br>한 경기의 최고 점수로 랭킹을 정해요.</p>`,[{label:'랭킹 보기',click:()=>showRanking()},{label:'로그아웃',secondary:true,click:async()=>{if(online)goHome();await IceAccount.request('/api/auth/logout',{});IceAccount.update(null);closeModal();}},{label:'닫기',secondary:true,click:closeModal}]);}
async function showRanking(mode='personal'){
 try{
  const user=IceAccount.user;
  const data=mode==='personal'?(user?await IceAccount.request('/api/personal-ranking'):{records:[]}):await IceAccount.request('/api/ranking');
  const tabs=`<div class="rank-tabs"><button data-ranking="personal" class="${mode==='personal'?'selected':''}">내 최고기록 랭킹</button><button data-ranking="global" class="${mode==='global'?'selected':''}">전체 펭귄 랭킹</button></div>`;
  const rows=mode==='personal'?data.records:data.ranking;
  const content=rows.length?`<div class="ranking-table">${rows.map(r=>{const detail=mode==='global'?escapeHTML(r.nickname):r.mode==='previous'?'이전 최고기록':`${r.mode==='solo'?'혼자 하기':'온라인'} · ${new Date(r.at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric'})}`;return `<div class="result-line"><span>${r.rank}. ${detail}</span><strong>${mode==='global'?r.best:r.score}점</strong></div>`;}).join('')}</div>`:`<p>${mode==='personal'&&!user?'로그인하면 나의 역대 기록을 확인할 수 있어요.':'아직 기록이 없어요. 첫 기록을 만들어봐요!'}</p>`;
  openModal(mode==='personal'?'내 경기 기록을 높은 점수순으로':'다른 사람들의 최고기록과 비교',mode==='personal'?'내 최고기록 랭킹':'전체 펭귄 랭킹',tabs+content,[{label:'닫기',click:closeModal}]);
  for(const button of $('modal-content').querySelectorAll('[data-ranking]'))button.onclick=()=>showRanking(button.dataset.ranking);
 }catch(e){notify(e.message);}
}
function setPower(value){power=Math.min(1,Math.max(.1,value));$('power').value=Math.round(power*100);$('power-value').textContent=`${Math.round(power*100)}%`;}
function launchTurn(){if(online)sendOnlinePlan();}
function forcePair(a,b,nx,nz,impulse){
 collisions++;if(practice)practiceHit=true;
 const length=Math.min(2.2,.9+impulse*.1);
 for(const [body,sign] of [[a,-1],[b,1]]){const arrow=new T.ArrowHelper(new T.Vector3(nx*sign,0,nz*sign),new T.Vector3(body.x,.75,body.z),length,'#df8c4c',.3,.19);scene.add(arrow);forceArrows.push({mesh:arrow,life:1.35,body});}
 
 showCollisionNotice(a,b);
 burst((a.x+b.x)/2,.75,(a.z+b.z)/2,'#fff8df',9);
 if(clock-lastSound>.09){sound(270+Math.min(impulse,8)*35,.1);lastSound=clock;}
}
function burst(x,y,z,color,n=12){for(let i=0;i<n;i++){const m=mesh(new T.SphereGeometry(.035+Math.random()*.035,5,4),mat(color),scene,x,y,z);m.castShadow=false;sparks.push({mesh:m,vx:(Math.random()-.5)*3,vy:1+Math.random()*3,vz:(Math.random()-.5)*3,life:.65+Math.random()*.3});}}
function fall(b){b.alive=false;b.fall=0;scoreUI();sound(130,.24);if(b.id===0&&!practice&&!deathShown){deathPending=true;deathDelay=0;$('banner').textContent='첨벙! 아쉽게 빙판 밖으로 떨어졌어.';} }
function showCollisionNotice(a,b){
 const key=round+'-'+turn;if(lastCollisionTurn===key)return;lastCollisionTurn=key;
 const notice=$('collision-notice');notice.innerHTML=`<strong>${escapeHTML(a.name)} ↔ ${escapeHTML(b.name)}</strong><span>작용·반작용: 크기는 같고 방향은 반대</span><small>각각 다른 펭귄에 힘이 작용했어요.</small>`;notice.hidden=false;
 clearTimeout(collisionNoticeTimer);collisionNoticeTimer=setTimeout(()=>notice.hidden=true,3800);
}
function maybeShowDefeat(dt){
 if(!deathPending||deathShown||practice)return;
 deathDelay+=dt;if(deathDelay<.7||!$('modal').hidden)return;
 if(phase==='quiz'||phase==='finished'){deathPending=false;return;}
 deathPending=false;deathShown=true;deathPopupActive=true;
 showEndQuiz(0,[...QUIZZES].sort(()=>Math.random()-.5).slice(0,3));
}
function showEndQuiz(index,questions){
 const q=questions[index],last=index===2;
 openModal(`작용·반작용 퀴즈 ${index+1} / 3`,q.q,questionMarkup(q),[]);
 quizAnswers(q,()=>{const next=document.createElement('button');next.className=last?'primary replay-button':'primary';next.textContent=last?'홈으로 돌아가기 →':'다음 문제 →';next.onclick=()=>last?retryCurrentMode():showEndQuiz(index+1,questions);$('modal-actions').appendChild(next);next.focus();});
}
function retryCurrentMode(){goHome();}
function pauseGame(){if(online&&onlineState?.solo){online.action('pause').catch(e=>notify(e.message));return;}if(online){notify('온라인 경기는 함께 진행돼서 일시정지할 수 없어요.');return;}if(phase==='lobby'||!$('modal').hidden)return;paused=!paused;$('pause').textContent=paused?'계속하기':'일시정지';$('banner').textContent=paused?'잠깐 쉬는 중 · 계속하기를 누르면 이어져요.':'';drag=null;}
function confirmRestart(){if(online){notify('경기가 끝나면 다시 자동 매칭할 수 있어요.');return;}if(phase==='lobby')return;openModal('NEW EXPEDITION','새 경기를 시작할까?',`<p>현재 경기 점수와 학습 점수가 초기화돼요.</p>`,[{label:'새 경기 시작',click:startMatch},{label:'이어서 하기',secondary:true,click:closeModal}]);}
function goHome(){if(online){online.leave();online=null;onlineState=null;$('network-bar').hidden=true;}closeModal();paused=false;practice=false;phase='lobby';document.body.classList.add('lobby-view');$('lobby').hidden=false;$('game-ui').hidden=true;$('pause').hidden=$('restart').hidden=true;iceGroup.scale.set(1,1,1);createBodies(5,true);aimArrow.visible=playerRing.visible=false;requestAnimationFrame(resize);}
renderer.domElement.addEventListener('pointerdown',e=>{if((online&&onlineLocked)||phase!=='plan'||paused||!bodies[0].alive||e.button>0)return;drag={x:e.clientX,y:e.clientY,angle,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault();});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||paused||phase!=='plan')return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;angle=drag.angle+dx*.008;if(Math.abs(dy)>8)setPower(.25+Math.abs(dy)/180);aimed=true;refreshControls();});
renderer.domElement.addEventListener('pointerup',e=>{if(!drag)return;drag=null;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointercancel',()=>drag=null);
$('power').oninput=e=>setPower(Number(e.target.value)/100);$('launch').onclick=launchTurn;
$('start').onclick=startMatch;$('help').onclick=showHelp;$('pause').onclick=pauseGame;$('restart').onclick=confirmRestart;
$('friends').onclick=openFriends;$('account').onclick=showAccount;$('leaderboard').onclick=()=>showRanking();
$('home').onclick=e=>{e.preventDefault();if(phase==='lobby')return;openModal('BACK TO BASE','첫 화면으로 돌아갈까?',`<p>진행 중인 경기 점수는 초기화돼요.</p>`,[{label:'첫 화면으로',click:goHome},{label:'이어서 하기',secondary:true,click:closeModal}]);};
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'소리 꺼짐':'소리 켜짐';$('sound').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');if(!muted)sound(660,.12);};
PALETTE.forEach((color,i)=>{const b=document.createElement('button');b.className='swatch';b.style.setProperty('--swatch',color);b.setAttribute('aria-label',['빨간색','노란색','초록색','분홍색','하늘색'][i]+' 목도리');b.setAttribute('aria-pressed',i===0?'true':'false');b.onclick=()=>{scarfIndex=i;Array.from($('colors').children).forEach((c,j)=>c.setAttribute('aria-pressed',i===j?'true':'false'));createBodies(5,true);};$('colors').appendChild(b);});
window.addEventListener('keydown',e=>{
 if(e.key==='Tab'&&!$('modal').hidden){const controls=[...$('modal').querySelectorAll('button:not(:disabled)')];if(!controls.length)return;const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}return;}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&!['INPUT','SELECT'].includes(e.target.tagName))e.preventDefault();
 if(e.repeat)return;
 if(e.code==='KeyP'&&$('modal').hidden){pauseGame();return;}
 if(!paused&&(!online||!onlineLocked)&&phase==='plan'&&bodies[0]?.alive&&!['INPUT','SELECT','BUTTON'].includes(e.target.tagName)){
  if(e.code==='ArrowLeft'){angle-=.2;aimed=true;}if(e.code==='ArrowRight'){angle+=.2;aimed=true;}
  if(e.code==='ArrowUp'){setPower(power+.1);aimed=true;}if(e.code==='ArrowDown'){setPower(power-.1);aimed=true;}
  if(e.code==='Enter')launchTurn();refreshControls();
 }
});
document.addEventListener('visibilitychange',()=>{if(!online&&document.hidden&&!paused&&phase!=='lobby'&&$('modal').hidden)pauseGame();});
function syncModels(dt){for(const b of bodies){const m=b.model;if(b.alive){m.position.set(b.x,0,b.z);const speed=Math.hypot(b.vx,b.vz);const direction=m.userData.direction;direction.visible=(phase==='simulate'||phase==='countdown')&&speed>.1&&!paused;if(direction.visible){direction.position.set(b.x,.15,b.z);direction.setDirection(new T.Vector3(b.vx/speed,0,b.vz/speed));direction.setLength(Math.min(2.8,.8+speed*.35),.32,.2);}if(speed>.1){const desired=Math.atan2(b.vx,b.vz),diff=Math.atan2(Math.sin(desired-m.rotation.y),Math.cos(desired-m.rotation.y));m.rotation.y+=diff*Math.min(1,dt*10);}
 const lean=phase==='simulate'?Math.min(.25,speed*.025):0;m.userData.torso.rotation.x=lean;m.userData.left.rotation.z=-.3-Math.min(.7,speed*.08);m.userData.right.rotation.z=.3+Math.min(.7,speed*.08);m.rotation.z=0;
 }else{m.userData.direction.visible=false;b.fall+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;m.position.set(b.x,Math.max(-1.1,-b.fall*b.fall*4),b.z);m.rotation.z=Math.sin(b.fall*5)*.22;m.userData.torso.rotation.x=-.15;
 if(b.fall>.45&&!b.splashed){b.splashed=true;burst(b.x,-.7,b.z,'#e4f8fa',16);const tube=mesh(new T.TorusGeometry(.58,.12,8,30),mat(colorFor(b.id)),m,0,.5,0);tube.rotation.x=Math.PI/2;}
 if(b.fall>.65)m.position.y=-1.0+Math.sin(clock*2+b.id)*.04;
 }
}}
function animateEffects(dt){for(let i=forceArrows.length-1;i>=0;i--){const a=forceArrows[i];a.life-=dt;a.mesh.position.set(a.body.x,.8,a.body.z);a.mesh.visible=a.body.alive;if(a.life<=0){scene.remove(a.mesh);a.mesh.dispose();forceArrows.splice(i,1);}}
 for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.life-=dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.vy-=7*dt;p.mesh.scale.setScalar(Math.max(.01,p.life));if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();sparks.splice(i,1);}}
}
function labelsAndHUD(){if(phase==='lobby')return;const w=world.clientWidth,h=world.clientHeight;bodies.forEach((b,i)=>{projected.set(b.x,b.alive?2.15:.8,b.z).project(camera);const label=labels[i];label.style.left=`${(projected.x*.5+.5)*w}px`;label.style.top=`${(-projected.y*.5+.5)*h}px`;label.style.display=projected.z>1||projected.z<0?'none':'block';label.style.opacity=b.alive?'1':'.55';});$('speed').innerHTML=`${Math.hypot(bodies[0].vx,bodies[0].vz).toFixed(1)} <small>m/s</small>`;$('remaining').innerHTML=`${bodies.filter(b=>b.alive).length} <small>마리</small>`;
 const b=bodies[0];aimArrow.position.set(b.x,.18,b.z);aimArrow.setDirection(new T.Vector3(Math.cos(angle),0,Math.sin(angle)));aimArrow.setLength(1.3+power*2.4,.4,.24);playerRing.position.set(b.x,.1,b.z);
}
function frame(now){
 const dt=Math.min((now-last)/1000,.05);last=now;clock+=dt;
 if(online&&onlineState)updateOnlineVisuals(dt);
 else if(!paused){bodies.forEach((b,i)=>b.model.userData.torso.rotation.z=Math.sin(clock*.8+i)*.035);animateEffects(dt);}
 if(!paused){for(let i=0;i<waves.length;i++)waves[i].material.opacity=.23+Math.sin(clock*.6+i)*.1;flakes.rotation.y=Math.sin(clock*.05)*.03;}
 updateCamera(dt);labelsAndHUD();renderer.render(scene,camera);requestAnimationFrame(frame);
}

function escapeHTML(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function openFriends(){
 if(!onboardingDone){showConcept();return;}if(!await ensureLogin(openFriends))return;
 openModal('QUICK MATCH / 온라인 자동 매칭','함께할 펭귄을 찾는 중!',`<p>접속한 사람들과 자동으로 매칭돼요. 최대 8초 동안 기다린 뒤, 빈자리는 AI가 대신해서 총 5마리로 출발해요.</p><div id="room-error" class="room-error" role="status">남극 기지에 연결 중…</div>`,[{label:'매칭 취소',secondary:true,click:goHome}]);
 connectRoom();
}
async function connectRoom(solo=false){
 const client=new IceOnline(receiveOnline,message=>{if(clock-onlineDisconnectNotice>5){notify(message);onlineDisconnectNotice=clock;}});
 online=client;roomRenderKey='';quizRenderKey='';onlineEvent=0;onlineRound=0;onlineQuizRound=0;
 try{await client.connect(IceAccount.user.nickname,solo,Number($('players').value));}catch(e){client.leave();if(online!==client)return;online=null;if($('room-error'))$('room-error').textContent=e.message;else{closeModal();notify(e.message);}}
}
function showRoomLobby(s){
 const signature=JSON.stringify(s.members);const seconds=Math.max(0,Math.ceil((s.matchDeadline-s.now)/1000));
 if(roomRenderKey!==signature){roomRenderKey=signature;
  openModal('QUICK MATCH / 온라인 자동 매칭','함께할 펭귄을 찾는 중!',`<p>같은 시간에 접속한 사람들과 자동으로 만나요.</p><div class="room-code" id="match-countdown"></div>${Array.from({length:5},(_,i)=>{const m=s.members.find(m=>m.slot===i);return `<div class="room-seat"><span>${m?escapeHTML(m.name):'함께할 펭귄 찾는 중…'}</span><small>${m?(m.connected?'준비 완료':'연결 중'):'기다리는 중'}</small></div>`;}).join('')}<p class="room-message">5명이 모이면 바로 출발! 시간이 끝나면 빈자리는 AI가 채워요.</p>`,[{label:'매칭 취소',secondary:true,click:goHome}]);
 }
 $('match-countdown').textContent=seconds+'초';
}
function receiveOnline(s){
 onlineState=s;if(deathPopupActive)return;onlineOrder=[s.you,...s.bodies.map(b=>b.id).filter(i=>i!==s.you)];if(s.phase==='waiting')onlineOrder=[s.you,...[0,1,2,3,4].filter(i=>i!==s.you)];
 if(s.phase==='waiting'){showRoomLobby(s);return;}
 if(onlineRound!==s.round||bodies.length!==s.bodies.length||phase==='lobby'){
  onlineRound=s.round;onlineTurn=0;onlineLocked=false;beginInterface();practice=false;count=s.bodies.length;createBodies(count);roomRenderKey='';quizRenderKey='';closeModal();
  $('network-bar').hidden=!!s.solo;$('pause').hidden=!s.solo;$('restart').hidden=true;
 }
 const prior=phase;
 onlineOrder.forEach((id,i)=>{const state=s.bodies[id],b=bodies[i];if(!state)return;b.name=state.name;b.serverId=id;b.targetX=state.x;b.targetZ=state.z;b.vx=state.vx;b.vz=state.vz;
  if(onlineTurn===0){b.x=state.x;b.z=state.z;}
  if(b.alive&&!state.alive){b.x=state.x;b.z=state.z;fall(b);}else if(state.alive)b.alive=true;
  labels[i].textContent=(i===0?'나 · ':'')+state.name;
 });
 round=s.round;turn=s.turn;radius=s.size;iceGroup.scale.set(radius/ICE_SIZE,1,radius/ICE_SIZE);scores=onlineOrder.map(id=>s.scores[id]);learning=s.points[s.you];if(s.profile)IceAccount.update(s.profile);correct=s.correct;answeredCount=s.answers;
 $('learning').innerHTML=`${learning} <small>점</small>`;
 phase=s.phase;paused=!!s.paused||!$('modal').hidden;$('pause').textContent=s.paused?'계속하기':'일시정지';onlineLocked=s.ready.includes(s.you);
 if(s.phase==='plan'&&(onlineTurn!==s.turn||prior!=='plan')){angle=Math.atan2(-bodies[0].z,-bodies[0].x);power=.45;setPower(power);aimed=false;if(!deathPopupActive)closeModal();}
 onlineTurn=s.turn;
 $('state-title').textContent='다 같이, 빙판 위로!';
 if(s.phase==='plan')$('state-title').textContent=bodies[0].alive?'어디로 밀어볼까?':'친구들의 승부를 지켜보자';
 scoreUI();refreshControls();
 if(onlineLocked&&s.phase==='plan'){$('aim-status').textContent='확정 완료! 친구를 기다려요.';$('launch').disabled=true;aimArrow.visible=bodies[0].alive;}
 const humans=s.members.length;$('network-bar').textContent=`자동 매칭 · 사람 ${humans}명 + AI ${5-humans}마리 · ${s.phase==='plan'?`확정 ${s.members.filter(m=>s.ready.includes(m.slot)&&s.bodies[m.slot]?.alive).length}명 · ${Math.max(0,Math.ceil((s.deadline-s.now)/1000))}초 남음`:s.phase==='quiz'?'함께 퀴즈를 푸는 중':s.phase==='finished'?'경기 종료':'같은 서버에서 함께 진행 중'}`;
 for(const event of s.events){if(event.seq<=onlineEvent)continue;onlineEvent=event.seq;
  if(event.type==='collision'){const a=bodies.find(b=>b.serverId===event.a),b=bodies.find(b=>b.serverId===event.b);if(a&&b)forcePair(a,b,event.nx,event.nz,event.impulse);}
  if(event.type==='shrink')notify('탈락자가 생겨 사각 빙판이 작아졌어요.');
  if(event.type==='launch')sound(720,.15);
  if(event.type==='points'&&event.slot===s.you)notify(event.reason==='shrink'?'빙판 축소! +10점':'조준 명중! +15점');
 }
 if(s.phase==='countdown')$('banner').textContent='READY… 모두 동시에 출발!';
 else if(s.phase==='round-end')$('banner').textContent=s.winner<0?'모두 첨벙! 무승부':`${s.bodies[s.winner].name}의 라운드 승리!`;
 else $('banner').textContent='';
 if(s.phase==='quiz')showOnlineQuiz(s);
 if(s.phase==='finished'&&prior!=='finished'){goHome();return;}
}
function showOnlineQuiz(s){
 const signature=JSON.stringify([s.round,s.quiz.number,s.feedback]);if(quizRenderKey===signature)return;quizRenderKey=signature;
 const q=s.quiz;openModal(`작용·반작용 퀴즈 ${s.quiz.number} / 3`,'다음 게임 전에, 과학 한 입.',`<p><strong>${escapeHTML(q.q)}</strong></p><div class="quiz-answers">${q.a.map((a,i)=>`<button class="quiz-option" data-answer="${i}">${i+1}. ${escapeHTML(a)}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>`,[]);
 for(const btn of $('modal-content').querySelectorAll('[data-answer]')){
  if(s.feedback){btn.disabled=true;const i=Number(btn.dataset.answer);if(i===s.feedback.correct)btn.classList.add('correct');if(!s.feedback.ok&&i===s.feedback.answer)btn.classList.add('wrong');}
  else btn.onclick=async()=>{for(const b of $('modal-content').querySelectorAll('[data-answer]'))b.disabled=true;try{await online.action('answer',{answer:Number(btn.dataset.answer)});}catch(e){notify(e.message);quizRenderKey='';showOnlineQuiz(onlineState);}};
 }
 if(s.feedback){$('quiz-feedback').innerHTML=`<strong>${s.feedback.ok?'정답이에요!':'해설을 확인해봐요.'}</strong><br>${escapeHTML(s.feedback.why)}`;const next=document.createElement('button');next.className=s.quiz.number===3?'primary replay-button':'primary';next.textContent=s.quiz.number===3?'홈으로 돌아가기 →':'다음 문제 →';next.onclick=async()=>{if(s.quiz.number===3){goHome();return;}try{await online.action('continue');next.disabled=true;next.textContent='다음 게임 준비 중…';}catch(e){notify(e.message);}};$('modal-actions').appendChild(next);}
}
async function sendOnlinePlan(){if(!onlineState||onlineState.phase!=='plan'||onlineLocked||!aimed||paused||!bodies[0].alive)return;
 onlineLocked=true;refreshControls();try{await online.action('plan',{angle,power});}catch(e){onlineLocked=false;refreshControls();notify(e.message);}}
function updateOnlineVisuals(dt){
 if(onlineState.phase==='waiting')return;
 for(const b of bodies)if(b.alive&&Number.isFinite(b.targetX)){b.x+=(b.targetX-b.x)*Math.min(1,dt*16);b.z+=(b.targetZ-b.z)*Math.min(1,dt*16);}
 syncModels(dt);animateEffects(dt);maybeShowDefeat(dt);
}

createBodies(5,true);aimArrow.visible=playerRing.visible=false;requestAnimationFrame(frame);showConcept();

})();
