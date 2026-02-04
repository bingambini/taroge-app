const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 1. ძირითადი ფუნქციები (Rendering) ---

function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (!el) return;
    el.style.backgroundColor = h.bg || "#2563eb";
    el.innerHTML = `
        <div class="flex items-center gap-3 px-4 h-full text-white">
            <img src="${h.logo}" class="w-10 h-10 rounded-full border-2 border-white/20">
            <span class="font-black text-lg">${h.name || 'Taroge'}</span>
        </div>`;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.innerHTML = `
        <div class="relative w-full h-44 rounded-[30px] overflow-hidden bg-slate-900 shadow-xl">
            <img src="${b.image}" class="w-full h-full object-cover opacity-70">
            <div class="absolute inset-0 p-6 flex flex-col justify-end">
                <h2 class="text-white text-2xl font-black leading-tight">${b.title}</h2>
                <p class="text-white/80 text-xs font-bold mt-1 uppercase tracking-wider">${b.subtitle || ''}</p>
            </div>
        </div>`;
}

function renderNavigation(navItems) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.innerHTML = navItems.map(item => `
        <div class="flex flex-col items-center gap-1 opacity-40 active:opacity-100 transition-opacity">
            <i class="fa-solid ${item.icon} text-lg"></i>
            <span class="text-[9px] font-black uppercase">${item.name}</span>
        </div>
    `).join('');
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = items.map(p => {
        // ძებნა ID-ით (მხარდაჭერა d.ID-სთვის)
        const d = storeData.productDetails.find(det => String(det.ID) === String(p.id || p.ID));
        const img = d && d.Image_URLs ? d.Image_URLs.split(',')[0].trim() : (p.images ? p.images.split(',')[0] : "");
        
        return `
            <div onclick="goToProductDetails('${p.id || p.ID}')" class="bg-white p-4 rounded-[30px] shadow-sm border border-slate-50 active:scale-95 transition-all">
                <div class="h-28 flex items-center justify-center mb-3">
                    <img src="${img}" class="max-h-full object-contain" onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <h4 class="font-bold text-[11px] text-slate-700 truncate">${p.name || p.Name}</h4>
                <p class="text-blue-600 font-black text-sm mt-1">${p.price || p.Price}₾</p>
            </div>`;
    }).join('');
}

// --- 2. დეტალების გვერდი ---

function goToProductDetails(id) {
    const d = storeData.productDetails.find(det => String(det.ID) === String(id));
    if (!d) return;

    const images = d.Image_URLs ? d.Image_URLs.split(',') : [];
    const sizes = d.Sizes ? String(d.Sizes).split(',') : [];
    const colors = d.Colors ? String(d.Colors).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="p-4 pb-32">
            <button onclick="closeDetails()" class="mb-4 bg-slate-100 p-3 rounded-full w-10 h-10 flex items-center justify-center"><i class="fa-solid fa-arrow-left"></i></button>
            <div class="w-full h-72 bg-slate-50 rounded-[40px] flex items-center justify-center overflow-hidden mb-6 shadow-inner">
                <img src="${images[0] ? images[0].trim() : ''}" class="max-w-[80%] max-h-[80%] object-contain">
            </div>
            
            <h1 class="text-2xl font-black text-slate-800">${d.Name}</h1>
            <div class="flex items-center justify-between mt-2">
                <span class="text-3xl font-black text-blue-600">${d.Price}₾</span>
                <span class="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-400 font-bold uppercase">ID: ${d.ID}</span>
            </div>

            <p class="text-slate-500 text-sm mt-6 leading-relaxed">${d.Description || 'აღწერა არ არის'}</p>

            <div class="mt-8">
                <h4 class="text-[10px] font-black text-slate-400 uppercase mb-3 italic">აირჩიე ზომა</h4>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(s => `<button onclick="selectOpt(this, 'size')" class="px-5 py-2.5 border border-slate-100 rounded-2xl text-sm font-bold opt-btn transition-all">${s.trim()}</button>`).join('')}
                </div>
            </div>

            <div class="mt-6">
                <h4 class="text-[10px] font-black text-slate-400 uppercase mb-3 italic">აირჩიე ფერი</h4>
                <div class="flex flex-wrap gap-2">
                    ${colors.map(c => `<button onclick="selectOpt(this, 'color')" class="px-5 py-2.5 border border-slate-100 rounded-2xl text-sm font-bold opt-btn transition-all">${c.trim()}</button>`).join('')}
                </div>
            </div>
        </div>
        
        <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-50">
            <button id="buy-btn" disabled onclick="alert('დაემატა კალათაში!')" class="w-full bg-slate-200 text-slate-400 py-5 rounded-[25px] font-black text-lg shadow-xl transition-all">აირჩიე ზომა და ფერი</button>
        </div>
    `;
    
    document.getElementById('product-details-page').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function closeDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
}

function selectOpt(btn, type) {
    btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'selected', 'shadow-lg', 'shadow-blue-200'));
    btn.classList.add('bg-blue-600', 'text-white', 'selected', 'shadow-lg', 'shadow-blue-200');
    
    const selections = document.querySelectorAll('.selected').length;
    const buyBtn = document.getElementById('buy-btn');
    if (selections >= 2) {
        buyBtn.disabled = false;
        buyBtn.innerText = "კალათაში დამატება";
        buyBtn.className = "w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all";
    }
}

// --- 3. ინიციალიზაცია (Init) ---

async function init() {
    tg.ready();
    tg.expand();
    
    try {
        const res = await fetch(API_URL, { redirect: 'follow' });
        storeData = await res.json();
        
        // ფუნქციები ახლა უკვე განსაზღვრულია ზემოთ!
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        const loader = document.getElementById('app-preloader');
        if (loader) loader.style.display = 'none';
        
    } catch (e) {
        console.error("ჩატვირთვის შეცდომა:", e);
        const loader = document.getElementById('app-preloader');
        if (loader) loader.style.display = 'none';
    }
}

init();
