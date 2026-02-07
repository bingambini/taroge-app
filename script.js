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

// დამხმარე ფუნქცია ფერების თარგმნისთვის
function translateColor(color) {
    const colors = {
        'შავი': 'black',
        'თეთრი': 'white',
        'წითელი': 'red',
        'ლურჯი': '#007aff',
        'მწვანე': '#4cd964',
        'ყვითელი': '#ffcc00',
        'ნაცრისფერი': '#8e8e93',
        'ყავისფერი': '#a2845e',
        'ვარდისფერი': '#ff2d55',
        'იასამნისფერი': '#5856d6',
        'სტაფილოსფერი': '#ff9500'
    };
    return colors[color] || color;
}

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
        
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        
        if (data.headerConfig) applyHeaderDesign(data.headerConfig);
        if (data.heroConfig) applyHeroDesign(data.heroConfig);

        renderProducts();
    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
    } finally {
        setTimeout(hideLoader, 800);
    }
}

// 4. Header-ის დიზაინი
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

        const hasDiscount = product.old_price && parseFloat(product.old_price) > parseFloat(product.final_price);
        const discountPercent = hasDiscount ? Math.round(((product.old_price - product.final_price) / product.old_price) * 100) : 0;
        const statusBadge = product.badge_text ? product.badge_text : '';

        // ფერების ამოკრება "Colors" სვეტიდან
        const productVariants = state.productDetails.filter(d => String(d.product_id) === String(product.product_id));
        const uniqueColors = [...new Set(productVariants.map(v => v.Colors).filter(c => c))];

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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <p class="brand" style="font-size: 10px; color: #86868b; text-transform: uppercase; margin: 0;">${product.brand || ''}</p>
                    <div class="card-colors" style="display: flex; gap: 4px;">
                        ${uniqueColors.slice(0, 3).map(color => `
                            <div title="${color}" style="width: 10px; height: 10px; border-radius: 50%; background: ${translateColor(color)}; border: 1px solid rgba(0,0,0,0.1);"></div>
                        `).join('')}
                        ${uniqueColors.length > 3 ? `<span style="font-size: 9px; color: #86868b; font-weight: 600;">+${uniqueColors.length - 3}</span>` : ''}
                    </div>
                </div>
                <h3 class="product-title">${product.name_ge}</h3>
                <div class="price-block">
                    <span class="final-price">${product.final_price} ₾</span>
                    ${hasDiscount ? `<span class="old-price">${product.old_price} ₾</span>` : ''}
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// 7. დეტალური გვერდი
function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id) === String(productId));
    if (!product) return;

    const variants = state.productDetails.filter(d => String(d.product_id) === String(productId));
    const uniqueSizes = [...new Set(variants.map(v => v.Size).filter(s => s))];
    const uniqueColors = [...new Set(variants.map(v => v.Colors).filter(c => c))];
    const hasDiscount = product.old_price && parseFloat(product.old_price) > parseFloat(product.final_price);

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';
    overlay.innerHTML = `
        <div class="detail-container">
            <div class="detail-header"><button onclick="closeProductDetail()" class="close-btn">✕</button></div>
            <div class="detail-image" style="display: flex; justify-content: center; align-items: center; height: 250px;">
                <img src="${product.photo_url_1}" style="max-height: 100%; object-fit: contain;">
            </div>
            <div class="detail-info" style="padding: 20px;">
                <p style="color: #86868b; text-transform: uppercase; font-size: 12px; font-weight: 600;">${product.brand || ''}</p>
                <h2 class="detail-name" style="margin: 10px 0;">${product.name_ge}</h2>
                <div class="price-block" style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 20px;">
                    <span class="final-price" style="font-size: 24px; font-weight: 800;">${product.final_price} ₾</span>
                    ${hasDiscount ? `<span class="old-price" style="text-decoration: line-through; color: #86868b;">${product.old_price} ₾</span>` : ''}
                </div>

                ${uniqueColors.length > 0 ? `
                    <p class="section-label" style="font-size: 12px; font-weight: 700; color: #86868b; margin-bottom: 10px;">ფერები:</p>
                    <div class="detail-colors" style="display:flex; gap:10px; margin-bottom:20px;">
                        ${uniqueColors.map(c => `<div onclick="this.parentElement.querySelectorAll('div').forEach(d=>d.style.borderColor='#eee'); this.style.borderColor='#0071e3';" style="width:30px; height:30px; border-radius:50%; background:${translateColor(c)}; border:2px solid #eee; cursor:pointer;"></div>`).join('')}
                    </div>
                ` : ''}

                ${uniqueSizes.length > 0 ? `
                    <p class="section-label" style="font-size: 12px; font-weight: 700; color: #86868b; margin-bottom: 10px;">ზომა:</p>
                    <div class="detail-sizes" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: 20px;">
                        ${uniqueSizes.map(s => `<div class="size-option" onclick="selectSize(this, '${s}')" style="padding:10px 15px; border:1px solid #ddd; border-radius:10px; cursor:pointer; font-weight: 600;">${s}</div>`).join('')}
                    </div>
                ` : ''}

                <button class="main-btn" id="add-to-cart-btn" onclick="handleAddToCart('${productId}')">კალათაში დამატება</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function selectSize(el, size) {
    document.querySelectorAll('.size-option').forEach(opt => {
        opt.style.borderColor = '#ddd';
        opt.style.background = 'transparent';
        opt.style.color = '#1d1d1f';
    });
    el.style.borderColor = '#0071e3';
    el.style.background = '#0071e3';
    el.style.color = 'white';
    selectedSize = size;
}

function closeProductDetail() { 
    document.getElementById('active-overlay')?.remove(); 
    document.body.style.overflow = 'auto';
    selectedSize = null;
}

function handleAddToCart(productId) {
    state.cart.push({ id: productId, size: selectedSize });
    const badge = document.getElementById('nav-cart-badge');
    if (badge) {
        badge.innerText = state.cart.length;
        badge.style.display = 'flex';
    }
    const btn = document.getElementById('add-to-cart-btn');
    btn.innerText = "დამატებულია! ✓";
    btn.style.background = "#4cd964";
    setTimeout(closeProductDetail, 800);
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
}
