'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt),directory=process.env.ICE_DATA_DIR||path.join(__dirname,'../data'),file=path.join(directory,'accounts.json');
const database=process.env.DATABASE_URL?new(require('pg').Pool)({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:10000}):null;
let db={users:[],sessions:{}},pending=Promise.resolve();
const ready=(async()=>{
 if(database){await database.query('CREATE TABLE IF NOT EXISTS ice_penguin_state (id TEXT PRIMARY KEY, data JSONB NOT NULL)');const result=await database.query('SELECT data FROM ice_penguin_state WHERE id=$1',['accounts']);if(result.rows[0])db=result.rows[0].data;}
 else{fs.mkdirSync(directory,{recursive:true,mode:0o700});if(fs.existsSync(file))db=JSON.parse(fs.readFileSync(file,'utf8'));}
})();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const fail=(message,status=400)=>{const error=new Error(message);error.status=status;throw error;};
function save(){
 if(database){const data=JSON.stringify(db);pending=pending.catch(()=>{}).then(()=>database.query('INSERT INTO ice_penguin_state (id,data) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data',['accounts',data]));pending.catch(()=>console.error('계정 기록 저장에 실패했습니다.'));return pending;}
 const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(db),{mode:0o600});fs.renameSync(temp,file);
}
function profile(user){return user?{id:user.id,nickname:user.nickname,total:user.total,best:user.best,level:user.level}:null;}
function current(req){const cookie=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('ice_session='));if(!cookie)return null;const session=db.sessions[hash(cookie.slice(12))];if(!session||session.expires<Date.now())return null;return db.users.find(u=>u.id===session.userId)||null;}
function requireUser(req){return current(req)||fail('게임을 시작하려면 로그인해주세요.',401);}
function cookie(res,req,token,age=90*86400){const secure=req.socket.encrypted||req.headers['x-forwarded-proto']==='https'||String(process.env.PUBLIC_URL||'').startsWith('https:');res.setHeader('Set-Cookie',`ice_session=${token}; Path=${process.env.BASE_PATH?(process.env.BASE_PATH.replace(/\/$/,'')+'/'):'/'}; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`);}
async function handle(route,body,req,res){
 if(route==='/api/auth/logout'){const raw=String(req.headers.cookie||'').match(/(?:^|;\s*)ice_session=([^;]+)/)?.[1];if(raw)delete db.sessions[hash(raw)];await save();cookie(res,req,'',0);return {user:null};}
 if(!['/api/auth/register','/api/auth/login'].includes(route))return null;
 const nickname=String(body.nickname||'').normalize('NFKC').trim(),password=String(body.password||'');
 if(!/^[\p{L}\p{N}_ -]{2,12}$/u.test(nickname))fail('닉네임은 한글·영문·숫자 등 2~12자로 적어주세요.');
 if(password.length<6||password.length>128)fail('비밀번호는 6~128자로 설정해주세요.');
 const normalized=nickname.toLocaleLowerCase('ko');let user=db.users.find(u=>u.key===normalized);
 if(route.endsWith('register')){
  if(user)fail('이미 사용 중인 닉네임이에요.',409);
  const salt=crypto.randomBytes(16).toString('hex'),passwordHash=(await scrypt(password,salt,64)).toString('hex');
  if(db.users.some(u=>u.key===normalized))fail('이미 사용 중인 닉네임이에요.',409);
  user={id:crypto.randomUUID(),key:normalized,nickname,salt,passwordHash,total:0,best:0,level:1,records:[],created:Date.now()};db.users.push(user);
 }else{
  const derived=await scrypt(password,user?.salt||'invalid-login-salt',64);
  if(!user||!crypto.timingSafeEqual(derived,Buffer.from(user.passwordHash,'hex')))fail('닉네임이나 비밀번호를 확인해주세요.',401);
 }
 for(const key of Object.keys(db.sessions))if(db.sessions[key].expires<Date.now())delete db.sessions[key];
 const token=crypto.randomBytes(32).toString('hex');db.sessions[hash(token)]={userId:user.id,expires:Date.now()+90*86400000};await save();cookie(res,req,token);return {user:profile(user)};
}
function award(userId,points,runScore,level){const u=db.users.find(u=>u.id===userId);if(!u)return;u.total+=points;u.best=Math.max(u.best,runScore);u.level=Math.max(u.level,level);save();}
function recordsFor(user){
 if(!Array.isArray(user.records))user.records=user.best>0?[{id:'legacy',score:user.best,level:user.level,mode:'previous',at:null}]:[];
 return user.records;
}
function record(userId,runId,score,level,mode){
 const user=db.users.find(u=>u.id===userId);if(!user)return;
 const records=recordsFor(user),existing=records.find(r=>r.id===runId);
 if(existing){existing.score=Math.max(existing.score,score);existing.level=Math.max(existing.level,level);}else records.push({id:runId,score,level,mode,at:Date.now()});
 records.sort((a,b)=>b.score-a.score||(b.at||0)-(a.at||0));user.records=records.slice(0,50);save();
}
function personal(userId){const user=db.users.find(u=>u.id===userId);return user?recordsFor(user).slice().sort((a,b)=>b.score-a.score||(b.at||0)-(a.at||0)).map((r,i)=>({rank:i+1,score:r.score,level:r.level,mode:r.mode,at:r.at})):[];}
function ranking(){return [...db.users].sort((a,b)=>b.best-a.best||b.total-a.total||a.created-b.created).slice(0,30).map((u,i)=>({rank:i+1,...profile(u)}));}
function byId(id){return profile(db.users.find(u=>u.id===id));}
module.exports={ready,flush:()=>pending,record,personal,byId,current,requireUser,profile,handle,award,ranking};
