const API_URL = "https://script.google.com/macros/s/AKfycbwuUoh7dSasq18fEkJtFFq948F2NONk-6GWoUCCNDrnNpAwWUSn7Pq9xVShBeYAUOVBUw/exec";
let storeData = null;
let cart = [];

// აპლიკაციის საწყისი ჩატვირთვა
async function init() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        
        // ვიძახებთ მხოლოდ იმას, რაც მუშაობდა
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) { 
        console.error("Error loading data:", e); 
    }
}

// ჰედერის ფუნქცია (როგორც იყო)
function renderHeader(h) { 
    const el = document.getElementById('main-header');
    if (!el || h.status !== 'active') return;
    el.innerHTML = `
        <div class="header-container flex items-center justify-between px-5 w-full h-full" style="background: ${h.bg}; color: ${h.textColor};">
            ${h.logo ? `<img src="${h.logo}" style="height: ${h.logoSize || 40}px; border-radius: ${h.logoRadius || 0}px;">` : '<div></div>'}
            <span class="font-black text-lg">${h.name || ''}</span>
            <div onclick="switchPage('cart')" class="relative cursor-pointer">
                <i class="fa-solid fa-cart-shopping text-xl"></i>
            </div>
        </div>`;
}

// ბანერის ფუნქცია (როგორც იყო)
function renderBanner(b) { 
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.innerHTML = `
        <div class="relative w-full overflow-hidden rounded-[35px] mt-4 shadow-lg" style="height: ${b.height || 200}px;">
            <img src="${b.image}" class="w-full h-full object-cover">
            <div class="absolute inset-0 p-6 flex flex-col justify-center bg-black/30">
                <h2 style="color: ${b.titleColor}; font-size: ${b.titleSize}px;" class="font-black leading-tight">${b.title}</h2>
                <p class="text-white text-sm mt-1">${b.subtitle || ''}</p>
                <button class="mt-4 bg-white text-black px-6 py-2 rounded-full font-black text-sm w-fit">${b.btnText || 'ნახვა'}</button>
            </div>
        </div>`;
}

// პროდუქტების გამოჩენა
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = items.map((p) => {
        let img = p.images ? p.images.split(',')[0].trim() : "";
        return `
            <div class="bg-white p-4 rounded-[30px] shadow-sm flex flex-col items-center border border-slate-50">
                <img src="${img}" class="h-32 object-contain mb-4">
                <h4 class="font-bold text-slate-800 text-[11px] text-center">${p.name}</h4>
                <span class="text-blue-600 font-black text-lg mt-2">${p.price}₾</span>
            </div>`;
    }).join('');
}

// ნავიგაცია
function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center flex-1 text-slate-400 py-2">
            <i class="fa-solid ${i.icon} text-xl"></i>
            <span class="text-[10px] font-bold">${i.name}</span>
        </div>`).join('');
}

// გვერდების გადართვა
function switchPage(pageId) {
    document.querySelectorAll('.page-fade').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId + '-page');
    if (target) target.classList.remove('hidden');
}

init();
