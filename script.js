const API_URL = "https://script.google.com/macros/s/AKfycbwuUoh7dSasq18fEkJtFFq948F2NONk-6GWoUCCNDrnNpAwWUSn7Pq9xVShBeYAUOVBUw/exec";
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 1. ინიციალიზაცია
async function init() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const res = await fetch(API_URL);
        storeData = await res.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        const preloader = document.getElementById('app-preloader');
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.display = 'none', 500);
    } catch (e) {
        console.error("ჩატვირთვის შეცდომა:", e);
    }
}

// 2. პროდუქტების გამოჩენა (HTML-ში არსებული product-grid-ისთვის)
function renderProducts(l) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = l.items.map((p, index) => {
        const details = storeData.productDetails.find(d => d.id.toString() === p.id.toString());
        const statusBadge = details?.status ? `<span class="badge badge-${details.status.toLowerCase()}">${details.status}</span>` : '';
        const mainImg = p.images ? p.images.split(',')[0] : '';
        return `
            <div onclick="openProductSheet(${index})" class="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all cursor-pointer relative overflow-hidden">
                ${statusBadge}
                <img src="${mainImg}" class="h-24 mx-auto object-contain">
                <h4 class="font-bold text-[11px] text-slate-700 truncate mt-3">${p.name}</h4>
                <p class="text-blue-600 font-black text-sm mt-1">${p.price}₾</p>
            </div>`;
    }).join('');
}

// 3. პროდუქტის "ფურცლის" (Sheet) გახსნა
function openProductSheet(index) {
    const p = storeData.latest.items[index];
    const overlay = document.getElementById('product-sheet-overlay');
    const content = document.getElementById('sheet-content');
    content.innerHTML = `
        <div class="flex flex-col items-center">
            <div class="w-full aspect-square bg-slate-50 rounded-[30px] flex items-center justify-center mb-6 overflow-hidden">
                <img src="${p.images.split(',')[0]}" class="w-4/5 h-4/5 object-contain">
            </div>
            <h3 class="text-2xl font-black text-slate-800 text-center leading-tight">${p.name}</h3>
            <p class="text-3xl font-black text-blue-600 mt-3">${p.price}₾</p>
            <button onclick="goToProductDetails('${p.id}')" class="w-full mt-10 bg-slate-900 text-white py-5 rounded-[25px] font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                დეტალურად <i class="fa-solid fa-arrow-right text-sm"></i>
            </button>
        </div>`;
    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.classList.add('opacity-100');
        document.getElementById('product-sheet').classList.remove('translate-y-full');
    }, 10);
}

// 4. გვერდების გადართვა
function switchPage(pageId) {
    const pages = ['home-page', 'cart-page', 'checkout-page', 'payment-page', 'orders-page', 'product-details-page'];
    pages.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(pageId + '-page');
    if (target) target.classList.remove('hidden');
    
    // თუ კალათაში გადავდივართ, განვაახლოთ შიგთავსი
    if (pageId === 'cart') renderCart();
}

// 5. კალათის ლოგიკა
function renderCart() {
    const itemsContainer = document.getElementById('cart-items');
    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="text-center text-slate-400 font-bold py-10">კალათა ცარიელია</p>';
        return;
    }
    // აქ დაამატე კალათის ელემენტების რენდერი...
}

function closeProductSheet() {
    const overlay = document.getElementById('product-sheet-overlay');
    const sheet = document.getElementById('product-sheet');
    sheet.classList.add('translate-y-full');
    overlay.classList.remove('opacity-100');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

// დანარჩენი ფუნქციები (renderHeader, renderBanner და ა.შ.) შენი code.txt-დან
function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (h.status !== 'active') return;
    el.style.display = 'flex';
    el.style.backgroundColor = h.bg || "#24afeb";
    el.innerHTML = `<div class="header-container"><span class="font-black">${h.name}</span></div>`;
}

init();
