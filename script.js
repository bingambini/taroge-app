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

// 1. Loader-ის მართვა
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
        
        console.log("შიტიდან მოსული ყველა მონაცემი:", data);
        
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        
        if (data.headerConfig) applyHeaderDesign(data.headerConfig);
        if (data.heroConfig) applyHeroDesign(data.heroConfig);

        renderProducts();
    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
    } finally {
        setTimeout(hideLoader, 500);
    }
}

// 4. დიზაინის ფუნქციები
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
    if (config.H_Font_Size && logoElement) logoElement.style.fontSize = config.H_Font_Size + 'px';
    if (config.H_Padding && headerElement) headerElement.style.padding = config.H_Padding;

    if (config.H_Shadow && headerElement) headerElement.style.boxShadow = config.H_Shadow;
    if (config.H_Border && headerElement) headerElement.style.borderBottom = config.H_Border;

    if (config.Shop_Logo && logoIcon) {
        logoIcon.innerHTML = `<img src="${config.Shop_Logo}" style="
            width: ${config.Logo_Size || 40}px; 
            height: ${config.Logo_Size || 40}px; 
            border-radius: ${config.Logo_Radius || '50%'}; 
            object-fit: cover;">`;
        logoIcon.style.background = 'none';
    }
}

function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config || config.Status !== 'active') return;

    const marginTop = config.B_Margin_Top || '20px'; 
    const imageUrl = config.B_Image || '';

    heroSection.innerHTML = `
        <div class="hero-wrapper" style="
            background: ${config.B_Gradient || '#eee'}; 
            border-radius: 24px; 
            padding: 25px; 
            position: relative; 
            overflow: hidden; 
            margin-top: ${marginTop}; 
            margin-bottom: 30px; 
            height: ${config.B_Height || 200}px; 
            display: flex; 
            align-items: center;">
            
            <div style="position: relative; z-index: 2; width: 60%;">
                <h2 style="color: ${config.B_Title_Color || '#fff'}; font-size: 22px; margin-bottom: 8px;">${config.B_Title || ''}</h2>
                <p style="color: #fff; opacity: 0.9; margin-bottom: 15px; font-size: 14px;">${config.B_Subtitle || ''}</p>
                <button onclick="document.getElementById('products-grid').scrollIntoView({behavior:'smooth'})" 
                        style="padding: 10px 20px; border-radius: 12px; border: none; background: white; font-weight: 800; cursor: pointer;">
                    ${config.B_Btn_Text || 'ყიდვა'}
                </button>
            </div>
            ${imageUrl ? `<img src="${imageUrl}" style="position: absolute; right: -20px; top: 10px; height: 110%; transform: rotate(-10deg); z-index: 1;">` : ''}
        </div>`;
    heroSection.style.display = 'block';
}

// 5. პროდუქტების რენდერი
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(product => {
        if (product.status !== 'active') return;

        const variants = state.productDetails.filter(d => String(d.product_id) === String(product.product_id));
        const totalStock = variants.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0), 0);
        const isAvailable = totalStock > 0;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.photo_url_1}" alt="${product.name_ge}" loading="lazy">
            </div>
            <div class="product-info">
                <p class="brand">${product.brand || ''}</p>
                <h3 class="name">${product.name_ge}</h3>
                <div class="price-value">${product.final_price} ₾</div>
                <div style="font-size: 10px; color: ${isAvailable ? '#34c759' : '#ff3b30'}; font-weight: 700; margin-top: 5px;">
                    ${isAvailable ? '● მარაგშია' : '○ ამოწურულია'}
                </div>
            </div>`;
    grid.appendChild(card);
    });
}

// 6. დეტალური გვერდის გახსნა
function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id) === String(productId));
    const variants = state.productDetails.filter(d => String(d.product_id) === String(productId));
    if (!product) return;

    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';

    const colors = [...new Set(variants.map(v => v.Colors).filter(c => c))];

    overlay.innerHTML = `
        <div class="detail-container">
            <div class="detail-header">
                <button onclick="closeProductDetail()" class="close-btn">✕</button>
            </div>
            <div class="detail-image">
                <img src="${product.photo_url_1}">
            </div>
            <div class="detail-info">
                <p class="brand">${product.brand || ''}</p>
                <h2 class="detail-name">${product.name_ge}</h2>
                <div class="detail-price">${product.final_price} ₾</div>
                
                <p class="section-label">აირჩიე ფერი</p>
                <div class="detail-colors">
                    ${colors.map((color, i) => `
                        <div class="color-option ${i === 0 ? 'active' : ''}" 
                             style="background: ${color.trim().toLowerCase()};" 
                             onclick="selectColor(this, '${color}', '${productId}')">
                        </div>`).join('')}
                </div>
                
                <p class="section-label">აირჩიე ზომა</p>
                <div id="size-options" class="detail-sizes"></div>
                
                <button id="add-to-cart-btn" class="main-btn" disabled onclick="handleAddToCart('${productId}')">
                    აირჩიეთ ფერი და ზომა
                </button>
                
                <p class="description-text">${product.description_ge || ''}</p>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    if (colors.length > 0) {
        const firstColorEl = overlay.querySelector('.color-option');
        selectColor(firstColorEl, colors[0], productId);
    }
}

// 7. ფერისა და ზომის შერჩევა
function selectColor(element, color, productId) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    
    const sizesContainer = document.getElementById('size-options');
    const availableVariants = state.productDetails.filter(v => 
        String(v.product_id) === String(productId) && 
        v.Colors === color && 
        parseInt(v.stock_quantity) > 0
    );

    sizesContainer.innerHTML = availableVariants.map(v => `
        <div class="size-option" onclick="selectSize(this, '${v.Sizes}')">${v.Sizes}</div>
    `).join('');
    
    selectedSize = null;
    updateButtonState();
}

function selectSize(element, size) {
    document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    selectedSize = size;
    updateButtonState();
}

function updateButtonState() {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;
    
    if (selectedSize) {
        btn.disabled = false;
        btn.innerText = `დამატება - ${selectedSize}`;
    } else {
        btn.disabled = true;
        btn.innerText = `აირჩიეთ ზომა`;
    }
}

// 8. კალათა და ნავიგაცია
function handleAddToCart(productId) {
    state.cart.push({ id: productId, size: selectedSize });
    
    const navBadge = document.getElementById('nav-cart-badge');
    if (navBadge) {
        navBadge.innerText = state.cart.length;
        navBadge.style.display = 'flex';
    }

    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    closeProductDetail();
}

function closeProductDetail() {
    const overlay = document.getElementById('active-overlay');
    if (overlay) overlay.remove();
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
    
    if (page === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // აქ დავამატებთ კოდს, რომ კალათა თუ ღიაა დაიხუროს
    }
    
    if (page === 'cart') {
        // აქ მომავალში გამოვიძახებთ კალათის გვერდის ჩვენების ფუნქციას
        console.log("კალათაშია:", state.cart);
    }
}
