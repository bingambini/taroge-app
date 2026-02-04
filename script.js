// 1. კონფიგურაცია და ცვლადები
const API_URL = "https://script.google.com/macros/s/AKfycbwnpjMaHc_bs2b4aNLU60lStAsebby6K32ECbgv35WV_uBvmX3Uo3Q3PDkxB9bALCMPHQ/exec"; 
const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 2. აპლიკაციის ინიციალიზაცია
async function init() {
    tg.expand();
    tg.ready();
    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        renderProducts();
        updateCartBadge();
        hidePreloader();
    } catch (e) {
        console.error("მონაცემების წამოღება ვერ მოხერხდა:", e);
        alert("შეცდომა მონაცემების ჩატვირთვისას");
    }
}

// 3. გვერდების გადართვა
function showPage(pageId) {
    const pages = ['home-page', 'cart-page'];
    pages.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(pageId + '-page').classList.remove('hidden');
    
    // მენიუს ღილაკების გააქტიურება
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (pageId === 'cart') renderCart();
}

// 4. პროდუქტების გამოჩენა
function renderProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = storeData.products.map(product => `
        <div class="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 flex flex-col items-center">
            <img src="${product.image}" class="w-full h-32 object-contain mb-3 p-2 rounded-2xl bg-slate-50">
            <h3 class="font-bold text-sm text-slate-700 text-center line-clamp-1">${product.name}</h3>
            <p class="text-blue-600 font-black mt-1">${product.price}₾</p>
            <button onclick="showDetails('${product.id}')" 
                class="w-full mt-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform">
                ნახვა
            </button>
        </div>
    `).join('');
}

// 5. კალათის ფუნქციები
function addToCart(productId, size) {
    const product = storeData.products.find(p => p.id === productId);
    cart.push({ ...product, selectedSize: size, cartId: Date.now() });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    tg.HapticFeedback.notificationOccurred('success');
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('cart-empty');

    if (cart.length === 0) {
        cartItems.innerHTML = '';
        summary.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');
    summary.classList.remove('hidden');
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="flex items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <img src="${item.image}" class="w-16 h-16 object-contain p-1 bg-slate-50 rounded-lg">
            <div class="ml-4 flex-1">
                <h4 class="font-bold text-sm text-slate-800">${item.name}</h4>
                <p class="text-xs text-slate-400">ზომა: ${item.selectedSize}</p>
                <p class="text-blue-600 font-bold">${item.price}₾</p>
            </div>
            <button onclick="removeFromCart(${index})" class="text-slate-300 hover:text-red-500">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
    document.getElementById('cart-total-price').innerText = total + '₾';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (cart.length > 0) {
        badge.innerText = cart.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// 6. დამხმარე ფუნქციები
function hidePreloader() {
    const loader = document.getElementById('app-preloader');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

// სტარტი
init();
