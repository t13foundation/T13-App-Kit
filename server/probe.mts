import { buildApp } from './src/app.ts';
const app = await buildApp();
const E=`q${Date.now()}@example.test`;
await app.inject({method:'POST',url:'/api/auth/sign-up/email',headers:{origin:'http://localhost:8080'},payload:{email:E,password:'Bardzo-Dlugie-Haslo-123',name:'P'}});
await new Promise(r=>setTimeout(r,1500));
const msgs:any = await (await fetch('http://127.0.0.1:8025/api/v1/messages?limit=5')).json();
const m = msgs.messages.find((x:any)=>x.To.some((t:any)=>t.Address===E));
const body:any = await (await fetch(`http://127.0.0.1:8025/api/v1/message/${m.ID}`)).json();
const url = (body.HTML+body.Text).match(/https?:\/\/[^\s"'<>)\]]+/)[0].replace(/&amp;/g,'&');
console.log('LINK', url);
const r = await app.inject({method:'GET',url:url.replace(/^https?:\/\/[^/]+/,''),headers:{origin:'http://localhost:8080'}});
console.log('VERIFY', r.statusCode, r.body.slice(0,200));
for (const p of ['/api/auth/forget-password','/api/auth/request-password-reset']) {
  const x = await app.inject({method:'POST',url:p,headers:{origin:'http://localhost:8080'},payload:{email:E,redirectTo:'http://localhost:8080/reset'}});
  console.log(p, x.statusCode, x.body.slice(0,120));
}
process.exit(0);
