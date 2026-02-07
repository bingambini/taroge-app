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

function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config) return;

    const imageUrl = config.B_Image || '';
    const glassColor = config.B_Gradient || 'rgba(255, 255, 255, 0.2)';

    heroSection.innerHTML = `
        <div class="hero-wrapper" style="
            position: relative;
            width: calc(100% - 32px);
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
    
    // განვაახლოთ ორივე ბეიჯი: ჰედერის და ნავიგაციის
    const badge = document.getElementById('cart-count');
    const navBadge = document.getElementById('nav-cart-badge');
    
    const count = state.cart.length;
    
    if (badge) {
        badge.innerText = count;
        badge.style.display = 'block';
    }
    if (navBadge) {
        navBadge.innerText = count;
        navBadge.style.display = 'flex';
    }
    
    if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
}

function toggleCart() {
    console.log("კალათა გაიხსნა:", state.cart);
    // აქ შეგიძლია გამოიძახო კალათის გვერდი
}

/* =========================================
   ახალი ფუნქციები ნავიგაციისთვის
   ========================================= */

function handleNavChange(page, element) {
    // 1. აქტიური კლასის შეცვლა
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');

    // 2. ვიბრაცია (Haptic)
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    // 3. გვერდების გადართვა
    const mainProducts = document.getElementById('main-products');
    const hero = document.getElementById('hero');
    const profileSection = document.getElementById('profile-section');

    if (page === 'home') {
        mainProducts.style.display = 'block';
        hero.style.display = 'block';
        profileSection.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } 
    else if (page === 'category') {
        openCategorySheet();
    } 
    else if (page === 'cart') {
        toggleCart();
    } 
    else if (page === 'profile') {
        mainProducts.style.display = 'none';
        hero.style.display = 'none';
        profileSection.style.display = 'block';
        setupProfileData();
    }
}

function openCategorySheet() {
    const sheet = document.getElementById('category-sheet');
    const list = document.getElementById('categories-list');
    
    // ამოვიღოთ უნიკალური ბრენდები
    const brands = [...new Set(state.products.map(p => p.brand))];
    
    list.innerHTML = brands.map(brand => `
        <div class="category-item" onclick="filterByBrand('${brand}')">
            <span>${brand}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
    `).join('');
    
    sheet.classList.add('active');
}

function closeSheet(id) {
    document.getElementById(id).classList.remove('active');
}

function filterByBrand(brand) {
    console.log("ფილტრი ბრენდით:", brand);
    closeSheet('category-sheet');
    // აქ შეგიძლია დაამატო რეალური ფილტრაციის ლოგიკა
}

function setupProfileData() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        if (user.photo_url) {
            document.getElementById('user-avatar').innerHTML = `<img src="${user.photo_url}" style="width:100%; height:100%; border-radius:50%;">`;
        }
    }
}
