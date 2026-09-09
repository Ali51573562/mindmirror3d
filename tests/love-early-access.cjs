const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const writes=[];
let databaseError=null;
const source=fs.readFileSync('pages/api/love-early-access.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export const config','const config').replace('export default async function','async function');
const sandbox={URL,AbortSignal,analyticsDatabase:()=>({from:table=>({upsert:(row,options)=>({abortSignal:async signal=>{assert(signal instanceof AbortSignal);writes.push({table,row,options});return {error:databaseError};}})})})};
vm.createContext(sandbox);vm.runInContext(source,sandbox);
async function call(body,method='POST',origin='http://localhost:3000'){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}};
 await sandbox.handler({method,headers:{host:'localhost:3000',origin},body},res);return res;
}
(async()=>{
 assert.equal((await call({},'GET')).code,405);
 assert.equal((await call({email:'person@example.com'},'POST','https://unrelated.example')).code,403);
 for(const email of ['',null,{},'invalid','a'.repeat(255)+'@example.com'])assert.equal((await call({email})).code,400);
 assert.equal(writes.length,0);
 assert.equal((await call({email:' Person@Example.com '})).code,200);
 assert.equal(writes[0].row.email,'person@example.com');assert.equal(writes[0].table,'love_early_access');assert.equal(writes[0].options.ignoreDuplicates,true);
 assert.equal((await call({email:'person@example.com'})).code,200);
 databaseError={code:'42P01'};assert.equal((await call({email:'person@example.com'})).code,503);
 console.log('LoveMirror early access validation, origin checks, normalization, duplicate handling and failure response passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});

