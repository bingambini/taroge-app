const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
let storeData = null;

async function init() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    
    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        
        // 1. ჰედერი
        if (storeData.header) {
            const h = storeData.header;
            const el = document.getElementById('main-header');
            if (el && h.status === 'active') {
                el.style.display = 'block';
                el.style.background = h.bg || '#ffffff';
                el.innerHTML = `
                    <div class="flex items-center justify-between px-5 h-full" style="color: ${h.textColor}; height: ${h.height || 70}px;">
                        ${h.logo ? `<img src="${h.logo}" style="height: ${h.logoSize || 40}px;">` : '<div></div>'}
                        <h1 class="font-black text-lg">${h.name || ''}</h1>
                        <i class="fa-solid fa-cart-shopping text-xl"></i>
                    </div>`;
            }
        }

        // 2. ბანერი
        if (storeData.banner) {
            const b = storeData.banner;
            const el = document.getElementById('hero-banner');
            if (el) {
                el.innerHTML = `
                    <div class="relative w-full overflow-hidden rounded-[35px] mt-4 shadow-lg" style="height: ${b.height || 200}px;">
                        <img src="${b.image}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 p-6 flex flex-col justify-center bg-black/30">
                            <h2 style="color: ${b.titleColor}; font-size: ${b.titleSize}px;" class="font-black leading-tight">${b.title}</h2>
                            <button class="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold text-sm w-fit">${b.btnText || 'ნახვა'}</button>
                        </div>
                    </div>`;
            }
        }

        // 3. პროდუქტები
        if (storeData.latest) {
            const grid = document.getElementById('product-grid');
            if (grid) {
                grid.innerHTML = storeData.latest.items.map(p => `
                    <div class="bg-white p-4 rounded-[30px] shadow-sm flex flex-col items-center border border-slate-50">
                        <img src="${p.images.split(',')[0]}" class="h-32 object-contain mb-4">
                        <h4 class="font-bold text-slate-800 text-[11px] text-center">${p.name}</h4>
                        <span class="text-blue-600 font-black text-lg mt-2">${p.price}₾</span>
                    </div>`).join('');
            }
        }

        // 4. ნავიგაცია
        if (storeData.navigation) {
            const nav = document.getElementById('bottom-nav');
            if (nav) {
                nav.innerHTML = storeData.navigation.map(i => `
                    <div class="flex flex-col items-center flex-1 text-slate-400 py-2">
                        <i class="fa-solid ${i.icon} text-xl"></i>
                        <span class="text-[10px] font-bold">${i.name}</span>
                    </div>`).join('');
            }
        }

        // პრელოადერის გათიშვა
        document.getElementById('app-preloader').style.display = 'none';

    } catch (e) {
        console.error("Error:", e);
        // თუ შეცდომაა, მაინც გავთიშოთ პრელოადერი რომ თეთრი ეკრანი არ დარჩეს
        document.getElementById('app-preloader').style.innerHTML = "ჩატვირთვის შეცდომა";
    }
}

init();
