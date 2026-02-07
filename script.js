const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwRwC5Y4DGCqQD7aXCZ8aYCpJ1cm8AFOwlWkV1VW6yTHn2-ximNdQ1sUO0b-brA8nt33A/exec'
};

let state = {
    products: [],
    headerConfig: {},
    cart: []
};

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
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // მონაცემების შენახვა state-ში
        state.products = data.products || [];
        state.productDetails = data.productDetails || []; // საწყობის მონაცემები
        state.design = data.design || {};
        
        renderHero(data.heroConfig);
        renderProducts(); // აქ გამოიძახება ჩვენი ახალი "ჭკვიანი" რენდერი
    } catch (error) {
        console.error("Error loading data:", error);
    } finally {
        hideLoader();
    }
}

function applyHeaderDesign(config) {
    if (!config || config.Status !== 'active') return;

    const header = document.querySelector('.header');
    const logoText = document.getElementById('logo');
    const logoIcon = document.getElementById('logo-icon');
    const cartIconSvg = document.querySelector('.cart-icon svg');
    const headerGrid = document.querySelector('.header-grid');

    if (config.Shop_Name && logoText) logoText.innerText = config.Shop_Name;
    
    if (config.Shop_Logo && logoIcon) {
        const logoVal = String(config.Shop_Logo);
        if (logoVal.startsWith('http')) {
            logoIcon.innerHTML = `<img src="${logoVal}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
            logoIcon.style.background = 'transparent';
        } else {
            logoIcon.innerHTML = logoVal;
        }
    }

    if (config.H_Height && header) header.style.height = config.H_Height + 'px';
    if (config.H_Font_Size && logoText) logoText.style.fontSize = config.H_Font_Size + 'px';
    if (config.Logo_Size && logoIcon) {
        logoIcon.style.width = config.Logo_Size + 'px';
        logoIcon.style.height = config.Logo_Size + 'px';
    }
    if (config.Logo_Radius !== undefined && logoIcon) {
        logoIcon.style.borderRadius = config.Logo_Radius + '%';
    }

    if (config.H_BG && header) header.style.backgroundColor = config.H_BG;
    if (config.H_Text) {
        if (logoText) logoText.style.color = config.H_Text;
        const logoVal = String(config.Shop_Logo);
        if (logoIcon && !logoVal.startsWith('http')) {
            logoIcon.style.color = config.H_BG || '#fff';
            logoIcon.style.backgroundColor = config.H_Text;
        }
    }
    if (config.Icon_Color && cartIconSvg) {
        cartIconSvg.style.stroke = config.Icon_Color;
    }

    if (header) {
        header.style.boxShadow = config.H_Shadow === 'yes' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none';
        if (config.H_Border) header.style.borderBottom = `1px solid ${config.H_Border}`;
    }
    if (config.H_Padding && headerGrid) {
        headerGrid.style.padding = `0 ${config.H_Padding}px`;
    }
}

function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config) return;

    const imageUrl = config.B_Image || '';
    const glassColor = config.B_Gradient || 'rgba(255, 255, 255, 0.2)';

    heroSection.innerHTML = `
        <div class="hero-wrapper" style="
            position: relative;
            width: 100%;
            margin: ${config.B_Margin_Top || 30}px auto;
            height: ${config.B_Height || 220}px;
            display: flex;
            align-items: center;
        ">
            <div class="glass-base" style="
                position: absolute;
                width: 100%;
                height: 100%;
                background: ${glassColor};
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                z-index: 1;
            "></div>

            <div class="hero-text" style="
                position: relative;
                z-index: 2;
                padding-left: 25px;
                width: 55%;
            ">
                <h2 style="
                    color: ${config.B_Title_Color || '#ffffff'}; 
                    font-size: ${config.B_Title_Size || 22}px; 
                    font-weight: 900;
                    margin: 0 0 5px 0;
                    line-height: 1.1;
                ">
                    ${config.B_Title || ''}
                </h2>
                <p style="
                    color: #ffffff; 
                    font-size: ${config.B_Sub_Size || 14}px; 
                    margin: 0 0 15px 0;
                    opacity: 0.8;
                ">
                    ${config.B_Subtitle || ''}
                </p>
                <button onclick="handleHeroAction('${config.B_Action_Type}', '${config.B_Action_Value}')"
                    style="
                        padding: 10px 24px;
                        background: ${config.B_Title_Color || '#ffffff'};
                        color: #000;
                        border: none;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 13px;
                        cursor: pointer;
                    ">
                    ${config.B_Btn_Text || 'ყიდვა'}
                </button>
            </div>

            ${imageUrl ? `
                <div class="floating-product" style="
                    position: absolute;
                    right: -10px;
                    top: -20px;
                    width: 55%;
                    height: 120%;
                    z-index: 3;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(0 20px 35px rgba(0,0,0,0.4));
                    pointer-events: none;
                ">
                    <img src="${imageUrl}" style="
                        width: 100%;
                        height: auto;
                        object-fit: contain;
                        transform: rotate(-10deg);
                    ">
                </div>
            ` : ''}
        </div>
    `;
    heroSection.style.display = 'block';
}

function handleHeroAction(type, value) {
    if (type === 'product') {
        document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    }
}

/* =========================================
   განახლებული Premium Render (Version 2.0)
   ========================================= */
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // state.products - მოდის "Products" შიტიდან
    state.products.forEach(product => {
        if (product.status !== 'active') return;

        // 1. ვპოულობთ ყველა შესაბამის ხაზს "Product_Details" შიტიდან product_id-ით
        const variants = state.productDetails ? state.productDetails.filter(d => String(d.product_id) === String(product.product_id)) : [];

        // 2. ვაგროვებთ უნიკალურ ფერებს ამ მოდელისთვის
        const uniqueColors = [...new Set(variants.map(v => v.Colors).filter(c => c))];
        
        // 3. ვითვლით ჯამურ მარაგს ყველა ზომიდან
        const totalStock = variants.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0), 0);
        const isAvailable = totalStock > 0;

        // ფერების HTML-ის მომზადება (წრეები)
        let colorsHTML = '';
        uniqueColors.forEach(color => {
            // ვწმენდთ ფერის სახელს და ვიყენებთ background-ად
            const cleanColor = color.trim().toLowerCase();
            colorsHTML += `<div class="color-dot" style="background: ${cleanColor}; border: 1px solid #e0e0e0;" title="${color}"></div>`;
        });

        const card = document.createElement('div');
        card.className = 'product-card';
        // დაჭერისას გადავცემთ ID-ს დეტალური გვერდისთვის
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            ${product.discount_percent > 0 ? `<span class="badge">-${product.discount_percent}%</span>` : ''}
            <div class="product-image">
                <img src="${product.photo_url_1}" alt="${product.name_ge}">
            </div>
            
            <div class="product-info">
                <div class="stock-status ${isAvailable ? 'in-stock' : 'out-of-stock'}">
                    ${isAvailable ? 'მარაგშია' : 'ამოიწურა'}
                </div>
                <p class="brand">${product.brand}</p>
                <h3 class="name">${product.name_ge}</h3>
                
                <div class="color-options" style="display: flex; gap: 4px; margin-bottom: 10px; height: 14px;">
                    ${colorsHTML || '<div style="height:14px"></div>'}
                </div>

                <div class="price-box">
                    <span class="price-label">PRICE</span>
                    <div class="price-value">
                        ${product.final_price} <span class="currency">₾</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openProductDetails(productId) {
    console.log("გადავდივართ პროდუქტზე:", productId);
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    // აქ დაამატებ პროდუქტის სრული გვერდის გახსნის ლოგიკას
}

function addToCart(id) {
    state.cart.push(id);
    const badge = document.getElementById('cart-count');
    const navBadge = document.getElementById('nav-cart-badge');
    if (badge) {
        badge.innerText = state.cart.length;
        badge.style.display = 'block';
    }
    if (navBadge) {
        navBadge.innerText = state.cart.length;
        navBadge.style.display = 'flex';
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');

    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    const mainProducts = document.querySelector('.section');
    const hero = document.getElementById('hero');

    if (page === 'home') {
        if (mainProducts) mainProducts.style.display = 'block';
        if (hero) hero.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
