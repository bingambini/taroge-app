const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
const PROMO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQH2mZB4PnZn6hJJRPgC_Ry0HTt7BvKiNmcNGyx7PVOMHY0rNFqhM4MneVoRI3kT00y6vxMMOoHbipA/pub?output=csv";

let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let activeDiscountData = null;

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
        if (storeData.latest) renderProducts(storeData.latest);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        if (storeData.profileMenu) renderProfile(storeData.profileMenu);
        
        updateCartBadge();

        const preloader = document.getElementById('app-preloader');
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.display = 'none', 500);

    } catch (e) { 
        console.error("Error:", e); 
        document.getElementById('app-preloader').style.display = 'none';
    }
}

function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (h.status !== 'active') return;
    el.style.display = 'flex';
    el.style.backgroundColor = h.bg || "#24afeb";
    el.style.height = (parseInt(h.height) || 80) + "px";
    el.style.color = h.textColor || "#ffffff";
    if (h.style === 'floating') el.classList.add('header-floating');
    el.innerHTML = `
        <div class="header-container" style="justify-content: ${h.layout === 'center' ? 'center' : 'space-between'}">
            <div class="flex items-center gap-3">
                <img src="${h.logo}" style="width: 45px; border-radius: ${h.logoRadius}%">
                <span style="font-weight: 800; font-size: 18px">${h.name || ''}</span>
            </div>
            ${h.layout !== 'center' ? '<div><i class="fa-solid fa-bell text-xl"></i></div>' : ''}
        </div>`;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (b.status !== 'active') return;
    el.style.height = (parseInt(b.height) || 180) + "px";
    el.style.backgroundColor = b.bg || "#1e293b";
    el.innerHTML = `
        <div class="banner-content" style="color: ${b.textColor || '#ffffff'}">
            <h2 style="font-size: 22px; font-weight: 900; line-height: 1.2">${b.title}</h2>
            <p style="font-size: 12px; font-weight: 700; margin-top: 8px; opacity: 0.9">${b.subtitle || ''}</p>
            <button style="margin-top: 15px; background: #ffffff; color: #000000; padding: 8px 20px; border-radius: 12px; font-size: 11px; font-weight: 800; box-shadow: 0 10px 20px rgba(0,0,0,0.1)">${b.buttonText || 'Shop Now'}</button>
        </div>
        <img src="${b.image}" class="banner-img">
    `;
}

function renderProducts(l) {
    const grid = document.getElementById('product-grid');
    if (l.status !== 'active') return;
    grid.innerHTML = l.items.map((p, index) => {
        const details = storeData.productDetails.find(d => d.id.toString() === p.id.toString());
        const images = details ? details.images.split(',') : [];
        const mainImg = images[0] ? images[0].trim() : '';
        const badgeClass = p.badgeType === 'sale' ? 'badge-sale' : (p.badgeType === 'new' ? 'badge-new' : 'badge-hot');
        
        return `
        <div onclick="openProductSheet(${index})" class="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all cursor-pointer relative overflow-hidden">
            ${p.badge ? `<div class="badge ${badgeClass}">${p.badge}</div>` : ''}
            <div class="h-28 flex items-center justify-center mb-4">
                <img src="${mainImg}" class="max-h-full object-contain filter drop-shadow-lg">
            </div>
            <h4 class="font-bold text-[11px] text-slate-400 uppercase tracking-tight truncate">${p.name}</h4>
            <div class="flex justify-between items-end mt-1">
                <span class="text-slate-800 font-extrabold text-sm">${p.price}₾</span>
                <div class="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white text-[10px]">
                    <i class="fa-solid fa-plus"></i>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openProductSheet(index) {
    const p = storeData.latest.items[index];
    const details = storeData.productDetails.find(d => d.id.toString() === p.id.toString());
    if (!details) return;

    const images = details.images.split(',');
    const sizes = details.sizes.split(',');
    
    const sheet = document.getElementById('product-sheet');
    const overlay = document.getElementById('product-sheet-overlay');
    const content = document.getElementById('sheet-content');

    content.innerHTML = `
        <div class="flex gap-6 mb-8 items-center">
            <div class="w-32 h-32 bg-slate-50 rounded-[30px] flex items-center justify-center p-4">
                <img src="${images[0].trim()}" class="max-h-full object-contain">
            </div>
            <div class="flex-1">
                <h3 class="text-xl font-black text-slate-800 leading-tight">${p.name}</h3>
                <p class="text-2xl font-black text-blue-600 mt-2">${p.price}₾</p>
            </div>
        </div>

        <div class="mb-8">
            <h4 class="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">აირჩიეთ ზომა</h4>
            <div class="options-scroll">
                ${sizes.map((s, i) => `
                    <button onclick="selectSizeOption(this)" class="option-btn px-6 py-3 rounded-2xl bg-white text-slate-800 text-sm font-bold border-2 border-slate-50">
                        ${s.trim()}
                    </button>
                `).join('')}
            </div>
        </div>

        <button onclick="goToProductDetails('${p.id}')" class="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all">
            დეტალების ნახვა
            <i class="fa-solid fa-arrow-right text-sm opacity-50"></i>
        </button>
    `;

    overlay.classList.remove('hidden');
    setTimeout(() => {
        overlay.style.opacity = '1';
        sheet.style.transform = 'translateY(0)';
    }, 10);
}

function closeProductSheet() {
    const sheet = document.getElementById('product-sheet');
    const overlay = document.getElementById('product-sheet-overlay');
    sheet.style.transform = 'translateY(100%)';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

function selectSizeOption(btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function goToProductDetails(id) {
    closeProductSheet();
    const p = storeData.latest.items.find(item => item.id.toString() === id.toString());
    const details = storeData.productDetails.find(d => d.id.toString() === id.toString());
    
    const page = document.getElementById('product-details-page');
    const content = document.getElementById('details-content');
    
    const images = details.images.split(',');
    const sizes = details.sizes.split(',');

    content.innerHTML = `
        <div class="slider-container">
            ${images.map(img => `
                <div class="slider-item">
                    <img src="${img.trim()}">
                </div>
            `).join('')}
        </div>

        <div class="mt-8">
            <h1 class="text-3xl font-black text-slate-800 leading-tight">${p.name}</h1>
            <div class="flex items-center gap-3 mt-3">
                <span class="text-3xl font-black text-blue-600">${p.price}₾</span>
                <span class="bg-blue-50 text-blue-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">მარაგშია</span>
            </div>

            <p class="mt-8 text-slate-500 text-sm font-bold leading-relaxed uppercase tracking-tight opacity-80">აღწერა</p>
            <p class="mt-2 text-slate-600 leading-relaxed font-medium">${details.description}</p>

            <div class="mt-10">
                <h4 class="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">ხელმისაწვდომი ზომები</h4>
                <div class="options-scroll">
                    ${sizes.map(s => `
                        <button onclick="selectSizeOption(this)" class="option-btn px-6 py-3 rounded-2xl bg-white text-slate-800 text-sm font-bold border-2 border-slate-50">
                            ${s.trim()}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="fixed bottom-10 left-6 right-6 flex gap-3 z-[40000]">
            <div class="stepper-ui h-[64px] px-2">
                <button onclick="changeQty(-1)" class="stepper-btn"><i class="fa-solid fa-minus text-[10px]"></i></button>
                <span id="detail-qty" class="stepper-count text-lg">1</span>
                <button onclick="changeQty(1)" class="stepper-btn"><i class="fa-solid fa-plus text-[10px]"></i></button>
            </div>
            <button onclick="addToCartFromDetails('${p.id}')" class="flex-1 bg-slate-900 text-white py-5 rounded-[25px] font-black text-lg shadow-2xl active:scale-95 transition-all">
                კალათაში დამატება
            </button>
        </div>
    `;

    page.classList.remove('hidden');
    window.scrollTo(0,0);
}

function closeProductDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
}

function changeQty(amt) {
    const el = document.getElementById('detail-qty');
    let q = parseInt(el.innerText) + amt;
    if (q < 1) q = 1;
    el.innerText = q;
}

function addToCartFromDetails(id) {
    const selectedSizeBtn = document.querySelector('#details-content .option-btn.selected');
    if (!selectedSizeBtn) {
        alert("გთხოვთ აირჩიოთ ზომა!");
        return;
    }

    const size = selectedSizeBtn.innerText.trim();
    const qty = parseInt(document.getElementById('detail-qty').innerText);
    const p = storeData.latest.items.find(item => item.id.toString() === id.toString());
    const details = storeData.productDetails.find(d => d.id.toString() === id.toString());
    
    const cartItem = {
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        size: size,
        qty: qty,
        image: details.images.split(',')[0].trim()
    };

    const existing = cart.find(item => item.id === cartItem.id && item.size === cartItem.size);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    closeProductDetails();
    switchPage('cart');
}

function updateCartBadge() {
    const counts = document.querySelectorAll('.cart-badge');
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    counts.forEach(el => {
        el.innerText = total;
        el.style.display = total > 0 ? 'flex' : 'none';
    });
}

function switchPage(page) {
    ['home-page', 'cart-page', 'checkout-page', 'payment-page', 'orders-page', 'profile-page'].forEach(p => {
        const el = document.getElementById(p);
        if (el) el.classList.add('hidden');
    });

    const activePage = document.getElementById(page + '-page');
    if (activePage) activePage.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('onclick') && nav.getAttribute('onclick').includes(page)) {
            nav.classList.add('active');
        }
    });

    if (page === 'cart') renderCart();
    if (page === 'orders') renderOrders();
    window.scrollTo(0, 0);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const promoSection = document.getElementById('promo-section');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20">
                <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fa-solid fa-cart-shopping text-slate-200 text-4xl"></i>
                </div>
                <h3 class="text-slate-400 font-bold">კალათა ცარიელია</h3>
            </div>`;
        summary.classList.add('hidden');
        promoSection.classList.add('hidden');
        return;
    }

    summary.classList.remove('hidden');
    promoSection.classList.remove('hidden');

    container.innerHTML = cart.map((item, index) => `
        <div class="bg-white p-5 rounded-[30px] flex items-center gap-5 shadow-sm border border-slate-50">
            <div class="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-2">
                <img src="${item.image}" class="max-h-full object-contain">
            </div>
            <div class="flex-1">
                <h4 class="font-black text-slate-800 text-sm">${item.name}</h4>
                <p class="text-[10px] font-black text-slate-400 uppercase mt-1">ზომა: ${item.size}</p>
                <div class="flex justify-between items-center mt-3">
                    <span class="font-black text-blue-600">${item.price * item.qty}₾</span>
                    <div class="stepper-ui">
                        <button onclick="updateCartQty(${index}, -1)" class="stepper-btn"><i class="fa-solid fa-minus text-[8px]"></i></button>
                        <span class="stepper-count">${item.qty}</span>
                        <button onclick="updateCartQty(${index}, 1)" class="stepper-btn"><i class="fa-solid fa-plus text-[8px]"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    calculateTotal();
}

function updateCartQty(index, amt) {
    cart[index].qty += amt;
    if (cart[index].qty < 1) {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartBadge();
}

function calculateTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let finalTotal = subtotal;

    if (activeDiscountData) {
        if (activeDiscountData.type === 'percent') {
            finalTotal = subtotal * (1 - activeDiscountData.value / 100);
        } else {
            finalTotal = subtotal - activeDiscountData.value;
        }
        document.getElementById('discount-label').classList.remove('hidden');
        document.getElementById('discount-label').innerText = `პრომო კოდი: -${subtotal - finalTotal}₾`;
    } else {
        document.getElementById('discount-label').classList.add('hidden');
    }

    document.getElementById('cart-total-price').innerText = Math.max(0, Math.round(finalTotal)) + '₾';
}

async function applyPromo() {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    const msg = document.getElementById('promo-msg');
    
    if (!code) return;

    try {
        const res = await fetch(PROMO_CSV_URL);
        const text = await res.text();
        const rows = text.split('\n').slice(1);
        
        let found = false;
        for (let row of rows) {
            const [promoCode, type, value, status] = row.split(',').map(s => s.trim());
            if (promoCode === code && status === 'active') {
                activeDiscountData = { type, value: parseFloat(value) };
                msg.innerText = "პრომო კოდი გააქტიურდა!";
                msg.className = "text-[10px] font-bold mt-2 px-2 text-green-600";
                found = true;
                break;
            }
        }

        if (!found) {
            activeDiscountData = null;
            msg.innerText = "პრომო კოდი არასწორია!";
            msg.className = "text-[10px] font-bold mt-2 px-2 text-red-600";
        }
        
        calculateTotal();

    } catch (e) {
        console.error(e);
    }
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    nav.innerHTML = items.map(item => `
        <div onclick="switchPage('${item.action}')" class="nav-item ${item.action === 'home' ? 'active' : ''}">
            <i class="fa-solid ${item.icon}"></i>
            <span>${item.name}</span>
            ${item.action === 'cart' ? '<div class="cart-badge" style="display:none">0</div>' : ''}
        </div>
    `).join('');
}

function renderProfile(menu) {
    const container = document.getElementById('profile-page');
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    container.innerHTML = `
        <div class="bg-slate-900 px-6 pt-12 pb-20 rounded-b-[50px]">
            <div class="flex items-center gap-5">
                <div class="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/5">
                    <i class="fa-solid fa-user text-3xl text-white"></i>
                </div>
                <div>
                    <h2 class="text-white text-2xl font-black">${user?.first_name || 'სტუმარი'}</h2>
                    <p class="text-white/40 font-bold text-xs uppercase tracking-widest mt-1">ID: ${user?.id || '000000'}</p>
                </div>
            </div>
        </div>

        <div class="px-6 -mt-10">
            <div class="bg-white rounded-[35px] shadow-sm border border-slate-50 overflow-hidden">
                ${menu.items.map(item => `
                    <div onclick="handleProfileClick('${item.action}')" class="flex items-center gap-4 p-5 active:bg-slate-50 transition-all cursor-pointer border-b border-slate-50 last:border-0">
                        <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <i class="fa-solid ${item.icon}"></i>
                        </div>
                        <span class="flex-1 font-bold text-slate-700">${item.name}</span>
                        <i class="fa-solid fa-chevron-right text-slate-200 text-xs"></i>
                    </div>
                `).join('');}
            </div>
        </div>`;
}

function handleProfileClick(action) {
    if (action === 'orders') switchPage('orders');
}

function placeOrder() {
    switchPage('checkout');
    document.getElementById('checkout-total-price').innerText = document.getElementById('cart-total-price').innerText;
}

function selectPayment(method, title) {
    localStorage.setItem('temp_payment', JSON.stringify({ method, title }));
    confirmFinalOrder();
}

async function confirmFinalOrder() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const city = document.getElementById('order-city').value.trim();
    const address = document.getElementById('order-address').value.trim();
    const extra = document.getElementById('order-extra').value.trim();
    const payment = JSON.parse(localStorage.getItem('temp_payment'));

    if (!name || !phone || !city || !address) {
        alert("გთხოვთ შეავსოთ ყველა სავალდებულო ველი!");
        return;
    }

    if (document.getElementById('checkout-page').classList.contains('hidden')) {
        // ეს ნიშნავს რომ უკვე Checkout-ზე ვართ და გადახდაზე გადავდივართ
    } else {
        document.getElementById('payment-final-total').innerText = document.getElementById('checkout-total-price').innerText;
        switchPage('payment');
        return;
    }

    const itemsSummary = cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ');
    const total = document.getElementById('payment-final-total').innerText;

    const orderPayload = {
        action: 'placeOrder',
        name, phone, city, address, extra,
        paymentMethod: payment.title,
        items: itemsSummary,
        totalPrice: total,
        userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest'
    };

    try {
        const params = new URLSearchParams(orderPayload);
        await fetch(`${API_URL}?${params.toString()}`, { mode: 'no-cors' });
        
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.unshift({
            date: new Date().toLocaleString('ka-GE'),
            total: total,
            items: itemsSummary,
            status: 'მიღებულია'
        });
        localStorage.setItem('orders', JSON.stringify(orders));

        alert("შეკვეთა წარმატებით გაიგზავნა!");
        cart = [];
        localStorage.removeItem('cart');
        updateCartBadge();
        switchPage('home');
        
    } catch (e) {
        alert("შეცდომა შეკვეთის გაგზავნისას.");
    }
}

function renderOrders() {
    const container = document.getElementById('orders-list');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    if (orders.length === 0) {
        container.innerHTML = `<p class="text-center py-20 text-slate-400 font-bold">შეკვეთები არ გაქვთ</p>`;
        return;
    }

    container.innerHTML = orders.map(o => `
        <div class="bg-white p-5 rounded-[30px] shadow-sm border border-slate-50">
            <div class="flex justify-between items-start mb-3">
                <span class="text-[10px] font-black text-slate-400 uppercase">${o.date}</span>
                <span class="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">${o.status}</span>
            </div>
            <p class="font-bold text-slate-700 text-sm mb-3">${o.items}</p>
            <div class="border-t border-slate-50 pt-3 flex justify-between items-center">
                <span class="text-xs font-bold text-slate-400">ჯამი:</span>
                <span class="font-black text-slate-800">${o.total}</span>
            </div>
        </div>
    `).join('');
}

init();
