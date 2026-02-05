const API_URL = "https://script.google.com/macros/s/AKfycbwuUoh7dSasq18fEkJtFFq948F2NONk-6GWoUCCNDrnNpAwWUSn7Pq9xVShBeYAUOVBUw/exec";
let storeData = null;
let cart = [];
let selectedSize = null;
let selectedColor = null;

// 1. აპლიკაციის ინიციალიზაცია
async function init() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        
        refreshUI();
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) { 
        console.error("Error:", e);
        alert("მონაცემების ჩატვირთვა ვერ მოხერხდა");
    }
}

// 2. UI-ს განახლების ცენტრალური ფუნქცია
function refreshUI() {
    if (!storeData) return;
    if (storeData.header) renderHeader(storeData.header);
    if (storeData.banner) renderBanner(storeData.banner);
    if (storeData.latest) renderProducts(storeData.latest.items);
    if (storeData.navigation) renderNavigation(storeData.navigation);
}

// 3. ჰედერის რენდერი
function renderHeader(h) { 
    const el = document.getElementById('main-header');
    if (!el || h.status !== 'active') return;
    el.style.display = 'block';
    el.style.background = h.bg || '#ffffff';
    
    el.innerHTML = `
        <div class="flex items-center justify-between px-5 h-full" style="color: ${h.textColor}; height: ${h.height || 70}px;">
            ${h.logo ? `<img src="${h.logo}" style="height: ${h.logoSize || 40}px; border-radius: ${h.logoRadius || 0}px;">` : '<div></div>'}
            <h1 class="font-black text-lg">${h.name || ''}</h1>
            <div onclick="switchPage('cart')" class="relative cursor-pointer">
                <i class="fa-solid fa-cart-shopping text-xl"></i>
                ${cart.length > 0 ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">${cart.length}</span>` : ''}
            </div>
        </div>
    `;
}

// 4. ბანერის რენდერი
function renderBanner(b) { 
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.innerHTML = `
        <div class="relative w-full overflow-hidden rounded-[35px] mt-4 shadow-lg" style="height: ${b.height || 200}px;">
            <img src="${b.image}" class="w-full h-full object-cover">
            <div class="absolute inset-0 p-6 flex flex-col justify-center bg-black/30">
                <h2 style="color: ${b.titleColor || '#fff'}; font-size: ${b.titleSize || 24}px;" class="font-black leading-tight">${b.title}</h2>
                <p class="text-white/90 text-sm mt-1">${b.subtitle || ''}</p>
                <button class="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold text-sm w-fit active:scale-95 transition-all">
                    ${b.btnText || 'ნახვა'}
                </button>
            </div>
        </div>
    `;
}

// 5. პროდუქტების რენდერი (ფასდაკლების ლოგიკით)
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = items.map(p => {
        let img = p.images ? p.images.toString().split(',')[0].trim() : "https://placehold.jp/150x150.png";
        const currentPrice = Number(p.price);
        const oldPrice = p.oldPrice ? Number(p.oldPrice) : null;
        const hasDiscount = oldPrice && oldPrice > currentPrice;

        let badgeHtml = '';
        if (p.status || hasDiscount) {
            let label = hasDiscount ? 'SALE' : p.status;
            let color = hasDiscount ? "#ef4444" : "#22c55e"; 
            badgeHtml = `<div style="position: absolute; top: 12px; left: 12px; background: ${color}; color: white; padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: 900; z-index: 10;">${label}</div>`;
        }

        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[30px] shadow-sm active:scale-95 transition-all flex flex-col relative overflow-hidden border border-slate-50">
                ${badgeHtml}
                <div class="h-32 w-full flex items-center justify-center mb-4">
                    <img src="${img}" class="max-h-full max-w-full object-contain">
                </div>
                <h4 class="font-bold text-slate-800 text-[13px] leading-tight h-10 overflow-hidden text-center">${p.name}</h4>
                <div class="mt-3 flex flex-col items-center">
                    ${hasDiscount ? `<span class="text-slate-400 text-[11px] line-through">${oldPrice}₾</span>` : ''}
                    <span class="text-[#2563eb] font-black text-lg">${currentPrice}₾</span>
                </div>
            </div>
        `;
    }).join('');
}

// 6. დეტალური გვერდი
function showDetails(productId) {
    const product = storeData.productDetails.find(p => p.id.toString() === productId.toString());
    if (!product) return;

    selectedSize = null;
    selectedColor = null;
    const detailsPage = document.getElementById('details-page');
    const sizes = product.sizes ? product.sizes.toString().split(',') : [];
    const colors = product.colors ? product.colors.toString().split(',') : [];

    detailsPage.innerHTML = `
        <div class="p-5 pb-32 bg-white min-h-screen">
            <button onclick="switchPage('main')" class="w-12 h-12 bg-slate-100 rounded-2xl mb-5 active:scale-90 transition-all"><i class="fa-solid fa-arrow-left"></i></button>
            <div class="w-full h-64 flex items-center justify-center mb-8">
                <img src="${product.images.split(',')[0]}" class="max-w-full max-h-full object-contain">
            </div>
            <h1 class="text-2xl font-black text-slate-900">${product.name}</h1>
            <p class="text-3xl font-black text-blue-600 mt-2">${product.price}₾</p>
            
            ${sizes.length > 0 ? `<div class="mt-6"><p class="font-bold mb-3">ზომა</p><div class="flex gap-2 flex-wrap">${sizes.map(s => `<button onclick="selOpt(this, 'size', '${s.trim()}')" class="option-btn">${s.trim()}</button>`).join('')}</div></div>` : ''}
            ${colors.length > 0 ? `<div class="mt-6"><p class="font-bold mb-3">ფერი</p><div class="flex gap-2 flex-wrap">${colors.map(c => `<button onclick="selOpt(this, 'color', '${c.trim()}')" class="option-btn">${c.trim()}</button>`).join('')}</div></div>` : ''}
            
            <div class="mt-8 pt-6 border-t border-slate-100">
                <p class="font-bold mb-2">აღწერა</p>
                <p class="text-slate-500 text-sm leading-relaxed">${product.description || 'აღწერა არ არის'}</p>
            </div>

            <div class="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50 z-[100]">
                <button onclick="addToCart('${product.id}')" id="add-btn" class="w-full bg-slate-900 text-white py-5 rounded-[25px] font-black shadow-xl active:scale-95 transition-all">კალათაში დამატება</button>
            </div>
        </div>
    `;
    switchPage('details');
}

// 7. დამხმარე ფუნქციები (არჩევა, დამატება, გადართვა)
function selOpt(btn, type, val) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('selected', 'bg-slate-900', 'text-white'));
    btn.classList.add('selected', 'bg-slate-900', 'text-white');
    if(type === 'size') selectedSize = val; else selectedColor = val;
}

function addToCart(id) {
    const product = storeData.productDetails.find(p => p.id.toString() === id.toString());
    if ((product.sizes && !selectedSize) || (product.colors && !selectedColor)) {
        window.Telegram?.WebApp?.showAlert("გთხოვთ აირჩიოთ პარამეტრები!");
        return;
    }
    cart.push({ ...product, selectedSize, selectedColor });
    renderHeader(storeData.header); // კალათის ნიშნულის განახლება
    
    const btn = document.getElementById('add-btn');
    btn.innerHTML = "დამატებულია! ✓"; btn.style.background = "#22c55e";
    setTimeout(() => { btn.innerHTML = "კალათაში დამატება"; btn.style.background = "#0f172a"; }, 1500);
}

function switchPage(pageId) {
    document.querySelectorAll('.page-fade').forEach(p => { p.classList.add('hidden'); p.style.display = 'none'; });
    const target = document.getElementById(pageId + '-page');
    if (target) { target.classList.remove('hidden'); target.style.display = 'block'; }
    if (pageId === 'cart') renderCart();
    window.scrollTo(0, 0);
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center flex-1 text-slate-400 active:scale-90 transition-all cursor-pointer">
            <i class="fa-solid ${i.icon} text-xl mb-1"></i>
            <span class="text-[10px] font-bold">${i.name}</span>
        </div>
    `).join('');
}

function renderCart() {
    const el = document.getElementById('cart-page');
    if (!el) return;
    if (cart.length === 0) {
        el.innerHTML = '<div class="flex flex-col items-center justify-center h-screen text-slate-400"><i class="fa-solid fa-cart-shopping text-6xl mb-4"></i><p class="font-bold">კალათა ცარიელია</p></div>';
        return;
    }
    let total = cart.reduce((s, i) => s + Number(i.price), 0);
    el.innerHTML = `
        <div class="p-6">
            <h2 class="text-2xl font-black mb-6">კალათა</h2>
            <div class="space-y-4">${cart.map((item, idx) => `
                <div class="flex items-center bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
                    <img src="${item.images.split(',')[0]}" class="w-16 h-16 object-contain">
                    <div class="ml-4 flex-1">
                        <p class="font-bold text-sm">${item.name}</p>
                        <p class="text-[10px] text-slate-400">${item.selectedSize} / ${item.selectedColor}</p>
                        <p class="font-black text-blue-600">${item.price}₾</p>
                    </div>
                    <button onclick="cart.splice(${idx},1); renderCart(); renderHeader(storeData.header);" class="text-red-500 p-2"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('')}</div>
            <div class="mt-10 p-6 bg-white rounded-3xl border border-slate-100">
                <div class="flex justify-between mb-4 font-black text-xl"><span>ჯამი:</span><span>${total}₾</span></div>
                <button onclick="switchPage('checkout')" class="w-full bg-blue-600 text-white py-5 rounded-2xl font-black">გაფორმება</button>
            </div>
        </div>
    `;
}

init();
