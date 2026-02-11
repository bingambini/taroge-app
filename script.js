// 1. კონფიგურაცია და სახელმწიფო
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycby2nOeg9xQ19-onErrsvEjQFTZmZTLeUOPatk0XdrlRw870tGBQuj24EbY4BI-SmRU/exec' 
};

let state = {
    products: [],
    productDetails: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    currentCategory: 'all',
    headerConfig: null
};

// 2. ინიციალიზაცია
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    await loadData();
    updateCartBadge();
}

async function loadData() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        state.products = data.products;
        state.productDetails = data.productDetails;
        state.headerConfig = data.headerConfig;
        
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
