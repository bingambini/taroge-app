const API_URL = "https://script.google.com/macros/s/AKfycbwogedzKe0goXS8gB0woEFW9VmAwAUATsRv-tKDwEjaevxGeZUq5SElNZa9aTwktZPvxw/exec";
let storeData = null;
let cart = [];

async function init() {
    console.log("App starting...");
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        storeData = await response.json();
        console.log("Data received:", storeData);

        // მონაცემების ასახვა
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        // პრელოადერის გათიშვა
        const preloader = document.getElementById('app-preloader');
        if (preloader) preloader.style.display = 'none';

    } catch (e) {
        console.error("Critical Error:", e);
        document.getElementById('app-preloader').innerHTML = `
            <div class="text-center p-10">
                <p class="text-red-500 font-bold">ვერ მოხერხდა მონაცემების ჩატვირთვა</p>
                <button onclick="location.reload()" class="mt-4 bg-slate-800 text-white px-6 py-2 rounded-xl">თავიდან ცდა</button>
            </div>
        `;
    }
}

function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (!el || h.status !== 'active') return;

    el.className = "flex items-center px-6 sticky top-0 z-[1000] shadow-sm transition-all";
    el.style.backgroundColor = h.bg || "#ffffff";
    el.style.color = h.textColor || "#000000";
    el.style.height = (h.height || 70) + "px";
    
    const isSplit = h.layout === 'split';

    el.innerHTML = `
        <div class="flex items-center w-full relative h-full">
            <img src="${h.logo}" style="width:${h.logoSize || 40}px; height:${h.logoSize || 40}px; border-radius:${h.logoRadius || 50}%; object-fit:cover;">
            <span class="font-black text-lg" style="
                position: ${isSplit ? 'absolute' : 'relative'};
                left: ${isSplit ? '50%' : '12px'};
                transform: ${isSplit ? 'translateX(-50%)' : 'none'};
                white-space: nowrap;
            ">${h.name || ''}</span>
        </div>
    `;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;

    el.className = "mx-6 mt-4 rounded-[30px] relative overflow-hidden flex items-center p-8 min-h-[180px]";
    el.style.height = b.height + "px";
    el.style.marginTop = b.marginTop + "px";
    el.style.background = b.gradient || "#1e293b";

    el.innerHTML = `
        <div class="relative z-10 w-3/5">
            <h2 class="font-black leading-tight" style="font-size:${b.titleSize || 24}px; color:${b.titleColor || '#fff'}">${b.title || ''}</h2>
            <p class="mt-2 opacity-80 font-bold" style="font-size:${b.subSize || 12}px; color:${b.titleColor || '#fff'}">${b.subtitle || ''}</p>
            ${b.btnText ? `<button class="mt-5 px-6 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">${b.btnText}</button>` : ''}
        </div>
        <img src="${b.image}" class="absolute right-[-20px] bottom-[-10px] w-3/5 object-contain pointer-events-none transform rotate-[-15deg] drop-shadow-2xl">
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = items.map(p => {
        // სურათების დამუშავება
        let img = "https://via.placeholder.com/150";
        if (p.images) {
            const imgArray = p.images.split(',');
            img = imgArray[0].trim();
        }

        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col items-center text-center">
                <div class="h-32 w-full flex items-center justify-center">
                    <img src="${img}" class="max-h-full max-w-full object-contain drop-shadow-md">
                </div>
                <h4 class="font-bold text-slate-700 text-sm mt-3 leading-tight h-10 overflow-hidden line-clamp-2">${p.name}</h4>
                <div class="flex justify-between items-center w-full mt-3">
                    <span class="text-blue-600 font-black text-lg">${p.price}₾</span>
                    <button class="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-900 active:bg-blue-600 active:text-white transition-colors">
                        <i class="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.className = "fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center py-4 px-6 z-[5000]";
    
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center text-slate-400 active:text-blue-600 transition-colors cursor-pointer">
            <i class="fa-solid ${i.icon} text-xl"></i>
            <span class="text-[10px] font-bold mt-1">${i.name}</span>
        </div>
    `).join('');
}

function switchPage(pageId) {
    document.querySelectorAll('.page-fade').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId + '-page');
    if (target) target.classList.remove('hidden');
    
    // ნავიგაციის ფერების შეცვლა
    console.log("Switched to:", pageId);
}

// აპლიკაციის გაშვება
init();
