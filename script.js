const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
const PROMO_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQH2mZB4PnZn6hJJRPgC_Ry0HTt7BvKiNmcNGyx7PVOMHY0rNFqhM4MneVoRI3kT00y6vxMMOoHbipA/pub?output=csv";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 1. პირველ რიგში განვსაზღვროთ დამხმარე ფუნქციები, რომლებსაც init იყენებს

function renderProfile(menu) {
    const el = document.getElementById('profile-page');
    if (!el) return;
    const user = tg.initDataUnsafe?.user || { first_name: "სტუმარი", id: "000000" };
    const photo = user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}`;
    
    el.innerHTML = `
        <div class="flex items-center gap-4 p-6">
            <img src="${photo}" class="w-16 h-16 rounded-full border-4 border-white shadow-lg">
            <div>
                <h2 class="text-lg font-black text-slate-800">${user.first_name}</h2>
                <p class="text-slate-400 text-[10px] font-bold">ID: ${user.id}</p>
            </div>
        </div>
        <div class="px-6 space-y-2">
            ${menu.map(m => `
                <div onclick="switchPage('${m.action}', this)" class="bg-white p-3.5 rounded-[22px] flex items-center justify-between border border-slate-50 active:scale-95 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                            <i class="fa-solid ${m.icon}"></i>
                        </div>
                        <span class="font-bold text-slate-700 text-sm">${m.label}</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i>
                </div>`).join('')}
        </div>`;
}

function hidePreloader() {
    const p = document.getElementById('app-preloader');
    if (p) {
        p.style.opacity = '0';
        setTimeout(() => p.style.display = 'none', 500);
    }
}

// 2. მთავარი ინიციალიზაციის ფუნქცია
async function init() {
    tg.ready();
    tg.expand();
    
    try {
        console.log("მონაცემების წამოღება...");
        const res = await fetch(API_URL, { redirect: 'follow' });
        storeData = await res.json();
        console.log("მონაცემები მიღებულია:", storeData);
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        // აქ ვიძახებთ renderProfile-ს, რომელიც ზემოთ უკვე აღვწერეთ
        if (storeData.profileMenu) renderProfile(storeData.profileMenu);
        
        updateCartBadge();
        hidePreloader();
    } catch (e) {
        console.error("ჩატვირთვის შეცდომა:", e);
        // შეცდომის შემთხვევაშიც კი გავთიშოთ პრელოუდერი, რომ ცარიელი გვერდი მაინც გამოჩნდეს
        hidePreloader();
    }
}

// დანარჩენი ფუნქციები (renderHeader, renderBanner და ა.შ.) ჩაამატე ქვემოთ...
// (გააგრძელე წინა ვერსიის მსგავსად)
