const DATA_URL = "data/movies.json";
let movies = [], filtered = [], page = 1, pageSize = 48, rankLimit = 100, listMode = false;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const num = v => { if(v===null||v===undefined||String(v).trim()==="") return null; const n=Number(String(v).replace(",", ".")); return Number.isFinite(n)?n:null; };
const fmt = n => new Intl.NumberFormat("en-US").format(n);
const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const clean = v => (v && String(v).trim() && String(v).trim()!=="-") ? String(v).trim() : "—";
const rank = m => num(m.Rating) ?? 99999;
const score = m => num(m["My Rating"]);
const year = m => num(m.Year);
const imdb = m => num(m["IMDb-rating"]);
const palette = ["#394650","#59443f","#3d4b42","#514454","#454b5a","#66513d","#394d55","#5b3e42","#4d5140","#3f4658","#5a4b39","#44404e"];
function hueFor(m){let s=(m.Genre||"")+(m.Movies||"");let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return palette[h%palette.length]}
function posterMarkup(m, big=false){
 const title=clean(m["Translated title"])!=="—" && m["Translated title"].length<30 ? m["Translated title"] : m.Movies;
 return `<div class="${big?'modal-poster':'poster'}" style="background:radial-gradient(ellipse at 50% 35%,${hueFor(m)} 0%,#17191f 80%)"><div class="poster-art"></div><span class="${big?'poster-index':'poster-rank'}">№ ${String(rank(m)).padStart(3,"0")}</span><span class="poster-score">${score(m)??"—"}</span><div><div class="poster-title">${esc(title)}</div><div class="poster-year">${clean(m.Year)} · ${esc(clean(m.Genre))}</div></div></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function card(m){return `<article class="film-card" data-key="${movies.indexOf(m)}">${posterMarkup(m)}<div class="film-meta" data-sub="${esc(clean(m.Director))}"><strong>${esc(m.Movies)}</strong><span>${score(m)??"—"}</span></div></article>`}
function topCounts(field, limit=6){const map=new Map();movies.forEach(m=>{const v=clean(m[field]);if(v!=="—")map.set(v,(map.get(v)||0)+1)});return [...map].sort((a,b)=>b[1]-a[1]).slice(0,limit)}
function chartBars(el,items){const max=items[0]?.[1]||1;$(el).innerHTML=items.map(([name,value])=>`<div class="hbar-row"><span class="hbar-name" title="${esc(name)}">${esc(name)}</span><div class="hbar-track"><div class="hbar-fill" style="width:${value/max*100}%"></div></div><span class="hbar-value">${value}</span></div>`).join("")}
function renderOverview(){
 const scores=movies.map(score).filter(x=>x!==null), years=movies.map(year).filter(x=>x!==null), imd=movies.map(imdb).filter(x=>x!==null);
 const ten=scores.filter(x=>x===10).length, eight=scores.filter(x=>x>=8).length;
 const stats=[["TOTAL FILMS",fmt(movies.length),"Every film in the archive",""],["AVERAGE RATING",avg(scores).toFixed(2),"Your personal score","accent"],["HIGHEST RATED",ten+" films","Rated a perfect 10",""],["AVERAGE IMDb",avg(imd).toFixed(2),"Across films with IMDb data",""]];
 $("#stat-cards").innerHTML=stats.map(([l,v,f,c])=>`<div class="stat-card"><div class="stat-label">${l}</div><div class="stat-value ${c}">${v}</div><div class="stat-foot">${f}</div></div>`).join("");
 const dist=Array.from({length:10},(_,i)=>[10-i,scores.filter(x=>Math.round(x)===10-i).length]);
 const max=Math.max(...dist.map(x=>x[1]),1);
 $("#rating-chart").innerHTML=dist.map(([r,c])=>`<div class="rating-col"><span class="rating-count">${c}</span><div class="rating-bar-wrap"><div class="rating-bar" style="height:${c/max*100}%"></div></div><span class="rating-label">${r}</span></div>`).join("");
 chartBars("#genre-chart",topCounts("Genre",6));
 $("#featured-films").innerHTML=[...movies].sort((a,b)=>rank(a)-rank(b)).slice(0,5).map(card).join("");
 bindCards();
}
function populateFilters(){const genres=[...new Set(movies.map(m=>clean(m.Genre)).filter(x=>x!=="—"))].sort();$("#genre-filter").innerHTML='<option value="">All genres</option>'+genres.map(g=>`<option>${esc(g)}</option>`).join("")}
function applyFilters(){const q=$("#search").value.trim().toLowerCase(),g=$("#genre-filter").value,r=$("#rating-filter").value,s=$("#sort-filter").value;
 filtered=movies.filter(m=>(!q||[m.Movies,m.Director,m["Main star"],m["Main antagonist"],m.Genre,m["Sub-genre"],m.Year,m.Language].join(" ").toLowerCase().includes(q))&&(!g||m.Genre===g)&&(!r||(r==="4"?score(m)!==null&&score(m)<=4:score(m)===Number(r))));
 const sorts={"rank-asc":(a,b)=>rank(a)-rank(b),"rank-desc":(a,b)=>rank(b)-rank(a),"year-desc":(a,b)=>(year(b)||0)-(year(a)||0),"year-asc":(a,b)=>(year(a)||9999)-(year(b)||9999),"imdb-desc":(a,b)=>(imdb(b)||0)-(imdb(a)||0),"rating-desc":(a,b)=>(score(b)||0)-(score(a)||0),"title-asc":(a,b)=>a.Movies.localeCompare(b.Movies)};
 filtered.sort(sorts[s]||sorts["rank-asc"]);page=1;renderLibrary()}
function renderLibrary(){const total=filtered.length,pages=Math.max(1,Math.ceil(total/pageSize)),start=(page-1)*pageSize;$("#movie-grid").classList.toggle("list-mode",listMode);$("#movie-grid").innerHTML=filtered.slice(start,start+pageSize).map(card).join("")||'<div class="panel">No films match those filters.</div>';$("#result-count").textContent=`Showing ${total?start+1:0}–${Math.min(start+pageSize,total)} of ${fmt(total)}`;$("#library-total").textContent=fmt(total);$("#page-label").textContent=`PAGE ${page} / ${pages}`;$("#prev-page").disabled=page<=1;$("#next-page").disabled=page>=pages;bindCards()}
function bindCards(){$$(".film-card").forEach(el=>el.addEventListener("click",()=>{const m=movies[Number(el.dataset.key)];if(m)openModal(m)}))}
function openModal(m){const p=$("#movie-modal");$("#modal-poster").style.background=`radial-gradient(ellipse at 50% 35%,${hueFor(m)} 0%,#17191f 80%)`;$("#modal-poster .poster-index").textContent=`№ ${String(rank(m)).padStart(3,"0")}`;$("#modal-poster .poster-title").textContent=m.Movies;$("#modal-poster .poster-year").textContent=`${clean(m.Year)} · ${clean(m.Genre)}`;$("#modal-title").textContent=m.Movies;$("#modal-translated").textContent=clean(m["Translated title"])==="—"?"":m["Translated title"];$("#modal-rank").textContent=`/ RANK ${rank(m)}`;$("#modal-score").textContent=score(m)??"—";$("#modal-imdb").textContent=imdb(m)??"—";$("#modal-position").textContent=rank(m);const fields=[["DIRECTOR",m.Director],["GENRE",m.Genre],["SUB-GENRE",m["Sub-genre"]],["YEAR",m.Year],["LEAD ACTOR",m["Main star"]],["ANTAGONIST",m["Main antagonist"]],["LANGUAGE",m.Language],["QUALIFIED ACTORS",m["# of qualified actors"]],["TOTAL POINTS",m["Total points"]]];$("#modal-details").innerHTML=fields.map(([k,v])=>`<div class="detail-item"><span>${k}</span><strong>${esc(clean(v))}</strong></div>`).join("");$("#modal-runtime").textContent=`RUNTIME  ${clean(m.Length)}`;$("#modal-awards").textContent=`OSCARS  ${clean(m.Oscars)}`;p.classList.add("open");p.setAttribute("aria-hidden","false");document.body.style.overflow="hidden"}
function closeModal(){$("#movie-modal").classList.remove("open");$("#movie-modal").setAttribute("aria-hidden","true");document.body.style.overflow=""}
function renderRankings(){const ordered=[...movies].sort((a,b)=>rank(a)-rank(b));const best=ordered[0],worst=ordered[ordered.length-1],highest=[...movies].filter(m=>score(m)!==null).sort((a,b)=>score(b)-score(a))[0];$("#ranking-highlight").innerHTML=[[`#${rank(best)}`,best.Movies,"TOP PERSONAL RANK"],[score(highest),highest.Movies,"HIGHEST PERSONAL SCORE"],[`#${rank(worst)}`,worst.Movies,"LOWEST PERSONAL RANK"]].map(([n,t,l])=>`<div class="highlight-card"><div class="highlight-number">${n}</div><div><strong>${esc(t)}</strong><span>${l}</span></div></div>`).join("");renderRankTable()}
function renderRankTable(){const rows=[...movies].sort((a,b)=>rank(a)-rank(b)).slice(0,rankLimit);$("#ranking-table").innerHTML=rows.map(m=>`<tr data-key="${movies.indexOf(m)}"><td>${rank(m)}</td><td>${esc(m.Movies)}</td><td>${esc(clean(m.Year))}</td><td>${esc(clean(m.Director))}</td><td>${esc(clean(m.Genre))}</td><td>${imdb(m)??"—"}</td><td><span class="score-pill">${score(m)??"—"}</span></td></tr>`).join("");$("#ranking-count").textContent=`Showing ${rows.length} of ${movies.length}`;$("#show-more-ranks").style.display=rankLimit>=movies.length?"none":"inline";$$('#ranking-table tr').forEach(tr=>tr.addEventListener("click",()=>openModal(movies[Number(tr.dataset.key)])))}

function renderTimeline(){
 const map=new Map();
 movies.forEach(m=>{const y=year(m);if(!y||y<1880||y>2100)return;const d=Math.floor(y/10)*10;if(!map.has(d))map.set(d,[]);map.get(d).push(m)});
 const decades=[...map].sort((a,b)=>a[0]-b[0]);
 $("#timeline-decades").textContent=decades.length;
 $("#timeline-grid").innerHTML=decades.map(([d,films])=>{const rated=films.map(score).filter(x=>x!==null);const top=[...films].sort((a,b)=>(score(b)??0)-(score(a)??0))[0];return '<button class="decade-card" data-decade="'+d+'"><span class="decade-years">'+d+'s</span><strong>'+films.length+'</strong><span class="decade-count">FILMS IN YOUR ARCHIVE</span><span class="decade-average">AVG '+avg(rated).toFixed(1)+' / 10</span><span class="decade-sample">'+esc(top?.Movies||"")+'</span></button>'}).join("");
 $(".decade-card").forEach(b=>b.addEventListener("click",()=>renderDecadeDetail(Number(b.dataset.decade),map.get(Number(b.dataset.decade))||[])));
}
function renderDecadeDetail(decade,films){
 const sorted=[...films].sort((a,b)=>rank(a)-rank(b));
 const directors=[...new Set(films.map(m=>clean(m.Director)).filter(x=>x!=="—"))].slice(0,5);
 $("#timeline-detail").innerHTML='<div class="panel-head"><div><span class="panel-kicker">THE '+decade+'s / '+films.length+' FILMS</span><h3>Stories from '+decade+'–'+(decade+9)+'</h3></div><span class="panel-meta">TOP PERSONAL RANK FIRST</span></div><p class="muted-copy">Notable filmmakers: '+directors.map(esc).join(" · ")+'</p><div class="timeline-film-grid">'+sorted.slice(0,12).map(card).join("")+'</div>';
 bindCards();
}
function renderRouletteFilters(){
 const genres=[...new Set(movies.map(m=>clean(m.Genre)).filter(x=>x!=="—"))].sort();
 $("#roulette-genre").innerHTML='<option value="">Any genre</option>'+genres.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join("");
 const decades=[...new Set(movies.map(year).filter(Boolean).map(y=>Math.floor(y/10)*10))].sort((a,b)=>b-a);
 $("#roulette-decade").innerHTML='<option value="">Any decade</option>'+decades.map(d=>'<option value="'+d+'">'+d+'s</option>').join("");
}
function spinRoulette(){
 const genre=$("#roulette-genre").value,decade=$("#roulette-decade").value,minImdb=Number($("#roulette-imdb").value),minScore=Number($("#roulette-score").value);
 const candidates=movies.filter(m=>(!genre||m.Genre===genre)&&(!decade||Math.floor((year(m)||0)/10)*10===Number(decade))&&(imdb(m)??0)>=minImdb&&(score(m)??0)>=minScore);
 const result=$("#roulette-result");
 if(!candidates.length){result.innerHTML='<div class="roulette-empty"><span class="panel-kicker">NO MATCHES FOUND</span><h3>Too selective?</h3><p>Try relaxing one or more filters.</p></div>';return}
 const chosen=candidates[Math.floor(Math.random()*candidates.length)];
 result.innerHTML='<div class="roulette-picked"><div><span class="panel-kicker">THE ROULETTE HAS SPOKEN</span><h3>Your next film.</h3><p class="muted-copy">'+candidates.length+' matching films in the draw</p></div><div class="roulette-picked-card"><div>'+posterMarkup(chosen)+'</div><div class="roulette-film-meta"><strong>'+esc(chosen.Movies)+'</strong><span>'+clean(chosen.Year)+' · '+esc(clean(chosen.Genre))+'</span><div class="roulette-scores"><span>YOUR RATING <b>'+(score(chosen)??"—")+'</b></span><span>IMDb <b>'+(imdb(chosen)??"—")+'</b></span></div><button class="text-btn" id="roulette-open">OPEN FILM FILE ↗</button></div></div><button class="primary-btn" id="spin-again">SPIN AGAIN ↻</button></div>';
 $("#roulette-open").addEventListener("click",()=>openModal(chosen));
 $("#spin-again").addEventListener("click",spinRoulette);
}

function renderInsights(){const scores=movies.map(score).filter(x=>x!==null),years=movies.map(year).filter(x=>x!==null),imdbs=movies.map(imdb).filter(x=>x!==null);const decadeMap=new Map();years.forEach(y=>{let d=Math.floor(y/10)*10;decadeMap.set(d,(decadeMap.get(d)||0)+1)});const decades=[...decadeMap].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([d,n])=>[`${d}s`,n]);const dirs=topCounts("Director",8);const above=movies.filter(m=>score(m)!==null&&imdb(m)!==null&&score(m)>imdb(m));const below=movies.filter(m=>score(m)!==null&&imdb(m)!==null&&score(m)<imdb(m));const topGenre=topCounts("Genre",1)[0],topDirector=topCounts("Director",1)[0];const cards=[["FILMS IN ARCHIVE",fmt(movies.length),"All titles in your collection"],["AVERAGE PERSONAL RATING",avg(scores).toFixed(2),"Out of 10 · rated films"],["AVERAGE IMDb RATING",avg(imdbs).toFixed(2),"Across films with IMDb data"],["FAVOURITE GENRE",topGenre?.[0]||"—",`${topGenre?.[1]||0} films in archive`],["MOST WATCHED DECADE",decades[0]?.[0]||"—",`${decades[0]?.[1]||0} films`],["TOP DIRECTOR",topDirector?.[0]||"—",`${topDirector?.[1]||0} films in archive`],["PERSONAL VS IMDb",`${above.length} >`,`${below.length} films rated below IMDb`],["RATING 8–10",scores.length?`${(scores.filter(x=>x>=8).length/scores.length*100).toFixed(1)}%`:"—","Share of personally rated films"]];$("#insights-cards").innerHTML=cards.map(([l,v,s])=>`<div class="insight-card"><span>${l}</span><strong>${v}</strong><small>${s}</small></div>`).join("");chartBars("#decade-chart",decades);chartBars("#director-chart",dirs)}
function showView(name){$$(".view").forEach(v=>v.classList.remove("active-view"));$(`#${name}-view`).classList.add("active-view");$$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));$("#crumb").textContent=name.toUpperCase();window.scrollTo({top:0,behavior:"smooth"});if(name==="library")applyFilters();if(name==="timeline")renderTimeline()}
async function init(){try{const res=await fetch(DATA_URL);if(!res.ok)throw new Error("Could not load the movie data");movies=await res.json();movies.sort((a,b)=>rank(a)-rank(b));$("#nav-count").textContent=fmt(movies.length);renderOverview();populateFilters();filtered=[...movies];renderLibrary();renderRankings();renderInsights();renderTimeline();renderRouletteFilters();}catch(e){document.querySelector(".main").innerHTML=`<div class="panel" style="margin:50px">Could not load the movie archive. ${esc(e.message)}<br><br>Run this site through a local web server, or deploy the complete folder to GitHub Pages.</div>`}}
$$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
["search","genre-filter","rating-filter","sort-filter"].forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",applyFilters));
$("#prev-page").addEventListener("click",()=>{if(page>1){page--;renderLibrary()}});
$("#next-page").addEventListener("click",()=>{if(page<Math.ceil(filtered.length/pageSize)){page++;renderLibrary()}});
$("#view-toggle").addEventListener("click",()=>{listMode=!listMode;$("#view-toggle").textContent=listMode?"▦":"☷";renderLibrary()});
$("#spin-roulette").addEventListener("click",spinRoulette);
$("#show-more-ranks").addEventListener("click",()=>{rankLimit=Math.min(rankLimit+100,movies.length);renderRankTable()});
$("#modal-close").addEventListener("click",closeModal);$("#movie-modal").addEventListener("click",e=>{if(e.target.id==="movie-modal")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();showView("library");$("#search").focus()}});
$$(".quick-filter").forEach(b=>b.addEventListener("click",()=>{showView("library");$("#rating-filter").value=b.dataset.rating;applyFilters()}));
$("#theme-toggle").addEventListener("click",()=>document.body.classList.toggle("light"));
init();