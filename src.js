import './style.css';
import { createClient } from '@supabase/supabase-js';
import raw from './combinations.json';
import { norma1, norma2, norma3 } from './reference-photos.js';

const combos = raw.map(([a,b,blob,hash],i) => ({
  id: i+1, a, b,
  remote: `https://codahosted.io/docs/gBZFlRwMm-/blobs/${blob}/${hash}`,
  local: `/combinations/${i+1}.png`
}));
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = url && key ? createClient(url,key) : null;
const app = document.querySelector('#app');
const answersKey = 'norma-vote-draft-v1';
const completedKey = 'norma-vote-completed-v1';
let answers = JSON.parse(localStorage.getItem(answersKey) || '{}');
let current = 0;
let submitting = false;
const isAdmin = location.pathname.replace(/\/$/,'') === '/admin';
const icon = (name) => ({heart:'♡',yes:'♥',no:'×',arrow:'→',back:'←',spark:'✳'}[name]);
const esc = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const layout = (content,admin=false) => `<div class="site"><main>${content}</main></div>`;
function photo(item,cls='',eager=false){return `<img class="${cls}" src="${item.local}" data-remote="${esc(item.remote)}" alt="Sweater color combination ${item.id}" ${eager?'fetchpriority="high"':'loading="lazy"'} />`;}
function bindImages(){
 document.querySelectorAll('img[data-remote]').forEach(img=>{
   img.addEventListener('error',()=>{
     if(img.dataset.fallback!=='yes'){
       img.dataset.fallback='yes';img.src=img.dataset.remote;
     } else {
       img.classList.add('broken');
       const parent=img.parentElement;
       if(!parent.querySelector('.image-error')) parent.insertAdjacentHTML('beforeend','<div class="image-error"><strong>Image not available</strong><p>This sweater preview needs to be uploaded by the organizer.</p><button type="button" class="retry-image">Try again</button></div>');
       parent.querySelector('.retry-image').onclick=()=>{img.dataset.fallback='';img.classList.remove('broken');parent.querySelector('.image-error')?.remove();img.src=img.dataset.remote+'?retry='+Date.now();};
       if(img.closest('.vote-stage')) document.querySelectorAll('.vote-button').forEach(b=>b.disabled=true);
     }
   });
 });
}
function welcome(){
 app.innerHTML=layout(`<section class="hero"><div class="hero-copy"><p class="kicker">A LITTLE KNITTING POLL</p><h1>Help me choose<br>my sweater stripes.</h1><p class="intro">I'm making the Norma sweater with a natural-colored base and two stripe colors. I've narrowed it down to 20 combinations, and I'd love your opinion.</p><p class="instructions">You'll see one sweater at a time. Give each a thumbs up or thumbs down. That's it.</p><button class="primary start" id="start">Start voting <span aria-hidden="true">→</span></button><p class="fineprint">20 combinations · about 2 minutes · anonymous</p></div><div class="hero-photos"><img src="${norma1}" alt="Norma sweater reference photo one"/><img src="${norma2}" alt="Norma sweater reference photo two"/><img src="${norma3}" alt="Norma sweater reference photo three"/></div></section>`);
 document.querySelector('#start').onclick=()=>{current=combos.findIndex(c=>answers[c.id]===undefined);if(current<0)current=19;renderVote();};
}
function renderVote(){
 const c=combos[current];const count=Object.keys(answers).length;
 app.innerHTML=layout(`<section class="vote-stage"><div class="vote-top"><button class="back" id="back" ${current===0?'disabled':''}>← Back</button><span class="counter">${current+1} of 20</span></div><div class="progress" role="progressbar" aria-label="Voting progress" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="20"><div style="width:${count/20*100}%"></div></div><div class="vote-prompt">Would you wear these stripes?</div><div class="sweater-frame">${photo(c,'sweater',true)}</div><div class="vote-actions"><button class="vote-button no ${answers[c.id]===false?'selected':''}" id="no" aria-label="Thumbs down"><span class="vote-icon">👎</span><span>No</span></button><button class="vote-button yes ${answers[c.id]===true?'selected':''}" id="yes" aria-label="Thumbs up"><span class="vote-icon">👍</span><span>Yes</span></button></div><p class="vote-hint">${count} of 20 answered · You can go back and change a vote</p></section>`);
 bindImages();document.querySelector('#no').onclick=()=>vote(false);document.querySelector('#yes').onclick=()=>vote(true);document.querySelector('#back').onclick=()=>{if(current>0){current--;renderVote();}};
}
function vote(value){answers[combos[current].id]=value;localStorage.setItem(answersKey,JSON.stringify(answers));if(current<19){current++;renderVote();}else review();}
function review(){const n=Object.keys(answers).length;if(n<20){current=combos.findIndex(c=>answers[c.id]===undefined);renderVote();return;}
 app.innerHTML=layout(`<section class="finish"><div class="big-spark">✳</div><div class="eyebrow">ONE LAST THING</div><h1>All <em>done!</em></h1><p>You've voted on all 20 sweaters. Ready to send your choices?</p><div class="finish-stat"><strong>${Object.values(answers).filter(Boolean).length}</strong> loved <span>·</span> <strong>${Object.values(answers).filter(v=>!v).length}</strong> passed</div><button class="primary" id="send" ${submitting?'disabled':''}>Submit my votes →</button><button class="back" id="edit">← Review my choices</button><p id="status" class="status" role="status"></p></section>`);
 document.querySelector('#edit').onclick=()=>{current=0;renderVote();};document.querySelector('#send').onclick=submit;
}
async function submit(){if(submitting)return;const status=document.querySelector('#status');if(!db){status.textContent='Voting is not connected yet. The organizer needs to set up Supabase first.';return;}
 submitting=true;document.querySelector('#send').disabled=true;status.textContent='Sending your votes…';
 const votes=combos.map(c=>({id:c.id,yes:answers[c.id]}));
 try{const {error}=await db.rpc('submit_ballot',{p_votes:votes});if(error)throw error;localStorage.setItem(completedKey,'true');localStorage.removeItem(answersKey);thanks();}
 catch(e){status.textContent='Could not submit. Your choices are saved on this device. Please try again.';console.error(e);document.querySelector('#send').disabled=false;}finally{submitting=false;}
}
function thanks(){app.innerHTML=layout(`<section class="finish"><div class="big-spark">♥</div><div class="eyebrow">YOU'RE THE BEST</div><h1>Thank <em>you!</em></h1><p>Your votes have been counted. You've officially made my sweater decision a little easier.</p><div class="thank-photo"><img src="${norma2}" alt="The Norma sweater inspiration"/></div><p class="closing">Now, back to the knitting needles. ♡</p></section>`);}
async function admin(){
 if(!db){app.innerHTML=layout(`<section class="admin-wrap"><h1>Organizer <em>dashboard.</em></h1><p>Connect Supabase to enable sign-in and results. See README.md.</p></section>`,true);return;}
 const {data:{session}}=await db.auth.getSession();if(!session){
 app.innerHTML=layout(`<section class="admin-wrap login"><div class="eyebrow">FOR THE KNITTER'S EYES ONLY</div><h1>Organizer <em>login.</em></h1><p>Sign in with your Supabase organizer account to see the votes.</p><form id="login"><label>Email<input type="email" id="email" required autocomplete="email"/></label><label>Password<input type="password" id="password" required autocomplete="current-password"/></label><button class="primary" type="submit">Sign in →</button><p class="status" id="status" role="status"></p></form></section>`,true);
 document.querySelector('#login').onsubmit=async(e)=>{e.preventDefault();document.querySelector('#status').textContent='Signing in…';const {error}=await db.auth.signInWithPassword({email:document.querySelector('#email').value,password:document.querySelector('#password').value});if(error)document.querySelector('#status').textContent='Could not sign in. Check your credentials.';else admin();};return;}
 app.innerHTML=layout(`<section class="admin-wrap"><div class="admin-heading"><div><div class="eyebrow">PRIVATE RESULTS</div><h1>The <em>verdict.</em></h1></div><div class="admin-buttons"><button class="small-btn" id="refresh">↻ Refresh</button><button class="small-btn" id="logout">Sign out</button></div></div><p id="admin-status" class="status">Loading results…</p><div id="results"></div></section>`,true);
 document.querySelector('#logout').onclick=async()=>{await db.auth.signOut();admin();};document.querySelector('#refresh').onclick=admin;
 const {data,error}=await db.rpc('admin_results');if(error){document.querySelector('#admin-status').textContent='Access denied or database not configured. Check the organizer allowlist in Supabase.';return;}
 const byId=new Map(data.map(r=>[Number(r.combination_id),r]));const total=Number(data[0]?.yes_count||0)+Number(data[0]?.no_count||0);
 document.querySelector('#admin-status').textContent=`${total} completed ballot${total===1?'':'s'} · ${total*20} votes cast`;
 const ordered=[...combos].sort((a,b)=>Number(byId.get(b.id)?.yes_count||0)-Number(byId.get(a.id)?.yes_count||0));
 document.querySelector('#results').innerHTML=`<div class="results-grid">${ordered.map((c,index)=>{const r=byId.get(c.id)||{};const yes=Number(r.yes_count||0),no=Number(r.no_count||0);const percent=yes+no?Math.round(100*yes/(yes+no)):0;return `<article class="result-card"><div class="result-img">${photo(c)}</div><div class="result-info"><div class="result-index">#${c.id} ${index===0&&yes>0?'<span>· MOST LOVED</span>':''}</div><h2>${esc(c.a)} <span>+</span><br/>${esc(c.b)}</h2><div class="result-numbers"><span class="yes-text">♥ ${yes} yes</span><span class="no-text">× ${no} no</span></div><div class="result-bar"><div style="width:${percent}%"></div></div><div class="result-percent">${percent}% yes</div></div></article>`;}).join('')}</div>`;
 bindImages();
}

function imageDiagnostic(){
 app.innerHTML=layout(`<section class="admin-wrap"><h1>Image <em>check.</em></h1><p>This checks the same local and fallback image URLs as the voting screens. It doesn't change any votes.</p><p id="diag-status" role="status">Checking 20 combinations…</p><button class="small-btn" id="copy-report" disabled>Copy report</button><div id="diag-results"></div></section>`);
 const results=[];
 const timeout=12000;
 const check=(url)=>new Promise(resolve=>{
  const img=new Image();let done=false;
  const finish=(ok)=>{if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(ok);};
  const timer=setTimeout(()=>finish(false),timeout);
  img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=url;
 });
 Promise.all(combos.map(async c=>{
  const local=await check(c.local);
  const remote=local?null:await check(c.remote);
  return {id:c.id,a:c.a,b:c.b,status:local?'OK (local)':remote?'OK (fallback)':'BROKEN',remote:c.remote};
 })).then(rows=>{
  rows.sort((a,b)=>a.id-b.id);
  const broken=rows.filter(r=>r.status==='BROKEN');
  document.querySelector('#diag-status').textContent=`${rows.length-broken.length} working · ${broken.length} broken`;
  document.querySelector('#diag-results').innerHTML=rows.map(r=>`<p style="margin:10px 0"><strong>#${r.id}: ${esc(r.a)} + ${esc(r.b)}</strong> — ${esc(r.status)}</p>`).join('');
  const report=rows.map(r=>`#${r.id}: ${r.a} + ${r.b} — ${r.status}${r.status==='BROKEN'?' — '+r.remote:''}`).join('\n');
  document.querySelector('#copy-report').disabled=false;
  document.querySelector('#copy-report').onclick=()=>navigator.clipboard.writeText(report).then(()=>{document.querySelector('#copy-report').textContent='Copied!';}).catch(()=>{const ta=document.createElement('textarea');ta.value=report;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();});
 });
}

if(location.pathname.replace(/\/$/,'')==='/image-check')imageDiagnostic();else if(isAdmin)admin();else if(localStorage.getItem(completedKey)==='true')thanks();else welcome();
