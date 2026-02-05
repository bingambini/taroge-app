const API_URL = "https://script.google.com/macros/s/AKfycbwuUoh7dSasq18fEkJtFFq948F2NONk-6GWoUCCNDrnNpAwWUSn7Pq9xVShBeYAUOVBUw/exec";
let storeData = null;
let cart = [];
let selectedSize = null;
let selectedColor = null;

async function init() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const response = await fetch(API_URL);
        storeData = await response.json();
        
        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) { console.error("Error:", e); }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    grid.innerHTML = items.map(p => {
        let img = p.images ? p.images.toString().split(',')[0].trim() : "https://placehold.jp/150x150.png";
        
        // Badge ლოგიკა Status (F) სვეტის მიხედვით
        let badgeHtml = '';
        if (p.status) {
            const s = p.status.toString().toLowerCase().trim();
            let color = "";
            if (s === 'sale') color = "#ef4444"; // წითელი
            if (s === 'new') color = "#22c55e";  // მწვანე
            if (s === 'hot') color = "#f59e0b";  // ნარინჯისფერი
            
            if (color) {
                badgeHtml = `<div style="position: absolute; top: 15px; left: 15px; background: ${color}; color: white; padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">${p.status}</div>`;
            }
        }

        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[35px] shadow-sm active:scale-95 transition-all flex flex-col items-center text-center relative overflow-hidden">
                ${badgeHtml}
                <div class="h-32 w-full flex items-center justify-center mb-4">
                    <img src="${img}" class="max-h-full max-w-full object-contain">
                </div>
                <h4 class="font-bold text-slate-800 text-[14px] leading-tight h-10 overflow-hidden line-clamp-2">${p.name}</h4>
                <div class="mt-4">
                    <span class="text-[#3b82f6] font-black text-xl">${p.price}₾</span>
                </div>
            </div>
        `;
    }).join('');
}

function showDetails(productId) {
    const product = storeData.productDetails.find(p => p.id.toString() === productId.toString());
    if (!product) return;

    selectedSize = null;
    selectedColor = null;
    const detailsPage = document.getElementById('details-page');
    
    const sizes = product.sizes ? product.sizes.toString().split(',') : [];
    const colors = product.colors ? product.colors.toString().split(',') : [];

    detailsPage.innerHTML = `
        <div style="padding: 20px; padding-bottom: 120px; background: white; min-height: 100vh;">
            <button onclick="switchPage('main')" style="background: #f1f5f9; border: none; width: 45px; height: 45px; border-radius: 15px; margin-bottom: 20px;"><i class="fa-solid fa-arrow-left"></i></button>
            
            <div style="width: 100%; height: 300px; display: flex; align-items: center; justify-content: center;">
                <img src="${product.images.split(',')[0]}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
            </div>

            <div style="margin-top: 30px;">
                <h1 style="font-size: 24px; font-weight: 900; color: #0f172a;">${product.name}</h1>
                <p style="font-size: 26px; font-weight: 900; color: #2563eb; margin-top: 5px;">${product.price}₾</p>
                
                ${sizes.length > 0 ? `
                    <div style="margin-top: 25px;">
                        <p style="font-weight: 800; font-size: 14px; margin-bottom: 10px;">აირჩიეთ ზომა</p>
                        <div id="size-opts" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${sizes.map(s => `<button onclick="selOpt(this, 'size', '${s.trim()}')" style="padding: 12px 20px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 15px; font-weight: 700; transition: all 0.2s;">${s.trim()}</button>`).join('')}
                        </div>
                    </div>` : ''}

                ${colors.length > 0 ? `
                    <div style="margin-top: 25px;">
                        <p style="font-weight: 800; font-size: 14px; margin-bottom: 10px;">აირჩიეთ ფერი</p>
                        <div id="color-opts" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${colors.map(c => `<button onclick="selOpt(this, 'color', '${c.trim()}')" style="padding: 12px 20px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 15px; font-weight: 700; transition: all 0.2s;">${c.trim()}</button>`).join('')}
                        </div>
                    </div>` : ''}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                    <p style="font-weight: 800; font-size: 14px; margin-bottom: 5px;">აღწერა</p>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">${product.description || 'აღწერა არ არის.'}</p>
                </div>
            </div>

            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 25px; border-top: 1px solid #f1f5f9; z-index: 10000;">
                <button onclick="addToCart('${product.id}')" id="add-btn" style="width: 100%; background: #0f172a; color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 800; font-size: 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">კალათაში დამატება</button>
            </div>
        </div>
    `;
    switchPage('details');
}

function selOpt(btn, type, val) {
    const cont = type === 'size' ? 'size-opts' : 'color-opts';
    document.querySelectorAll(`#${cont} button`).forEach(b => { 
        b.style.background = '#f8fafc'; 
        b.style.color = '#000';
        b.style.borderColor = '#f1f5f9';
    });
    btn.style.background = '#0f172a'; 
    btn.style.color = '#fff';
    btn.style.borderColor = '#0f172a';
    if(type === 'size') selectedSize = val; else selectedColor = val;
}

function addToCart(id) {
    const product = storeData.productDetails.find(p => p.id.toString() === id.toString());
    
    // ვალიდაცია: თუ ზომა ან ფერი არაა არჩეული
    if ((product.sizes && !selectedSize) || (product.colors && !selectedColor)) {
        window.Telegram?.WebApp?.showAlert("გთხოვთ, აირჩიოთ ზომა და ფერი!");
        return;
    }

    cart.push({ ...product, selectedSize, selectedColor });
    
    if (window.Telegram?.WebApp) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    
    const btn = document.getElementById('add-btn');
    btn.innerHTML = "დამატებულია! ✓"; 
    btn.style.background = "#22c55e";
    setTimeout(() => { 
        btn.innerHTML = "კალათაში დამატება"; 
        btn.style.background = "#0f172a"; 
    }, 1500);
}

// სხვა დამხმარე ფუნქციები (renderHeader, renderBanner, renderNavigation, switchPage)
function renderHeader(h) { 
  const el = document.getElementById('main-header');
  if (!el || h.status !== 'active') return;
  // ... შენი არსებული ჰედერის კოდი
}
function renderBanner(b) { 
  const el = document.getElementById('hero-banner');
  if (!el) return;
  // ... შენი არსებული ბანერის კოდი
}
function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="flex flex-col items-center text-slate-400 active:text-blue-600">
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

init();
