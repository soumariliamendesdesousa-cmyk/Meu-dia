
(function(){
var KEY='meudia.v1';
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var CATS={estudio:{nome:'Estúdio',icon:'camera'},pessoal:{nome:'Pessoal',icon:'home'},compra:{nome:'Compra',icon:'cart'}};
var ORDEM=['estudio','pessoal','compra'];
var P={
camera:'<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
home:'<path d="M3 11l9-7.5L21 11"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
cart:'<path d="M3 4h2.5l2.2 10.5h10.3L20 7H6.3"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M18 14.8c1.8.7 3 2.4 3 5.2"/>',
layers:'<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/>',
image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M3 17l5.5-5 4 3.5 3-2.5L21 17"/>',
play:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M10 9l5 3-5 3z"/>',
file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
chev:'<path d="M9 6l6 6-6 6"/>',
save:'<path d="M12 4v10M8 10.5l4 4 4-4M5 19h14"/>',
star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
back:'<path d="M15 5l-7 7 7 7"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
chart:'<path d="M5 20v-6M11 20V9M17 20V5"/>',
user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
logo:'<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-7"/>'
};
function ic(n){return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">'+P[n]+'</svg>';}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(){return Math.random().toString(36).slice(2,8)+Date.now().toString(36);}
function pad(n){return n<10?'0'+n:''+n;}
function hoje(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function curto(s){var p=s.split('-');return p[2]+'/'+p[1];}

function seed(){
  var n=[['Clientes','users'],['Ensaios','layers'],['Edição','image'],['Conteúdo / Redes','play'],['Entregas','file'],['Organização','gear']];
  return {subs:n.map(function(x){return {id:uid(),cat:'estudio',nome:x[0],icon:x[1]};}),tasks:[]};
}
function load(){
  try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&Array.isArray(d.subs)&&Array.isArray(d.tasks))return d;}}catch(e){}
  return seed();
}
var S=load();

var CFG=window.MEUDIA_CONFIG||{};
var CLOUD=!!(CFG.url&&CFG.key&&CFG.url.indexOf('COLE')<0&&window.supabase);
var sb=null,USER=null,AUTH=CLOUD?'wait':'local';
var LG={modo:'entrar',err:'',msg:'',busy:false,email:''};
var pushT=0,pushing=false,lastSeen=0;
function isDirty(){try{return localStorage.getItem('meudia.dirty')==='1';}catch(e){return false;}}
function setDirty(v){try{localStorage.setItem('meudia.dirty',v?'1':'0');}catch(e){}}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
  if(CLOUD&&AUTH==='in'){setDirty(true);clearTimeout(pushT);pushT=setTimeout(push,700);}
}
function push(){
  if(!CLOUD||AUTH!=='in'||!USER||pushing)return Promise.resolve();
  pushing=true;
  var snap=JSON.stringify(S),stamp=new Date().toISOString();
  return sb.from('app_state').upsert({user_id:USER.id,data:JSON.parse(snap),updated_at:stamp},{onConflict:'user_id'}).then(function(r){
    pushing=false;
    if(r&&r.error){return;}
    lastSeen=new Date(stamp).getTime();
    if(JSON.stringify(S)===snap){setDirty(false);}else{clearTimeout(pushT);pushT=setTimeout(push,300);}
  },function(){pushing=false;});
}
function pull(){
  if(!CLOUD||AUTH!=='in'||!USER)return Promise.resolve();
  return sb.from('app_state').select('data,updated_at').eq('user_id',USER.id).maybeSingle().then(function(r){
    if(!r||r.error)return;
    if(isDirty()){push();return;}
    if(!r.data){push();return;}
    var t=new Date(r.data.updated_at).getTime();
    if(t===lastSeen)return;
    var d=r.data.data;
    if(d&&Array.isArray(d.subs)&&Array.isArray(d.tasks)){
      lastSeen=t;S=d;
      try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}
      if(!M)render();
    }
  },function(){});
}
function msgErro(e){
  var m=((e&&e.message)||'').toLowerCase();
  if(m.indexOf('invalid login')>=0)return 'E-mail ou senha incorretos.';
  if(m.indexOf('already')>=0&&m.indexOf('registered')>=0)return 'Esse e-mail já tem conta. Toque em Entrar.';
  if(m.indexOf('not confirmed')>=0)return 'Confirme seu e-mail pelo link que enviamos e tente de novo.';
  if(m.indexOf('rate limit')>=0)return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if(m.indexOf('password')>=0)return 'A senha precisa ter pelo menos 6 caracteres.';
  return 'Não foi possível entrar. Confira os dados e a internet.';
}
function acct(){
  return (CLOUD&&AUTH==='in'&&USER)?'<p class="mini-t">Nuvem ligada em <b>'+esc(USER.email||'')+'</b>. Suas tarefas são salvas sozinhas.</p><button type="button" class="btn ghost" data-act="sair">Sair da conta</button>':'';
}
function vLogin(){
  var criar=LG.modo==='criar';
  return '<div class="login"><div class="top"><span></span><div class="mid"><div class="brand">'+ic('logo')+'Meu Dia</div><p class="date">'+(criar?'Crie sua conta':'Entre para ver suas tarefas')+'</p></div><span></span></div>'+
    '<form id="lf" class="quick" novalidate><div><label for="l-e">E-mail</label><input type="email" id="l-e" autocomplete="username" inputmode="email" value="'+esc(LG.email)+'"></div>'+
    '<div><label for="l-p">Senha</label><input type="password" id="l-p" autocomplete="'+(criar?'new-password':'current-password')+'"></div>'+
    (LG.err?'<p class="err" role="alert">'+LG.err+'</p>':'')+(LG.msg?'<p class="okmsg" role="status">'+LG.msg+'</p>':'')+
    '<button type="submit" class="btn main"'+(LG.busy?' disabled':'')+'>'+(LG.busy?'Aguarde...':(criar?'Criar conta':'Entrar'))+'</button>'+
    '<button type="button" class="linkbtn" data-act="lgmodo">'+(criar?'Já tenho conta. Entrar':'Primeira vez? Criar conta')+'</button></form></div>';
}
function bootAuth(){
  sb.auth.getSession().then(function(r){
    var se=r&&r.data&&r.data.session;
    if(se){USER=se.user;AUTH='in';render();pull();}
    else if(!navigator.onLine&&AUTH==='wait'){AUTH='in';render();}
    else{AUTH='out';render();}
  },function(){if(!navigator.onLine){AUTH='in';render();}else{AUTH='out';render();}});
}
function boot(){
  if(!CLOUD){render();return;}
  sb=window.supabase.createClient(CFG.url,CFG.key);
  sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'&&AUTH==='in'){USER=null;AUTH='out';render();}});
  render();bootAuth();
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&AUTH==='in'){if(!USER)bootAuth();else if(isDirty())push();else pull();}});
  window.addEventListener('online',function(){if(AUTH==='in'){if(!USER)bootAuth();else if(isDirty())push();else pull();}});
}


var HF={titulo:'',cat:'',sub:'',fav:false,err:'',msg:'',focus:false};
var FILT='todas';
try{var sf=localStorage.getItem('meudia.filt');if(sf==='hoje'||sf==='todas')FILT=sf;}catch(e){}
var M=null,slide='',lastHash=null; /* folha aberta */
var app=document.getElementById('app'),layer=document.getElementById('layer');

function route(){
  var h=location.hash.replace('#',''),m;
  if(h==='progresso')return {v:'progresso'};
  if(h==='perfil')return {v:'perfil'};
  if((m=h.match(/^cat-(estudio|pessoal|compra)$/)))return {v:'cat',cat:m[1]};
  if((m=h.match(/^sem-(estudio|pessoal|compra)$/)))return {v:'sem',cat:m[1]};
  if((m=h.match(/^sub-([a-z0-9]+)$/))){var s=S.subs.filter(function(x){return x.id===m[1];})[0];if(s)return {v:'sub',sub:s};}
  return {v:'inicio'};
}
function go(h){M=null;window.scrollTo(0,0);if(location.hash==='#'+h){render();}else{location.hash=h;render();}}

function saudacao(){var h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';}
function subNome(t){var s=S.subs.filter(function(x){return x.id===t.sub;})[0];return s?s.nome:'';}

function taskRow(t,opt){
  var tag=opt&&opt.data?'<span class="tag dt">'+curto(t.data)+'</span>':'<span class="tag '+t.cat+'">'+CATS[t.cat].nome+'</span>';
  return '<div class="task'+(t.feita?' done':'')+'">'+
    '<button class="hit" data-act="toggle" data-id="'+t.id+'" role="checkbox" aria-checked="'+(!!t.feita)+'" aria-label="Concluir '+esc(t.titulo)+'"><span class="chk">'+ic('check')+'</span></button>'+
    '<span class="tt">'+esc(t.titulo)+'</span>'+tag+
    '<button class="star'+(t.fav?' on':'')+'" data-act="fav" data-id="'+t.id+'" aria-pressed="'+(!!t.fav)+'" aria-label="Favoritar '+esc(t.titulo)+'">'+ic('star')+'</button>'+
    '<button class="edit" data-act="edit" data-id="'+t.id+'" aria-label="Editar '+esc(t.titulo)+'">'+ic('chev')+'</button></div>';
}
function ordena(a){return a.slice().sort(function(x,y){return (x.feita?1:0)-(y.feita?1:0)||(x.data<y.data?-1:x.data>y.data?1:0);});}
function pendentes(f){return S.tasks.filter(function(t){return !t.feita&&f(t);}).length;}

var LIM_MSG='Limite de 5 favoritas por dia.';
function favCount(d,ex){return S.tasks.filter(function(t){return t.fav&&t.data===d&&t.id!==ex;}).length;}
var toastT=0;
function toast(m){
  var d=document.getElementById('toast');
  if(!d){d=document.createElement('div');d.id='toast';d.className='toast';d.setAttribute('role','status');document.body.appendChild(d);}
  d.textContent=m;void d.offsetWidth;d.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){d.classList.remove('on');},2600);
}
function addDias(n){var d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function okFilt(t){return FILT==='todas'||t.data===hoje();}
function segHtml(){return '<div class="seg" role="group" aria-label="Mostrar pendentes"><button data-act="filt" data-f="hoje" aria-pressed="'+(FILT==='hoje')+'">Hoje</button><button data-act="filt" data-f="todas" aria-pressed="'+(FILT==='todas')+'">Todas</button></div>';}
function quickForm(){
  var chips=ORDEM.map(function(c){return '<button type="button" class="chip c-'+c+'" data-act="hcat" data-cat="'+c+'" aria-pressed="'+(HF.cat===c)+'">'+CATS[c].nome+'</button>';}).join('');
  var sel=HF.cat?'<select id="h-s" aria-label="Subcategoria">'+subOptions(HF.cat,HF.sub)+'</select>':'';
  return '<form id="hf" class="quick" novalidate><div class="q-row"><input type="text" id="h-t" placeholder="Nova tarefa de hoje" aria-label="Nova tarefa" autocomplete="off" maxlength="140" value="'+esc(HF.titulo)+'"><button type="button" class="q-star" data-act="hfav" aria-label="Favorita" aria-pressed="'+(!!HF.fav)+'">'+ic('star')+'</button><button type="submit" class="q-add" aria-label="Adicionar tarefa">'+ic('check')+'</button></div>'+
    '<div class="chips cats">'+chips+'</div>'+sel+
    (HF.err?'<p class="err" role="alert">'+HF.err+'</p>':'')+(HF.msg?'<p class="okmsg" role="status">'+HF.msg+'</p>':'')+'</form>';
}
function readHF(){var t=document.getElementById('h-t'),s=document.getElementById('h-s');if(t)HF.titulo=t.value;if(s)HF.sub=s.value;}
function dotsHtml(cur){return '';var pg=['inicio'].concat(ORDEM);return '<div class="dots" role="img" aria-label="Tela '+(pg.indexOf(cur)+1)+' de 4">'+pg.map(function(x){return '<span class="dot'+(x===cur?' on':'')+'"></span>';}).join('')+'</div>';}
function vInicio(){
  var d=new Date(),h=hoje();
  var ts=S.tasks.filter(function(t){return t.data===h;});
  var fe=ts.filter(function(t){return t.feita;}).length;
  var pct=ts.length?Math.round(fe/ts.length*100):0;
  var shorts=ORDEM.map(function(c){return '<button class="tile c-'+c+'" data-act="go" data-to="cat-'+c+'">'+ic(CATS[c].icon)+'<span>'+CATS[c].nome+'</span></button>';}).join('');
  var favs=ts.filter(function(t){return t.fav;});
  var lista=favs.length?'<div class="list">'+ordena(favs).map(function(t){return taskRow(t);}).join('')+'</div>':
    '<div class="list"><div class="empty">'+(ts.length?'<b>Nenhuma favorita hoje</b>Toque na estrela de uma tarefa para ela aparecer aqui.':'<b>Nenhuma tarefa para hoje</b>Toque no + para criar a primeira.')+'</div></div>';
  return '<div class="top"><span></span><div class="mid"><div class="brand">'+ic('logo')+'Meu Dia</div><p class="date">Hoje, '+d.getDate()+' de '+MESES[d.getMonth()]+'</p></div><button class="back" data-act="backup" aria-label="Cópia de segurança">'+ic('save')+'</button></div>'+
    dotsHtml('inicio')+'<div class="hello"><svg class="sun" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M11.3 36.7l4.2-4.2M32.5 15.5l4.2-4.2"/></svg>'+
    '<div><h2>'+saudacao()+', Mari!</h2><p>Organização, foco e equilíbrio. <svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg></p></div></div>'+
    quickForm()+
    '<div class="sec-head"><h3>Tarefas de hoje</h3><span>'+pct+'% concluído</span></div>'+
    '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></div>'+lista;
}

function vCat(c){
  var subs=S.subs.filter(function(s){return s.cat===c;});
  var rows=subs.map(function(s){
    var n=pendentes(function(t){return t.sub===s.id&&okFilt(t);});
    return '<button class="row c-'+c+'" data-act="go" data-to="sub-'+s.id+'">'+ic(s.icon||'folder')+'<span class="nm">'+esc(s.nome)+'</span>'+(n?'<span class="meta">'+n+(n===1?' pendente':' pendentes')+'</span>':'')+ic('chev')+'</button>';
  }).join('');
  var sem=S.tasks.filter(function(t){return t.cat===c&&!t.sub;});
  if(sem.length){var ns=sem.filter(function(t){return !t.feita&&okFilt(t);}).length;
    rows+='<button class="row c-'+c+'" data-act="go" data-to="sem-'+c+'">'+ic('folder')+'<span class="nm">Sem subcategoria</span>'+(ns?'<span class="meta">'+ns+(ns===1?' pendente':' pendentes')+'</span>':'')+ic('chev')+'</button>';}
  var outras=ORDEM.filter(function(x){return x!==c;}).map(function(x){
    return '<button class="row big c-'+x+'" data-act="go" data-to="cat-'+x+'">'+ic(CATS[x].icon)+'<span class="nm">'+CATS[x].nome+'</span>'+ic('chev')+'</button>';}).join('');
  return '<div class="top start"><button class="back" data-act="go" data-to="inicio" aria-label="Voltar">'+ic('back')+'</button><div class="mid"><div class="cat-title"><div class="ico">'+ic(CATS[c].icon)+'</div><h1>'+CATS[c].nome+'</h1></div></div><span></span></div>'+
    segHtml()+
    '<div class="rows">'+rows+'</div>'+
    '<button class="add" data-act="newsub" data-cat="'+c+'">'+ic('plus')+'Nova subcategoria</button>'+
    '';
}

function vLista(titulo,cat,backTo,ts,subId){
  var lista=ts.length?'<div class="list">'+ordena(ts).map(function(t){return taskRow(t,{data:true});}).join('')+'</div>':
    '<div class="list"><div class="empty"><b>Nenhuma tarefa aqui</b>Toque em "Nova tarefa" para criar.</div></div>';
  var tools=subId?'<div class="tools"><button class="pill" data-act="rensub" data-id="'+subId+'">Renomear</button><button class="pill warn" data-act="delsub" data-id="'+subId+'">Excluir subcategoria</button></div>':'<div style="height:16px"></div>';
  return '<div class="top start"><button class="back" data-act="go" data-to="'+backTo+'" aria-label="Voltar">'+ic('back')+'</button><div class="mid"><div class="cat-title"><div class="ico">'+ic(subId?(S.subs.filter(function(s){return s.id===subId;})[0].icon||'folder'):'folder')+'</div><h1>'+esc(titulo)+'</h1><span class="tag '+cat+'">'+CATS[cat].nome+'</span></div></div><span></span></div>'+
    tools+lista+
    '<button class="add" data-act="newtask" data-cat="'+cat+'" data-sub="'+(subId||'')+'">'+ic('plus')+'Nova tarefa</button>';
}

function motivo(t){
  var h=hoje(),o=t.orig||t.data;
  if(!t.feita&&t.data<h)return 'Atrasada';
  if(t.feita&&t.feitaEm&&t.feitaEm>o)return 'Concluída depois da data';
  if(t.data>o)return 'Adiada';
  return '';
}
function vProgresso(){
  var cats=ORDEM.map(function(c){
    var ts=S.tasks.filter(function(t){return t.cat===c;}),f=ts.filter(function(t){return t.feita;}).length,p=ts.length?Math.round(f/ts.length*100):0;
    return '<div class="pc c-'+c+'"><div class="pc-h"><b>'+CATS[c].nome+'</b><span>'+p+'% concluído</span></div><div class="bar" role="progressbar" aria-label="'+CATS[c].nome+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'"><i style="width:'+p+'%;background:var(--rail)"></i></div></div>';
  }).join('');
  var pr=S.tasks.filter(function(t){return motivo(t);});
  var lista=pr.length?'<div class="list">'+pr.map(function(t){
    return '<div class="task"><span class="tt">'+esc(t.titulo)+'<small class="why">'+motivo(t)+'</small></span><span class="tag '+t.cat+'">'+CATS[t.cat].nome+'</span><button class="edit" data-act="edit" data-id="'+t.id+'" aria-label="Editar '+esc(t.titulo)+'">'+ic('chev')+'</button></div>';
  }).join('')+'</div>':'<div class="list"><div class="empty"><b>Nenhuma por enquanto</b>Tarefas atrasadas, adiadas ou concluídas depois da data aparecem aqui.</div></div>';
  return '<div class="top"><span></span><div class="mid"><div class="brand">'+ic('logo')+'Meu Dia</div></div><span></span></div>'+
    '<div class="sec-head"><h3>Por categoria</h3></div><div class="list pcs">'+cats+'</div><div class="gap"></div>'+
    '<div class="sec-head"><h3>Procrastinadas</h3><span>'+pr.length+'</span></div>'+lista;
}
function vSoon(t,i,txt){
  return '<div class="top"><span></span><div class="mid"><div class="brand">'+ic('logo')+'Meu Dia</div></div><span></span></div>'+
    '<div class="soon">'+ic(i)+'<h2>'+t+'</h2><p>'+txt+'</p></div>';
}

function navHtml(a){
  function b(h,i,l){return '<button data-act="go" data-to="'+h+'"'+(a===h?' aria-current="page"':'')+'>'+ic(i)+l+'</button>';}
  return '<nav class="nav" aria-label="Menu principal"><div>'+b('inicio','home','Início')+b('progresso','chart','Progresso')+''+'</div></nav>';
}

function render(){
  readHF();
  if(AUTH==='wait'){M=null;layer.innerHTML='';app.className='app';document.body.removeAttribute('data-c');app.innerHTML='<div class="top"><span></span><div class="mid"><div class="brand">'+ic('logo')+'Meu Dia</div></div><span></span></div>';return;}
  if(AUTH==='out'){M=null;layer.innerHTML='';app.className='app';document.body.removeAttribute('data-c');app.innerHTML=vLogin();return;}
  var r=route(),html='',nav='';
  if(r.v==='inicio'){html=vInicio();nav=navHtml('inicio');}
  else if(r.v==='progresso'){html=vProgresso();nav=navHtml('progresso');}
  else if(r.v==='perfil'){html=vSoon('Perfil','user','Esta tela ainda vai ser montada.');nav=navHtml('perfil');}
  else if(r.v==='cat'){html=vCat(r.cat);}
  else if(r.v==='sem'){html=vLista('Sem subcategoria',r.cat,'cat-'+r.cat,S.tasks.filter(function(t){return t.cat===r.cat&&!t.sub;}),'');}
  else if(r.v==='sub'){html=vLista(r.sub.nome,r.sub.cat,'cat-'+r.sub.cat,S.tasks.filter(function(t){return t.sub===r.sub.id;}),r.sub.id);}
  app.className='app'+(r.v==='inicio'?' home':'');
  app.innerHTML=html+nav;
  app.classList.remove('sl','sr');
  if(slide&&(r.v==='cat'||r.v==='inicio')){void app.offsetWidth;app.classList.add(slide);}
  slide='';lastHash=location.hash;
  var bc=r.v==='cat'||r.v==='sem'?r.cat:r.v==='sub'?r.sub.cat:'';
  if(bc)document.body.setAttribute('data-c',bc);else document.body.removeAttribute('data-c');
  if(HF.focus&&r.v==='inicio'){var q=document.getElementById('h-t');if(q){try{q.focus({preventScroll:true});}catch(x){}}}
  HF.focus=false;
  renderSheet();
}

/* ---------- folhas (nova tarefa, editar, subcategoria) ---------- */
function subOptions(c,sel){
  var o='<option value="">Sem subcategoria</option>';
  S.subs.filter(function(s){return s.cat===c;}).forEach(function(s){o+='<option value="'+s.id+'"'+(s.id===sel?' selected':'')+'>'+esc(s.nome)+'</option>';});
  return o;
}
function renderSheet(){
  if(!M){layer.innerHTML='';return;}
  var h='<div class="scrim" data-act="close"></div><div class="sheet'+(M.t==='mini'||M.t==='backup'?' mini':'')+'" role="dialog" aria-modal="true">';
  if(M.t==='task'){
    h+='<form id="f" novalidate><h2>'+(M.id?'Editar tarefa':'Nova tarefa')+'</h2>'+
      '<div><label for="f-t">O que precisa fazer?</label><input type="text" id="f-t" autocomplete="off" value="'+esc(M.titulo)+'" maxlength="140">'+(M.err?'<p class="err">'+M.err+'</p>':'')+'</div>'+
      '<div><span class="lbl">Categoria</span><div class="chips">'+ORDEM.map(function(c){return '<button type="button" class="chip c-'+c+'" data-act="pickcat" data-cat="'+c+'" aria-pressed="'+(M.cat===c)+'">'+CATS[c].nome+'</button>';}).join('')+'</div></div>'+
      '<div><label for="f-s">Subcategoria</label><select id="f-s">'+subOptions(M.cat,M.sub)+'</select></div>'+
      '<div><label for="f-d">Data</label><input type="date" id="f-d" value="'+M.data+'"></div>'+
      
      '<div><button type="button" class="chip" data-act="pickfav" aria-pressed="'+(!!M.fav)+'">★ Favorita (aparece na tela inicial)</button>'+(M.errF?'<p class="err" role="alert">'+M.errF+'</p>':'')+'</div>'+
      '<div class="btns"><button type="submit" class="btn main">Salvar</button><button type="button" class="btn ghost" data-act="close">Cancelar</button>'+
      (M.id?'<button type="button" class="btn del'+(M.conf?' on':'')+'" data-act="deltask">'+(M.conf?'Toque de novo para excluir':'Excluir')+'</button>':'')+'</div></form>';
  }else if(M.t==='sub'){
    h+='<form id="f" novalidate><h2>'+(M.id?'Renomear subcategoria':'Nova subcategoria')+'</h2>'+
      '<div><span class="lbl">Categoria</span><div><span class="tag '+M.cat+'">'+CATS[M.cat].nome+'</span></div></div>'+
      '<div><label for="f-n">Nome</label><input type="text" id="f-n" autocomplete="off" value="'+esc(M.nome)+'" maxlength="40">'+(M.err?'<p class="err">'+M.err+'</p>':'')+'</div>'+
      '<div class="btns"><button type="submit" class="btn main">Salvar</button><button type="button" class="btn ghost" data-act="close">Cancelar</button></div></form>';
  }else if(M.t==='mini'){
    var tk=S.tasks.filter(function(x){return x.id===M.id;})[0];
    if(!tk){M=null;layer.innerHTML='';return;}
    h+='<div class="mini-in"><h2>Adiar para</h2><p class="mini-t">'+esc(tk.titulo)+'</p>'+
      '<div class="chips"><button type="button" class="chip" data-act="adiarq" data-d="1">Amanhã</button><button type="button" class="chip" data-act="adiarq" data-d="2">Depois de amanhã</button><button type="button" class="chip" data-act="adiarq" data-d="7">Próxima semana</button></div>'+
      (M.errF?'<p class="err" role="alert">'+M.errF+'</p>':'')+
      '<div class="btns"><button type="button" class="btn ghost" data-act="editfull">Editar tarefa</button><button type="button" class="btn ghost" data-act="close">Fechar</button></div></div>';
  }else if(M.t==='backup'){
    h+='<div class="mini-in"><h2>Cópia de segurança</h2>'+acct()+'<p class="mini-t">Copie suas tarefas e guarde em um lugar seguro, por exemplo mandando para você mesma. Para restaurar, cole o texto abaixo.</p>'+
      '<button type="button" class="btn main" data-act="bkcopy">Copiar minhas tarefas</button>'+
      '<textarea id="bk-t" rows="3" placeholder="Cole aqui a cópia para restaurar" aria-label="Cópia para restaurar">'+esc(M.txt||'')+'</textarea>'+
      (M.err?'<p class="err" role="alert">'+M.err+'</p>':'')+
      '<div class="btns"><button type="button" class="btn del'+(M.conf?' on':'')+'" data-act="bkrest">'+(M.conf?'Toque de novo para substituir':'Restaurar')+'</button><button type="button" class="btn ghost" data-act="close">Fechar</button></div></div>';
  }else if(M.t==='delsub'){
    var n=S.tasks.filter(function(t){return t.sub===M.id;}).length;
    h+='<form id="f" novalidate><h2>Excluir "'+esc(M.nome)+'"?</h2><p style="margin:0">'+(n?'As '+n+(n===1?' tarefa continua':' tarefas continuam')+' no app, sem subcategoria.':'Esta subcategoria não tem tarefas.')+'</p>'+
      '<div class="btns"><button type="button" class="btn del on" data-act="delsubok">Excluir</button><button type="button" class="btn ghost" data-act="close">Cancelar</button></div></form>';
  }
  layer.innerHTML=h+'</div>';
  var f=document.getElementById(M.t==='task'?'f-t':'f-n');
  if(f&&!M.noFocus){try{f.focus({preventScroll:true});}catch(e){}}
}
function sync(){
  if(!M)return;
  var t=document.getElementById('f-t'),s=document.getElementById('f-s'),d=document.getElementById('f-d'),n=document.getElementById('f-n');
  if(t)M.titulo=t.value;if(s)M.sub=s.value;if(d&&d.value)M.data=d.value;if(n)M.nome=n.value;
}

document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.getAttribute('data-act'),id=el.getAttribute('data-id');
  if(a==='go'){go(el.getAttribute('data-to'));}
  else if(a==='toggle'){var t=S.tasks.filter(function(x){return x.id===id;})[0];if(t){t.feita=!t.feita;if(t.feita)t.feitaEm=hoje();else delete t.feitaEm;save();render();}}
  else if(a==='adiarq'){var tq=S.tasks.filter(function(x){return x.id===M.id;})[0];if(tq){var nq=addDias(parseInt(el.getAttribute('data-d'),10));if(tq.fav&&favCount(nq,tq.id)>=5){M.errF='Esse dia já tem 5 favoritas.';renderSheet();}else{tq.data=nq;save();M=null;render();toast('Adiada para '+curto(nq)+'.');}}}
  else if(a==='backup'){M={t:'backup',txt:'',err:'',conf:false};renderSheet();}
  else if(a==='bkcopy'){
    var txt=JSON.stringify(S),ta=document.getElementById('bk-t');
    var fb=function(){if(ta){ta.value=txt;ta.focus();ta.select();}toast('Selecione o texto e copie.');};
    if(navigator.clipboard&&navigator.clipboard.writeText){try{navigator.clipboard.writeText(txt).then(function(){toast('Cópia feita. Cole em um lugar seguro.');},fb);}catch(x){fb();}}else{fb();}
  }
  else if(a==='bkrest'){
    var ta2=document.getElementById('bk-t'),raw=ta2?ta2.value.trim():'',d2=null;
    try{d2=JSON.parse(raw);}catch(x){}
    if(!d2||!Array.isArray(d2.subs)||!Array.isArray(d2.tasks)){M.err='Cópia inválida. Cole o texto completo que você copiou.';M.conf=false;M.txt=raw;renderSheet();}
    else if(!M.conf){M.conf=true;M.err='Isso troca todas as tarefas atuais pelas da cópia.';M.txt=raw;renderSheet();}
    else{
      d2.subs=d2.subs.filter(function(s){return s&&typeof s.id==='string'&&typeof s.nome==='string'&&CATS[s.cat];});
      d2.tasks=d2.tasks.filter(function(t){return t&&typeof t.id==='string'&&typeof t.titulo==='string'&&CATS[t.cat]&&typeof t.data==='string';});
      S=d2;save();M=null;render();toast('Tarefas restauradas.');
    }
  }
  else if(a==='sair'){M=null;(sb?sb.auth.signOut():Promise.resolve()).then(function(){if(!isDirty()){try{localStorage.removeItem(KEY);}catch(x){}S=seed();}USER=null;AUTH='out';render();});}
  else if(a==='lgmodo'){var e1=document.getElementById('l-e');if(e1)LG.email=e1.value;LG.modo=LG.modo==='criar'?'entrar':'criar';LG.err='';LG.msg='';render();}
  else if(a==='filt'){FILT=el.getAttribute('data-f');try{localStorage.setItem('meudia.filt',FILT);}catch(x){}render();}
  else if(a==='hcat'){readHF();HF.cat=el.getAttribute('data-cat');HF.sub='';HF.msg='';HF.err='';HF.focus=true;render();}
  else if(a==='hfav'){readHF();HF.msg='';HF.err='';if(!HF.fav&&favCount(hoje())>=5){HF.err=LIM_MSG;}else{HF.fav=!HF.fav;}HF.focus=true;render();}
  else if(a==='fav'){var tf=S.tasks.filter(function(x){return x.id===id;})[0];if(tf){if(!tf.fav&&favCount(tf.data,tf.id)>=5){toast(LIM_MSG);}else{tf.fav=!tf.fav;save();render();}}}
  else if(a==='pickfav'){sync();M.errF='';if(!M.fav&&favCount(M.data,M.id)>=5){M.errF=LIM_MSG;}else{M.fav=!M.fav;}M.noFocus=true;renderSheet();M.noFocus=false;}
  else if(a==='edit'){M={t:'mini',id:id,errF:''};renderSheet();}
  else if(a==='editfull'){id=M.id;var t2=S.tasks.filter(function(x){return x.id===id;})[0];if(t2){M={t:'task',id:t2.id,titulo:t2.titulo,cat:t2.cat,sub:t2.sub||'',data:t2.data,fav:!!t2.fav};renderSheet();}}
  else if(a==='newtask'){M={t:'task',id:'',titulo:'',cat:el.getAttribute('data-cat')||'estudio',sub:el.getAttribute('data-sub')||'',data:hoje(),fav:false};renderSheet();}
  else if(a==='newsub'){M={t:'sub',id:'',cat:el.getAttribute('data-cat'),nome:''};renderSheet();}
  else if(a==='rensub'){var s=S.subs.filter(function(x){return x.id===id;})[0];if(s){M={t:'sub',id:s.id,cat:s.cat,nome:s.nome};renderSheet();}}
  else if(a==='delsub'){var s2=S.subs.filter(function(x){return x.id===id;})[0];if(s2){M={t:'delsub',id:s2.id,nome:s2.nome,cat:s2.cat};renderSheet();}}
  else if(a==='delsubok'){var c=M.cat,sid=M.id;S.subs=S.subs.filter(function(x){return x.id!==sid;});S.tasks.forEach(function(t){if(t.sub===sid)t.sub='';});save();go('cat-'+c);}
  else if(a==='pickcat'){sync();M.cat=el.getAttribute('data-cat');M.sub='';M.noFocus=true;renderSheet();M.noFocus=false;}
  else if(a==='deltask'){sync();if(!M.conf){M.conf=true;M.noFocus=true;renderSheet();M.noFocus=false;}else{S.tasks=S.tasks.filter(function(x){return x.id!==M.id;});save();M=null;render();}}
  else if(a==='close'){M=null;renderSheet();}
});
document.addEventListener('submit',function(e){
  e.preventDefault();
  if(e.target.id==='lf'){
    var em=document.getElementById('l-e').value.trim(),pw=document.getElementById('l-p').value;
    LG.email=em;LG.err='';LG.msg='';
    if(!em||!pw){LG.err='Preencha o e-mail e a senha.';render();return;}
    if(LG.modo==='criar'&&pw.length<6){LG.err='A senha precisa ter pelo menos 6 caracteres.';render();return;}
    LG.busy=true;render();
    var pr=LG.modo==='criar'?sb.auth.signUp({email:em,password:pw}):sb.auth.signInWithPassword({email:em,password:pw});
    pr.then(function(r){
      LG.busy=false;
      if(r.error){LG.err=msgErro(r.error);render();return;}
      if(r.data&&r.data.session){USER=r.data.session.user;AUTH='in';render();pull();}
      else{LG.msg='Conta criada. Confirme pelo e-mail que enviamos e depois toque em Entrar.';LG.modo='entrar';render();}
    },function(){LG.busy=false;LG.err='Sem conexão. Tente de novo.';render();});
    return;
  }
  if(e.target.id==='hf'){
    readHF();var hti=HF.titulo.trim();HF.msg='';HF.err='';
    if(!hti){HF.err='Escreva a tarefa.';}
    else if(!HF.cat){HF.err='Escolha a categoria.';}
    else if(HF.fav&&favCount(hoje())>=5){HF.err=LIM_MSG+' Desmarque a estrela ou outra favorita.';}
    else{S.tasks.push({id:uid(),titulo:hti,cat:HF.cat,sub:HF.sub,data:hoje(),orig:hoje(),feita:false,fav:!!HF.fav});save();HF.msg='Adicionada em '+CATS[HF.cat].nome+'.';HF.titulo='';HF.cat='';HF.sub='';HF.fav=false;var ci=document.getElementById('h-t'),cs=document.getElementById('h-s');if(ci)ci.value='';if(cs)cs.value='';}
    HF.focus=true;render();return;
  }
  sync();if(!M)return;
  if(M.t==='task'){
    var ti=M.titulo.trim();if(!ti){M.err='Escreva o nome da tarefa.';renderSheet();return;}
    if(M.fav&&favCount(M.data,M.id)>=5){M.errF=LIM_MSG+' Escolha outra data ou desmarque uma favorita.';renderSheet();return;}
    if(M.id){var t=S.tasks.filter(function(x){return x.id===M.id;})[0];if(t){t.titulo=ti;t.cat=M.cat;t.sub=M.sub;t.data=M.data;t.fav=!!M.fav;}}
    else{S.tasks.push({id:uid(),titulo:ti,cat:M.cat,sub:M.sub,data:M.data,orig:M.data,feita:false,fav:!!M.fav});}
    save();M=null;render();
  }else if(M.t==='sub'){
    var nm=M.nome.trim();if(!nm){M.err='Escreva o nome da subcategoria.';renderSheet();return;}
    if(M.id){var s=S.subs.filter(function(x){return x.id===M.id;})[0];if(s)s.nome=nm;}
    else{S.subs.push({id:uid(),cat:M.cat,nome:nm,icon:'folder'});}
    save();M=null;render();
  }
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&M){M=null;renderSheet();}});
var tx=0,ty=0;
document.addEventListener('touchstart',function(e){var t=e.touches[0];tx=t.clientX;ty=t.clientY;},{passive:true});
document.addEventListener('touchend',function(e){
  var r=route();if((r.v!=='cat'&&r.v!=='inicio')||M)return;
  var t=e.changedTouches[0],dx=t.clientX-tx,dy=t.clientY-ty;
  if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return;
  var pg=['inicio','cat-estudio','cat-pessoal','cat-compra'];
  var i=r.v==='inicio'?0:1+ORDEM.indexOf(r.cat),j=dx<0?i+1:i-1;
  if(j<0||j>=pg.length)return;
  slide=dx<0?'sl':'sr';go(pg[j]);
},{passive:true});
window.addEventListener('hashchange',function(){if(location.hash===lastHash)return;M=null;render();});
boot();
})();
