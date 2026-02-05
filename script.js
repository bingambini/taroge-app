const API_URL = "https://script.google.com/macros/s/AKfycbwogedzKe0goXS8gB0woEFW9VmAwAUATsRv-tKDwEjaevxGeZUq5SElNZa9aTwktZPvxw/exec";
let storeData = null;
let cart = [];

async function init() {
    console.log("App starting...");
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.isVersionAtLeast('6.1')) {
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
        }
        if (tg.isVersionAtLeast('6.2')) {
            tg.isClosingConfirmationEnabled = true;
        }
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        storeData = await response.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        const preloader = document.getElementById('app-preloader');
        if (preloader) preloader.style.display = 'none';
    } catch (e) {
        console.error("Critical Error:", e);
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

    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible', 
        borderRadius: '35px',
        margin: '50px auto 20px auto', 
        width: 'calc(100% - 48px)',
        height: (b.height || 180) + 'px',
        marginTop: (b.marginTop || 50) + 'px',
        background: b.gradient || '#1e293b',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        boxSizing: 'border-box',
        zIndex: '10'
    });

    const textColor = b.titleColor || '#ffffff';

    el.innerHTML = `
        <div style="position: relative; z-index: 30; width: 50%; padding-left: 20px; display: flex; flex-direction: column; justify-content: center; pointer-events: none;">
            <h2 style="margin: 0; font-weight: 900; font-size: ${b.titleSize || 20}px; color: ${textColor}; text-transform: uppercase;">${b.title || ''}</h2>
            <p style="margin-top: 6px; font-weight: 600; opacity: 0.85; font-size: ${b.subSize || 11}px; color: ${textColor};">${b.subtitle || ''}</p>
            ${b.btnText ? `<div style="margin-top: 15px; pointer-events: auto;"><button onclick="switchPage('${b.actionValue}')" style="padding: 10px 22px; background: ${textColor}; color: #000; filter: invert(1); border: none; border-radius: 14px; font-weight: 900; font-size: 10px; text-transform: uppercase;">${b.btnText}</button></div>` : ''}
        </div>
        <div style="position: absolute; right: 0; top: 0; width: 50%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: visible; z-index: 40;">
            ${b.image ? `<img src="${b.image}" style="width: 120%; height: auto; object-fit: contain; transform: rotate(-12deg) translateY(-15%); filter: drop-shadow(0 20px 30px rgba(0,0,0,0.4));">` : ''}
        </div>
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    // ვიყენებთ შენს სვეტებს: ID, Name, Price, Image (სქრინის მიხედვით)
    grid.innerHTML = items.map(p => {
        let img = "https://via.placeholder.com/150";
        if (p.Image) img = p.Image.split(',')[0].trim();
        
        return `
            <div onclick="showDetails('${p.ID}')" class="bg-white p-4 rounded-[35px] border border-slate-50 shadow-sm active:scale-95 transition-all flex flex-col items-center text-center relative">
                <div class="h-36 w-full flex items-center justify-center">
                    <img src="${img}" class="max-h-full max-w-full object-contain drop-shadow-xl">
                </div>
                <h4 class="font-bold text-slate-800 text-[13px] mt-4 leading-tight h-10 overflow-hidden line-clamp-2">${p.Name}</h4>
                <div class="flex justify-between items-center w-full mt-4">
                    <span class="text-blue-600 font-black text-lg">${p.Price}₾</span>
                    <button class="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-900">
                        <i class="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showDetails(productId) {
    const product = storeData.latest.items.find(p => p.ID.toString() === productId.toString());
    if (!product) return;

    const detailsPage = document.getElementById('details-page');
    if (!detailsPage) return;

    let images = product.Image ? product.Image.split(',').map(img => img.trim()) : ["https://via.placeholder.com/300"];
    
    detailsPage.innerHTML = `
        <div style="padding: 20px; padding-bottom: 120px; background: #ffffff; min-height: 100vh;">
            <button onclick="switchPage('main')" style="background: #f8fafc; border: none; width: 45px; height: 45px; border-radius: 15px; margin-bottom: 20px;"><i class="fa-solid fa-arrow-left"></i></button>
            <div style="width: 100%; height: 320px; display: flex; align-items: center; justify-content: center;"><img src="${images[0]}" style="max-width: 90%; max-height: 90%; object-fit: contain;"></div>
            <div style="margin-top: 30px;">
                <h1 style="font-size: 26px; font-weight: 900; color: #0f172a;">${product.Name}</h1>
                <p style="font-size: 28px; font-weight: 900; color: #2563eb; margin-top: 10px;">${product.Price}₾</p>
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                    <p style="font-weight: 800; font-size: 14px; margin-bottom: 10px;">აღწერა</p>
                    <p style="color: #64748b; font-size: 15px; line-height: 1.6;">${product.Description || 'პროდუქტის აღწერა მალე დაემატება.'}</p>
                </div>
            </div>
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 25px; border-top: 1px solid #f1f5f9; z-index: 10000;">
                <button onclick="addToCart('${product.ID}')" style="width: 100%; background: #0f172a; color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 800; font-size: 16px;">კალათაში დამატება</button>
            </div>
        </div>
    `;
    switchPage('details');
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

function addToCart(id) {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

init();
