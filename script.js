const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 1. მთავარი ჩატვირთვა ---
async function init() {
    tg.ready();
    tg.expand();
    
    try {
        const res = await fetch(API_URL, { redirect: 'follow' });
        storeData = await res.json();
        
        // ფუნქციების გამოძახება
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        hidePreloader();
    } catch (e) {
        console.error("ჩატვირთვის შეცდომა:", e);
        hidePreloader();
    }
}

function hidePreloader() {
    const loader = document.getElementById('app-preloader');
    if (loader) loader.style.display = 'none';
}

// --- 2. ჰედერის რენდერინგი (რომელიც გაკლდა) ---
function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (!el) return;
    el.style.backgroundColor = h.bg || "#2563eb";
    el.innerHTML = `
        <div class="flex items-center justify-between px-4 h-full">
            <div class="flex items-center gap-2">
                <img src="${h.logo}" class="w-10 h-10 rounded-full">
                <span class="font-bold text-white">${h.name || 'Taroge'}</span>
            </div>
        </div>`;
}

// --- 3. ბანერის რენდერინგი ---
function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.innerHTML = `
        <div class="relative w-full h-40 rounded-[30px] overflow-hidden bg-slate-900">
            <img src="${b.image}" class="w-full h-full object-cover opacity-60">
            <div class="absolute inset-0 p-6 flex flex-col justify-center">
                <h2 class="text-white text-xl font-black">${b.title}</h2>
                <p class="text-white/70 text-sm">${b.subtitle || ''}</p>
            </div>
        </div>`;
}

// --- 4. პროდუქტების რენდერინგი ---
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = items.map(p => {
        const d = storeData.productDetails.find(det => String(det.ID) === String(p.id || p.ID));
        const img = d && d.Image_URLs ? d.Image_URLs.split(',')[0] : (p.images || "");
        
        return `
            <div onclick="goToProductDetails('${p.id || p.ID}')" class="bg-white p-4 rounded-[30px] shadow-sm border border-slate-100">
                <div class="h-28 flex items-center justify-center mb-2">
                    <img src="${img}" class="max-h-full object-contain">
                </div>
                <h4 class="font-bold text-[11px] truncate">${p.name || p.Name}</h4>
                <p class="text-blue-600 font-black text-sm">${p.price || p.Price}₾</p>
            </div>`;
    }).join('');
}

// --- 5. ნავიგაციის რენდერინგი ---
function renderNavigation(navItems) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.innerHTML = navItems.map(item => `
        <div class="flex flex-col items-center gap-1 opacity-50">
            <i class="fa-solid ${item.icon}"></i>
            <span class="text-[10px] font-bold">${item.name}</span>
        </div>
    `).join('');
}

// --- 6. პროდუქტის დეტალები ---
function goToProductDetails(id) {
    const d = storeData.productDetails.find(det => String(det.ID) === String(id));
    if (!d) return;

    const images = d.Image_URLs ? d.Image_URLs.split(',') : [];
    const sizes = d.Sizes ? String(d.Sizes).split(',') : [];
    const colors = d.Colors ? String(d.Colors).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="p-4">
            <button onclick="closeDetails()" class="mb-4 text-slate-400 font-bold">← უკან</button>
            <div class="w-full h-64 bg-slate-50 rounded-[30px] flex items-center justify-center overflow-hidden">
                <img src="${images[0] || ''}" class="max-w-full max-h-full object-contain">
            </div>
            <h1 class="text-2xl font-black mt-4">${d.Name}</h1>
            <p class="text-blue-600 font-black text-2xl">${d.Price}₾</p>
            <p class="text-slate-500 text-sm mt-4">${d.Description || ''}</p>
            
            <div class="mt-6">
                <p class="text-[10px] font-bold text-slate-400 mb-2">ზომა</p>
                <div class="flex gap-2">${sizes.map(s => `<span class="px-3 py-1 border rounded-lg text-sm">${s}</span>`).join('')}</div>
            </div>
        </div>
    `;
    document.getElementById('product-details-page').classList.remove('hidden');
}

function closeDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
}

init();
