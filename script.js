const API_URL = "https://script.google.com/macros/s/AKfycbwnpjMaHc_bs2b4aNLU60lStAsebby6K32ECbgv35WV_uBvmX3Uo3Q3PDkxB9bALCMPHQ/exec";
const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function init() {
    tg.expand();
    tg.ready();
    try {
        const response = await fetch(API_URL, { redirect: 'follow' });
        storeData = await response.json();
        
        console.log("მონაცემები ჩაიტვირთა:", storeData); // დიაგნოსტიკისთვის

        renderBanner();
        renderProducts();
        updateCartBadge();
        hidePreloader();
    } catch (e) {
        console.error("შეცდომა:", e);
        document.getElementById('product-grid').innerHTML = "<p class='col-span-2 text-center text-red-500'>მონაცემების ჩატვირთვა ვერ მოხერხდა</p>";
    }
}

// 1. ბანერის რენდერი
function renderBanner() {
    const banner = storeData.banner;
    const bannerContainer = document.getElementById('hero-banner');
    if (banner && banner.image) {
        bannerContainer.innerHTML = `
            <div class="relative w-full rounded-[30px] overflow-hidden shadow-lg h-48 bg-slate-200">
                <img src="${banner.image}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                    <h1 class="text-white text-xl font-black">${banner.title || ''}</h1>
                    <p class="text-white/80 text-sm">${banner.subtitle || ''}</p>
                </div>
            </div>
        `;
    }
}

// 2. პროდუქტების რენდერი (მორგებული შენს სტრუქტურაზე: latest.items)
function renderProducts() {
    const grid = document.getElementById('product-grid');
    // შენს JSON-ში პროდუქტები არის აქ: storeData.latest.items
    const products = storeData.latest.items;

    if (!products || products.length === 0) {
        grid.innerHTML = "<p class='col-span-2 text-center'>პროდუქტები ვერ მოიძებნა</p>";
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 flex flex-col items-center transition-transform active:scale-95">
            <div class="w-full h-32 bg-slate-50 rounded-2xl p-2 mb-3">
                <img src="${product.images}" class="w-full h-full object-contain" onerror="this.src='https://via.placeholder.com/150'">
            </div>
            <h3 class="font-bold text-xs text-slate-700 text-center line-clamp-2 h-8">${product.name}</h3>
            <p class="text-blue-600 font-black mt-2">${product.price}₾</p>
            <button onclick="showDetails('${product.id}')" 
                class="w-full mt-3 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                ნახვა
            </button>
        </div>
    `).join('');
}

// 3. დეტალური გვერდი (იყენებს productDetails მასივს)
function showDetails(productId) {
    const product = storeData.productDetails.find(p => String(p.id) === String(productId));
    if (!product) return;

    const detailsPage = document.getElementById('product-details-page');
    // ზომების დამუშავება
    const sizes = product.sizes ? String(product.sizes).split(',') : [];

    detailsPage.innerHTML = `
        <div class="p-6 pb-32">
            <button onclick="closeDetails()" class="mb-4 text-slate-400 p-2"><i class="fa-solid fa-arrow-left text-xl"></i></button>
            <div class="w-full h-64 bg-slate-50 rounded-3xl p-6 mb-6">
                <img src="${product.fullImages || product.images}" class="w-full h-full object-contain">
            </div>
            <h2 class="text-2xl font-black mb-2 text-slate-800">${product.name}</h2>
            <p class="text-blue-600 text-2xl font-black mb-6">${product.price}₾</p>
            
            ${product.description ? `<p class="text-slate-500 text-sm mb-6 leading-relaxed">${product.description}</p>` : ''}

            <div class="mb-8">
                <p class="font-bold mb-3 text-slate-400 text-[10px] uppercase tracking-widest">აირჩიე ზომა</p>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(size => `
                        <button onclick="selectSize(this, '${size.trim()}')" 
                            class="size-btn border-2 border-slate-100 py-3 px-5 rounded-xl font-black transition-all">
                            ${size.trim()}
                        </button>
                    `).join('')}
                </div>
            </div>

            <button id="add-to-cart-btn" disabled onclick="handleAddToCart('${product.id}')" 
                class="w-full py-5 bg-black text-white rounded-[25px] font-bold opacity-50 shadow-xl shadow-black/20">
                კალათაში დამატება
            </button>
        </div>
    `;
    detailsPage.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// --- დამხმარე ფუნქციები ---
let selectedSize = null;
function selectSize(btn, size) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('bg-black', 'text-white', 'border-black'));
    btn.classList.add('bg-black', 'text-white', 'border-black');
    selectedSize = size;
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.disabled = false;
    addBtn.classList.remove('opacity-50');
}

function handleAddToCart(productId) {
    const product = storeData.productDetails.find(p => String(p.id) === String(productId));
    cart.push({ ...product, selectedSize: selectedSize, cartId: Date.now() });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    closeDetails();
    tg.HapticFeedback.notificationOccurred('success');
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    badge.innerText = cart.length;
    cart.length > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
}

function closeDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
    document.body.style.overflow = 'auto';
    selectedSize = null;
}

function hidePreloader() {
    const loader = document.getElementById('app-preloader');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

function showPage(pageId) {
    document.getElementById('home-page').classList.toggle('hidden', pageId !== 'home');
    document.getElementById('cart-page').classList.toggle('hidden', pageId !== 'cart');
}

init();
