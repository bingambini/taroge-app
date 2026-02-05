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

        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
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
    const content = document.getElementById('app-content');
    if (!el || h.status !== 'active') return;

    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: '0', left: '0', right: '0',
        zIndex: '10000',
        backgroundColor: h.bg || "#ffffff",
        color: h.textColor || "#000000",
        height: (h.height || 70) + "px",
        padding: '0 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        boxSizing: 'border-box'
    });

    if (content) content.style.paddingTop = el.style.height;

    const isSplit = h.layout === 'split';
    el.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%; height: 100%; position: relative;">
            <img src="${h.logo}" style="width: ${h.logoSize || 40}px; height: ${h.logoSize || 40}px; border-radius: ${h.logoRadius || 50}%; object-fit: cover;">
            <span style="font-weight: 900; font-size: 18px; position: ${isSplit ? 'absolute' : 'relative'}; left: ${isSplit ? '50%' : '12px'}; transform: ${isSplit ? 'translateX(-50%)' : 'none'}; white-space: nowrap;">
                ${h.name || ''}
            </span>
        </div>
    `;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;

    // 1. ბანერის მთავარი კონტეინერი
    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible', 
        borderRadius: '35px',
        margin: '50px 24px 20px 24px', 
        height: (b.height || 180) + 'px',
        marginTop: (b.marginTop || 50) + 'px',
        background: b.gradient || '#1e293b',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        boxSizing: 'border-box',
        zIndex: '10'
    });

    const textColor = b.titleColor || '#ffffff';

    el.innerHTML = `
        <div style="
            position: relative; 
            z-index: 30; 
            width: 45%; /* შევამცირეთ სიგანე, რომ ფოტოს არ შეეხოს */
            padding-left: 15px; /* მივწიეთ მარცხენა კიდისკენ */
            display: flex; 
            flex-direction: column; 
            justify-content: center;
            pointer-events: none;
        ">
            <h2 style="
                margin: 0; 
                font-weight: 900; 
                line-height: 1.1; 
                font-size: ${b.titleSize || 20}px; 
                color: ${textColor};
                text-transform: uppercase;
            ">
                ${b.title || ''}
            </h2>
            <p style="
                margin-top: 6px; 
                font-weight: 600; 
                opacity: 0.85; 
                font-size: ${b.subSize || 11}px; 
                color: ${textColor};
            ">
                ${b.subtitle || ''}
            </p>
            ${b.btnText ? `
                <div style="margin-top: 15px; pointer-events: auto;">
                    <button onclick="switchPage('${b.actionValue}')" style="
                        padding: 10px 22px; 
                        background: ${textColor}; 
                        color: #000; 
                        filter: invert(1); 
                        border: none; 
                        border-radius: 14px; 
                        font-weight: 900; 
                        font-size: 10px; 
                        text-transform: uppercase;
                        cursor: pointer;
                    ">
                        ${b.btnText}
                    </button>
                </div>` : ''}
        </div>

        ${b.image ? `
            <div style="
                position: absolute;
                right: -10px;
                top: -45px; 
                width: 65%; /* ფოტოს ველი უფრო დიდია */
                height: 140%;
                z-index: 40;
                pointer-events: none;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <img src="${b.image}" style="
                    width: 100%;
                    height: auto;
                    object-fit: contain;
                    transform: rotate(-12deg);
                    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.4));
                ">
            </div>
        ` : ''}
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = items.map(p => {
        let img = "https://via.placeholder.com/150";
        if (p.images) img = p.images.split(',')[0].trim();
        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col items-center text-center">
                <div class="h-32 w-full flex items-center justify-center">
                    <img src="${img}" class="max-h-full max-w-full object-contain drop-shadow-md">
                </div>
                <h4 class="font-bold text-slate-700 text-sm mt-3 leading-tight h-10 overflow-hidden line-clamp-2">${p.name}</h4>
                <div class="flex justify-between items-center w-full mt-3">
                    <span class="text-blue-600 font-black text-lg">${p.price}₾</span>
                    <button class="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-900">
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
}

init();
