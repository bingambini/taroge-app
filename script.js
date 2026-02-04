const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
const tg = window.Telegram.WebApp;
let storeData = null;

async function init() {
    tg.ready();
    tg.expand();
    try {
        const res = await fetch(API_URL, { redirect: 'follow' });
        storeData = await res.json();
        
        // ვამოწმებთ სტრუქტურას კონსოლში (F12-ით შეგიძლია ნახო)
        console.log("Sheet Data:", storeData);

        // 1. პროდუქტების რენდერინგი (ვიყენებთ დიდ ასოებს: ID, Name, Price)
        if (storeData.latest && storeData.latest.items) {
            renderProducts(storeData.latest.items);
        }

        // 2. ჰედერი და ბანერი (თუ არსებობს შიტში)
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);

        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) {
        console.error("Critical Error:", e);
        document.getElementById('app-preloader').style.display = 'none';
    }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = items.map(p => {
        // ვეძებთ დეტალურ ინფორმაციას Image_URLs-ისთვის
        const details = storeData.productDetails.find(d => String(d.ID) === String(p.ID || p.id));
        
        // ვიყენებთ ზუსტად შენს სვეტს: Image_URLs
        let img = "";
        if (details && details.Image_URLs) {
            img = details.Image_URLs.split(',')[0].trim();
        }

        return `
            <div onclick="openDetails('${p.ID || p.id}')" class="bg-white p-4 rounded-[30px] shadow-sm border border-slate-50">
                <div class="h-28 flex items-center justify-center mb-2">
                    <img src="${img}" class="max-h-full object-contain" onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <h4 class="font-bold text-[11px] truncate">${p.Name || p.name}</h4>
                <p class="text-blue-600 font-black text-sm">${p.Price || p.price}₾</p>
            </div>`;
    }).join('');
}

function openDetails(id) {
    const d = storeData.productDetails.find(det => String(det.ID) === String(id));
    if (!d) return;

    // ვამზადებთ სურათებს, ზომებს და ფერებს ზუსტად შენი სვეტებიდან
    const images = d.Image_URLs ? d.Image_URLs.split(',') : [];
    const sizes = d.Sizes ? String(d.Sizes).split(',') : [];
    const colors = d.Colors ? String(d.Colors).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="p-4">
            <button onclick="document.getElementById('product-details-page').classList.add('hidden')" class="mb-4 text-slate-400 font-bold">← უკან</button>
            <div class="w-full h-64 bg-slate-50 rounded-[30px] flex items-center justify-center overflow-hidden">
                <img src="${images[0] ? images[0].trim() : ''}" class="max-w-full max-h-full object-contain">
            </div>
            <h1 class="text-2xl font-black mt-4">${d.Name}</h1>
            <p class="text-blue-600 font-black text-2xl">${d.Price}₾</p>
            <p class="text-slate-500 text-sm mt-4">${d.Description || 'აღწერა არ არის'}</p>
            
            <div class="mt-6">
                <p class="text-[10px] font-bold text-slate-400 mb-2 uppercase">ზომა</p>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(s => `<span class="px-4 py-2 border rounded-xl text-sm font-bold">${s.trim()}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('product-details-page').classList.remove('hidden');
}

// ჰედერის და ბანერის ფუნქციები (რომ ReferenceError არ ამოაგდოს)
function renderHeader(h) {
    const el = document.getElementById('main-header');
    if (el) el.innerHTML = `<div class="p-4 text-white font-bold">${h.name || 'Taroge'}</div>`;
}
function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (el) el.innerHTML = `<div class="w-full h-40 rounded-[30px] overflow-hidden bg-slate-100"><img src="${b.image}" class="w-full h-full object-cover"></div>`;
}

init();
