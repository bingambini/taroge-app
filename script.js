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
        
        renderHeader(storeData.header);
        renderBanner(storeData.banner);
        renderProducts(storeData.latest.items);
        renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.opacity = '0';
        setTimeout(() => document.getElementById('app-preloader').style.display = 'none', 500);
    } catch (e) { console.log("Error loading app"); }
}

function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (h.status !== 'active') return;
    el.style.display = 'flex';
    el.style.backgroundColor = h.bg;
    el.innerHTML = `<img src="${h.logo}" class="w-10 h-10 rounded-full mr-3"><span class="font-black">${h.name}</span>`;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (b.status !== 'active') return;
    el.style.backgroundColor = b.bg;
    el.innerHTML = `<div class="z-10 text-white"><h2 class="text-xl font-black">${b.title}</h2><p class="text-xs opacity-80">${b.subtitle}</p></div><img src="${b.image}" class="banner-img">`;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = items.map(p => {
        const details = storeData.productDetails.find(d => String(d.ID) === String(p.ID));
        const img = details ? details.Image_URLs.split(',')[0].trim() : "";
        return `
            <div onclick="showDetails('${p.ID}')" class="bg-white p-4 rounded-[25px] border border-slate-50 shadow-sm active:scale-95 transition-all cursor-pointer">
                <img src="${img}" class="h-28 mx-auto object-contain">
                <h4 class="font-bold text-[11px] mt-3 truncate text-slate-500 uppercase">${p.Name}</h4>
                <p class="text-blue-600 font-black mt-1">${p.Price}₾</p>
            </div>`;
    }).join('');
}

function showDetails(id) {
    const p = storeData.productDetails.find(d => String(d.ID) === String(id));
    const images = p.Image_URLs.split(',');
    const sizes = p.Sizes.split(',');
    
    document.getElementById('details-content').innerHTML = `
        <img src="${images[0]}" class="w-full h-64 object-contain bg-slate-50 rounded-[30px] mt-4">
        <h1 class="text-2xl font-black mt-6 text-slate-800">${p.Name}</h1>
        <p class="text-2xl font-black text-blue-600 mt-2">${p.Price}₾</p>
        <p class="mt-4 text-slate-500 text-sm leading-relaxed">${p.Description}</p>
        <div class="mt-6 flex gap-2 overflow-x-auto pb-2">
            ${sizes.map(s => `<button onclick="selectSize(this)" class="option-btn">${s.trim()}</button>`).join('')}
        </div>
        <button onclick="addToCart('${p.ID}')" class="w-full bg-slate-900 text-white py-5 rounded-[20px] font-black mt-8">კალათაში დამატება</button>
    `;
    document.getElementById('product-details-page').classList.remove('hidden');
}

function selectSize(btn) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function addToCart(id) {
    const size = document.querySelector('.option-btn.selected')?.innerText;
    if(!size) return alert("გთხოვთ აირჩიოთ ზომა");
    const p = storeData.productDetails.find(d => String(d.ID) === String(id));
    cart.push({ name: p.Name, price: p.Price, size, img: p.Image_URLs.split(',')[0] });
    localStorage.setItem('cart', JSON.stringify(cart));
    closeProductDetails();
    switchPage('cart');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="nav-item">
            <i class="fa-solid ${i.icon} text-xl"></i>
            <span class="mt-1">${i.name}</span>
        </div>`).join('');
}

function switchPage(page) {
    ['home-page', 'cart-page', 'checkout-page'].forEach(p => document.getElementById(p).classList.add('hidden'));
    document.getElementById(page + '-page').classList.remove('hidden');
    if(page === 'cart') renderCart();
    window.scrollTo(0,0);
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if(cart.length === 0) {
        container.innerHTML = "<p class='text-center py-20 text-slate-400 font-bold'>კალათა ცარიელია</p>";
        document.getElementById('cart-summary').classList.add('hidden');
        return;
    }
    document.getElementById('cart-summary').classList.remove('hidden');
    container.innerHTML = cart.map((item, idx) => `
        <div class="bg-white p-4 rounded-3xl flex items-center gap-4 border border-slate-50 shadow-sm">
            <img src="${item.img}" class="w-16 h-16 object-contain">
            <div class="flex-1">
                <h4 class="font-bold text-sm text-slate-800">${item.name}</h4>
                <p class="text-[10px] font-bold text-slate-400 uppercase">${item.size} • ${item.price}₾</p>
            </div>
            <button onclick="removeFromCart(${idx})" class="text-red-400 p-2"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');
    
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    document.getElementById('cart-total-price').innerText = total + "₾";
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

async function confirmFinalOrder() {
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    if(!name || !phone) return alert("შეავსეთ სახელი და ნომერი");
    
    alert("შეკვეთა მიღებულია!");
    cart = [];
    localStorage.removeItem('cart');
    switchPage('home');
}

function closeProductDetails() { document.getElementById('product-details-page').classList.add('hidden'); }

init();
