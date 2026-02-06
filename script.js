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

        // 1. ვაჩვენებთ ჰედერს რბილად
        const header = document.querySelector('.header');
        if (header) {
            header.classList.add('loaded');
        }

        // 2. ვაქრობთ ლოდერს
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

    // 1. ტექსტები და ლოგო
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

    // 2. ზომები
    if (config.H_Height && header) header.style.height = config.H_Height + 'px';
    if (config.H_Font_Size && logoText) logoText.style.fontSize = config.H_Font_Size + 'px';
    if (config.Logo_Size && logoIcon) {
        logoIcon.style.width = config.Logo_Size + 'px';
        logoIcon.style.height = config.Logo_Size + 'px';
    }
    if (config.Logo_Radius !== undefined && logoIcon) {
        logoIcon.style.borderRadius = config.Logo_Radius + '%';
    }

    // 3. ფერები
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

    // 4. დეკორაცია
    if (header) {
        header.style.boxShadow = config.H_Shadow === 'yes' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none';
        if (config.H_Border) header.style.borderBottom = `1px solid ${config.H_Border}`;
    }
    if (config.H_Padding && headerGrid) {
        headerGrid.style.padding = `0 ${config.H_Padding}px`;
    }
}

// განახლებული ბანერის ფუნქცია ღილაკის ლოგიკით
function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config) return;

    const imageUrl = config.B_Image || '';
    
    heroSection.innerHTML = `
        <div class="hero-banner" style="
            background-image: url('${imageUrl}');
            background-size: cover;
            background-position: center;
            height: ${config.B_Height || 240}px;
            /* ცენტრირების ახალი ლოგიკა */
            width: calc(100% - 32px); 
            margin: ${config.B_Margin_Top || 15}px auto;
            
            display: flex;
            align-items: flex-end;
            border-radius: 24px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        ">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 70%; 
                        background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); z-index: 1;"></div>
            
            <div class="hero-content" style="
                position: relative; 
                z-index: 2; 
                padding: 20px 25px; 
                width: 100%;
            ">
                <h2 style="
                    color: ${config.B_Title_Color || '#ffffff'}; 
                    font-size: ${config.B_Title_Size || 24}px; 
                    font-weight: 800;
                    margin: 0 0 4px 0;
                    line-height: 1.2;
                ">
                    ${config.B_Title || ''}
                </h2>
                <p style="
                    color: rgba(255,255,255,0.9); 
                    font-size: ${config.B_Sub_Size || 15}px; 
                    margin: 0 0 12px 0;
                ">
                    ${config.B_Subtitle || ''}
                </p>
                ${config.B_Btn_Text ? `
                    <button class="hero-btn" 
                        onclick="handleHeroAction('${config.B_Action_Type}', '${config.B_Action_Value}')"
                        style="
                            padding: 10px 28px;
                            background: #ffffff;
                            color: #000000;
                            border-radius: 12px;
                            font-weight: 700;
                            font-size: 14px;
                            border: none;
                            cursor: pointer;
                        ">
                        ${config.B_Btn_Text}
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    heroSection.style.display = 'block';
}

// ფუნქცია ბანერის ღილაკზე დაჭერისას
function handleHeroAction(type, value) {
    if (type === 'product') {
        // ვპოულობთ პროდუქტის ბარათებს შორის შესაბამისს
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
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

function toggleCart() {
    console.log("კალათა გაიხსნა:", state.cart);
}
