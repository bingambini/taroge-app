// 1. კონფიგურაცია
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
        storeData = await response.json(); // შენი API პირდაპირ მასივს აბრუნებს
        renderProducts();
        updateCartBadge();
        hidePreloader();
    } catch (e) {
        console.error("მონაცემების წამოღება ვერ მოხერხდა:", e);
    }
}

// 3. პროდუქტების გამოჩენა (მორგებულია შენს JSON-ზე)
function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!storeData || !Array.isArray(storeData)) return;

    grid.innerHTML = storeData.map(product => `
        <div class="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 flex flex-col items-center">
            <img src="${product.image}" class="w-full h-32 object-contain mb-3 p-2 rounded-2xl bg-slate-50" onerror="this.src='https://via.placeholder.com/150'">
            <h3 class="font-bold text-sm text-slate-700 text-center line-clamp-1">${product.name}</h3>
            <p class="text-blue-600 font-black mt-1">${product.price}₾</p>
            <button onclick="showDetails('${product.id}')" 
                class="w-full mt-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform">
                ნახვა
            </button>
        </div>
    `).join('');
}

// 4. დეტალების ნახვა
function showDetails(productId) {
    const product = storeData.find(p => String(p.id) === String(productId));
    if (!product) return;

    const detailsPage = document.getElementById('product-details-page');
    // ზომების მასივად ქცევა (თუ სტილში მძიმითაა გამოყოფილი)
    const sizes = typeof product.size === 'string' ? product.size.split(',') : [product.size];

    detailsPage.innerHTML = `
        <div class="p-6 pb-32">
            <button onclick="closeDetails()" class="mb-4 text-slate-400 p-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
            <img src="${product.image}" class="w-full h-64 object-contain mb-6 rounded-3xl p-4 bg-slate-50">
            <h2 class="text-2xl font-black mb-2 text-slate-800">${product.name}</h2>
            <p class="text-blue-600 text-2xl font-black mb-6">${product.price}₾</p>
            
            <div class="mb-8">
                <p class="font-bold mb-3 text-slate-500 text-sm uppercase tracking-wider">აირჩიე ზომა</p>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(size => `
                        <button onclick="selectSize(this, '${size.trim()}')" 
                            class="size-btn border-2 border-slate-100 py-3 px-5 rounded-xl font-bold transition-all active:scale-90">
                            ${size.trim()}
                        </button>
                    `).join('')}
                </div>
            </div>

            <button id="add-to-cart-btn" disabled onclick="handleAddToCart('${product.id}')" 
                class="w-full py-5 bg-black text-white rounded-[25px] font-bold opacity-50 shadow-xl shadow-black/20 transition-all">
                კალათაში დამატება
            </button>
        </div>
    `;
    detailsPage.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 5. სხვა ფუნქციები (კალათა, ნავიგაცია)
let selectedSize = null;
function selectSize(btn, size) {
    document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('border-black', 'bg-black', 'text-white');
        b.classList.add('border-slate-100');
    });
    btn.classList.remove('border-slate-100');
    btn.classList.add('border-black', 'bg-black', 'text-white');
    selectedSize = size;
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.disabled = false;
    addBtn.classList.remove('opacity-50');
}

function handleAddToCart(productId) {
    const product = storeData.find(p => String(p.id) === String(productId));
    cart.push({ ...product, selectedSize: selectedSize, cartId: Date.now() });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    closeDetails();
    tg.HapticFeedback.notificationOccurred('success');
}

function closeDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
    document.body.style.overflow = 'auto';
    selectedSize = null;
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

function showPage(pageId) {
    document.getElementById('home-page').classList.toggle('hidden', pageId !== 'home');
    document.getElementById('cart-page').classList.toggle('hidden', pageId !== 'cart');
    if (pageId === 'cart') renderCart();
}

function hidePreloader() {
    const loader = document.getElementById('app-preloader');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

init();
