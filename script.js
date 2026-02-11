// ==========================================
// 1. კონფიგურაცია და სახელმწიფო
// ==========================================
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycby2nOeg9xQ19-onErrsvEjQFTZmZTLeUOPatk0XdrlRw870tGBQuj24EbY4BI-SmRU/exec' 
};

let state = {
    products: [],
    productDetails: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    currentCategory: 'all',
    headerConfig: null,
    design: null,
    orders: []
};

// ==========================================
// 2. ინიციალიზაცია და ჩატვირთვა
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    console.log("App initializing...");
    await loadData();
    updateCartBadge();
    setupEventListeners();
}

async function loadData() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        console.log("Data received:", data);
        
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        state.headerConfig = data.heroConfig || data.headerConfig;
        state.design = data.design || {};
        
        if (state.headerConfig) {
            applyHeroDesign(state.headerConfig);
            window.lastHeroConfig = state.headerConfig;
        }
        
        renderProducts();
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function applyHeroDesign(config) {
    const hero = document.getElementById('hero');
    if (!hero) return;
    
    hero.style.display = 'block';
    hero.innerHTML = `
        <div class="hero-card" style="background: ${config.bg_color || '#000'}; color: ${config.text_color || '#fff'}; border-radius: 24px; padding: 30px; margin: 10px; position: relative; overflow: hidden; min-height: 200px; display: flex; align-items: center;">
            <div class="hero-content" style="position: relative; z-index: 2; width: 60%;">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 8px; line-height: 1.2;">${config.title_ge || ''}</h1>
                <p style="font-size: 15px; opacity: 0.9; margin-bottom: 20px;">${config.subtitle_ge || ''}</p>
                <button onclick="scrollToProducts()" class="hero-btn" style="background: ${config.text_color || '#fff'}; color: ${config.bg_color || '#000'}; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform 0.2s;">
                    ${config.button_text_ge || '👇 ნახვა'}
                </button>
            </div>
            <div class="hero-image-wrapper" style="position: absolute; right: -20px; bottom: -10px; height: 110%; width: 50%; z-index: 1;">
                <img src="${config.image_url}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'">
            </div>
        </div>
    `;
}

function scrollToProducts() {
    const section = document.getElementById('content-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 3. პროდუქტების რენდერი
// ==========================================
function renderProducts(productsToRender = state.products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #86868b;">პროდუქტები ვერ მოიძებნა</div>';
        return;
    }

    productsToRender.forEach(product => {
        const hasDiscount = product.old_price && parseFloat(product.old_price) > parseFloat(product.final_price);
        const discountPercent = hasDiscount ? Math.round((1 - product.final_price / product.old_price) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animation = 'fadeIn 0.5s ease forwards';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; background: #f5f5f7; border-radius: 18px; overflow: hidden; aspect-ratio: 1/1;">
                <img src="${product.photo_url_1}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;">
                ${hasDiscount ? `<span class="discount-badge" style="position: absolute; top: 10px; left: 10px; background: #ff3b30; color: white; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 700;">-${discountPercent}%</span>` : ''}
            </div>
            <div class="product-info" style="padding: 12px 5px;">
                <p class="brand-name" style="color: #0071e3; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">${product.brand || ''}</p>
                <h3 class="product-title" style="font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${product.name_ge || ''}</h3>
                <div class="price-container" style="display: flex; align-items: center; gap: 8px;">
                    <span class="current-price" style="font-size: 16px; font-weight: 700; color: #1d1d1f;">${product.final_price} ₾</span>
                    ${hasDiscount ? `<span class="old-price" style="font-size: 13px; color: #86868b; text-decoration: line-through;">${product.old_price} ₾</span>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function initializeApp() {
    await loadData();
    updateCartBadge();
}

async function loadData() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        
        // მონაცემების მინიჭება სკრიპტიდან წამოსული სახელების მიხედვით
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        
        // შენს სკრიპტში ბანერის მონაცემებს ქვია "heroConfig"
        state.headerConfig = data.heroConfig || data.headerConfig; 
        
        if (state.headerConfig) {
            applyHeroDesign(state.headerConfig);
            window.lastHeroConfig = state.headerConfig;
        }
        
        renderProducts();
    } catch (error) {
        console.error("Error loading data:", error);
        // აქ შეგიძლია დაამატო alert, რომ დავინახოთ თუ fetch-ი ჩავარდა
    }
}

function applyHeroDesign(config) {
    const hero = document.getElementById('hero');
    if (!hero) return;
    hero.style.display = 'block';
    hero.innerHTML = `
        <div class="hero-card" style="background: ${config.bg_color || '#000'}; color: ${config.text_color || '#fff'}; border-radius: 24px; padding: 30px; margin: 10px; position: relative; overflow: hidden; min-height: 200px; display: flex; align-items: center;">
            <div style="position: relative; z-index: 2; width: 60%;">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 8px;">${config.title_ge}</h1>
                <p style="font-size: 15px; opacity: 0.9; margin-bottom: 20px;">${config.subtitle_ge}</p>
                <button onclick="window.scrollTo({top: 500, behavior: 'smooth'})" style="background: ${config.text_color}; color: ${config.bg_color}; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 700; cursor: pointer;">👇 ნახვა</button>
            </div>
            <img src="${config.image_url}" style="position: absolute; right: -20px; bottom: -10px; height: 110%; object-fit: contain; z-index: 1;">
        </div>
    `;
}

function renderProducts(productsToRender = state.products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        const hasDiscount = product.old_price && product.old_price > product.final_price;
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${product.photo_url_1}" loading="lazy">
                ${hasDiscount ? `<span class="discount-badge">-${Math.round((1 - product.final_price/product.old_price)*100)}%</span>` : ''}
            </div>
            <div class="product-info">
                <p class="brand-name">${product.brand}</p>
                <h3 class="product-title">${product.name_ge}</h3>
                <div class="price-container">
                    <span class="current-price">${product.final_price} ₾</span>
                    ${hasDiscount ? `<span class="old-price">${product.old_price} ₾</span>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
function translateColor(color) {
    const colors = {
        'თეთრი': '#ffffff', 'შავი': '#000000', 'წითელი': '#ff3b30', 'ლურჯი': '#007aff',
        'მწვანე': '#34c759', 'ნაცრისფერი': '#8e8e93', 'ყვითელი': '#ffcc00', 'ვარდისფერი': '#ff2d55'
    };
    return colors[color] || color;
}

function openProductDetails(productId) {
    const product = state.products.find(p => p.product_id === productId || p.id === productId);
    if (!product) return;

    const variants = state.productDetails.filter(d => String(d.product_id) === String(productId));
    const uniqueColors = [...new Set(variants.map(v => v.Colors))];

    let selectedColor = null;
    let selectedSize = null;

    const overlay = document.createElement('div');
    overlay.id = 'active-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: flex-end; backdrop-filter: blur(4px);';

    window.updateSizeOptions = function(color) {
        selectedColor = color;
        selectedSize = null;
        document.querySelectorAll('.color-dot-option').forEach(dot => {
            dot.style.transform = dot.dataset.color === color ? 'scale(1.2)' : 'scale(1)';
            dot.style.border = dot.dataset.color === color ? '2px solid #0071e3' : '1px solid #e5e5e7';
        });
        const container = document.getElementById('size-options-container');
        const availableSizes = variants.filter(v => v.Colors === color && parseInt(v.stock_quantity) > 0);
        container.innerHTML = availableSizes.map(v => `
            <div class="size-option" onclick="selectSize(this, '${v.Sizes}')" style="padding: 12px 20px; border-radius: 12px; border: 1px solid #e5e5e7; background: white; font-weight: 600; cursor: pointer;">${v.Sizes}</div>
        `).join('');
        checkSelection();
    };

    window.selectSize = function(el, size) {
        selectedSize = size;
        document.querySelectorAll('.size-option').forEach(opt => { opt.style.background = 'white'; opt.style.color = '#1d1d1f'; });
        el.style.background = '#0071e3'; el.style.color = 'white';
        checkSelection();
    };

    function checkSelection() {
        const btn = document.getElementById('add-to-cart-btn');
        if (selectedColor && selectedSize) {
            btn.disabled = false; btn.style.opacity = '1'; btn.style.background = '#0071e3'; btn.innerText = 'კალათაში დამატება';
            btn.onclick = () => handleAddToCart(product.product_id, selectedColor, selectedSize);
        } else {
            btn.disabled = true; btn.style.opacity = '0.5'; btn.style.background = '#86868b'; btn.innerText = 'აირჩიეთ ფერი და ზომა';
        }
    }

    overlay.innerHTML = `
        <div class="detail-container" style="max-height: 90vh; border-radius: 30px 30px 0 0; background: white; position: fixed; bottom: 0; width: 100%; overflow-y: auto;">
            <div style="padding: 12px 20px 0; display: flex; justify-content: flex-end;"><button onclick="closeProductDetail()" style="background: #f5f5f7; border: none; width: 35px; height: 35px; border-radius: 50%;">✕</button></div>
            <div style="display: flex; justify-content: center; padding: 5px 20px;"><img src="${product.photo_url_1}" style="max-width: 90%; max-height: 220px; object-fit: contain;"></div>
            <div style="padding: 10px 25px 30px;">
                <p style="color: #0071e3; font-size: 12px; font-weight: 800;">${product.brand}</p>
                <h2 style="font-size: 22px; font-weight: 700;">${product.name_ge}</h2>
                <div style="margin: 10px 0;"><span style="font-size: 26px; font-weight: 800; color: #0071e3;">${product.final_price} ₾</span></div>
                <p style="font-size: 14px; font-weight: 700;">ფერი</p>
                <div style="display: flex; gap: 14px; margin-bottom: 15px;">
                    ${uniqueColors.map(c => `<div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" style="width: 32px; height: 32px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer;"></div>`).join('')}
                </div>
                <p style="font-size: 14px; font-weight: 700;">ზომა</p>
                <div id="size-options-container" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;"><p style="color: #86868b; font-size: 13px;">ჯერ აირჩიეთ ფერი...</p></div>
                <button class="main-btn" id="add-to-cart-btn" disabled style="width: 100%; padding: 18px; border-radius: 16px; border: none; background: #86868b; color: white; font-size: 16px; font-weight: 700; margin-top: 15px;">აირჩიეთ ფერი და ზომა</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function closeProductDetail() { 
    document.getElementById('active-overlay')?.remove(); 
    document.body.style.overflow = 'auto';
}

function handleAddToCart(productId, color, size) {
    const productData = state.products.find(p => p.product_id === productId || p.id === productId);
    const existingItem = state.cart.find(item => item.id === productId && item.color === color && item.size === size);
    const finalPrice = productData ? (productData.final_price || productData.price) : 0;

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        state.cart.push({ 
            id: productId, product_id: productId,
            name_ge: productData ? (productData.name_ge || productData.name) : "პროდუქტი", 
            price: finalPrice, color: color, size: size, quantity: 1
        });
    }
    updateCartBadge();
    localStorage.setItem('cart', JSON.stringify(state.cart));
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) { btn.innerText = "დამატებულია! ✓"; btn.style.background = "#4cd964"; }
    setTimeout(closeProductDetail, 800);
}
function updateCartBadge() {
    const badge = document.getElementById('nav-cart-badge');
    if (badge) {
        const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (page === 'categories') {
        showCategoriesHub();
    } else {
        mainContent.innerHTML = `
            <section id="hero" style="display: none;"></section>
            <section id="content-section" class="section">
                <h2 id="new-arrivals-title" class="section-title">ახალი კოლექცია</h2>
                <div id="products-grid" class="products-grid"></div>
            </section>
        `;
        if (page === 'cart') renderCart();
        else if (page === 'profile') renderProfile();
        else {
            const hero = document.getElementById('hero');
            if (hero && window.lastHeroConfig) { 
                hero.style.display = 'block'; 
                applyHeroDesign(window.lastHeroConfig); 
            }
            renderProducts();
        }
    }
    window.scrollTo(0, 0);
}

function renderCart() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '<h2 style="grid-column: 1/-1; margin: 10px 0 15px 5px; font-size: 18px; font-weight: 700;">ჩემი კალათა</h2>';

    if (state.cart.length === 0) {
        grid.innerHTML += `<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><p style="color: #86868b;">კალათა ცარიელია</p></div>`;
        return;
    }

    let totalSum = 0;
    state.cart.forEach((item, index) => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        totalSum += itemTotal;
        const cartItem = document.createElement('div');
        cartItem.style.cssText = 'grid-column: 1/-1; display: flex; align-items: center; gap: 12px; background: white; padding: 12px; border-radius: 18px; margin-bottom: 10px; border: 1px solid #f2f2f7; position: relative;';
        cartItem.innerHTML = `
            <div style="flex-grow: 1;">
                <h4 style="font-size: 13px; font-weight: 600;">${item.name_ge}</h4>
                <p style="font-size: 11px; color: #86868b;">${item.color}, ${item.size}</p>
                <div style="display: flex; align-items: center; gap: 15px; margin-top: 5px;">
                    <span style="font-weight: 700; color: #0071e3;">${itemTotal.toFixed(2)} ₾</span>
                    <div style="display: flex; background: #f5f5f7; border-radius: 8px; padding: 2px 8px; gap: 10px;">
                        <button onclick="changeQuantity(${index}, -1)" style="border:none; background:none; font-size: 16px; color:#0071e3;">−</button>
                        <span style="font-size: 13px; font-weight: 700;">${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)" style="border:none; background:none; font-size: 16px; color:#0071e3;">+</button>
                    </div>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" style="position: absolute; right: 10px; top: 10px; border:none; background:none; color:#d1d1d6;">✕</button>
        `;
        grid.appendChild(cartItem);
    });

    const footer = document.createElement('div');
    footer.style.cssText = 'grid-column: 1/-1; margin-top: 10px; padding: 20px; background: #f5f5f7; border-radius: 20px;';
    footer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span>სულ:</span><strong style="color: #0071e3; font-size: 20px;">${totalSum.toFixed(2)} ₾</strong>
        </div>
        <button onclick="checkout()" style="width: 100%; padding: 16px; border-radius: 14px; background: #000; color: #fff; font-weight: 700; border: none;">შეკვეთა</button>
    `;
    grid.appendChild(footer);
}

function changeQuantity(index, delta) {
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity < 1) state.cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge(); renderCart();
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge(); renderCart();
}

function checkout() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 10px;">
            <h2 style="font-size: 18px; font-weight: 800; margin-bottom: 20px;">შეკვეთის მონაცემები</h2>
            <input type="text" id="order-name" placeholder="სახელი და გვარი" style="width:100%; padding:14px; margin-bottom:12px; border-radius:12px; border:1px solid #e5e5e7;">
            <input type="tel" id="order-phone" placeholder="ტელეფონი" style="width:100%; padding:14px; margin-bottom:12px; border-radius:12px; border:1px solid #e5e5e7;">
            <textarea id="order-address" placeholder="მისამართი" style="width:100%; padding:14px; margin-bottom:20px; border-radius:12px; border:1px solid #e5e5e7; height:80px;"></textarea>
            <button onclick="handleFinalOrder()" id="final-submit-btn" style="width: 100%; padding: 18px; border-radius: 15px; background: #000; color: #fff; font-weight: 700; border: none;">შეკვეთის დასრულება</button>
        </div>
    `;
}

async function handleFinalOrder() {
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    if(!name || !phone || !address) return alert("შეავსეთ მონაცემები");

    const btn = document.getElementById('final-submit-btn');
    btn.disabled = true; btn.innerText = "იგზავნება...";

    const orderData = {
        action: 'addOrder',
        orderId: "#ORD-" + Math.floor(Date.now()/1000),
        customerName: name, phone: phone, address: address,
        items: state.cart.map(i => `${i.name_ge} x${i.quantity}`).join(', '),
        total: state.cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2),
        userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "Web",
        status: "Pending"
    };

    try {
        await fetch(CONFIG.API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) });
        alert("შეკვეთა მიღებულია! 🎉");
        state.cart = []; localStorage.removeItem('cart'); window.location.reload();
    } catch (e) { alert("შეცდომა გაგზავნისას"); btn.disabled = false; }
}

function showCategoriesHub() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="padding: 20px;">
            <h1 style="font-size: 22px; font-weight: 800;">კატალოგი</h1>
            <div style="display: grid; gap: 15px; margin-top: 20px;">
                <div onclick="renderBrandsList()" style="background: #0071e3; color: white; padding: 25px; border-radius: 20px; font-weight: 700;">🏷️ ბრენდები</div>
                <div onclick="alert('მალე!')" style="background: #ff3b30; color: white; padding: 25px; border-radius: 20px; font-weight: 700;">🔥 ფასდაკლებები</div>
            </div>
        </div>
    `;
}

async function renderBrandsList() {
    const uniqueBrands = [...new Set(state.products.map(p => p.brand))];
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="padding: 20px;">
            <button onclick="showCategoriesHub()" style="border:none; background:#f0f0f2; padding:10px 15px; border-radius:10px; margin-bottom:20px;">← უკან</button>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                ${uniqueBrands.map(b => `<div onclick="filterByBrand('${b}')" style="background:white; padding:20px; border-radius:15px; text-align:center; border:1px solid #f2f2f7; font-weight:700;">${b}</div>`).join('')}
            </div>
        </div>
    `;
}

function filterByBrand(brand) {
    const filtered = state.products.filter(p => p.brand === brand);
    handleNavChange('home', document.querySelector('.nav-item'));
    renderProducts(filtered);
}

function renderProfile() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 20px; text-align: center;">
            <img src="https://ui-avatars.com/api/?name=${user?.first_name || 'User'}&background=0071e3&color=fff" style="width:80px; border-radius:50%;">
            <h3 style="margin-top:10px;">${user?.first_name || 'სტუმარი'}</h3>
            <p style="color:#86868b; font-size:12px;">ID: ${user?.id || 'Web-User'}</p>
        </div>
    `;
}
// ==========================================
// 4. პროდუქტის დეტალები (სრული ვერსია)
// ==========================================
function translateColor(color) {
    const colors = {
        'თეთრი': '#ffffff',
        'შავი': '#000000',
        'წითელი': '#ff3b30',
        'ლურჯი': '#007aff',
        'მწვანე': '#34c759',
        'ნაცრისფერი': '#8e8e93',
        'ყვითელი': '#ffcc00',
        'ვარდისფერი': '#ff2d55',
        'ყავისფერი': '#a2845e',
        'იასამნისფერი': '#af52de',
        'ნარინჯისფერი': '#ff9500',
        'ოქროსფერი': '#ffd700',
        'ვერცხლისფერი': '#c0c0c0',
        'კრემისფერი': '#f5f5dc'
    };
    return colors[color] || color;
}

function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id) === String(productId) || String(p.id) === String(productId));
    if (!product) return;

    const variants = state.productDetails.filter(d => String(d.product_id) === String(productId));
    const uniqueColors = [...new Set(variants.map(v => v.Colors))];

    let selectedColor = null;
    let selectedSize = null;

    const overlay = document.createElement('div');
    overlay.id = 'active-overlay';
    overlay.className = 'product-detail-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: flex-end; backdrop-filter: blur(8px); transition: all 0.3s ease;';

    // ზომების განახლების ფუნქცია ფერის მიხედვით
    window.updateSizeOptions = function(color) {
        selectedColor = color;
        selectedSize = null;
        
        // ფერის ღილაკების აქტივაცია
        document.querySelectorAll('.color-dot-option').forEach(dot => {
            if (dot.dataset.color === color) {
                dot.style.transform = 'scale(1.2)';
                dot.style.border = '2px solid #0071e3';
                dot.style.boxShadow = '0 0 10px rgba(0,113,227,0.3)';
            } else {
                dot.style.transform = 'scale(1)';
                dot.style.border = '1px solid #e5e5e7';
                dot.style.boxShadow = 'none';
            }
        });

        const container = document.getElementById('size-options-container');
        const availableSizes = variants.filter(v => v.Colors === color && parseInt(v.stock_quantity) > 0);
        
        if (availableSizes.length > 0) {
            container.innerHTML = availableSizes.map(v => `
                <div class="size-option" onclick="selectSize(this, '${v.Sizes}')" 
                     style="min-width: 50px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1px solid #e5e5e7; background: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    ${v.Sizes}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #ff3b30; font-size: 13px;">მარაგში აღარ არის</p>';
        }
        checkSelection();
    };

    window.selectSize = function(el, size) {
        selectedSize = size;
        document.querySelectorAll('.size-option').forEach(opt => {
            opt.style.background = 'white';
            opt.style.color = '#1d1d1f';
            opt.style.borderColor = '#e5e5e7';
        });
        el.style.background = '#1d1d1f';
        el.style.color = 'white';
        el.style.borderColor = '#1d1d1f';
        checkSelection();
    };

    function checkSelection() {
        const btn = document.getElementById('add-to-cart-btn');
        if (selectedColor && selectedSize) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.background = '#0071e3';
            btn.innerText = 'კალათაში დამატება';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.background = '#86868b';
            btn.innerText = 'აირჩიეთ ფერი და ზომა';
        }
    }

    overlay.innerHTML = `
        <div class="detail-container" style="width: 100%; max-height: 92vh; border-radius: 30px 30px 0 0; background: white; position: relative; overflow-y: auto; animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
            <div class="detail-header" style="position: sticky; top: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10;">
                <span style="font-weight: 700; color: #1d1d1f;">პროდუქტის დეტალები</span>
                <button onclick="closeProductDetail()" style="background: #f5f5f7; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer;">✕</button>
            </div>
            
            <div class="detail-content" style="padding: 0 20px 40px;">
                <div class="detail-image-slider" style="display: flex; justify-content: center; margin-bottom: 25px;">
                    <img src="${product.photo_url_1}" style="max-width: 100%; max-height: 300px; object-fit: contain;">
                </div>

                <div class="detail-info">
                    <p style="color: #0071e3; font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px;">${product.brand}</p>
                    <h2 style="font-size: 24px; font-weight: 700; color: #1d1d1f; line-height: 1.2; margin-bottom: 10px;">${product.name_ge}</h2>
                    
                    <div class="detail-price" style="margin-bottom: 25px;">
                        <span style="font-size: 28px; font-weight: 800; color: #1d1d1f;">${product.final_price} ₾</span>
                        ${product.old_price ? `<span style="font-size: 18px; color: #86868b; text-decoration: line-through; margin-left: 10px;">${product.old_price} ₾</span>` : ''}
                    </div>

                    <div class="selection-section" style="margin-bottom: 20px;">
                        <p style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #1d1d1f;">ფერი</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px;">
                            ${uniqueColors.map(c => `
                                <div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" 
                                     style="width: 35px; height: 35px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer; transition: all 0.2s; position: relative;">
                                </div>
                            `).join('')}
                        </div>

                        <p style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #1d1d1f;">ზომა</p>
                        <div id="size-options-container" style="display: flex; flex-wrap: wrap; gap: 12px; min-height: 45px;">
                            <p style="color: #86868b; font-size: 13px;">გთხოვთ, ჯერ აირჩიოთ ფერი</p>
                        </div>
                    </div>

                    <div class="description-section" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f2f2f7;">
                        <p style="font-size: 15px; font-weight: 700; margin-bottom: 10px;">აღწერა</p>
                        <p style="font-size: 14px; color: #424245; line-height: 1.5;">${product.description_ge || 'ინფორმაცია არ არის ხელმისაწვდომი'}</p>
                    </div>

                    <button class="add-to-cart-large-btn" id="add-to-cart-btn" disabled 
                            style="width: 100%; padding: 20px; border-radius: 18px; border: none; background: #86868b; color: white; font-size: 17px; font-weight: 700; margin-top: 30px; cursor: pointer; transition: all 0.3s;">
                        აირჩიეთ ფერი და ზომა
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function closeProductDetail() {
    const overlay = document.getElementById('active-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.querySelector('.detail-container').style.transform = 'translateY(100%)';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }
}
// ==========================================
// 5. კალათის მართვის ლოგიკა (სრული)
// ==========================================
function handleAddToCart(productId, color, size) {
    const productData = state.products.find(p => String(p.product_id) === String(productId) || String(p.id) === String(productId));
    if (!productData) return;

    // ვამოწმებთ უკვე არის თუ არა ზუსტად ასეთი ნივთი (იგივე ფერი და ზომა) კალათაში
    const existingItemIndex = state.cart.findIndex(item => 
        String(item.product_id) === String(productId) && 
        item.color === color && 
        item.size === size
    );

    if (existingItemIndex > -1) {
        state.cart[existingItemIndex].quantity += 1;
    } else {
        state.cart.push({
            id: Date.now(), // უნიკალური ID კალათისთვის
            product_id: productId,
            name_ge: productData.name_ge,
            brand: productData.brand,
            price: parseFloat(productData.final_price),
            photo: productData.photo_url_1,
            color: color,
            size: size,
            quantity: 1
        });
    }

    // შენახვა და ვიზუალური განახლება
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge();
    
    // ღილაკის ანიმაცია
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
        btn.innerText = "დამატებულია! ✓";
        btn.style.background = "#34c759";
        
        // პატარა Toast შეტყობინება (თუ ფუნქცია გაქვს)
        if (window.showToast) {
            showToast("ნივთი კალათაშია");
        }
    }

    setTimeout(() => {
        closeProductDetail();
    }, 800);
}

function updateCartBadge() {
    const badge = document.getElementById('nav-cart-badge');
    if (!badge) return;
    
    const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = totalQty;
    
    if (totalQty > 0) {
        badge.style.display = 'flex';
        badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    } else {
        badge.style.display = 'none';
    }
}

function renderCart() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    // სათაური კალათისთვის
    grid.innerHTML = `
        <div style="grid-column: 1/-1; margin-bottom: 20px;">
            <h2 style="font-size: 24px; font-weight: 800; color: #1d1d1f;">ჩემი კალათა</h2>
        </div>
    `;

    if (state.cart.length === 0) {
        grid.innerHTML += `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 50px; margin-bottom: 20px;">🛒</div>
                <h3 style="font-size: 18px; color: #1d1d1f; margin-bottom: 10px;">კალათა ცარიელია</h3>
                <p style="color: #86868b; margin-bottom: 25px;">თქვენ ჯერ არ დაგიმატებიათ ნივთები</p>
                <button onclick="handleNavChange('home', document.querySelector('.nav-item'))" 
                        style="padding: 12px 25px; border-radius: 12px; border: none; background: #0071e3; color: white; font-weight: 600;">
                    შოპინგის დაწყება
                </button>
            </div>
        `;
        return;
    }

    let totalSum = 0;
    state.cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalSum += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item-card';
        cartItem.style.cssText = 'grid-column: 1/-1; display: flex; gap: 15px; background: white; padding: 15px; border-radius: 20px; border: 1px solid #f2f2f7; margin-bottom: 12px; position: relative; animation: slideIn 0.4s ease-out;';
        
        cartItem.innerHTML = `
            <div class="cart-item-image" style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; background: #f5f5f7;">
                <img src="${item.photo}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="cart-item-details" style="flex: 1;">
                <h4 style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 4px;">${item.name_ge}</h4>
                <p style="font-size: 12px; color: #86868b; margin-bottom: 8px;">${item.color} / ${item.size}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 800; color: #0071e3;">${itemTotal.toFixed(2)} ₾</span>
                    <div class="quantity-controls" style="display: flex; align-items: center; background: #f5f5f7; border-radius: 10px; padding: 4px 10px; gap: 12px;">
                        <button onclick="changeQuantity(${index}, -1)" style="border:none; background:none; font-size: 18px; color:#0071e3; cursor:pointer;">−</button>
                        <span style="font-size: 14px; font-weight: 700;">${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)" style="border:none; background:none; font-size: 18px; color:#0071e3; cursor:pointer;">+</button>
                    </div>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" style="position: absolute; right: 10px; top: 10px; border:none; background:none; color:#d1d1d6; font-size: 16px; cursor:pointer;">✕</button>
        `;
        grid.appendChild(cartItem);
    });

    // ჯამური თანხის ბლოკი
    const summaryCard = document.createElement('div');
    summaryCard.style.cssText = 'grid-column: 1/-1; margin-top: 15px; padding: 25px; background: #f5f5f7; border-radius: 24px; animation: fadeIn 0.5s ease;';
    summaryCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-size: 16px; color: #1d1d1f; font-weight: 500;">ჯამური თანხა:</span>
            <strong style="color: #1d1d1f; font-size: 24px; font-weight: 800;">${totalSum.toFixed(2)} ₾</strong>
        </div>
        <button onclick="checkout()" style="width: 100%; padding: 18px; border-radius: 16px; background: #000; color: #fff; font-size: 16px; font-weight: 700; border: none; cursor: pointer; transition: transform 0.2s;">
            შეკვეთის გაფორმება
        </button>
    `;
    grid.appendChild(summaryCard);
}

function changeQuantity(index, delta) {
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity < 1) {
        state.cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge();
    renderCart();
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    updateCartBadge();
    renderCart();
}
// ==========================================
// 6. შეკვეთის გაფორმება (Checkout)
// ==========================================
function checkout() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const totalSum = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 10px; animation: fadeIn 0.5s ease;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 25px;">
                <button onclick="renderCart()" style="border:none; background:#f5f5f7; width:35px; height:35px; border-radius:50%; cursor:pointer;">←</button>
                <h2 style="font-size: 22px; font-weight: 800; color: #1d1d1f;">შეკვეთის მონაცემები</h2>
            </div>

            <div class="checkout-form" style="display: flex; flex-direction: column; gap: 15px;">
                <div class="input-group">
                    <label style="display:block; margin-bottom:8px; font-size:13px; font-weight:600; color:#86868b; margin-left:5px;">სახელი და გვარი</label>
                    <input type="text" id="order-name" placeholder="მაგ: გიორგი ბერიძე" 
                           style="width:100%; padding:16px; border-radius:14px; border:1px solid #e5e5e7; background:#fff; font-size:15px; outline:none; transition:border-color 0.2s;">
                </div>

                <div class="input-group">
                    <label style="display:block; margin-bottom:8px; font-size:13px; font-weight:600; color:#86868b; margin-left:5px;">ტელეფონის ნომერი</label>
                    <input type="tel" id="order-phone" placeholder="599 XX XX XX" 
                           style="width:100%; padding:16px; border-radius:14px; border:1px solid #e5e5e7; background:#fff; font-size:15px; outline:none;">
                </div>

                <div class="input-group">
                    <label style="display:block; margin-bottom:8px; font-size:13px; font-weight:600; color:#86868b; margin-left:5px;">სრული მისამართი</label>
                    <textarea id="order-address" placeholder="ქალაქი, ქუჩა, ბინა..." 
                              style="width:100%; padding:16px; border-radius:14px; border:1px solid #e5e5e7; background:#fff; font-size:15px; outline:none; height:100px; resize:none;"></textarea>
                </div>

                <div style="background: #f5f5f7; padding: 20px; border-radius: 20px; margin-top: 10px;">
                    <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 15px;">შეკვეთის რეზიუმე</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #424245;">
                        <span>ნივთების რაოდენობა:</span>
                        <span>${state.cart.reduce((s, i) => s + i.quantity, 0)} ცალი</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 18px; color: #1d1d1f; border-top: 1px solid #e5e5e7; pt-15; margin-top: 10px; padding-top: 10px;">
                        <span>სულ გადასახდელი:</span>
                        <span>${totalSum.toFixed(2)} ₾</span>
                    </div>
                </div>

                <button onclick="handleFinalOrder()" id="final-submit-btn" 
                        style="width: 100%; padding: 20px; border-radius: 18px; background: #0071e3; color: #fff; font-size: 17px; font-weight: 700; border: none; margin-top: 15px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,113,227,0.3);">
                    შეკვეთის დასრულება
                </button>
                <p style="text-align: center; font-size: 11px; color: #86868b; margin-top: 10px;">
                    დაჭერით თქვენ ეთანხმებით მომსახურების პირობებს
                </p>
            </div>
        </div>
    `;
}

async function handleFinalOrder() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();

    if (!name || !phone || !address) {
        alert("გთხოვთ შეავსოთ ყველა აუცილებელი ველი");
        return;
    }

    const btn = document.getElementById('final-submit-btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "იგზავნება...";
    btn.style.background = "#86868b";

    const orderData = {
        action: 'addOrder',
        orderId: "#ORD-" + Math.floor(Date.now() / 1000),
        date: new Date().toLocaleString('ka-GE'),
        customerName: name,
        phone: phone,
        address: address,
        items: state.cart.map(i => `${i.brand} ${i.name_ge} (${i.color}, ${i.size}) x${i.quantity}`).join(', '),
        total: state.cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2),
        userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "Web-User",
        status: "Pending",
        payment_method: "Cash on Delivery"
    };

    try {
        // ვიყენებთ POST მოთხოვნას
        await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors', // მნიშვნელოვანია Google Apps Script-ისთვის
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        // წარმატების შეტყობინება
        const grid = document.getElementById('products-grid');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; animation: popIn 0.5s ease;">
                <div style="font-size: 70px; margin-bottom: 25px;">🎉</div>
                <h2 style="font-size: 24px; font-weight: 800; color: #1d1d1f; margin-bottom: 15px;">შეკვეთა მიღებულია!</h2>
                <p style="color: #424245; margin-bottom: 30px; line-height: 1.5;">თქვენი შეკვეთა ${orderData.orderId} წარმატებით დარეგისტრირდა. ჩვენი მენეჯერი მალე დაგიკავშირდებათ.</p>
                <button onclick="window.location.reload()" 
                        style="padding: 16px 35px; border-radius: 14px; border: none; background: #000; color: #fff; font-weight: 700; cursor: pointer;">
                    მთავარზე დაბრუნება
                </button>
            </div>
        `;

        // კალათის გასუფთავება
        state.cart = [];
        localStorage.removeItem('cart');
        updateCartBadge();

    } catch (e) {
        console.error("Order error:", e);
        alert("შეცდომა შეკვეთის გაგზავნისას. გთხოვთ სცადოთ მოგვიანებით.");
        btn.disabled = false;
        btn.innerText = originalText;
        btn.style.background = "#0071e3";
    }
}

// ==========================================
// 7. ნავიგაცია და გვერდების მართვა
// ==========================================
function handleNavChange(page, element) {
    // აქტიური კლასის შეცვლა ნავიგაციაში
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // კონტენტის გასუფთავება და სტრუქტურის აღდგენა
    if (page === 'categories') {
        showCategoriesHub();
    } else {
        mainContent.innerHTML = `
            <section id="hero" style="display: none;"></section>
            <section id="content-section" class="section">
                <h2 id="new-arrivals-title" class="section-title">ახალი კოლექცია</h2>
                <div id="products-grid" class="products-grid"></div>
            </section>
        `;
        
        if (page === 'cart') {
            renderCart();
        } else if (page === 'profile') {
            renderProfile();
        } else {
            // Home გვერდი
            const hero = document.getElementById('hero');
            if (hero && window.lastHeroConfig) {
                hero.style.display = 'block';
                applyHeroDesign(window.lastHeroConfig);
            }
            renderProducts();
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 8. კატეგორიები და ბრენდები
// ==========================================
function showCategoriesHub() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="padding: 20px; animation: fadeIn 0.4s ease;">
            <h1 style="font-size: 26px; font-weight: 800; color: #1d1d1f; margin-bottom: 25px;">კატალოგი</h1>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div onclick="renderBrandsList()" style="background: linear-gradient(135deg, #0071e3, #00c6ff); color: white; padding: 25px 20px; border-radius: 24px; position: relative; overflow: hidden; cursor: pointer;">
                    <span style="font-size: 18px; font-weight: 700; position: relative; z-index: 2;">🏷️ ბრენდები</span>
                    <div style="position: absolute; right: -10px; bottom: -10px; font-size: 60px; opacity: 0.2;">🏷️</div>
                </div>
                
                <div onclick="filterByDiscount()" style="background: linear-gradient(135deg, #ff3b30, #ff9500); color: white; padding: 25px 20px; border-radius: 24px; position: relative; overflow: hidden; cursor: pointer;">
                    <span style="font-size: 18px; font-weight: 700; position: relative; z-index: 2;">🔥 SALE</span>
                    <div style="position: absolute; right: -10px; bottom: -10px; font-size: 60px; opacity: 0.2;">🔥</div>
                </div>
            </div>

            <div style="margin-top: 30px;">
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 15px;">პოპულარული კატეგორიები</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div onclick="filterByCategory('ფეხსაცმელი')" style="background: white; padding: 18px; border-radius: 16px; border: 1px solid #f2f2f7; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">👟 ფეხსაცმელი</span>
                        <span style="color: #c7c7cc;">→</span>
                    </div>
                    <div onclick="filterByCategory('ტანსაცმელი')" style="background: white; padding: 18px; border-radius: 16px; border: 1px solid #f2f2f7; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">👕 ტანსაცმელი</span>
                        <span style="color: #c7c7cc;">→</span>
                    </div>
                    <div onclick="filterByCategory('აქსესუარები')" style="background: white; padding: 18px; border-radius: 16px; border: 1px solid #f2f2f7; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">👜 აქსესუარები</span>
                        <span style="color: #c7c7cc;">→</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function renderBrandsList() {
    const uniqueBrands = [...new Set(state.products.map(p => p.brand))].filter(Boolean);
    const main = document.getElementById('main-content');
    
    main.innerHTML = `
        <div style="padding: 20px; animation: slideInRight 0.3s ease;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                <button onclick="showCategoriesHub()" style="border:none; background:#f5f5f7; width:35px; height:35px; border-radius:50%;">←</button>
                <h1 style="font-size: 22px; font-weight: 800;">ბრენდები</h1>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                ${uniqueBrands.map(brand => `
                    <div onclick="filterByBrand('${brand}')" 
                         style="background: white; padding: 25px 15px; border-radius: 20px; text-align: center; border: 1px solid #f2f2f7; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        ${brand}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function filterByBrand(brand) {
    const filtered = state.products.filter(p => p.brand === brand);
    handleNavChange('home', document.querySelector('.nav-item'));
    const title = document.getElementById('new-arrivals-title');
    if (title) title.innerText = `ბრენდი: ${brand}`;
    renderProducts(filtered);
}

function filterByCategory(cat) {
    const filtered = state.products.filter(p => p.category === cat);
    handleNavChange('home', document.querySelector('.nav-item'));
    const title = document.getElementById('new-arrivals-title');
    if (title) title.innerText = cat;
    renderProducts(filtered);
}

function filterByDiscount() {
    const filtered = state.products.filter(p => p.old_price && parseFloat(p.old_price) > parseFloat(p.final_price));
    handleNavChange('home', document.querySelector('.nav-item'));
    const title = document.getElementById('new-arrivals-title');
    if (title) title.innerText = "ფასდაკლებები 🔥";
    renderProducts(filtered);
}

// ==========================================
// 9. მომხმარებლის პროფილი
// ==========================================
function renderProfile() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1/-1; animation: fadeIn 0.5s ease;">
            <div style="background: white; padding: 30px 20px; border-radius: 24px; text-align: center; border: 1px solid #f2f2f7; margin-bottom: 20px;">
                <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #0071e3, #00c6ff); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; font-weight: 800; border: 4px solid #fff; box-shadow: 0 5px 15px rgba(0,113,227,0.2);">
                    ${user?.first_name ? user.first_name[0] : 'U'}
                </div>
                <h2 style="font-size: 22px; font-weight: 800; color: #1d1d1f; margin-bottom: 5px;">${user?.first_name || 'სტუმარი'}</h2>
                <p style="color: #86868b; font-size: 14px;">ID: ${user?.id || 'Web-User'}</p>
            </div>

            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 15px; margin-left: 5px;">ჩემი აქტივობა</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="background: white; padding: 20px; border-radius: 18px; border: 1px solid #f2f2f7; display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 24px;">📦</div>
                    <div>
                        <p style="font-weight: 700; font-size: 15px;">შეკვეთების ისტორია</p>
                        <p style="font-size: 12px; color: #86868b;">თქვენ არ გაქვთ აქტიური შეკვეთები</p>
                    </div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 18px; border: 1px solid #f2f2f7; display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 24px;">📍</div>
                    <div>
                        <p style="font-weight: 700; font-size: 15px;">შენახული მისამართები</p>
                        <p style="font-size: 12px; color: #86868b;">მართეთ თქვენი მისამართები</p>
                    </div>
                </div>
                <div onclick="window.Telegram?.WebApp?.close()" style="background: #fff0f0; padding: 20px; border-radius: 18px; display: flex; align-items: center; gap: 15px; cursor: pointer;">
                    <div style="font-size: 24px;">🚪</div>
                    <p style="font-weight: 700; font-size: 15px; color: #ff3b30;">აპლიკაციის დახურვა</p>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 10. მოვლენების მოსმენა (Setup Event Listeners)
// ==========================================
function setupEventListeners() {
    // ძებნის ლოგიკა
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = state.products.filter(p => 
                p.name_ge.toLowerCase().includes(term) || 
                p.brand.toLowerCase().includes(term) ||
                (p.category && p.category.toLowerCase().includes(term))
            );
            
            // თუ ძებნისას Home გვერდზე არ ვართ, გადავიყვანოთ
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav && activeNav.getAttribute('onclick').includes('home')) {
                renderProducts(filtered);
            } else {
                handleNavChange('home', document.querySelector('.nav-item[onclick*="home"]'));
                setTimeout(() => renderProducts(filtered), 100);
            }
        });
    }

    // Telegram WebApp-ის გაფართოება
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.ready();
    }
}

// ==========================================
// 11. დამხმარე ვიზუალური ეფექტები
// ==========================================
window.showToast = function(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        z-index: 2000;
        animation: fadeInOut 2s ease forwards;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
};

// CSS ანიმაციების დამატება დინამიურად
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }
    @keyframes slideInRight {
        from { transform: translateX(30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        70% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        15% { opacity: 1; transform: translate(-50%, 0); }
        85% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
    }
    .product-card:active {
        transform: scale(0.96);
        transition: transform 0.1s;
    }
    .nav-item.active svg {
        color: #0071e3;
        transform: translateY(-3px);
        transition: all 0.3s;
    }
`;
document.head.appendChild(style);

// ==========================================
// 12. შეცდომების მართვა
// ==========================================
window.onerror = function(msg, url, line) {
    console.error("Global error: " + msg + " at " + line);
    // აქ შეგიძლია დაამატო ლოგიკა შეცდომის სერვერზე გასაგზავნად
    return false;
};

console.log("Full script loaded successfully.");
