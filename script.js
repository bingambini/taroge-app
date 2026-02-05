const API_URL = "https://script.google.com/macros/s/AKfycbwogedzKe0goXS8gB0woEFW9VmAwAUATsRv-tKDwEjaevxGeZUq5SElNZa9aTwktZPvxw/exec";
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function init() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        console.log("მონაცემები ჩაიტვირთა:", storeData);

        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) {
        console.error(e);
        alert("შეცდომა მონაცემების წამოღებისას.");
    }
}

function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (h.status !== 'active') return;

    el.style.display = 'flex';
    el.style.backgroundColor = h.bg || "#2563eb";
    el.style.color = h.textColor || "#ffffff";
    el.style.height = h.height + "px";
    el.style.position = 'relative';

    const isSplit = h.layout === 'split';

    el.innerHTML = `
        <div class="flex items-center px-5 w-full h-full">
            <img src="${h.logo}" style="width:${h.logoSize}px; height:${h.logoSize}px; border-radius:${h.logoRadius}%; object-fit:cover;">
            <span style="
                font-weight: 800; 
                font-size: 18px; 
                position: ${isSplit ? 'absolute' : 'relative'};
                left: ${isSplit ? '50%' : '15px'};
                transform: ${isSplit ? 'translateX(-50%)' : 'none'};
            ">${h.name}</span>
        </div>
    `;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    el.style.display = 'flex';
    el.style.height = b.height + "px";
    el.style.marginTop = b.marginTop + "px";
    el.style.background = b.gradient || "#1e293b";
    el.style.borderRadius = "25px";
    el.style.position = "relative";
    el.style.overflow = "hidden";
    el.style.padding = "20px";

    el.innerHTML = `
        <div style="z-index: 10; position: relative; max-width: 60%;">
            <h2 style="font-size: ${b.titleSize}px; color: ${b.titleColor}; font-weight: 800;">${b.title}</h2>
            <p style="font-size: ${b.subSize}px; color: ${b.titleColor}; opacity: 0.8;">${b.subtitle}</p>
            <button class="mt-3 px-5 py-2 bg-white text-black rounded-full font-bold text-xs uppercase">${b.btnText}</button>
        </div>
        <img src="${b.image}" style="position: absolute; right: -10px; bottom: -10px; width: 55%; transform: rotate(-15deg);">
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = items.map(p => {
        // სურათების დამუშავება (ვიღებთ პირველს)
        const imgList = p.images ? p.images.split(',') : [];
        const firstImg = imgList.length > 0 ? imgList[0].trim() : '';

        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[25px] border border-slate-100 shadow-sm active:scale-95 transition-all">
                <div class="h-32 flex items-center justify-center">
                    <img src="${firstImg}" class="max-h-full object-contain">
                </div>
                <h4 class="font-bold text-[12px] mt-3 truncate text-slate-700">${p.name}</h4>
                <div class="flex justify-between items-center mt-2">
                    <p class="text-blue-600 font-black">${p.price}₾</p>
                    <div class="bg-slate-100 p-2 rounded-full text-[10px]"><i class="fa-solid fa-plus"></i></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="nav-item flex flex-col items-center">
            <i class="fa-solid ${i.icon} text-lg"></i>
            <span class="text-[10px] mt-1">${i.name}</span>
        </div>
    `).join('');
}

// სხვა ფუნქციები (switchPage, showDetails და ა.შ.) დატოვე როგორც იყო
function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(page + '-page');
    if(target) target.classList.remove('hidden');
}

init();
