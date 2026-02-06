const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwRWjKaekleiDdmVElMD_oPNKgwcdEZJKkgcwXbB20r195SKJr2eRDK552R8j7Sx7Fwng/exec'
};

let state = {
    products: [],
    cart: [],
    content: {},
    design: {}
};

// ინიციალიზაცია
document.addEventListener('DOMContentLoaded', () => {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    loadData();
});

async function loadData() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        
        state.products = data.products;
        state.content = data.content;
        state.design = data.design;

        renderProducts();
    } catch (error) {
        console.error("მონაცემების ჩატვირთვის შეცდომა:", error);
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = ''; // Loading-ის წაშლა

    state.products.forEach(product => {
        if(product.status !== 'active') return;

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
                    ${product.discount_percent > 0 ? `<span class="old-price">${product.price} ₾</span>` : ''}
                </div>
                <button class="add-btn" onclick="addToCart('${product.product_id}')">დამატება</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id) {
    state.cart.push(id);
    document.getElementById('cart-count').innerText = state.cart.length;
    window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
}
