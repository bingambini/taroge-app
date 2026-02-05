const API_URL = "https://script.google.com/macros/s/AKfycbwogedzKe0goXS8gB0woEFW9VmAwAUATsRv-tKDwEjaevxGeZUq5SElNZa9aTwktZPvxw/exec";
let storeData = null;
let cart = [];

async function init() {
    console.log("App starting...");
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.isVersionAtLeast('6.1')) {
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
        }
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        storeData = await response.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        const preloader = document.getElementById('app-preloader');
        if (preloader) preloader.style.display = 'none';
    } catch (e) {
        console.error("Critical Error:", e);
    }
}

function renderHeader(h) {
    const el = document.getElementById('main-header');
    const content = document.getElementById('app-content');
    if (!el || h.status !== 'active') return;

    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: '0', left: '0', right: '0',
        zIndex: '10000',
        backgroundColor: h.bg || "#ffffff",
        height: (h.height || 70) + "px",
        padding: '0 24px',
        boxSizing: 'border-box'
    });

    if (content) content.style.paddingTop = el.style.height;

    const isSplit = h.layout === 'split';
    el.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%; height: 100%; position: relative;">
            <img src="${h.logo}" style="width: ${h.logoSize || 40}px; height: ${h.logoSize || 40}px; border-radius: ${h.logoRadius || 50}%; object-fit: cover;">
            <span style="font-weight: 900; font-size: 18px; position: ${isSplit ? 'absolute' : 'relative'}; left: ${isSplit ? '50%' : '12px'}; transform: ${isSplit ? 'translateX(-50%)' : 'none'}; white-space: nowrap; color: ${h.textColor || '#000'}">
                ${h.name || ''}
            </span>
        </div>
    `;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el) return;

    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        borderRadius: '35px',
        margin: '50px auto 20px auto', 
        width: 'calc(100% - 48px)',
        height: (b.height || 180) + 'px',
        background: b.gradient || '#1e293b',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        boxSizing: 'border-box'
    });

    const textColor = b.titleColor || '#ffffff';

    el.innerHTML = `
        <div style="width: 55%; padding-left: 20px; z-index: 2;">
            <h2 style="margin: 0; font-weight: 900; font-size: ${b.titleSize || 20}px; color: ${textColor}; text-transform: uppercase;">${b.title || ''}</h2>
            <p style="margin-top: 5px; font-weight: 600; opacity: 0.8; font-size: ${b.subSize || 11}px; color: ${textColor};">${b.subtitle || ''}</p>
            <button onclick="switchPage('${b.actionValue}')" style="margin-top: 15px; padding: 10px 20px; background: #56ab81; color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 12px;">${b.btnText || 'ყიდვა'}</button>
        </div>
        <div style="position: absolute; right: 10px; width: 45%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <img src="${b.image}" style="width: 100%; height: auto; object-fit: contain; transform: rotate(-10deg) translateY(-10%);">
        </div>
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; margin-top:20px;">პროდუქტები ვერ მოიძებნა</p>';
        return;
    }

    grid.innerHTML = items.map(p => {
        // Apps Script-ის მიხედვით ვიყენებთ პატარა ასოებს: id, name, price, images
        let img = "https://via.placeholder.com/150";
        if (p.images) {
            img = p.images.split(',')[0].trim();
        }

        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[35px] shadow-sm active:scale-95 transition-all flex flex-col items-center text-center">
                <div class="h-32 w-full flex items-center justify-center mb-4">
                    <img src="${img}" class="max-h-full max-w-full object-contain">
                </div>
                <h4 class="font-bold text-slate-800 text-[14px] leading-tight h-10 overflow-hidden line-clamp-2">${p.name}</h4>
                <div class="flex justify-between items-center w-full mt-4">
                    <span class="text-[#3b82f6] font-black text-xl">${p.price}₾</span>
                    <button class="bg-[#f1f5f9] w-10 h-10 rounded-full flex items-center justify-center text-slate-900">
                        <i class="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showDetails(productId) {
    // Apps Script-ში გაქვს ცალკე ობიექტი 'productDetails' მეტი ინფორმაციით
    const product = storeData.productDetails.find(p => p.id.toString() === productId.toString());
    if (!product) return;

    const detailsPage = document.getElementById('details-page');
    if (!detailsPage) return;

    // ვიყენებთ Apps Script-ის ველებს: description, sizes, images
    let img = product.images ? product.images.split(',')[0].trim() : "https://via.placeholder.com/300";
    const sizes = product.sizes ? product.sizes.toString().split(',') : [];

    detailsPage.innerHTML = `
        <div style="padding: 20px; padding-bottom: 120px; background: #ffffff; min-height: 100vh;">
            <button onclick="switchPage('main')" style="background: #f1f5f9; border: none; width: 45px; height: 45px; border-radius: 15px; margin-bottom: 20px;">
                <i class="fa-solid fa-arrow-left"></i>
            </button>
            
            <div style="width: 100%; height: 300px; display: flex; align-items: center; justify-content: center;">
                <img src="${img}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
            </div>

            <div style="margin-top: 30px;">
                <h1 style="font-size: 26px; font-weight: 900; color: #0f172a;">${product.name}</h1>
                <p style="font-size: 28px; font-weight: 900; color: #2563eb; margin-top: 10px;">${product.price}₾</p>
                
                ${sizes.length > 0 ? `
                    <div style="margin-top: 20px;">
                        <p style="font-weight: 800; font-size: 14px; margin-bottom: 10px;">ხელმისაწვდომი ზომები</p>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${sizes.map(s => `<span style="padding: 8px 15px; background: #f8fafc; border-radius: 10px; font-weight: 700; font-size: 13px; border: 1px solid #e2e8f0;">${s.trim()}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                    <p style="font-weight: 800; font-size: 14px; margin-bottom: 10px;">აღწერა</p>
                    <p style="color: #64748b; font-size: 15px; line-height: 1.6;">${product.description || 'აღწერა არ არის მითითებული.'}</p>
                </div>
            </div>

            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 25px; border-top: 1px solid #f1f5f9; z-index: 10000;">
                <button onclick="addToCart('${product.id}')" style="width: 100%; background: #0f172a; color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                    კალათაში დამატება
                </button>
            </div>
        </div>
    `;
    switchPage('details');
}
function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.className = "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center py-4 px-6 z-[5000]";
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center text-slate-400 active:text-blue-600 transition-colors">
            <i class="fa-solid ${i.icon} text-xl"></i>
            <span class="text-[10px] font-bold mt-1">${i.name}</span>
        </div>
    `).join('');
}

function switchPage(pageId) {
    document.querySelectorAll('.page-fade').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId + '-page');
    if (target) target.classList.remove('hidden');
}

function addToCart(id) {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

init();
