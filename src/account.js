/* Authentication stays in HttpOnly cookies; passwords are never stored in the browser. */
window.IceAccount={
 user:null,
 async request(route,data){
  if(!/^https?:$/.test(location.protocol))throw new Error('로그인과 기록 저장은 서버 실행이 필요해요. ‘게임시작.command’를 열고 localhost:8767로 접속해주세요.');
  const response=await fetch(route,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,credentials:'same-origin'});
  let result;try{result=await response.json();}catch{throw new Error('게임 서버에 연결하지 못했어요. localhost:8767에서 열어주세요.');}
  if(!response.ok)throw new Error(result.error||'요청을 처리하지 못했어요.');return result;
 },
 update(user){this.user=user;$('account').textContent=user?`${user.nickname} · 최고 ${user.best}점`:'로그인 / 회원가입';},
 async restore(){try{this.update((await this.request('/api/auth/me')).user);}catch{this.update(null);}},
};
function $(id){return document.getElementById(id);}
IceAccount.ready=IceAccount.restore();
