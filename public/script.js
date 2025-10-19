const input=document.getElementById("searchInput");
const form=document.getElementById("searchForm");
const resultsDiv=document.getElementById("results");
const tabs=document.querySelectorAll("#tabs button");
const pagination=document.getElementById("pagination");
const pageNum=document.getElementById("pageNum");
const nextBtn=document.getElementById("nextPage");
const prevBtn=document.getElementById("prevPage");
const chatSection=document.getElementById("chatSection");
const bookmarkSection=document.getElementById("bookmarkSection");
const settingsSection=document.getElementById("settingsSection");
const bookmarkList=document.getElementById("bookmarkList");
const downloadBookmarks=document.getElementById("downloadBookmarks");
const downloadSettings=document.getElementById("downloadSettings");
const darkToggle=document.getElementById("darkModeToggle");

let activeType="web";let currentPage=1;let bookmarks=JSON.parse(localStorage.getItem("bookmarks")||"[]");

window.addEventListener("DOMContentLoaded",()=>{
  const url=new URLSearchParams(window.location.search);
  const q=url.get("q");const p=url.get("page");
  if(p)currentPage=Number(p);if(q){input.value=q;runSearch(q,currentPage);}
  renderBookmarks();applySettings();
});

tabs.forEach(tab=>{
  tab.onclick=()=>{
    tabs.forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    activeType=tab.dataset.type;
    resultsDiv.innerHTML="";hideAllSections();
    if(activeType==="chat")chatSection.classList.remove("hidden");
    else if(activeType==="bookmarks")bookmarkSection.classList.remove("hidden");
    else if(activeType==="settings")settingsSection.classList.remove("hidden");
    else if(input.value.trim())runSearch(input.value.trim(),1);
  };
});
function hideAllSections(){
  chatSection.classList.add("hidden");
  bookmarkSection.classList.add("hidden");
  settingsSection.classList.add("hidden");
}
form.addEventListener("submit",e=>{
  e.preventDefault();
  runSearch(input.value.trim(),1);
});

async function runSearch(q,page){
  if(!q)return;
  currentPage=page;
  const newUrl=`${window.location.origin}?q=${encodeURIComponent(q)}&page=${page}`;
  window.history.pushState({}, "", newUrl);
  resultsDiv.innerHTML=`<p>Loading ${activeType} results...</p>`;
  pagination.classList.add("hidden");

  if(activeType==="summary"){
    const res=await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data=await res.json();
    const summary=data.slice(0,5).map(r=>"• "+r.title).join("<br>");
    resultsDiv.innerHTML=`<div class="result-card"><h3>🧠 Summary</h3><p>${summary}</p></div>`;
    return;
  }

  const res=await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${activeType}&page=${page}`);
  const data=await res.json();

  if(!data.length){resultsDiv.innerHTML="<p>No results found.</p>";return;}

  if(activeType==="images"){
    resultsDiv.innerHTML=`<div class="image-grid">${data.map(r=>r.image?`<a href="${r.link}" target="_blank"><img src="${r.image}" alt=""></a>`:"").join("")}</div>`;
  }else{
    resultsDiv.innerHTML=data.map(r=>`
      <div class="result-card">
        <a href="${r.link}" target="_blank" class="result-title">${r.title}</a>
        <p>${r.snippet||""}</p>
        <span style="color:#7f3ff0;font-size:0.8em;">${r.source}</span>
        <button class="addBookmark" data-link="${r.link}" data-title="${r.title}">⭐ Save</button>
      </div>`).join("");
    document.querySelectorAll(".addBookmark").forEach(b=>b.onclick=()=>{
      addBookmark({title:b.dataset.title,link:b.dataset.link});
    });
  }
  pagination.classList.remove("hidden");
  pageNum.textContent=currentPage;
}
nextBtn.onclick=()=>runSearch(input.value.trim(),currentPage+1);
prevBtn.onclick=()=>{if(currentPage>1)runSearch(input.value.trim(),currentPage-1);};

// BOOKMARKS
function addBookmark(item){
  if(!bookmarks.some(b=>b.link===item.link)){
    bookmarks.push(item);
    localStorage.setItem("bookmarks",JSON.stringify(bookmarks));
    renderBookmarks();
  }
}
function renderBookmarks(){
  bookmarkList.innerHTML=bookmarks.map(b=>`<li><a href="${b.link}" target="_blank">${b.title}</a></li>`).join("")||"<p>No bookmarks yet.</p>";
}
downloadBookmarks.onclick=()=>{
  const blob=new Blob([JSON.stringify(bookmarks,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="shadow-bookmarks.json";a.click();
};

// SETTINGS
downloadSettings.onclick=()=>{
  const settings={dark:darkToggle.checked};
  const blob=new Blob([JSON.stringify(settings,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="shadow-settings.json";a.click();
};
darkToggle.onchange=applySettings;
function applySettings(){
  if(darkToggle.checked)document.body.classList.remove("light");
  else document.body.classList.add("light");
}
