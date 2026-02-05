const API_URL = "https://script.google.com/macros/s/AKfycbwogedzKe0goXS8gB0woEFW9VmAwAUATsRv-tKDwEjaevxGeZUq5SElNZa9aTwktZPvxw/exec";
let storeData = null;
let cart = [];

async function init() {
    console.log("App starting...");
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        storeData = await response.json();
        console.log("Data received:", storeData);

        // მონაცემების ასახვა
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        // პრელოადერის გათიშვა
        const preloader = document.getElementById('app-preloader');
        if (preloader) preloader.style.display = 'none';

    } catch (e) {
        console.error("Critical Error:", e);
        document.getElementById('app-preloader').innerHTML = `
            <div class="text-center p-10">
                <p class="text-red-500 font-bold">ვერ მოხერხდა მონაცემების ჩატვირთვა</p>
                <button onclick="location.reload()" class="mt-4 bg-slate-800 text-white px-6 py-2 rounded-xl">თავიდან ცდა</button>
            </div>
        `;
    }
}


function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;

    // ბანერის მთავარი კონტეინერის "ჩაკეტილი" სტილები
    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '30px',
        padding: '25px',
        margin: '0 24px', // გვერდებიდან დაშორება
        height: (b.height || 180) + 'px',
        marginTop: (b.marginTop || 20) + 'px',
        background: b.gradient || '#1e293b',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxSizing: 'border-box',
        isolation: 'isolate'
    });

    const textColor = b.titleColor || '#ffffff';

    el.innerHTML = `
        <div style="z-index: 10; position: relative; width: 60%; pointer-events: none;">
            <h2 style="
                margin: 0;
                font-weight: 900;
                line-height: 1.1;
                font-size: ${b.titleSize || 22}px;
                color: ${textColor};
            ">
                ${b.title || ''}
            </h2>
            <p style="
                margin-top: 8px;
                font-weight: 600;
                opacity: 0.85;
                font-size: ${b.subSize || 12}px;
                color: ${textColor};
            ">
                ${b.subtitle || ''}
            </p>
            
            ${b.btnText ? `
                <button style="
                    margin-top: 15px;
                    padding: 8px 20px;
                    background: ${textColor};
                    color: ${b.gradient?.includes('#') ? b.gradient.split(' ')[0] : '#000'};
                    filter: invert(1);
                    border: none;
                    border-radius: 15px;
                    font-weight: 900;
                    font-size: 10px;
                    text-transform: uppercase;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                ">${b.btnText}</button>
            ` : ''}
        </div>

        ${b.image ? `
            <img src="${b.image}" style="
                position: absolute;
                right: -15px;
                bottom: -10px;
                width: 55%;
                height: auto;
                object-fit: contain;
                transform: rotate(-15deg);
                z-index: 5;
                filter: drop-shadow(0 15px 15px rgba(0,0,0,0.3));
                pointer-events: none;
            ">
        ` : ''}
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = items.map(p => {
        // სურათების დამუშავება
        let img = "https://via.placeholder.com/150";
        if (p.images) {
            const imgArray = p.images.split(',');
            img = imgArray[0].trim();
        }

        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[30px] border border-slate-100 shadow-sm active:scale-95 transition-all flex flex-col items-center text-center">
                <div class="h-32 w-full flex items-center justify-center">
                    <img src="${img}" class="max-h-full max-w-full object-contain drop-shadow-md">
                </div>
                <h4 class="font-bold text-slate-700 text-sm mt-3 leading-tight h-10 overflow-hidden line-clamp-2">${p.name}</h4>
                <div class="flex justify-between items-center w-full mt-3">
                    <span class="text-blue-600 font-black text-lg">${p.price}₾</span>
                    <button class="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-900 active:bg-blue-600 active:text-white transition-colors">
                        <i class="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.className = "fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center py-4 px-6 z-[5000]";
    
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center text-slate-400 active:text-blue-600 transition-colors cursor-pointer">
            <i class="fa-solid ${i.icon} text-xl"></i>
            <span class="text-[10px] font-bold mt-1">${i.name}</span>
        </div>
    `).join('');
}

function switchPage(pageId) {
    document.querySelectorAll('.page-fade').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId + '-page');
    if (target) target.classList.remove('hidden');
    
    // ნავიგაციის ფერების შეცვლა
    console.log("Switched to:", pageId);
}

// აპლიკაციის გაშვება
init();
