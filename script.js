const API_URL = "https://script.google.com/macros/s/AKfycbwuUoh7dSasq18fEkJtFFq948F2NONk-6GWoUCCNDrnNpAwWUSn7Pq9xVShBeYAUOVBUw/exec";
let storeData = null;
let cart = [];
let selectedSize = null;
let selectedColor = null;

async function init() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) { console.error("Error:", e); }
}

function renderHeader(h) { 
    const el = document.getElementById('main-header');
    if (!el || h.status !== 'active') return;
    el.innerHTML = `
        <div class="flex items-center justify-between px-5 h-full" style="background: ${h.bg}; color: ${h.textColor}; height: ${h.height || 70}px;">
            ${h.logo ? `<img src="${h.logo}" style="height: ${h.logoSize || 40}px; border-radius: ${h.logoRadius || 0}px;">` : '<div></div>'}
            <h1 class="font-black text-lg">${h.name || ''}</h1>
            <div onclick="switchPage('cart')" class="relative cursor-pointer">
                <i class="fa-solid fa-cart-shopping text-xl"></i>
                ${cart.length > 0 ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">${cart.length}</span>` : ''}
            </div>
        </div>`;
}

function renderBanner(b) { 
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.innerHTML = `
        <div class="relative w-full overflow-hidden rounded-[35px] mt-4 shadow-lg" style="height: ${b.height || 200}px;">
            <img src="${b.image}" class="w-full h-full object-cover">
            <div class="absolute inset-0 p-6 flex flex-col justify-center bg-black/30">
                <h2 style="color: ${b.titleColor}; font-size: ${b.titleSize}px;" class="font-black leading-tight">${b.title}</h2>
                <button class="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold text-sm w-fit active:scale-95 transition-all">${b.btnText || 'ნახვა'}</button>
            </div>
        </div>`;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = items.map(p => {
        let img = p.images ? p.images.split(',')[0].trim() : "";
        const curP = Number(p.price);
        const oldP = p.oldPrice ? Number(p.oldPrice) : null;
        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[30px] shadow-sm flex flex-col relative border border-slate-50 active:scale-95 transition-all">
                <div class="h-32 w-full flex items-center justify-center mb-4">
                    <img src="${img}" class="max-h-full max-w-full object-contain">
                </div>
                <h4 class="font-bold text-slate-800 text-[13px] text-center h-10 overflow-hidden">${p.name}</h4>
                <div class="mt-3 flex flex-col items-center">
                    ${oldP && oldP > curP ? `<span class="text-slate-400 text-[11px] line-through">${oldP}₾</span>` : ''}
                    <span class="text-[#2563eb] font-black text-lg">${curP}₾</span>
                </div>
            </div>`;
    }).join('');
}

function showDetails(id) {
    const p = storeData.productDetails.find(x => x.id.toString() === id.toString());
    if (!p) return;
    selectedSize = null; selectedColor = null;
    const sizes = p.sizes ? p.sizes.toString().split(',') : [];
    const colors = p.colors ? p.colors.toString().split(',') : [];

    document.getElementById('details-page').innerHTML = `
        <div class="p-5 pb-32">
            <button onclick="switchPage('main')" class="w-12 h-12 bg-slate-100 rounded-2xl mb-5 active:scale-90 transition-all"><i class="fa-solid fa-arrow-left"></i></button>
            <div class="h-64 flex items-center justify-center mb-8"><img src="${p.images.split(',')[0]}" class="max-h-full object-contain"></div>
            <h1 class="text-2xl font-black">${p.name}</h1>
            <p class="text-3xl font-black text-blue-600 mt-2">${p.price}₾</p>
            <div class="mt-6 flex gap-2 flex-wrap">${sizes.map(s => `<button onclick="selOpt(this,'size','${s.trim()}')" class="option-btn bg-slate-50 p-3 px-5 rounded-xl font-bold border border-slate-100 transition-all">${s.trim()}</button>`).join('')}</div>
            <div class="mt-6 flex gap-2 flex-wrap">${colors.map(c => `<button onclick="selOpt(this,'color','${c.trim()}')" class="option-btn bg-slate-50 p-3 px-5 rounded-xl font-bold border border-slate-100 transition-all">${c.trim()}</button>`).join('')}</div>
            <div class="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-[2000]">
                <button onclick="addToCart('${p.id}')" id="add-btn" class="w-full bg-slate-900 text-white py-5 rounded-[25px] font-black active:scale-95 transition-all">კალათაში დამატება</button>
            </div>
        </div>`;
    switchPage('details');
}

function selOpt(btn, type, val) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white');
        b.classList.add('bg-slate-50', 'text-black');
    });
    btn.classList.remove('bg-slate-50', 'text-black');
    btn.classList.add('bg-slate-900', 'text-white');
    if(type === 'size') selectedSize = val; else selectedColor = val;
}

function addToCart(id) {
    const p = storeData.productDetails.find(x => x.id.toString() === id.toString());
    if ((p.sizes && !selectedSize) || (p.colors && !selectedColor)) {
        return window.Telegram?.WebApp?.showAlert("გთხოვთ აირჩიოთ ზომა და ფერი!");
    }
    cart.push({ ...p, selectedSize, selectedColor });
    renderHeader(storeData.header);
    const b = document.getElementById('add-btn');
    b.innerHTML = "დამატებულია! ✓"; b.style.background = "#22c55e";
    setTimeout(() => { b.innerHTML = "კალათაში დამატება"; b.style.background = "#0f172a"; }, 1500);
}

function renderNavigation(items) {
    document.getElementById('bottom-nav').innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center flex-1 text-slate-500 py-2 active:scale-90 transition-all cursor-pointer">
            <i class="fa-solid ${i.icon} text-xl mb-1"></i>
            <span class="text-[10px] font-bold">${i.name}</span>
        </div>`).join('');
}

function switchPage(p) {
    document.querySelectorAll('.page-fade').forEach(x => { x.classList.add('hidden'); x.style.display = 'none'; });
    const target = document.getElementById(p + '-page');
    if (target) { target.classList.remove('hidden'); target.style.display = 'block'; }
    if (p === 'cart') renderCart();
    window.scrollTo(0, 0);
}

function renderCart() {
    const el = document.getElementById('cart-page');
    if (cart.length === 0) { 
        el.innerHTML = '<div class="h-[70vh] flex flex-col items-center justify-center font-bold text-slate-400"><i class="fa-solid fa-cart-shopping text-5xl mb-4"></i>კალათა ცარიელია</div>'; 
        return; 
    }
    let total = cart.reduce((s, i) => s + Number(i.price), 0);
    el.innerHTML = `<div class="p-6">
        <h2 class="text-2xl font-black mb-6">კალათა</h2>
        ${cart.map((item, i) => `<div class="flex items-center bg-white p-4 rounded-3xl mb-3 border border-slate-50 shadow-sm">
            <img src="${item.images.split(',')[0]}" class="w-16 h-16 object-contain">
            <div class="ml-4 flex-1">
                <p class="font-bold text-sm">${item.name}</p>
                <p class="text-[10px] text-slate-400">${item.selectedSize || '-'} / ${item.selectedColor || '-'}</p>
                <p class="font-black text-blue-600">${item.price}₾</p>
            </div>
            <button onclick="cart.splice(${i},1); renderCart(); renderHeader(storeData.header);" class="text-red-500 p-2"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('')}
        <div class="mt-10 p-6 bg-white rounded-3xl border border-slate-100">
            <div class="flex justify-between items-center mb-6 font-black text-xl"><span>ჯამი:</span><span class="text-blue-600">${total}₾</span></div>
            <button onclick="switchPage('checkout')" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black active:scale-95 transition-all">შეკვეთის გაფორმება</button>
        </div>
    </div>`;
}

async function placeOrder() {
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;

    if (!name || !phone || !address) {
        return window.Telegram?.WebApp?.showAlert("გთხოვთ შეავსოთ ყველა ველი!");
    }

    const itemsSummary = cart.map(i => `${i.name} (${i.selectedSize || '-'}, ${i.selectedColor || '-'})`).join(', ');
    const total = cart.reduce((s, i) => s + Number(i.price), 0);
    
    try {
        const url = `${API_URL}?action=placeOrder&customerName=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&address=${encodeURIComponent(address)}&items=${encodeURIComponent(itemsSummary)}&total=${total}`;
        await fetch(url);
        window.Telegram?.WebApp?.showAlert("შეკვეთა წარმატებით გაიგზავნა!");
        cart = [];
        renderHeader(storeData.header);
        switchPage('main');
    } catch (e) {
        window.Telegram?.WebApp?.showAlert("შეცდომა შეკვეთის გაგზავნისას.");
    }
}

init();
