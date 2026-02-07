const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwRwC5Y4DGCqQD7aXCZ8aYCpJ1cm8AFOwlWkV1VW6yTHn2-ximNdQ1sUO0b-brA8nt33A/exec'
};

let state = {
    products: [],
    productDetails: [],
    design: {},
    cart: []
};

let selectedSize = null;

// 1. დამხმარე ფუნქციები (Loader & UI)
function showLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.remove('loader-hidden'); 
}

function hideLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.add('loader-hidden'); 
}

// 2. ინიციალიზაცია
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    loadData();
});

async function loadData() {
    showLoader();
    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();
        
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        state.design = data.design || {};
        
        if (data.headerConfig) applyHeaderDesign(data.headerConfig);
        if (data.heroConfig) applyHeroDesign(data.heroConfig);

        renderProducts();
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        hideLoader();
    }
}

// 3. დიზაინის მართვა
function applyHeaderDesign(config) {
    if (!config || config.Status !== 'active') return;
    const logoText = document.getElementById('logo');
    if (config.Shop_Name && logoText) logoText.innerText = config.Shop_Name;
    // ... აქ შეიძლება დაემატოს სხვა ვიზუალური პარამეტრებიც
}

function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config) return;

    const imageUrl = config.B_Image || '';
    const glassColor = config.B_Gradient || 'rgba(255, 255, 255, 0.2)';

    heroSection.innerHTML = `
        <div class="hero-wrapper" style="position: relative; width: 100%; margin: ${config.B_Margin_Top || 30}px auto; height: ${config.B_Height || 220}px; display: flex; align-items: center;">
            <div class="glass-base" style="position: absolute; width: 100%; height: 100%; background: ${glassColor}; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.2); z-index: 1;"></div>
            <div class="hero-text" style="position: relative; z-index: 2; padding-left: 25px; width: 55%;">
                <h2 style="color: ${config.B_Title_Color || '#ffffff'}; font-size: ${config.B_Title_Size || 22}px; font-weight: 900; margin-bottom: 5px;">${config.B_Title || ''}</h2>
                <p style="color: #ffffff; opacity: 0.8; margin-bottom: 15px;">${config.B_Subtitle || ''}</p>
                <button onclick="handleHeroAction('${config.B_Action_Type}', '${config.B_Action_Value}')" style="padding: 10px 24px; background: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer;">${config.B_Btn_Text || 'ნახვა'}</button>
            </div>
            ${imageUrl ? `<div style="position: absolute; right: -10px; top: -20px; width: 55%; z-index: 3;"><img src="${imageUrl}" style="width: 100%; transform: rotate(-10deg);"></div>` : ''}
        </div>`;
    heroSection.style.display = 'block';
}

function handleHeroAction(type, value) {
    if (type === 'product') {
        document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
    }
}

// 4. პროდუქტების რენდერი
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(product => {
        if (product.status !== 'active') return;

        const variants = state.productDetails.filter(d => String(d.product_id) === String(product.product_id));
        const uniqueColors = [...new Set(variants.map(v => v.Colors).filter(c => c))];
        const totalStock = variants.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0), 0);
        const isAvailable = totalStock > 0;

        let colorsHTML = uniqueColors.map(color => `<div class="color-dot" style="background: ${color.trim().toLowerCase()}; width:12px; height:12px; border-radius:50%; border:1px solid #ddd;"></div>`).join('');

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            ${product.discount_percent > 0 ? `<span class="badge">-${product.discount_percent}%</span>` : ''}
            <div class="product-image"><img src="${product.photo_url_1}"></div>
            <div class="product-info">
                <div class="stock-status ${isAvailable ? 'in-stock' : 'out-of-stock'}">${isAvailable ? 'მარაგშია' : 'ამოიწურა'}</div>
                <p class="brand">${product.brand}</p>
                <h3 class="name">${product.name_ge}</h3>
                <div style="display: flex; gap: 4px; margin-bottom: 8px;">${colorsHTML}</div>
                <div class="price-value">${product.final_price} ₾</div>
            </div>`;
        grid.appendChild(card);
    });
}

// 5. დეტალური გვერდი (აქ არის მთელი ჯადოქრობა)
function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id) === String(productId));
    const variants = state.productDetails.filter(d => String(d.product_id) === String(productId));
    if (!product) return;

    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');

    const detailOverlay = document.createElement('div');
    detailOverlay.id = 'product-detail-overlay';
    detailOverlay.className = 'detail-overlay';

    const colors = [...new Set(variants.map(v => v.Colors).filter(c => c))];

    detailOverlay.innerHTML = `
        <div class="detail-container">
            <div class="detail-header"><button onclick="closeProductDetail()" class="close-btn">✕</button></div>
            <div class="detail-image"><img src="${product.photo_url_1}"></div>
            <div class="detail-info">
                <p class="brand">${product.brand}</p>
                <h2 class="detail-name">${product.name_ge}</h2>
                <div class="detail-price">${product.final_price} ₾</div>
                <p class="section-label">აირჩიე ფერი</p>
                <div class="detail-colors">
                    ${colors.map((color, i) => `<div class="color-option ${i===0?'active':''}" style="background:${color.trim().toLowerCase()};" onclick="selectColor(this,'${color}','${productId}')"></div>`).join('')}
                </div>
                <p class="section-label">აირჩიე ზომა</p>
                <div id="size-options" class="detail-sizes"></div>
                <button id="add-to-cart-btn" class="main-btn" disabled onclick="handleAddToCart('${productId}')">აირჩიეთ ფერი და ზომა</button>
                <p class="description-text">${product.description_ge || ''}</p>
            </div>
        </div>`;

    document.body.appendChild(detailOverlay);
    if (colors.length > 0) selectColor(detailOverlay.querySelector('.color-option'), colors[0], productId);
}

function selectColor(element, color, productId) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    const sizesContainer = document.getElementById('size-options');
    const available = state.productDetails.filter(d => String(d.product_id) === String(productId) && d.Colors === color && parseInt(d.stock_quantity) > 0);
    sizesContainer.innerHTML = available.map(v => `<div class="size-option" onclick="selectSize(this,'${v.Sizes}')">${v.Sizes}</div>`).join('');
    selectedSize = null;
    checkButtonState();
}

function selectSize(element, size) {
    document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    selectedSize = size;
    checkButtonState();
}

function checkButtonState() {
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
        btn.disabled = !selectedSize;
        btn.innerText = selectedSize ? `დამატება - ${selectedSize}` : `აირჩიეთ ზომა`;
    }
}

function closeProductDetail() { 
    const el = document.getElementById('product-detail-overlay');
    if (el) el.remove(); 
}

function handleAddToCart(id) {
    state.cart.push({id, size: selectedSize});
    const badge = document.getElementById('cart-count');
    if (badge) { badge.innerText = state.cart.length; badge.style.display = 'block'; }
    closeProductDetail();
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    element.classList.add('active');
}
