const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const resetBtn = document.getElementById("resetBtn");
const chatToggle = document.getElementById("chatToggle");
const chatPanel = document.getElementById("chatPanel");
const chatClose = document.getElementById("chatClose");
const startChatBtn = document.getElementById("startChatBtn");
const startChatBtn2 = document.getElementById("startChatBtn2");
const themeToggle = document.getElementById("themeToggle");
const recipeFilters = document.getElementById("recipeFilters");
const recipeSearch = document.getElementById("recipeSearch");
const recipePager = document.getElementById("recipePager");
const blogFilters = document.getElementById("blogFilters");
const blogSearch = document.getElementById("blogSearch");
const bmiForm = document.getElementById('bmiForm');
const tdeeForm = document.getElementById('tdeeForm');
const contactForm = document.getElementById('contactForm');
const commentForm = document.getElementById('commentForm');
const commentsWrap = document.getElementById('comments');
const commentsPager = document.getElementById('commentsPager');
const profileForm = document.getElementById('profileForm');
const pwdForm = document.getElementById('pwdForm');

const sessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function addMsg(role, text) {
  if (!chat) return;
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMsg(text) {
  addMsg("user", text);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: text }],
        temperature: 0.2,
        max_tokens: 512
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    addMsg("assistant", data.reply);
  } catch (e) {
    addMsg("assistant", "⚠️ Error: " + e.message);
  }
}

if (form) {
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMsg(text);
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "x-session-id": sessionId }
    });
    if (chat) chat.innerHTML = "";
    addMsg("assistant", "Conversación reiniciada. Cuéntame tu objetivo, nivel actual y tiempo disponible por semana.");
  });
}

function openChat() { if (chatPanel) chatPanel.classList.add("open"); }
function closeChat() { if (chatPanel) chatPanel.classList.remove("open"); }
if (chatToggle) chatToggle.addEventListener("click", openChat);
if (chatClose) chatClose.addEventListener("click", closeChat);
if (startChatBtn) startChatBtn.addEventListener("click", openChat);
if (startChatBtn2) startChatBtn2.addEventListener("click", openChat);

// Fallback de imágenes
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    img.src = 'https://placehold.co/800x600?text=Imagen';
    img.style.objectFit = 'cover';
  }, { once: true });
});

// Carrusel testimonios
(function initCarousel(){
  const root = document.getElementById('testiCarousel');
  if (!root) return;
  const track = root.querySelector('.carousel-track');
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');
  const dotsWrap = root.querySelector('.carousel-dots');
  let index = 0; let timer;
  function setIndex(i){ index = (i + slides.length) % slides.length; track.style.transform = `translateX(-${index * 100}%)`; if (dotsWrap){ [...dotsWrap.children].forEach((d, di)=> d.classList.toggle('active', di===index)); } }
  function start(){ timer = setInterval(()=> setIndex(index+1), 5000); }
  function stop(){ clearInterval(timer); }
  if (dotsWrap){ dotsWrap.innerHTML=''; slides.forEach((_, i)=>{ const b=document.createElement('button'); if(i===0)b.classList.add('active'); b.addEventListener('click', ()=> setIndex(i)); dotsWrap.appendChild(b); }); }
  if (prev) prev.addEventListener('click', ()=> setIndex(index-1));
  if (next) next.addEventListener('click', ()=> setIndex(index+1));
  root.addEventListener('mouseenter', stop); root.addEventListener('mouseleave', start);
  setIndex(0); start();
})();

// Menú móvil toggle
(function initMenu(){
  const header = document.querySelector('.header-inner');
  const nav = document.querySelector('.nav');
  if (!header || !nav) return;
  let btn = document.getElementById('menuToggle');
  if (!btn){
    btn = document.createElement('button');
    btn.id = 'menuToggle';
    btn.className = 'menu-toggle';
    btn.textContent = '☰';
    header.insertBefore(btn, header.lastElementChild);
  }
  btn.addEventListener('click', ()=>{
    document.body.dataset.menu = (document.body.dataset.menu === 'open') ? '' : 'open';
  });
  document.querySelectorAll('.nav a').forEach(a=> a.addEventListener('click', ()=>{ document.body.dataset.menu = ''; }));
})();

// Tema claro/oscuro
function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); }
function getPreferredTheme() { const saved = localStorage.getItem('theme'); if (saved) return saved; const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; return prefersLight ? 'light' : 'dark'; }
let currentTheme = getPreferredTheme(); applyTheme(currentTheme);
if (themeToggle) themeToggle.addEventListener('click', ()=>{ currentTheme = currentTheme==='light'?'dark':'light'; localStorage.setItem('theme', currentTheme); applyTheme(currentTheme); });

// Recetas: filtro + búsqueda + paginación
const recipeState = { filter: 'all', query: '', page: 1, perPage: 6 };
function getRecipeCards() { return Array.from(document.querySelectorAll('.recipe-card')); }
function matchesCard(card, state) { const cat = card.dataset.category||''; const text = (card.textContent||'').toLowerCase(); const q = state.query.toLowerCase(); const passFilter = (state.filter==='all') || (cat===state.filter); const passQuery = !q || text.includes(q); return passFilter && passQuery; }
function renderPager(total, state){ if(!recipePager) return; const pages = Math.max(1, Math.ceil(total/state.perPage)); recipePager.innerHTML=''; for(let p=1;p<=pages;p++){ const b=document.createElement('button'); b.textContent=String(p); if(p===state.page) b.classList.add('active'); b.addEventListener('click', ()=>{ state.page=p; updateRecipes(); }); recipePager.appendChild(b);} }
function updateRecipes(){ const cards=getRecipeCards(); const filtered=cards.filter(c=>matchesCard(c, recipeState)); const start=(recipeState.page-1)*recipeState.perPage; const end=start+recipeState.perPage; filtered.forEach((c,i)=>{ c.style.display=(i>=start&&i<end)?'':'none'; }); cards.filter(c=>!filtered.includes(c)).forEach(c=>c.style.display='none'); renderPager(filtered.length, recipeState); }
if (recipeFilters) recipeFilters.addEventListener('click', (e)=>{ const btn=e.target.closest('.chip'); if(!btn) return; recipeState.filter=btn.dataset.filter; recipeState.page=1; [...recipeFilters.querySelectorAll('.chip')].forEach(c=>c.classList.toggle('active', c===btn)); updateRecipes(); });
if (recipeSearch) recipeSearch.addEventListener('input', ()=>{ recipeState.query=recipeSearch.value.trim(); recipeState.page=1; updateRecipes(); });
if (document.querySelector('.recipe-card')) updateRecipes();

// Recetas: botón aleatorio y recuentos en chips
const randomBtn = document.getElementById('randomRecipe');
if (randomBtn){
  randomBtn.addEventListener('click', ()=>{
    const links = Array.from(document.querySelectorAll('.recipe-card a[href]'));
    if (!links.length) return;
    const idx = Math.floor(Math.random()*links.length);
    window.location.href = links[idx].getAttribute('href');
  });
}
// Añadir contadores a chips
if (recipeFilters){
  const counts = { all: document.querySelectorAll('.recipe-card').length };
  document.querySelectorAll('.recipe-card').forEach(card=>{
    const c = card.dataset.category || 'other';
    counts[c] = (counts[c]||0) + 1;
  });
  recipeFilters.querySelectorAll('.chip').forEach(ch=>{
    const f = ch.dataset.filter;
    if (f && counts[f]!=null){ ch.textContent = ch.textContent.replace(/\s*\(.*\)$/, '') + ` (${counts[f]})`; }
  });
}

// Blog: filtro + búsqueda
const blogState = { filter: 'all', query: '', page: 1, perPage: 6 };
const blogPager = document.getElementById('blogPager');
function getBlogCards(){ return Array.from(document.querySelectorAll('.post-card')); }
function matchesBlog(card, state){ const cat = card.dataset.category||''; const text = (card.textContent||'').toLowerCase(); const q = state.query.toLowerCase(); const passF = (state.filter==='all')||(cat===state.filter); const passQ = !q || text.includes(q); return passF && passQ; }
function renderBlogPager(total){ if(!blogPager) return; const pages=Math.max(1, Math.ceil(total/blogState.perPage)); blogPager.innerHTML=''; for(let p=1;p<=pages;p++){ const b=document.createElement('button'); b.textContent=String(p); if(p===blogState.page) b.classList.add('active'); b.addEventListener('click', ()=>{ blogState.page=p; updateBlog(); }); blogPager.appendChild(b);} }
function updateBlog(){ const cards=getBlogCards(); const filtered=cards.filter(c=>matchesBlog(c, blogState)); const start=(blogState.page-1)*blogState.perPage; const end=start+blogState.perPage; filtered.forEach((c,i)=>{ c.style.display=(i>=start&&i<end)?'':'none'; }); cards.filter(c=>!filtered.includes(c)).forEach(c=>c.style.display='none'); renderBlogPager(filtered.length); }
if (blogFilters){ blogFilters.addEventListener('click', (e)=>{ const btn=e.target.closest('.chip'); if(!btn) return; blogState.filter = btn.dataset.filter; [...blogFilters.querySelectorAll('.chip')].forEach(c=>c.classList.toggle('active', c===btn)); updateBlog(); }); }
if (blogSearch){ blogSearch.addEventListener('input', ()=>{ blogState.query = blogSearch.value.trim(); updateBlog(); }); }
if (document.querySelector('.post-card')) updateBlog();

// Recipe meta: time/difficulty badges via map
const recipeMeta = {
  '/static/recetas/overnight-oats.html': { time:'5 min', difficulty:'Fácil' },
  '/static/recetas/tostada-huevo.html': { time:'10 min', difficulty:'Fácil' },
  '/static/recetas/yogur-nueces.html': { time:'5 min', difficulty:'Muy fácil' },
  '/static/recetas/bowl-pollo-quinoa.html': { time:'25 min', difficulty:'Media' },
  '/static/recetas/tacos-pavo.html': { time:'20 min', difficulty:'Fácil' },
  '/static/recetas/ensalada-garbanzos.html': { time:'12 min', difficulty:'Fácil' },
  '/static/recetas/salmon-verduras.html': { time:'20 min', difficulty:'Fácil' },
  '/static/recetas/tofu-salteado.html': { time:'15 min', difficulty:'Fácil' },
  '/static/recetas/merluza-horno.html': { time:'15 min', difficulty:'Fácil' },
  '/static/recetas/batido-whey.html': { time:'5 min', difficulty:'Muy fácil' },
  '/static/recetas/tortita-avena.html': { time:'15 min', difficulty:'Fácil' },
  '/static/recetas/pasta-integral-atun.html': { time:'20 min', difficulty:'Fácil' },
  '/static/recetas/chia-pudding.html': { time:'5 min (+reposo)', difficulty:'Muy fácil' },
  '/static/recetas/arroz-integral-verduras.html': { time:'20 min', difficulty:'Fácil' },
  '/static/recetas/crema-calabaza.html': { time:'30 min', difficulty:'Fácil' },
  '/static/recetas/hummus-palitos.html': { time:'10 min', difficulty:'Muy fácil' },
  '/static/recetas/revuelto-claras-verduras.html': { time:'12 min', difficulty:'Fácil' },
  '/static/recetas/wrap-integral-atun.html': { time:'10 min', difficulty:'Muy fácil' },
  '/static/recetas/batido-verde.html': { time:'5 min', difficulty:'Muy fácil' },
};

function enhanceRecipeCards(){
  document.querySelectorAll('.recipe-card').forEach(card=>{
    const a = card.querySelector('a[href]'); if(!a) return; const href = a.getAttribute('href'); const meta = recipeMeta[href];
    if (!meta) return; let badges = card.querySelector('.badges'); if(!badges){ badges=document.createElement('div'); badges.className='badges'; card.appendChild(badges);} 
    const t=document.createElement('span'); t.textContent = meta.time; badges.appendChild(t);
    const d=document.createElement('span'); d.textContent = meta.difficulty; badges.appendChild(d);
  });
}
if (document.querySelector('.recipe-card')) enhanceRecipeCards();

function enhanceRecipeDetail(){
  const path = location.pathname;
  const meta = recipeMeta[path];
  if (!meta) return;
  const hero = document.querySelector('.hero-inner'); if(!hero) return;
  const div = document.createElement('div'); div.className = 'badges';
  const t=document.createElement('span'); t.textContent = meta.time;
  const d=document.createElement('span'); d.textContent = meta.difficulty;
  div.appendChild(t); div.appendChild(d);
  hero.appendChild(div);
}
enhanceRecipeDetail();

// Nutrition totals based on servings
function buildNutritionTotals(){
  const table = document.querySelector('.nutri-table'); if(!table) return;
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const data = rows.map(r=>{ const k=r.children[0].textContent.trim(); const v=r.children[1].textContent.trim(); const m=v.match(/([0-9]+(?:\.[0-9]+)?)\s*(kcal|g)/i); return m? {k, val: parseFloat(m[1]), unit: m[2]}:null; }).filter(Boolean);
  const wrap = document.createElement('div'); wrap.className='card';
  const label = document.createElement('label'); label.textContent = 'Raciones'; label.style.display='block'; label.style.marginBottom='6px';
  const inp = document.createElement('input'); inp.type='number'; inp.min='1'; inp.value='1'; inp.style.width='120px';
  const totals = document.createElement('table'); totals.className='nutri-table'; totals.innerHTML = '<thead><tr><th>Totales</th><th>Cantidad</th></tr></thead><tbody></tbody>';
  function render(){ const n=parseFloat(inp.value)||1; const tbody=totals.querySelector('tbody'); tbody.innerHTML=''; data.forEach(d=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${d.k}</td><td>${(d.val*n).toFixed(0)} ${d.unit}</td>`; tbody.appendChild(tr); }); }
  inp.addEventListener('input', render); render();
  const container = table.closest('.card')?.parentElement || table.parentElement;
  wrap.appendChild(label); wrap.appendChild(inp); wrap.appendChild(totals);
  container.appendChild(wrap);
}
buildNutritionTotals();

// Global Search overlay
let searchIndex = null; let overlay=null; let inputEl=null; let resultsEl=null;
function ensureSearch(){
  if (overlay) return;
  overlay = document.createElement('div'); overlay.className='search-overlay';
  overlay.innerHTML = `<div class="search-panel"><div class="search-box"><span>🔎</span><input id="globalsearch" placeholder="Busca recetas o artículos... (Ctrl+K)" /><button class="search-close" aria-label="Cerrar">✕</button></div><div class="search-results"></div></div>`;
  document.body.appendChild(overlay);
  inputEl = overlay.querySelector('#globalsearch');
  resultsEl = overlay.querySelector('.search-results');
  overlay.querySelector('.search-close').addEventListener('click', ()=> hideSearch());
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) hideSearch(); });
  inputEl.addEventListener('input', ()=> renderResults(inputEl.value.trim()));
}
async function loadIndex(){ if (searchIndex) return searchIndex; const res=await fetch('/static/data/search-index.json'); searchIndex = await res.json(); return searchIndex; }
function showSearch(){ ensureSearch(); overlay.classList.add('open'); inputEl.focus(); }
function hideSearch(){ if(overlay) overlay.classList.remove('open'); }
function renderResults(q){ q=q.toLowerCase(); const data=(searchIndex||[]).filter(it=>!q || it.title.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)); resultsEl.innerHTML=''; data.slice(0,50).forEach(it=>{ const a=document.createElement('a'); a.className='search-item'; a.href=it.url; a.innerHTML=`<img class="thumb" src="${it.thumb}" alt=""><div><div><strong>${it.title}</strong></div><div class="tag">${it.type} • ${it.category}</div></div><div>→</div>`; resultsEl.appendChild(a); }); }

// Add search button to header
(function initGlobalSearch(){ const header=document.querySelector('.header-inner'); if(!header) return; const btn=document.createElement('button'); btn.className='menu-toggle'; btn.textContent='🔎'; header.appendChild(btn); btn.addEventListener('click', async ()=>{ await loadIndex(); showSearch(); renderResults(''); }); document.addEventListener('keydown', async (e)=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); await loadIndex(); showSearch(); renderResults(''); } if(e.key==='Escape') hideSearch(); }); })();

// Suscripción
document.querySelectorAll('form.subscribe').forEach((f)=>{ f.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const email=f.querySelector('input[type="email"]').value.trim(); const nameEl=f.querySelector('input[name="name"]'); const name=nameEl?nameEl.value.trim():undefined; try{ const res=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ email, name })}); if(!res.ok) throw new Error(); showToast('¡Gracias por suscribirte!','success'); f.reset(); }catch{ showToast('Error al suscribirte.','error'); } }); });

// Calculadoras
if (bmiForm){ bmiForm.addEventListener('submit',(e)=>{ e.preventDefault(); const w=parseFloat(bmiForm.weight.value); const h=parseFloat(bmiForm.height.value)/100; if(!w||!h) return; const bmi=w/(h*h); let cat='Normal'; if(bmi<18.5) cat='Bajo peso'; else if(bmi<25) cat='Normal'; else if(bmi<30) cat='Sobrepeso'; else cat='Obesidad'; const el=document.getElementById('bmiResult'); if(el) el.textContent=`IMC: ${bmi.toFixed(1)} (${cat})`; }); }
if (tdeeForm){ tdeeForm.addEventListener('submit',(e)=>{ e.preventDefault(); const sex=tdeeForm.sex.value; const age=parseFloat(tdeeForm.age.value); const w=parseFloat(tdeeForm.weight.value); const h=parseFloat(tdeeForm.height.value); const act=parseFloat(tdeeForm.activity.value); if(!age||!w||!h) return; const bmr= sex==='m' ? (10*w+6.25*h-5*age+5) : (10*w+6.25*h-5*age-161); const tdee=bmr*act; const el=document.getElementById('tdeeResult'); if(el) el.textContent=`TDEE estimado: ${Math.round(tdee)} kcal/día`; }); }

// Contacto
if (contactForm){ contactForm.addEventListener('submit', async (e)=>{ e.preventDefault(); const data=Object.fromEntries(new FormData(contactForm).entries()); try{ const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!r.ok) throw new Error(); showToast('¡Gracias por tu mensaje!','success'); contactForm.reset(); }catch{ showToast('No pudimos enviar tu mensaje.','error'); } }); }

// --------------- AUTH (JWT + Refresh) ---------------
function setTokens(access, refresh, profile){ if(access) localStorage.setItem('accessToken', access); if(refresh) localStorage.setItem('refreshToken', refresh); if(profile) localStorage.setItem('authProfile', JSON.stringify(profile)); refreshAuthUI(); }
function getAccessToken(){ return localStorage.getItem('accessToken'); }
function getRefreshToken(){ return localStorage.getItem('refreshToken'); }
function getProfile(){ try{ return JSON.parse(localStorage.getItem('authProfile')||'null'); }catch{ return null; } }
function logout(){ const rt=getRefreshToken(); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('authProfile'); refreshAuthUI(); if(rt) fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt})}).catch(()=>{}); }

async function api(path, opts={}){ const headers=Object.assign({'Content-Type':'application/json'}, opts.headers||{}); const at=getAccessToken(); if(at) headers['Authorization']=`Bearer ${at}`; let res=await fetch(path, Object.assign({}, opts, { headers })); if(res.status===401 && getRefreshToken()){ const rr=await fetch('/api/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ refresh_token:getRefreshToken() })}); if(rr.ok){ const data=await rr.json(); localStorage.setItem('accessToken', data.access_token); headers['Authorization']=`Bearer ${data.access_token}`; res=await fetch(path, Object.assign({}, opts, { headers })); } else { logout(); } } if(!res.ok) throw new Error(`HTTP ${res.status}`); if(res.status===204) return null; return res.json(); }

function refreshAuthUI(){ const header=document.querySelector('.header-inner'); if(!header) return; let box=header.querySelector('.auth-box'); if(!box){ box=document.createElement('div'); box.className='auth-box'; box.style.display='flex'; box.style.alignItems='center'; box.style.gap='8px'; header.appendChild(box); } const prof=getProfile(); if(getAccessToken() && prof){ box.innerHTML=`<span class="muted">Hola, ${prof.name||prof.email}</span><a class="auth-link" href="/static/mi-cuenta.html">Cuenta</a><a class="auth-link" href="/static/comentarios.html">Comentarios</a><button class="auth-link" id="logoutBtn">Salir</button>`; const btn=document.getElementById('logoutBtn'); if(btn) btn.addEventListener('click', logout); } else { box.innerHTML=`<a class="auth-link" href="/static/login.html">Acceder</a><a class="auth-link primary" href="/static/signup.html">Registro</a>`; } }
refreshAuthUI();

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm){
  attachPasswordToggles(loginForm);
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');
    btn && (btn.disabled = true);
    const data=Object.fromEntries(new FormData(loginForm).entries());
    try{ const res=await api('/api/auth/login',{method:'POST',body:JSON.stringify(data)}); setTokens(res.access_token, res.refresh_token, {name:res.name, email:res.email}); showToast('¡Bienvenido!','success'); location.href='/'; }
    catch{ showToast('Credenciales inválidas','error'); }
    finally{ btn && (btn.disabled = false); }
  });
}

// Signup
const signupForm = document.getElementById('signupForm');
if (signupForm){
  attachPasswordToggles(signupForm);
  signupForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = signupForm.querySelector('button[type="submit"]');
    btn && (btn.disabled = true);
    const data=Object.fromEntries(new FormData(signupForm).entries());
    try{ const res=await api('/api/auth/signup',{method:'POST',body:JSON.stringify(data)}); setTokens(res.access_token, res.refresh_token, {name:res.name, email:res.email}); showToast('Cuenta creada','success'); location.href='/'; }
    catch{ showToast('No pudimos crear tu cuenta','error'); }
    finally{ btn && (btn.disabled = false); }
  });
}

function attachPasswordToggles(scope){
  scope.querySelectorAll('[data-toggle="password"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.previousElementSibling && btn.previousElementSibling.tagName === 'INPUT' ? btn.previousElementSibling : btn.parentElement.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
      else { input.type = 'password'; btn.textContent = '👁️'; }
    });
  });
}

// Comentarios
const commentState = { page: 1, perPage: 6, total: 0 };
async function loadComments(){ if(!commentsWrap) return; const offset=(commentState.page-1)*commentState.perPage; const data=await api(`/api/comments?offset=${offset}&limit=${commentState.perPage}`, { method:'GET', headers:{} }); commentState.total=data.total; commentsWrap.innerHTML=''; data.items.forEach(it=>{ const div=document.createElement('div'); div.className='comment-item'; const initials=(it.author||'?').trim().slice(0,2).toUpperCase(); const date=new Date(it.created_at).toLocaleString(); div.innerHTML=`<div class="avatar">${initials}</div><div><div class="meta"><span class="author">${it.author}</span><span class="date">${date}</span></div><div class="text">${it.text}</div></div>`; commentsWrap.appendChild(div); }); renderCommentsPager(); }
function renderCommentsPager(){ if(!commentsPager) return; const pages=Math.max(1, Math.ceil(commentState.total/commentState.perPage)); commentsPager.innerHTML=''; for(let p=1;p<=pages;p++){ const b=document.createElement('button'); b.textContent=String(p); if(p===commentState.page) b.classList.add('active'); b.addEventListener('click', ()=>{ commentState.page=p; loadComments(); }); commentsPager.appendChild(b);} }
if (commentsWrap) loadComments();
if (commentForm){ commentForm.addEventListener('submit', async (e)=>{ e.preventDefault(); const txt=commentForm.text.value.trim(); if(!txt) return; try{ await api('/api/comments',{method:'POST', body: JSON.stringify({ text: txt })}); commentForm.reset(); commentState.page=1; loadComments(); showToast('Comentario publicado','success'); }catch{ showToast('Debes iniciar sesión para comentar.','error'); location.href='/static/login.html'; } }); }

// Mi cuenta
if (profileForm){ const prof=getProfile(); if(!getAccessToken()||!prof){ location.href='/static/login.html'; } else { profileForm.name.value=prof.name||''; profileForm.email.value=prof.email; } profileForm.addEventListener('submit', async (e)=>{ e.preventDefault(); const name=profileForm.name.value.trim(); try{ await api('/api/me',{method:'PATCH', body: JSON.stringify({ name })}); const p=getProfile()||{}; p.name=name; localStorage.setItem('authProfile', JSON.stringify(p)); showToast('Perfil actualizado','success'); refreshAuthUI(); }catch{ showToast('Error al actualizar perfil','error'); } }); }
if (pwdForm){ pwdForm.addEventListener('submit', async (e)=>{ e.preventDefault(); const data=Object.fromEntries(new FormData(pwdForm).entries()); try{ await api('/api/me/password-change',{method:'POST', body: JSON.stringify(data)}); showToast('Contraseña cambiada. Inicia sesión de nuevo.','success'); logout(); location.href='/static/login.html'; }catch{ showToast('No pudimos cambiar la contraseña','error'); } }); }

// Mensaje inicial del chat
addMsg("assistant", "¡Hola! Soy Nova, tu coach fitness. ¿Cuál es tu objetivo principal (pérdida de grasa, músculo, rendimiento)? Dime tu nivel, tiempo semanal y equipo disponible.");

// Toasts
function ensureToastRoot(){ let el=document.querySelector('.toast-container'); if(!el){ el=document.createElement('div'); el.className='toast-container'; document.body.appendChild(el);} return el; }
function showToast(msg, type='info'){ const root=ensureToastRoot(); const el=document.createElement('div'); el.className='toast '+(type==='error'?'error': type==='success'?'success':'' ); el.textContent=msg; root.appendChild(el); setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-6px)'; }, 2600); setTimeout(()=>{ el.remove(); }, 3000); }
