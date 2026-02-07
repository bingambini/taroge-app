const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzfoJLltxIO6mkRgRs1H-kf7eubu9quktfij9czu50-kqgPM_Hqc9sBUUZtiJe8qqrCAw/exec'
};

let state = {
    products: [],
    productDetails: [],
    design: {},
    cart: []
};

let selectedSize = null;

// 1. Loader-ის მართვა (მხოლოდ ჩვენება/დამალვა)
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

// 3. მონაცემების ჩატვირთვა
async function loadData() {
    showLoader();
    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();
        
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        
        if (data.headerConfig) applyHeaderDesign(data.headerConfig);
        if (data.heroConfig) applyHeroDesign(data.heroConfig);

        renderProducts();
    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
    } finally {
        setTimeout(hideLoader, 800); // მცირე პაუზა სუფთა გადასვლისთვის
    }
}

// 4. დიზაინის ფუნქციები (Header)
function applyHeaderDesign(config) {
    if (!config || config.Status !== 'active') return;
    const logoElement = document.getElementById('logo'); 
    const logoIcon = document.getElementById('logo-icon');
    const headerElement = document.querySelector('.header');

    if (config.Shop_Name && logoElement) logoElement.innerText = config.Shop_Name;
    if (config.H_BG && headerElement) headerElement.style.background = config.H_BG;
    if (config.H_Text && logoElement) logoElement.style.color = config.H_Text;
    if (config.Icon_Color && logoIcon) logoIcon.style.color = config.Icon_Color;
    if (config.H_Height && headerElement) headerElement.style.height = config.H_Height + 'px';
    
    if (config.Shop_Logo && logoIcon) {
        logoIcon.innerHTML = `<img src="${config.Shop_Logo}" style="width: ${config.Logo_Size || 40}px; height: ${config.Logo_Size || 40}px; border-radius: 50%; object-fit: cover;">`;
        logoIcon.style.background = 'none';
    }
}

// 5. Hero სექცია
function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config || config.Status !== 'active') return;

    heroSection.innerHTML = `
        <div class="hero-wrapper" style="background: ${config.B_Gradient || '#eee'}; border-radius: 24px; padding: 25px; position: relative; overflow: hidden; margin-top: 20px; margin-bottom: 30px; height: ${config.B_Height || 200}px; display: flex; align-items: center;">
            <div style="position: relative; z-index: 2; width: 60%;">
                <h2 style="color: ${config.B_Title_Color || '#fff'}; font-size: 22px; margin-bottom: 8px;">${config.B_Title || ''}</h2>
                <p style="color: #fff; opacity: 0.9; margin-bottom: 15px; font-size: 14px;">${config.B_Subtitle || ''}</p>
                <button onclick="document.getElementById('products-grid').scrollIntoView({behavior:'smooth'})" style="padding: 10px 20px; border-radius: 12px; border: none; background: white; font-weight: 800;">
                    ${config.B_Btn_Text || 'ყიდვა'}
                </button>
            </div>
            ${config.B_Image ? `<img src="${config.B_Image}" style="position: absolute; right: -20px; top: 10px; height: 110%; transform: rotate(-10deg); z-index: 1;">` : ''}
        </div>`;
    heroSection.style.display = 'block';
}

// 6. პროდუქტების რენდერი
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(product => {
        if (product.status !== 'active') return;

        // ფასდაკლების გამოთვლა
        const hasDiscount = product.old_price && parseFloat(product.old_price) > parseFloat(product.final_price);
        const discountPercent = hasDiscount ? Math.round(((product.old_price - product.final_price) / product.old_price) * 100) : 0;
        
        // სტატუსის ბეიჯი (მაგ: NEW, HOT, TOP)
        const statusBadge = product.badge_text ? product.badge_text : '';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${product.photo_url_1}" loading="lazy" class="product-img">
                <div class="badges-wrapper">
                    ${hasDiscount ? `<div class="badge discount">-${discountPercent}%</div>` : ''}
                    ${statusBadge ? `<div class="badge status">${statusBadge}</div>` : ''}
                </div>
            </div>
            <div class="product-details">
                <h3 class="product-title">${product.name_ge}</h3>
                <div class="price-block">
                    <span class="final-price">${product.final_price} ₾</span>
                    ${hasDiscount ? `<span class="old-price">${product.old_price} ₾</span>` : ''}
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// 7. დეტალური გვერდი და კალათა (შემოკლებული ფუნქციები უცვლელად)
function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id) === String(productId));
    if (!product) return;
    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';
    overlay.innerHTML = `
        <div class="detail-container">
            <div class="detail-header"><button onclick="closeProductDetail()" class="close-btn">✕</button></div>
            <div class="detail-image"><img src="${product.photo_url_1}"></div>
            <div class="detail-info">
                <h2 class="detail-name">${product.name_ge}</h2>
                <div class="detail-price">${product.final_price} ₾</div>
                <button class="main-btn" onclick="handleAddToCart('${productId}')">კალათაში დამატება</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

function closeProductDetail() { document.getElementById('active-overlay')?.remove(); }

function handleAddToCart(productId) {
    state.cart.push({ id: productId });
    document.getElementById('nav-cart-badge').innerText = state.cart.length;
    document.getElementById('nav-cart-badge').style.display = 'flex';
    closeProductDetail();
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
}
