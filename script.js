const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxO0oyopgCm47jhJ1X_8q18VEejkZRqKL8HnLqviWnVqLA5gyIUDgtC2UfxOb4vsqLMnQ/exec'
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
        renderProducts();

        // --- მხოლოდ ეს ნაწილი დაემატა Loader-ის გასაქრობად ---
        const loader = document.getElementById('loader-wrapper');
        if (loader) {
            loader.classList.add('loader-hidden');
        }
        // -----------------------------------------------

    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
        // შეცდომის შემთხვევაშიც ვაქრობთ ლოდერს, რომ მომხმარებელი არ დარჩეს თეთრ ეკრანზე
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
