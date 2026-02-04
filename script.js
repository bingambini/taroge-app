const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 1. მონაცემების ჩატვირთვა ---
async function init() {
    tg.ready();
    tg.expand();
    try {
        const res = await fetch(API_URL);
        storeData = await res.json();
        
        // რენდერინგი
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        updateCartBadge();
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) {
        console.error("Error:", e);
    }
}

// --- 2. პროდუქტების გამოჩენა მთავარზე ---
function renderProducts(l) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = l.items.map((p, index) => {
        // ვეძებთ დეტალებს Image_URLs-ისთვის
        const d = storeData.productDetails.find(det => String(det.ID) === String(p.id));
        const img = d && d.Image_URLs ? d.Image_URLs.split(',')[0] : p.images;

        return `
            <div onclick="openProductSheet(${index})" class="bg-white p-4 rounded-[30px] shadow-sm border border-slate-100">
                <div class="h-28 flex items-center justify-center mb-3">
                    <img src="${img}" class="max-h-full object-contain">
                </div>
                <h4 class="font-bold text-[11px] truncate">${p.name}</h4>
                <p class="text-blue-600 font-black text-sm">${p.price}₾</p>
            </div>`;
    }).join('');
}

// --- 3. პროდუქტის დეტალური გვერდი ---
function goToProductDetails(id) {
    const overlay = document.getElementById('product-sheet-overlay');
    if (overlay) overlay.classList.add('hidden'); // ვხურავთ შიტს

    const d = storeData.productDetails.find(det => String(det.ID) === String(id));
    if (!d) return;

    // მონაცემების მომზადება შენი ცხრილიდან
    const images = d.Image_URLs ? d.Image_URLs.split(',') : [];
    const sizes = d.Sizes ? String(d.Sizes).split(',') : [];
    const colors = d.Colors ? String(d.Colors).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="p-4">
            <div class="w-full h-64 bg-slate-50 rounded-[30px] flex items-center justify-center overflow-hidden">
                <img src="${images[0] || ''}" class="max-w-full max-h-full object-contain">
            </div>
            
            <h1 class="text-2xl font-black text-slate-800 mt-6">${d.Name}</h1>
            <div class="flex items-center justify-between mt-2">
                <span class="text-3xl font-black text-blue-600">${d.Price}₾</span>
                <span class="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-400">ID: ${d.ID}</span>
            </div>

            <p class="text-slate-500 text-sm mt-4">${d.Description || 'აღწერა არ არის'}</p>

            <div class="mt-6">
                <h4 class="text-[10px] font-bold text-slate-400 uppercase mb-2">ზომა</h4>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(s => `<button onclick="selectOpt(this, 'size')" class="px-4 py-2 border border-slate-100 rounded-xl text-sm font-bold opt-btn">${s.trim()}</button>`).join('')}
                </div>
            </div>

            <div class="mt-6">
                <h4 class="text-[10px] font-bold text-slate-400 uppercase mb-2">ფერი</h4>
                <div class="flex flex-wrap gap-2">
                    ${colors.map(c => `<button onclick="selectOpt(this, 'color')" class="px-4 py-2 border border-slate-100 rounded-xl text-sm font-bold opt-btn">${c.trim()}</button>`).join('')}
                </div>
            </div>

            <button id="buy-btn" disabled onclick="addToCart('${d.ID}')" class="w-full mt-10 bg-slate-200 text-slate-400 py-5 rounded-[25px] font-black text-lg">აირჩიე ზომა და ფერი</button>
        </div>
    `;
    document.getElementById('product-details-page').classList.remove('hidden');
}

// ზომის და ფერის არჩევა
function selectOpt(btn, type) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'selected'));
    btn.classList.add('bg-blue-600', 'text-white', 'selected');
    
    checkSelection();
}

function checkSelection() {
    const selected = document.querySelectorAll('.selected').length;
    const btn = document.getElementById('buy-btn');
    if (selected >= 2) {
        btn.disabled = false;
        btn.innerText = "კალათაში დამატება";
        btn.classList.replace('bg-slate-200', 'bg-blue-600');
        btn.classList.replace('text-slate-400', 'text-white');
    }
}

// ინიციალიზაცია
init();
