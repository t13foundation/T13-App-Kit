import { buildApp } from './src/app.ts';
const app = await buildApp();
const r = await app.inject({method:'POST',url:'/api/auth/sign-up/email',headers:{origin:'http://localhost:8080'},payload:{email:`p${Date.now()}@example.test`,password:'Bardzo-Dlugie-Haslo-123',name:'P'}});
console.log(r.statusCode, r.body);
process.exit(0);
