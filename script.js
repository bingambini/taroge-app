const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxO0oyopgCm47jhJ1X_8q18VEejkZRqKL8HnLqviWnVqLA5gyIUDgtC2UfxOb4vsqLMnQ/exec'
};

let state = {
    products: [],
    headerConfig: {},
    cart: []
};

document.addEventListener('DOMContentLoaded', () => {
    // Telegram-ის ინიციალიზაცია
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

        // ჯერ ვრთავთ ჰედერის დიზაინს
        applyHeaderDesign(state.headerConfig);
        // შემდეგ ვხატავთ პროდუქტებს
        renderProducts();
    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
    }
}

function applyHeaderDesign(config) {
    if (!config || config.Status !== 'active') return;

    const header = document.querySelector('.header');
    const logoText = document.getElementById('logo');
    const logoIcon = document.getElementById('logo-icon');
    const cartIconSvg = document.querySelector('.cart-icon svg');

    // 1. ტექსტები
    if (config.Shop_Name) logoText.innerText = config.Shop_Name;
    if (config.Shop_Logo) logoIcon.innerText = config.Shop_Logo;

    // 2. ზომები (Styles)
    if (config.H_Height) header.style.height = config.H_Height + 'px';
    if (config.H_Font_Size) logoText.style.fontSize = config.H_Font_Size + 'px';
    if (config.Logo_Size) {
        logoIcon.style.width = config.Logo_Size + 'px';
        logoIcon.style.height = config.Logo_Size + 'px';
        logoIcon.style.fontSize = (config.Logo_Size / 2) + 'px';
    }
    if (config.Logo_Radius !== undefined) {
        logoIcon.style.borderRadius = config.Logo_Radius + '%';
    }

    // 3. ფერები
    if (config.H_BG) header.style.backgroundColor = config.H_BG;
    if (config.H_Text) {
        logoText.style.color = config.H_Text;
        logoIcon.style.color = config.H_BG || '#fff'; // აიქონის შიდა ასოს ფერი
        logoIcon.style.backgroundColor = config.H_Text; // აიქონის წრის ფერი
    }
    if (config.Icon_Color && cartIconSvg) {
        cartIconSvg.style.stroke = config.Icon_Color;
    }

    // 4. დეკორაცია
    if (config.H_Shadow === 'yes') {
        header.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    } else {
        header.style.boxShadow = 'none';
    }
    if (config.H_Border) {
        header.style.borderBottom = `1px solid ${config.H_Border}`;
    }
    if (config.H_Padding) {
        document.querySelector('.header-grid').style.padding = `0 ${config.H_Padding}px`;
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
    // აქ მოგვიანებით დავწერთ კალათის გახსნის ლოგიკას
}
