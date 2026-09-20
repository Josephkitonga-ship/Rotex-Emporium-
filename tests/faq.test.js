/* Concierge routing tests.  Run:  node tests/faq.test.js
   Add a line to CASES whenever a customer asks something the bot gets wrong. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const ctx={window:{}}; ctx.globalThis=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8'),ctx); ctx.ROTEX_CONFIG=ctx.window.ROTEX_CONFIG;
vm.runInContext(fs.readFileSync(path.join(root,'js/faq.js'),'utf8'),ctx);
const F=ctx.window.RotexFAQ||ctx.RotexFAQ;

const CASES=[
 // delivery
 ['how long does delivery take','delivery'],['do you deliver to nairobi','delivery'],['when will my order arrive','delivery'],
 ['wat is ur deliverry time','delivery'],['can u send to mombasa','delivery'],['where is my order','delivery'],['do you ship upcountry','delivery'],
 ['do you deliver to loitokitok','delivery'],['how do i track my order','delivery'],['same day delivery?','delivery'],
 // delivery fee
 ['how much is delivery','deliveryfee'],['is delivery free','deliveryfee'],['delivery charges to kitengela','deliveryfee'],['shipping fee?','deliveryfee'],['how much for delivery to nairobi','deliveryfee'],
 // returns
 ['what is your return policy','returns'],['can i return an item','returns'],['it doesnt fit me','returns'],['wrong size delivered','returns'],['i want a refund','returns'],
 ['item is damaged','returns'],['can i exchange','returns'],['cancel my order','returns'],['i received the wrong item','returns'],['how many days do i have to return','returns'],
 // sizing
 ['what size should i get','sizing'],['do you have size chart','sizing'],['does it run small','sizing'],['shoe size 42?','sizing'],['my chest is 100cm what size','sizing'],['size guide','sizing'],['i am between sizes','sizing'],
 // payment
 ['do you accept mpesa','payment'],['how do i pay','payment'],['can i pay on delivery','payment'],['do you take cards','payment'],['lipa na mpesa','payment'],['is there a till number','payment'],['pay cash','payment'],['do you accept bank transfer','payment'],
 // ordering
 ['how do i order','ordering'],['how to buy','ordering'],['how does checkout work','ordering'],['how do i place an order','ordering'],
 // location
 ['where is your shop','location'],['are you in kimana','location'],['can i come to the shop','location'],['do you have a physical store','location'],['wapi mko','location'],['can i pick up my order','location'],['directions please','location'],['where are you located','location'],['are you in kajiado','location'],
 // hours
 ['what time do you open','hours'],['are you open on sunday','hours'],['opening hours','hours'],['when do you close','hours'],['are you open today','hours'],
 // contact
 ['what is your phone number','contact'],['i want to talk to a human','contact'],['whatsapp number','contact'],['i have a complaint','contact'],['do you have instagram','contact'],
 // authenticity
 ['are your clothes original','authenticity'],['is this a scam','authenticity'],['are they mtumba','authenticity'],['is it genuine leather','authenticity'],['is it safe to buy from you','authenticity'],
 // care
 ['how do i wash the blazer','care'],['will it shrink','care'],['can i iron it','care'],
 // price
 ['any discounts','price'],['bei gani','price'],['do you sell wholesale','price'],['what is the last price','price'],['can i negotiate','price'],
 // stock
 ['is it in stock','stock'],['do you have this in blue','stock'],['when will you restock','stock'],['new arrivals','stock'],['is this available','stock'],
 // small talk
 ['hello','greeting'],['hi','greeting'],['habari','greeting'],['good morning','greeting'],['mambo','greeting'],
 ['thanks','thanks'],['asante sana','thanks'],['thank you so much','thanks'],['ok thanks bye','thanks'],
];
const OFFTOPIC=['asdfghjkl','what is the weather','who won the match','tell me a joke','qwerty zxcv','what is the capital of france','can you code in python','what is 2+2'];
const SUBSTRING=['shipping','this is high','which','machine','archive'];

let fail=0; const bad=(m)=>{fail++;console.log('  ✗',m)};
let ok=0; for(const [q,exp] of CASES){const r=F.answer(q); r.id===exp?ok++:bad(`"${q}" → ${r.id} (want ${exp})`)}
console.log(`Routing            ${ok}/${CASES.length}`);
let n=0; for(const q of OFFTOPIC){const r=F.answer(q); !r.confident?n++:bad(`off-topic answered confidently: "${q}" → ${r.id}`)}
console.log(`Off-topic honest   ${n}/${OFFTOPIC.length}`);
let s=0; for(const q of SUBSTRING){F.answer(q).id!=='greeting'?s++:bad(`substring false-positive: "${q}"`)}
console.log(`No substring bugs  ${s}/${SUBSTRING.length}`);
let c=0; for(const t of F.TOPICS){const a=t.a(); a&&!/undefined|null|\[object|NaN/.test(a)?c++:bad('bad answer body: '+t.id)}
console.log(`Answers clean      ${c}/${F.TOPICS.length}`);
let ch=0,tt=0; for(const t of F.TOPICS)for(const x of t.next){tt++;F.chip(x)?ch++:bad(`dangling chip ${t.id}→${x}`)}
console.log(`Chips valid        ${ch}/${tt}`);
// Answers must reflect the SHOP config (edit-once guarantee)
const loc=F.answer('where is your shop').text;
const shopOK=/Kimana Town/.test(loc)&&/Kajiado/.test(loc); shopOK?console.log('Shop facts wired   ✓ (Kimana Town, Kajiado)'):bad('location answer missing Kimana/Kajiado: '+loc);
console.log(fail?`\n${fail} PROBLEM(S)`:'\nALL FAQ CHECKS PASSED'); process.exit(fail?1:0);
