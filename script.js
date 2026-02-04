const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
const PROMO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQH2mZB4PnZn6hJJRPgC_Ry0HTt7BvKiNmcNGyx7PVOMHY0rNFqhM4MneVoRI3kT00y6vxMMOoHbipA/pub?output=csv";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 1. დამხმარე ფუნქციები ---

function hidePreloader() {
    const p = document.getElementById('app-preloader');
    if (p) {
        p.style.opacity = '0';
        setTimeout(() => p.style.display = 'none', 500);
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count-badge');
    if (!badge) return;
    badge.innerText = cart.length;
    if (cart.length > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// --- 2. რენდერინგის ფუნქციები ---

function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (!el || h.status !== 'active') return;
    el.style.backgroundColor = h.bg || "#2563eb";
    el.style.height = (h.height || 80) + "px";
    el.style.color = h.textColor || "#ffffff";
    if (h.style === 'floating') el.classList.add('header-floating');
    el.innerHTML = `
        <div class="header-container" style="justify-content: ${h.layout === 'center' ? 'center' : 'space-between'}">
            <div class="flex items-center gap-3">
                <img src="${h.logo}" style="width: ${h.logoSize || 40}px; border-radius: ${h.logoRadius}%">
                <span class="font-black text-lg">${h.name || ''}</span>
            </div>
            ${h.layout !== 'center' ? '<i class="fa-solid fa-bell text-xl opacity-50"></i>' : ''}
        </div>`;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.style.height = (b.height || 180) + "px";
    el.style.background = b.gradient === "1" ? "linear-gradient(135deg, #1e293b 0%, #334155 100%)" : (b.bgColor || "#1e293b");
    el.innerHTML = `
        <div class="banner-content">
            <h2 style="font-size: ${b.titleSize}px; color: ${b.titleColor || 'white'}; font-weight: 900;">${b.title}</h2>
            <p class="text-white/60 text-[10px] mt-2 font-bold">${b.subtitle || ''}</p>
            <button class="mt-5 bg-white text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">${b.btnText}</button>
        </div>
        <img src="${b.image}" class="banner-img">`;
}

function renderProducts(l) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = l.items.map((p, index) => {
        // მოძებნა ID-ით (მხარდაჭერა d.ID და d.id)
        const details = storeData.productDetails.find(d => String(d.ID || d.id) === String(p.id));
        const badge = details?.Status ? `<span class="badge badge-${details.Status.toLowerCase()}">${details.Status}</span>` : '';
        
        // სურათის აღება Image_URLs-დან
        let firstImg = p.images ? p.images.split(',')[0] : "";
        if (details && details.Image_URLs) {
            firstImg = details.Image_URLs.split(',')[0];
        }

        return `
            <div onclick="openProductSheet(${index})" class="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all relative overflow-hidden">
                ${badge}
                <div class="h-28 flex items-center justify-center mb-3">
                    <img src="${firstImg}" class="max-h-full object-contain">
                </div>
                <h4 class="font-bold text-[11px] text-slate-700 truncate">${p.name}</h4>
                <p class="text-blue-600 font-black text-sm mt-1">${p.price}₾</p>
            </div>`;
    }).join('');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.innerHTML = items.map((item, index) => `
        <div onclick="switchPage('${item.action}', this)" class="nav-item ${index === 0 ? 'active' : ''}">
            <div class="relative"><i class="fa-solid ${item.icon}"></i>
                ${item.action === 'cart' ? '<div id="cart-count-badge" class="cart-badge hidden">0</div>' : ''}
            </div>
            <span class="text-[9px] font-bold mt-1 uppercase">${item.name}</span>
        </div>`).join('');
    updateCartBadge();
}

function renderProfile(menu) {
    const el = document.getElementById('profile-page');
    if (!el) return;
    const user = tg.initDataUnsafe?.user || { first_name: "სტუმარი", id: "000000" };
    const photo = user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}`;
    el.innerHTML = `
        <div class="flex items-center gap-4 p-6">
            <img src="${photo}" class="w-16 h-16 rounded-full border-4 border-white shadow-lg">
            <div><h2 class="text-lg font-black text-slate-800">${user.first_name}</h2><p class="text-slate-400 text-[10px] font-bold">ID: ${user.id}</p></div>
        </div>
        <div class="px-6 space-y-2">
            ${menu.map(m => `
                <div onclick="switchPage('${m.action}', this)" class="bg-white p-3.5 rounded-[22px] flex items-center justify-between border border-slate-50 active:scale-95 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500"><i class="fa-solid ${m.icon}"></i></div>
                        <span class="font-bold text-slate-700 text-sm">${m.label}</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i>
                </div>`).join('')}
        </div>`;
}

// --- 3. ინტერაქციის ფუნქციები ---

function openProductSheet(index) {
    const p = storeData.latest.items[index];
    const overlay = document.getElementById('product-sheet-overlay');
    const sheet = document.getElementById('product-sheet');
    document.getElementById('sheet-content').innerHTML = `
        <div class="flex flex-col items-center">
            <div class="w-full aspect-square bg-slate-50 rounded-[30px] flex items-center justify-center mb-6">
                <img src="${p.images.split(',')[0]}" class="w-4/5 object-contain">
            </div>
            <h3 class="text-2xl font-black text-slate-800 text-center">${p.name}</h3>
            <p class="text-3xl font-black text-blue-600 mt-2">${p.price}₾</p>
            <button onclick="goToProductDetails('${p.id}')" class="w-full mt-8 bg-black text-white py-5 rounded-[25px] font-black text-lg shadow-xl">დეტალურად</button>
        </div>`;
    overlay.classList.remove('hidden');
    setTimeout(() => { overlay.classList.add('opacity-100'); sheet.classList.remove('translate-y-full'); }, 10);
}

function closeProductSheet() {
    const overlay = document.getElementById('product-sheet-overlay');
    const sheet = document.getElementById('product-sheet');
    if (sheet) sheet.classList.add('translate-y-full');
    if (overlay) overlay.classList.remove('opacity-100');
    setTimeout(() => overlay && overlay.classList.add('hidden'), 300);
}

function goToProductDetails(id) {
    closeProductSheet();
    const details = storeData.productDetails.find(d => String(d.ID || d.id) === String(id));
    if (!details) return;

    // შენი შიტის ველების გამოყენება: Image_URLs, Name, Price, Sizes, Colors
    const imageVal = details.Image_URLs || "";
    const images = typeof imageVal === 'string' ? imageVal.split(',') : [String(imageVal)];
    const sizes = details.Sizes ? String(details.Sizes).split(',') : [];
    const colors = details.Colors ? String(details.Colors).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="slider-container mt-4">
            ${images.map(img => `<div class="slider-item"><img src="${img.trim()}"></div>`).join('')}
        </div>
        <div class="mt-6 px-4">
            <h1 class="text-2xl font-black text-slate-800">${details.Name || details.name}</h1>
            <div class="flex items-center justify-between mt-2">
                <div class="flex flex-col">
                    <span class="text-3xl font-black text-blue-600">${details.Price || details.price}₾</span>
                    ${details.Old_Price ? `<span class="text-sm text-slate-400 line-through">${details.Old_Price}₾</span>` : ''}
                </div>
                <span class="text-[10px] font-black py-1 px-3 bg-slate-100 rounded-full text-slate-400">ID: ${details.ID || details.id}</span>
            </div>
            <p class="text-slate-500 text-sm mt-6 leading-relaxed">${details.Description || 'აღწერა არ არის'}</p>
            <div class="mt-8"><h4 class="text-[10px] font-black text-slate-400 uppercase italic mb-3">ზომა</h4>
                <div class="options-scroll">${sizes.map(s => `<button onclick="selectOption(this, 'size')" class="option-btn size-opt">${s.trim()}</button>`).join('')}</div>
            </div>
            <div class="mt-6 mb-10"><h4 class="text-[10px] font-black text-slate-400 uppercase italic mb-3">ფერი</h4>
                <div class="options-scroll">${colors.map(c => `<button onclick="selectOption(this, 'color')" class="option-btn color-opt">${c.trim()}</button>`).join('')}</div>
            </div>
            <div class="py-6">
                <button id="dynamic-buy-btn" disabled onclick="handleBuy('${details.ID || details.id}')" class="w-full bg-slate-200 text-slate-400 py-5 rounded-[25px] font-black text-lg transition-all">აირჩიე ზომა და ფერი</button>
            </div>
        </div>`;
    document.getElementById('product-details-page').classList.remove('hidden');
    window.scrollTo(0, 0);
}

function closeProductDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
}

function selectOption(btn, type) {
    const parentClass = type === 'size' ? '.size-opt' : '.color-opt';
    document.querySelectorAll(parentClass).forEach(b => {
        b.classList.remove('selected', 'border-blue-600', 'bg-blue-50');
        b.classList.add('border-slate-100');
    });
    
    btn.classList.add('selected', 'border-blue-600', 'bg-blue-50');
    btn.classList.remove('border-slate-100');

    const hasSize = document.querySelector('.size-opt.selected');
    const hasColor = document.querySelector('.color-opt.selected');
    const buyBtn = document.getElementById('dynamic-buy-btn');

    if (hasSize && hasColor) {
        buyBtn.disabled = false;
        buyBtn.innerText = "კალათაში დამატება";
        buyBtn.className = "w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-lg shadow-xl active:scale-95 transition-all";
    } else {
        buyBtn.disabled = true;
        buyBtn.innerText = !hasSize ? "აირჩიე ზომა" : "აირჩიე ფერი";
        buyBtn.className = "w-full bg-slate-200 text-slate-400 py-5 rounded-[25px] font-black text-lg";
    }
}

function switchPage(page, btn) {
    const pages = ['home-page', 'cart-page', 'checkout-page', 'profile-page', 'orders-page', 'payment-page'];
    pages.forEach(p => {
        const el = document.getElementById(p);
        if(el) el.classList.add('hidden');
    });
    
    const target = page === 'home' ? 'home-page' : page + '-page';
    const targetEl = document.getElementById(target);
    if(targetEl) targetEl.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    if (page === 'cart') renderCart();
    window.scrollTo(0,0);
}

// --- 4. კალათის და შეკვეთის ლოგიკა ---

function handleBuy(id) {
    try {
        const selectedSizeEl = document.querySelector('.size-opt.selected');
        const selectedColorEl = document.querySelector('.color-opt.selected');
        if (!selectedSizeEl || !selectedColorEl) return;

        const product = storeData.productDetails.find(d => String(d.ID || d.id) === String(id));
        if (!product) return;

        let productImg = "https://via.placeholder.com/150";
        const imgVal = product.Image_URLs || product.images;
        if (imgVal && typeof imgVal === 'string') {
            productImg = imgVal.split(',')[0].trim();
        }

        cart.push({
            cartId: Date.now(),
            id: product.ID || product.id,
            name: product.Name || product.name,
            price: parseFloat(product.Price || product.price),
            size: selectedSizeEl.innerText,
            color: selectedColorEl.innerText,
            image: productImg
        });

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        const buyBtn = document.getElementById('dynamic-buy-btn');
        buyBtn.innerText = "✅ დაემატა";
        buyBtn.style.backgroundColor = "#10b981";
        buyBtn.style.color = "white";
        buyBtn.disabled = true;

        setTimeout(() => {
            closeProductDetails();
            buyBtn.innerText = "აირჩიე ზომა და ფერი";
            buyBtn.style.backgroundColor = "";
            buyBtn.disabled = true;
        }, 800);
    } catch (e) {
        console.error("HandleBuy Error:", e);
    }
}

function renderCart() {
    const el = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    if (!el) return;
    if (cart.length === 0) {
        el.innerHTML = `<div class="text-center py-20 opacity-30 font-bold">კალათა ცარიელია</div>`;
        if (summary) summary.classList.add('hidden');
        return;
    }
    if (summary) summary.classList.remove('hidden');
    let total = 0;
    el.innerHTML = cart.map((item, idx) => {
        total += item.price;
        return `
            <div class="bg-white p-4 rounded-[25px] flex items-center gap-4 shadow-sm border border-slate-50">
                <img src="${item.image}" class="w-16 h-16 object-contain bg-slate-50 rounded-xl">
                <div class="flex-1">
                    <h4 class="font-bold text-xs">${item.name}</h4>
                    <p class="text-[10px] text-slate-400 font-bold">${item.size} / ${item.color}</p>
                    <p class="text-blue-600 font-black mt-1">${item.price}₾</p>
                </div>
                <button onclick="removeFromCart(${idx})" class="text-red-400 p-2"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
    }).join('');
    
    const totalEl = document.getElementById('cart-total-price');
    if (totalEl) totalEl.innerText = total + "₾";
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
}

// --- 5. ინიციალიზაცია ---

async function init() {
    tg.ready();
    tg.expand();
    
    try {
        const res = await fetch(API_URL, { redirect: 'follow' });
        storeData = await res.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        if (storeData.profileMenu) renderProfile(storeData.profileMenu);
        
        updateCartBadge();
        hidePreloader();
    } catch (e) {
        console.error("ჩატვირთვის შეცდომა:", e);
        hidePreloader();
    }
}

init();
