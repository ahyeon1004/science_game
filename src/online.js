/* Small same-origin SSE client. No account, cookies or third-party relay. */
(function(){
'use strict';
class IceOnline{
 constructor(callback,onError){this.callback=callback;this.onError=onError;this.code='';this.token='';this.stream=null;this.closed=false;}
 async request(route,data){const response=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});let result;try{result=await response.json();}catch{throw new Error('친구랑 하기는 서버로 실행해야 해요. 폴더의 ‘게임시작.command’를 실행해주세요.');}if(!response.ok)throw new Error(result.error||'연결하지 못했어요.');return result;}
 async connect(name,solo=false,count=5){if(!/^https?:$/.test(location.protocol))throw new Error('친구랑 하기는 서버 주소에서 열어야 해요. 폴더의 ‘게임시작.command’를 실행해주세요.');
 const result=await this.request(solo?'/api/solo':'/api/match',{count});this.code=result.code;this.token=result.token;
 if(this.closed){await this.action('leave');return;} 
 this.stream=new EventSource('/api/events?room='+encodeURIComponent(this.code)+'&token='+encodeURIComponent(this.token));this.stream.onmessage=e=>{try{this.callback(JSON.parse(e.data));}catch(err){console.error(err);}};this.stream.onerror=()=>{if(!this.closed)this.onError('연결이 잠깐 끊겼어요. 자동으로 다시 연결하고 있어요.');};return this.code;
 }
 async action(type,data={}){return this.request('/api/action',{...data,type,code:this.code,token:this.token});}
 leave(){this.closed=true;this.stream?.close();if(this.token)this.action('leave').catch(()=>{});}
}
window.IceOnline=IceOnline;
})();
