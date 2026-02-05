const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function init() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    try {
        const res = await fetch(API_URL);
        storeData = await res.json();
        
        console.log("Data loaded:", storeData); // დეველოპერებისთვის

        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        if (storeData.latest) renderProducts(storeData.latest.items);
        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) {
        alert("ვერ მოხერხდა მონაცემების წამოღება. შეამოწმეთ ინტერნეტი.");
    }
}


function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    if (!el || !b) return;

    el.style.display = 'flex';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.style.borderRadius = '30px';
    
    // მონაცემები შენი Main_Banner შიტიდან
    el.style.height = (b.height || 180) + "px";           // D სვეტი: B_Height
    el.style.marginTop = (b.marginTop || 20) + "px";      // H სვეტი: B_MarginTop
    el.style.background = b.gradient || "#1e293b";        // L სვეტი: B_Gradient
    
    const tColor = b.titleColor || '#ffffff';             // M სვეტი: B_Title_Color

    el.innerHTML = `
        <div style="z-index: 10; position: relative; padding: 25px; max-width: 65%;">
            <h2 style="
                font-size: ${b.titleSize || 24}px; 
                color: ${tColor}; 
                font-weight: 800;
                line-height: 1.1;
                margin: 0;
            ">
                ${b.title || ''}
            </h2>
            <p style="
                font-size: ${b.subSize || 12}px; 
                color: ${tColor}; 
                opacity: 0.8; 
                margin-top: 8px;
                font-weight: 600;
            ">
                ${b.subtitle || ''}
            </p>
            ${b.btnText ? `
                <button style="
                    margin-top: 15px;
                    padding: 10px 22px;
                    background: ${tColor};
                    color: ${b.gradient && b.gradient.includes('#ffffff') ? '#000' : '#fff'};
                    filter: invert(1);
                    border-radius: 20px;
                    font-weight: 900;
                    font-size: 10px;
                    text-transform: uppercase;
                    border: none;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                ">
                    ${b.btnText}
                </button>
            ` : ''}
        </div>
        <img src="${b.image}" style="
            position: absolute;
            right: -15px;
            bottom: -10px;
            width: 55%;
            transform: rotate(-15deg);
            pointer-events: none;
            z-index: 5;
            filter: drop-shadow(0 15px 25px rgba(0,0,0,0.2));
        ">
    `;
}

function renderBanner(b) {
    const el = document.getElementById('hero-banner');
    
    // M2 უჯრა - თუ სტატუსი არ არის active, ბანერი ქრება
    if (b.status !== 'active') {
        el.style.display = 'none';
        return;
    }

    el.style.display = 'flex';
    
    // სტილები შიტიდან
    el.style.height = (b.height || 180) + "px";           // D სვეტი (B_Height)
    el.style.marginTop = (b.marginTop || 20) + "px";      // H სვეტი (B_MarginTop)
    el.style.background = b.gradient || "#1e293b";        // L სვეტი (B_Gradient)
    
    // შიგთავსის აწყობა
    el.innerHTML = `
        <div class="banner-content" style="z-index: 10; position: relative;">
            <h2 style="
                font-size: ${b.titleSize || 24}px; 
                color: ${b.titleColor || '#ffffff'}; 
                font-weight: 800;
                line-height: 1.1;
            ">
                ${b.title}
            </h2>
            <p style="
                font-size: ${b.subSize || 12}px; 
                color: ${b.titleColor || '#ffffff'}; 
                opacity: 0.8; 
                margin-top: 8px;
                font-weight: 600;
            ">
                ${b.subtitle || ''}
            </p>
            ${b.btnText ? `
                <button class="mt-4 px-6 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase shadow-lg">
                    ${b.btnText}
                </button>
            ` : ''}
        </div>
        <img src="${b.image}" class="banner-img" style="pointer-events: none;">
    `;
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = items.map(p => {
        // შენი სკრიპტიდან მოდის 'images' და არა 'Image_URLs'
        const img = p.images ? p.images.split(',')[0].trim() : "";
        return `
            <div onclick="showDetails('${p.id}')" class="bg-white p-4 rounded-[25px] border border-slate-100 shadow-sm active:scale-95 transition-all">
                <img src="${img}" class="h-24 mx-auto object-contain">
                <h4 class="font-bold text-[11px] mt-3 truncate text-slate-500">${p.name}</h4>
                <p class="text-blue-600 font-black mt-1">${p.price}₾</p>
            </div>
        `;
    }).join('');
}

function showDetails(id) {
    const p = storeData.productDetails.find(d => String(d.id) === String(id));
    if(!p) return;

    const images = p.fullImages ? p.fullImages.split(',') : [p.images];
    const sizes = p.sizes ? String(p.sizes).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="bg-slate-50 rounded-[30px] p-6 mt-2">
            <img src="${images[0].trim()}" class="w-full h-56 object-contain">
        </div>
        <h1 class="text-2xl font-black mt-6">${p.name}</h1>
        <p class="text-2xl font-black text-blue-600 mt-1">${p.price}₾</p>
        <p class="mt-4 text-slate-500 text-sm leading-relaxed">${p.description || ''}</p>
        
        <div class="mt-6">
            <p class="text-[10px] font-black text-slate-400 uppercase mb-3">აირჩიეთ ზომა</p>
            <div class="flex gap-2 overflow-x-auto pb-2">
                ${sizes.map(s => `<button onclick="selectSize(this)" class="option-btn">${s.trim()}</button>`).join('')}
            </div>
        </div>

        <button onclick="addToCart('${p.id}')" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black mt-8 shadow-lg">კალათაში დამატება</button>
    `;
    document.getElementById('product-details-page').classList.remove('hidden');
}

function selectSize(btn) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function addToCart(id) {
    const sizeBtn = document.querySelector('.option-btn.selected');
    if(!sizeBtn) return alert("გთხოვთ აირჩიოთ ზომა!");
    
    const p = storeData.productDetails.find(d => String(d.id) === String(id));
    cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        size: sizeBtn.innerText,
        img: p.images.split(',')[0].trim()
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    document.getElementById('product-details-page').classList.add('hidden');
    switchPage('cart');
}

function renderNavigation(items) {
    const nav = document.getElementById('bottom-nav');
    nav.innerHTML = items.map(i => `
        <div onclick="switchPage('${i.action}')" class="nav-item">
            <i class="fa-solid ${i.icon}"></i>
            <span>${i.name}</span>
        </div>
    `).join('');
}

function switchPage(page) {
    ['home-page', 'cart-page', 'checkout-page'].forEach(p => document.getElementById(p).classList.add('hidden'));
    document.getElementById(page + '-page').classList.remove('hidden');
    if(page === 'cart') renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if(cart.length === 0) {
        container.innerHTML = "<p class='text-center py-20 text-slate-400 font-bold'>კალათა ცარიელია</p>";
        document.getElementById('cart-summary').classList.add('hidden');
        return;
    }
    document.getElementById('cart-summary').classList.remove('hidden');
    container.innerHTML = cart.map((item, idx) => `
        <div class="bg-white p-4 rounded-3xl flex items-center gap-4 border border-slate-50">
            <img src="${item.img}" class="w-16 h-16 object-contain">
            <div class="flex-1">
                <h4 class="font-bold text-sm">${item.name}</h4>
                <p class="text-[10px] text-slate-400 uppercase font-bold">${item.size} • ${item.price}₾</p>
            </div>
            <button onclick="removeFromCart(${idx})" class="text-red-400 p-2"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, i) => sum + parseFloat(i.price), 0);
    document.getElementById('cart-total-price').innerText = total + "₾";
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

async function confirmFinalOrder() {
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const addr = document.getElementById('order-address').value;

    if(!name || !phone || !addr) return alert("შეავსეთ ყველა ველი");

    // შეკვეთის გაგზავნა შენს Google Script-ში
    const orderData = {
        action: "placeOrder",
        customerName: name,
        phone: phone,
        address: addr,
        items: cart.map(i => `${i.name} (${i.size})`).join(', '),
        total: document.getElementById('cart-total-price').innerText,
        userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "unknown"
    };

    const params = new URLSearchParams(orderData);
    fetch(`${API_URL}?${params.toString()}`, { mode: 'no-cors' });

    alert("შეკვეთა წარმატებით გაიგზავნა!");
    cart = [];
    localStorage.removeItem('cart');
    switchPage('home');
}

function closeProductDetails() {
    document.getElementById('product-details-page').classList.add('hidden');
}

init();
