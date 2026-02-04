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

        // Preloader hide logic
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

// შენი ორიგინალი ფაილის დანარჩენი ფუნქციები (renderBanner, renderProducts და ა.შ.) 
// აქ უნდა გაგრძელდეს ზუსტად იმ თანმიმდევრობით, როგორც შენს ფაილშია.

// იმის გამო რომ ფაილი დიდი იყო, დარწმუნდი რომ script.js-ში ჩაწერე 
// ყველაფერი რაც შენს ფაილში <script> თეგებს შორის ეწერა.

init();
