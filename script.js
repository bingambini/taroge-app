const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbweHRx6EOMOWA019h00kuJ4-pn4A55UJgR7DKGdLvNc0AYOBF7W-O9-2MNi734ZEFfl6Q/exec'
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
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        
        state.products = data.products;
        state.headerConfig = data.headerConfig;

        applyHeaderDesign(state.headerConfig);
        
        // --- აქ ჩაემატა ბანერის გამოძახება ---
        if (data.heroConfig) {
            applyHeroDesign(data.heroConfig);
        }
        
        renderProducts();

        const header = document.querySelector('.header');
        if (header) {
            header.classList.add('loaded');
        }

        const loader = document.getElementById('loader-wrapper');
        if (loader) {
            loader.classList.add('loader-hidden');
        }

    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
        const loader = document.getElementById('loader-wrapper');
        if (loader) loader.classList.add('loader-hidden');
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

// აი ეს ფუნქცია აკლდა შენს კოდს:
function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config) return;

    const imageUrl = config.B_Image || '';
    const gradient = config.B_Gradient || '';

    heroSection.innerHTML = `
        <div class="hero-banner" style="
            position: relative;
            width: calc(100% - 32px);
            margin: ${config.B_Margin_Top || 20}px auto;
            height: ${config.B_Height || 250}px;
            border-radius: 28px;
            background: ${gradient}${imageUrl ? (gradient ? ', ' : '') + `url('${imageUrl}')` : ''};
            background-size: cover;
            background-position: center;
            overflow: hidden;
            display: flex;
            align-items: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        ">
            <div style="
                margin-left: 20px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                max-width: 75%;
                z-index: 2;
            ">
                <h2 style="color: ${config.B_Title_Color || '#ffffff'}; font-size: ${config.B_Title_Size || 22}px; font-weight: 800; margin: 0 0 5px 0;">
                    ${config.B_Title || ''}
                </h2>
                <p style="color: #ffffff; font-size: ${config.B_Sub_Size || 14}px; margin: 0 0 15px 0; opacity: 0.95;">
                    ${config.B_Subtitle || ''}
                </p>
                ${config.B_Btn_Text ? `
                    <button class="hero-btn" onclick="handleHeroAction('${config.B_Action_Type}', '${config.B_Action_Value}')"
                        style="padding: 10px 22px; background: ${config.B_Title_Color || '#ffffff'}; color: #000; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">
                        ${config.B_Btn_Text}
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    heroSection.style.display = 'block';
}

function handleHeroAction(type, value) {
    if (type === 'product') {
        document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        console.log("ნავიგაცია პროდუქტზე ID-ით:", value);
        
        if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(product => {
        if (product.status !== 'active') return;

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.photo_url_1}" alt="${product.name_ge}">
                ${product.discount_percent > 0 ? `<span class="badge">-${product.discount_percent}%</span>` : ''}
            </div>
            <div class="product-info">
                <p class="brand">${product.brand}</p>
                <h3 class="name">${product.name_ge}</h3>
                <div class="price-row">
                    <span class="price">${product.final_price} ₾</span>
                </div>
                <button class="add-btn" onclick="addToCart('${product.product_id}')">კალათაში</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id) {
    state.cart.push(id);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = state.cart.length;
        badge.style.display = 'block';
    }
    
    if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.impactOccurred('medium');
    }
}

function toggleCart() {
    console.log("კალათა გაიხსნა:", state.cart);
}
