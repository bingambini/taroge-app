const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 1. ინიციალიზაცია ---
async function init() {
    if (tg) {
        tg.ready();
        tg.expand();
    }
    
    try {
        const res = await fetch(API_URL);
        storeData = await res.json();
        console.log("მონაცემები:", storeData); // ამას ნახავ Console-ში

        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        
        // Latest სექცია (შენს შიტში არის storeData.latest.items)
        if (storeData.latest && storeData.latest.items) {
            renderProducts(storeData.latest.items);
        }

        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        // პრელოადერის გათიშვა
        const preloader = document.getElementById('app-preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }

    } catch (e) {
        console.error("შეცდომა ჩატვირთვისას:", e);
        if (document.getElementById('app-preloader')) {
            document.getElementById('app-preloader').style.display = 'none';
        }
    }
}

// --- 2. პროდუქტების გამოტანა (Grid) ---
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = items.map((p, index) => {
        // ვეძებთ დეტალებს Image_URLs-ისთვის
        const d = storeData.productDetails.find(det => String(det.ID) === String(p.ID || p.id));
        const img = d && d.Image_URLs ? d.Image_URLs.split(',')[0].trim() : "https://via.placeholder.com/150";

        return `
            <div onclick="goToProductDetails('${p.ID || p.id}')" class="bg-white p-4 rounded-[30px] shadow-sm border border-slate-50 active:scale-95 transition-all">
                <div class="h-28 flex items-center justify-center mb-3">
                    <img src="${img}" class="max-h-full object-contain">
                </div>
                <h4 class="font-bold text-[11px] truncate text-slate-700">${p.Name || p.name}</h4>
                <p class="text-blue-600 font-black text-sm mt-1">${p.Price || p.price}₾</p>
            </div>`;
    }).join('');
}

// --- 3. დეტალური გვერდი ---
function goToProductDetails(id) {
    const d = storeData.productDetails.find(det => String(det.ID) === String(id));
    if (!d) return;

    const images = d.Image_URLs ? d.Image_URLs.split(',') : [];
    const sizes = d.Sizes ? String(d.Sizes).split(',') : [];

    const content = document.getElementById('details-content');
    if (!content) return;

    content.innerHTML = `
        <div class="pb-32">
            <div class="w-full h-72 bg-slate-50 rounded-[40px] flex items-center justify-center overflow-hidden mb-6">
                <img src="${images[0] ? images[0].trim() : ''}" class="max-w-[85%] max-h-[85%] object-contain">
            </div>
            
            <h1 class="text-2xl font-black text-slate-800">${d.Name}</h1>
            <p class="text-blue-600 font-black text-3xl mt-2">${d.Price}₾</p>
            
            <p class="text-slate-500 text-sm mt-6 leading-relaxed">${d.Description || 'აღწერა არ არის'}</p>

            <div class="mt-8">
                <h4 class="text-[10px] font-black text-slate-400 uppercase mb-3">ხელმისაწვდომი ზომები</h4>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(s => `<span class="px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold">${s.trim()}</span>`).join('')}
                </div>
            </div>
            
            <div class="fixed bottom-10 left-6 right-6 z-[40000]">
                <button onclick="alert('დაემატა კალათაში')" class="w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all">
                    კალათაში დამატება
                </button>
            </div>
        </div>
    `;

    document.getElementById('product-details-page').classList.remove('hidden');
}

function closeProductDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
}

// დამხმარე ფუნქციები (Header, Navigation და ა.შ.)
function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (!el) return;
    el.style.display = 'flex';
    el.style.backgroundColor = h.bg || "#24afeb";
    el.innerHTML = `<div class="px-6 py-4 text-white font-black uppercase tracking-widest">${h.name || 'TAROGE'}</div>`;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;
    el.innerHTML = `
        <div class="relative w-full h-44 rounded-[35px] overflow-hidden m-4">
            <img src="${b.image}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/20 p-6 flex flex-col justify-end text-white">
                <h2 class="text-xl font-black">${b.title}</h2>
            </div>
        </div>`;
}

function renderNavigation(nav) {
    const el = document.getElementById('bottom-nav');
    if (!el) return;
    el.innerHTML = nav.map(n => `
        <div class="nav-item">
            <i class="fa-solid ${n.icon}"></i>
            <span>${n.name}</span>
        </div>
    `).join('');
}

// გაშვება
init();
