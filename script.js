const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function init() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const res = await fetch(API_URL);
        storeData = await res.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) {
        console.error("Error:", e);
    }
}

function renderHeader(h) {
    const el = document.getElementById('main-header');
    el.innerHTML = `<div class="flex items-center gap-3"><img src="${h.logo}" class="w-10 h-10 rounded-full font-bold"><span>${h.name || 'Store'}</span></div>`;
    el.style.backgroundColor = h.bg || "#2563eb";
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    el.innerHTML = `<div class="z-10"><h2>${b.title}</h2><p class="text-[10px] opacity-70">${b.subtitle || ''}</p></div><img src="${b.image}" class="banner-img">`;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = items.map(p => {
        const details = storeData.productDetails.find(d => String(d.ID || d.id) === String(p.ID || p.id));
        const img = details ? details.Image_URLs.split(',')[0] : "";
        return `
            <div onclick="showDetails('${p.ID || p.id}')" class="bg-white p-4 rounded-3xl shadow-sm border border-slate-50 active:scale-95 transition-all cursor-pointer">
                <img src="${img}" class="h-24 mx-auto object-contain">
                <h4 class="font-bold text-[11px] mt-3 truncate">${p.Name || p.name}</h4>
                <p class="text-blue-600 font-black mt-1">${p.Price || p.price}₾</p>
            </div>
        `;
    }).join('');
}

function showDetails(id) {
    const p = storeData.productDetails.find(d => String(d.ID || d.id) === String(id));
    const images = p.Image_URLs.split(',');
    const sizes = String(p.Sizes || "").split(',');

    document.getElementById('details-content').innerHTML = `
        <div class="mt-4"><img src="${images[0]}" class="w-full h-64 object-contain bg-slate-50 rounded-3xl"></div>
        <h1 class="text-2xl font-black mt-6">${p.Name}</h1>
        <p class="text-blue-600 font-black text-2xl mt-2">${p.Price}₾</p>
        <p class="mt-4 text-slate-500 text-sm">${p.Description || ''}</p>
        <div class="mt-6 flex gap-2 overflow-x-auto pb-2">
            ${sizes.map(s => `<button onclick="selectSize(this)" class="option-btn">${s.trim()}</button>`).join('')}
        </div>
        <button onclick="addToCart('${p.ID}')" class="w-full bg-blue-600 text-white py-5 rounded-3xl font-black mt-8">კალათაში დამატება</button>
    `;
    document.getElementById('product-details-page').classList.remove('hidden');
}

function selectSize(btn) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function addToCart(id) {
    const size = document.querySelector('.option-btn.selected')?.innerText;
    if(!size) { alert("აირჩიეთ ზომა"); return; }
    const p = storeData.productDetails.find(d => String(d.ID || d.id) === String(id));
    cart.push({ name: p.Name, price: p.Price, size, img: p.Image_URLs.split(',')[0] });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert("დაემატა!");
    document.getElementById('product-details-page').classList.add('hidden');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="nav-item ${i.action === 'home' ? 'active' : ''}">
            <i class="fa-solid ${i.icon}"></i>
            <span>${i.name}</span>
        </div>
    `).join('');
}

function switchPage(page) {
    ['home-page', 'cart-page', 'checkout-page'].forEach(p => document.getElementById(p).classList.add('hidden'));
    document.getElementById(page + '-page').classList.remove('hidden');
    if(page === 'cart') renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if(cart.length === 0) { container.innerHTML = "<p class='text-center py-10 text-slate-400'>ცარიელია</p>"; return; }
    container.innerHTML = cart.map(item => `
        <div class="bg-white p-4 rounded-3xl flex items-center gap-4">
            <img src="${item.img}" class="w-16 h-16 object-contain">
            <div><h4 class="font-bold text-sm">${item.name}</h4><p class="text-xs text-slate-400">${item.size} • ${item.price}₾</p></div>
        </div>
    `).join('');
    document.getElementById('cart-summary').classList.remove('hidden');
    const total = cart.reduce((s, i) => s + parseFloat(i.price), 0);
    document.getElementById('cart-total-price').innerText = total + "₾";
}

init();
