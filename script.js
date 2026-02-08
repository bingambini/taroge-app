// --- კონფიგურაცია და მონაცემთა საცავი ---
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyKAUQCD1EQ0b1Kpl_AaC6i_0n0KmlHtC_T5n8QnkNS_tOAqD_9l6_iJFaoIkBOX0wdrA/exec'
};

let state = {
    products: [],
    productDetails: [],
    design: {},
    cart: []
};

// გლობალური ცვლადები შერჩევისთვის
let selectedColor = null;
let selectedSize = null;

// --- ფუნქცია: ფერების სახელების თარგმნა CSS ფერებში ---
function translateColor(color) {
    const colors = {
        'შავი': 'black', 'Black': 'black',
        'თეთრი': 'white', 'White': 'white',
        'წითელი': 'red', 'Red': 'red',
        'ლურჯი': '#007aff', 'Blue': '#007aff',
        'მწვანე': '#4cd964', 'Green': '#4cd964',
        'ყვითელი': '#ffcc00', 'Yellow': '#ffcc00',
        'ნაცრისფერი': '#8e8e93', 'Gray': '#8e8e93',
        'ყავისფერი': '#a2845e', 'Brown': '#a2845e',
        'ვარდისფერი': '#ff2d55', 'Pink': '#ff2d55',
        'იასამნისფერი': '#5856d6', 'Purple': '#5856d6',
        'სტაფილოსფერი': '#ff9500', 'Orange': '#ff9500'
    };
    return colors[color] || color;
}

// --- ფუნქციები: ჩატვირთვის ინდიკატორის (Loader) მართვა ---
function showLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.remove('loader-hidden'); 
}

function hideLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.add('loader-hidden'); 
}

// --- ღონისძიება: გვერდის ჩატვირთვისას მონაცემების წამოღება ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    loadData();
});

// --- ფუნქცია: მონაცემების წამოღება API-დან და შენახვა state-ში ---
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
        console.error("მონაცემების ჩატვირთვა ვერ მოხერხდა:", error);
    } finally {
        setTimeout(hideLoader, 800);
    }
}

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
    }
}

// --- ბანერის დიზაინის შესწორება ---
function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config || config.Status !== 'active') return;

    // margin-top შევამცირე 20px-დან 5px-მდე
    heroSection.innerHTML = `
        <div class="hero-wrapper" style="background: ${config.B_Gradient || '#eee'}; border-radius: 24px; padding: 25px; position: relative; overflow: hidden; margin-top: 5px; margin-bottom: 20px; height: ${config.B_Height || 200}px; display: flex; align-items: center;">
            <div style="position: relative; z-index: 2; width: 60%;">
                <h2 style="color: ${config.B_Title_Color || '#fff'}; font-size: 20px; margin-bottom: 8px;">${config.B_Title || ''}</h2>
                <p style="color: #fff; opacity: 0.9; margin-bottom: 15px; font-size: 13px;">${config.B_Subtitle || ''}</p>
                <button onclick="document.getElementById('products-grid').scrollIntoView({behavior:'smooth'})" style="padding: 8px 18px; border-radius: 10px; border: none; background: white; font-weight: 800; font-size: 13px;">
                    ${config.B_Btn_Text || 'ყიდვა'}
                </button>
            </div>
            ${config.B_Image ? `<img src="${config.B_Image}" style="position: absolute; right: -10px; top: 10px; height: 110%; transform: rotate(-5deg); z-index: 1;">` : ''}
        </div>`;
    heroSection.style.display = 'block';
}

// --- "ახალი კოლექცია" და პროდუქტების რენდერი ---
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const mainTitle = document.getElementById('new-arrivals-title');
    if (!grid) return;
    
    // სათაურის ზომის დაპატარავება
    if (mainTitle) {
        mainTitle.style.fontSize = '18px';
        mainTitle.style.margin = '10px 0 15px 5px';
    }

    grid.innerHTML = '';

    state.products.forEach(product => {
        const currentProductId = String(product.product_id).trim().toLowerCase();
        const productVariants = state.productDetails.filter(d => 
            String(d.product_id).trim().toLowerCase() === currentProductId
        );
        const availableVariants = productVariants.filter(v => parseInt(v.stock_quantity || 0) > 0);
        const uniqueColors = [...new Set(availableVariants.map(v => v.Colors).filter(c => c))];
        const statusBadge = productVariants.find(v => v.Badge_Status)?.Badge_Status || "";
        const discountVal = parseInt(product.discount_percent || 0);

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; width: 100%; height: 160px; background: #f8f8f8; display: flex; align-items: center; justify-content: center; border-radius: 18px 18px 0 0; overflow: hidden;">
                <img src="${product.photo_url_1}" loading="lazy" class="product-img" style="max-width: 85%; max-height: 85%; object-fit: contain;">
                <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 10;">
                    ${discountVal > 0 ? `<div style="background: #ff3b30; color: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid white;">-${discountVal}%</div>` : ''}
                    ${statusBadge && statusBadge !== 'undefined' ? `<div style="background: #007aff; color: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid white;">${statusBadge}</div>` : ''}
                </div>
            </div>
            <div class="product-details" style="padding: 12px; display: flex; flex-direction: column; flex-grow: 1; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <p style="font-size: 10px; color: #86868b; text-transform: uppercase; margin: 0; font-weight: 700;">${product.brand || ''}</p>
                    <div style="display: flex; gap: 3px;">
                        ${uniqueColors.slice(0, 4).map(color => `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${translateColor(color.trim())}; border: 1px solid #e5e5e5;"></div>`).join('')}
                    </div>
                </div>
                <h3 style="font-size: 13px; font-weight: 600; margin: 0 0 8px 0; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; color: #1d1d1f;">
                    ${product.name_ge}
                </h3>
                <div style="margin-top: auto;">
                    <span style="font-size: 15px; font-weight: 800; color: #000;">${product.final_price} ₾</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(product => {
        const currentProductId = String(product.product_id).trim().toLowerCase();
        const productVariants = state.productDetails.filter(d => 
            String(d.product_id).trim().toLowerCase() === currentProductId
        );
        const availableVariants = productVariants.filter(v => parseInt(v.stock_quantity || 0) > 0);
        const uniqueColors = [...new Set(availableVariants.map(v => v.Colors).filter(c => c))];
        const statusBadge = productVariants.find(v => v.Badge_Status)?.Badge_Status || "";
        const discountVal = parseInt(product.discount_percent || 0);

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; width: 100%; height: 160px; background: #f8f8f8; display: flex; align-items: center; justify-content: center; border-radius: 18px 18px 0 0; overflow: hidden;">
                <img src="${product.photo_url_1}" loading="lazy" class="product-img" style="max-width: 85%; max-height: 85%; object-fit: contain;">
                <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 10;">
                    ${discountVal > 0 ? `<div style="background: #ff3b30; color: white; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid white;">-${discountVal}%</div>` : ''}
                    ${statusBadge && statusBadge !== 'undefined' ? `<div style="background: #007aff; color: white; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid white;">${statusBadge}</div>` : ''}
                </div>
            </div>
            <div class="product-details" style="padding: 12px; display: flex; flex-direction: column; flex-grow: 1; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <p style="font-size: 11px; color: #86868b; text-transform: uppercase; margin: 0; font-weight: 700;">${product.brand || ''}</p>
                    <div style="display: flex; gap: 4px; min-height: 14px;">
                        ${uniqueColors.map(color => {
                            const hexColor = translateColor(color.trim());
                            return `<div style="width: 14px; height: 14px; border-radius: 50%; background: ${hexColor}; border: 1px solid #e5e5e5;"></div>`;
                        }).join('')}
                    </div>
                </div>
                <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 10px 0; height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; color: #1d1d1f;">
                    ${product.name_ge}
                </h3>
                <div style="margin-top: auto;">
                    <span style="font-size: 17px; font-weight: 800; color: #000;">${product.final_price} ₾</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase());
    if (!product) return;

    const allVariants = state.productDetails.filter(d => 
        String(d.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase() && 
        parseInt(d.stock_quantity || 0) > 0
    );

    const uniqueColors = [...new Set(allVariants.map(v => v.Colors).filter(c => c))];
    selectedColor = null;
    selectedSize = null;

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';
    
    window.updateSizeOptions = function(color) {
        selectedColor = color;
        selectedSize = null; 
        
        document.querySelectorAll('.color-dot-option').forEach(node => {
            if(node.getAttribute('data-color') === color) {
                node.style.boxShadow = '0 0 0 2px white, 0 0 0 4px #0071e3';
                node.style.transform = 'scale(1.1)';
            } else {
                node.style.boxShadow = 'none';
                node.style.transform = 'scale(1)';
            }
        });

        const sizeContainer = document.getElementById('size-options-container');
        const availableSizes = allVariants.filter(v => v.Colors === color).map(v => v.Sizes);

        sizeContainer.innerHTML = availableSizes.map(s => `
            <div class="size-option" onclick="selectSize(this, '${s}')" 
                 style="flex: 0 0 auto; padding: 12px 20px; border: 1.5px solid #e5e5e7; border-radius: 14px; cursor: pointer; font-weight: 600; min-width: 55px; text-align: center; background: white;">
                ${s}
            </div>
        `).join('');
        checkSelection();
    };

    window.selectSize = function(el, size) {
        selectedSize = size;
        document.querySelectorAll('.size-option').forEach(opt => {
            opt.style.borderColor = '#e5e5e7';
            opt.style.background = 'white';
            opt.style.color = '#1d1d1f';
        });
        el.style.borderColor = '#0071e3';
        el.style.background = '#f5f5f7';
        el.style.color = '#0071e3';
        checkSelection();
    };

    function checkSelection() {
        const btn = document.getElementById('add-to-cart-btn');
        if (selectedColor && selectedSize) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.background = '#0071e3';
            btn.innerText = 'კალათაში დამატება';
            btn.onclick = () => handleAddToCart(product.product_id, selectedColor, selectedSize);
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.background = '#86868b';
            btn.innerText = 'აირჩიეთ ფერი და ზომა';
        }
    }

    overlay.innerHTML = `
        <div class="detail-container" style="max-height: 90vh; border-radius: 30px 30px 0 0; background: white; position: fixed; bottom: 0; width: 100%; overflow-y: auto;">
            <div class="detail-header" style="padding: 12px 20px 0; display: flex; justify-content: flex-end;">
                <button onclick="closeProductDetail()" style="background: #f5f5f7; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; color: #86868b; font-size: 16px;">✕</button>
            </div>
            <div style="display: flex; justify-content: center; padding: 5px 20px;">
                <img src="${product.photo_url_1}" style="max-width: 90%; max-height: 220px; object-fit: contain;">
            </div>
            <div style="padding: 10px 25px 30px;">
                <p style="color: #0071e3; text-transform: uppercase; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px;">${product.brand}</p>
                <h2 style="font-size: 22px; font-weight: 700; color: #1d1d1f; line-height: 1.2; margin-bottom: 8px;">${product.name_ge}</h2>
                <div style="margin-bottom: 15px;">
                    <span style="font-size: 26px; font-weight: 800; color: #0071e3;">${product.final_price} ₾</span>
                </div>
                <p style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 10px;">ფერი</p>
                <div style="display: flex; gap: 14px; margin-bottom: 15px;">
                    ${uniqueColors.map(c => `<div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" style="width: 32px; height: 32px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer;"></div>`).join('')}
                </div>
                <p style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 10px;">ზომა</p>
                <div id="size-options-container" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
                    <p style="color: #86868b; font-size: 13px;">ჯერ აირჩიეთ ფერი...</p>
                </div>
                <div style="margin-top: 15px;">
                    <button class="main-btn" id="add-to-cart-btn" disabled style="width: 100%; padding: 18px; border-radius: 16px; border: none; background: #86868b; color: white; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.3s; opacity: 0.5;">
                        აირჩიეთ ფერი და ზომა
                    </button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function closeProductDetail() { 
    document.getElementById('active-overlay')?.remove(); 
    document.body.style.overflow = 'auto';
    selectedColor = null;
    selectedSize = null;
}

function handleAddToCart(productId, color, size) {
    const productData = state.products.find(p => p.product_id === productId || p.id === productId);

    const existingItem = state.cart.find(item => 
        item.id === productId && 
        item.color === color && 
        item.size === size
    );

    // ვიღებთ final_price-ს, თუ არა - ჩვეულებრივ price-ს
    const finalPrice = productData ? (productData.final_price || productData.price) : 0;

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        state.cart.push({ 
            id: productId,
            product_id: productId,
            name_ge: productData ? (productData.name_ge || productData.name) : "პროდუქტი", 
            price: finalPrice, // აი აქ ჩაიწერება უკვე ფასდაკლებული ფასი
            color: color, 
            size: size,
            quantity: 1
        });
    }

    updateCartBadge();
    const btn = document.getElementById('add-to-cart-btn');
    if (btn) {
        btn.innerText = "დამატებულია! ✓";
        btn.style.background = "#4cd964";
    }
    setTimeout(closeProductDetail, 800);
}

function updateCartBadge() {
    const badge = document.getElementById('nav-cart-badge');
    if (badge) {
        const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = totalQty;
        badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
}

function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
    
    if (page === 'cart') {
        renderCart();
    } else if (page === 'profile') {
        renderProfile(); // გამოიძახებს ჩვენს ახალ პროფილის ფუნქციას
    } else {
        // ეს არის 'home' ან ნებისმიერი სხვა გვერდი
        const hero = document.getElementById('hero');
        if (hero) hero.style.display = 'block';
        const mainTitle = document.getElementById('new-arrivals-title');
        if (mainTitle) mainTitle.style.display = 'block';
        
        // პროდუქტების დახატვამდე მენიუ უნდა გამოჩნდეს (თუ checkout-იდან გამოვდივართ)
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) bottomNav.style.display = 'flex';
        
        renderProducts();
    }
}

function renderCart() {
    const grid = document.getElementById('products-grid');
    const hero = document.getElementById('hero');
    const mainTitle = document.getElementById('new-arrivals-title');
    
    // --- ჩამატებული ლოგიკა მენიუს გამოსაჩენად ---
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';
    // ------------------------------------------
    
    if (!grid) return;
    if (hero) hero.style.display = 'none';
    if (mainTitle) mainTitle.style.display = 'none';

    grid.innerHTML = '';
    
    const cartHeader = document.createElement('h2');
    cartHeader.style.cssText = 'grid-column: 1/-1; margin: 5px 0 15px 5px; font-size: 18px; font-weight: 700; color: #1d1d1f;';
    cartHeader.innerText = 'ჩემი კალათა';
    grid.appendChild(cartHeader);

    if (state.cart.length === 0) {
        grid.innerHTML += `<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;"><p style="color: #86868b;">კალათა ცარიელია</p></div>`;
        return;
    }

    let totalSum = 0;
    state.cart.forEach((item, index) => {
        const product = state.products.find(p => String(p.product_id) === String(item.id));
        if (!product) return;

        const variant = state.productDetails.find(d => 
            String(d.product_id) === String(item.id) && 
            String(d.Colors).trim() === String(item.color).trim() && 
            String(d.Sizes).trim() === String(item.size).trim()
        );
        
        const stockLimit = variant ? parseInt(variant.stock_quantity || 0) : 0;
        const itemTotal = parseFloat(product.final_price) * item.quantity;
        totalSum += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.style.cssText = 'grid-column: 1/-1; display: flex; align-items: center; gap: 12px; background: white; padding: 12px; border-radius: 18px; margin-bottom: 10px; position: relative; border: 1px solid #f2f2f7;';
        
        cartItem.innerHTML = `
            <img src="${product.photo_url_1}" style="width: 70px; height: 70px; object-fit: contain; background: #f5f5f7; border-radius: 12px;">
            <div style="flex-grow: 1;">
                <h4 style="font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 2px;">${product.name_ge}</h4>
                <p style="font-size: 11px; color: #86868b; margin-bottom: 8px;">${item.color}, ${item.size}</p>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: 700; color: #0071e3; font-size: 14px;">${itemTotal.toFixed(2)} ₾</span>
                    <div style="display: flex; align-items: center; background: #f5f5f7; border-radius: 8px; padding: 4px 10px; gap: 12px;">
                        <button onclick="changeQuantity(${index}, -1)" style="border:none; background:none; font-size: 18px; color: #0071e3; cursor: pointer;">−</button>
                        <span style="font-size: 13px; font-weight: 700; min-width: 15px; text-align: center;">${item.quantity}</span>
                        ${item.quantity < stockLimit ? 
                            `<button onclick="changeQuantity(${index}, 1)" style="border:none; background:none; font-size: 18px; color: #0071e3; cursor: pointer;">+</button>` : 
                            `<span style="width: 18px; display: inline-block;"></span>`
                        }
                    </div>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" style="position: absolute; right: 10px; top: 10px; background: none; border: none; color: #d1d1d6; font-size: 16px; cursor: pointer;">✕</button>
        `;
        grid.appendChild(cartItem);
    });

    const footer = document.createElement('div');
    footer.style.cssText = 'grid-column: 1/-1; margin-top: 10px; padding: 20px; background: #f5f5f7; border-radius: 20px;';
    footer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="color: #86868b; font-size: 15px;">სულ გადასახდელი:</span>
            <strong style="color: #0071e3; font-size: 20px;">${totalSum.toFixed(2)} ₾</strong>
        </div>
        <button onclick="checkout()" style="width: 100%; padding: 16px; border-radius: 14px; border: none; background: #000; color: white; font-size: 15px; font-weight: 700; cursor: pointer;">შეკვეთის გაფორმება</button>
    `;
    grid.appendChild(footer);
}

function changeQuantity(index, delta) {
    const item = state.cart[index];
    if (delta > 0) {
        const variant = state.productDetails.find(d => 
            String(d.product_id) === String(item.id) && 
            String(d.Colors).trim() === String(item.color).trim() && 
            String(d.Sizes).trim() === String(item.size).trim()
        );
        const stockLimit = variant ? parseInt(variant.stock_quantity || 0) : 0;
        if (item.quantity >= stockLimit) {
            showToast("უკაცრავად, მეტი რაოდენობა მარაგში არ არის ✋");
            return;
        }
    }
    item.quantity += delta;
    if (item.quantity < 1) {
        state.cart.splice(index, 1);
    }
    updateCartBadge();
    renderCart();
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    updateCartBadge();
    renderCart();
}

function showToast(message) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8); color: white; padding: 12px 24px;
        border-radius: 25px; font-size: 14px; font-weight: 500; z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0;
        transition: opacity 0.3s, bottom 0.3s; white-space: nowrap;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.bottom = '120px'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.bottom = '100px';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function checkout() {
    const grid = document.getElementById('products-grid');
    const hero = document.getElementById('hero');
    const mainTitle = document.getElementById('new-arrivals-title');
    // ვპოულობთ ქვედა მენიუს
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (!grid) return;
    if (hero) hero.style.display = 'none';
    if (mainTitle) mainTitle.style.display = 'none';
    
    // ვმალავთ მენიუს, რომ კლავიატურას არ შეეჯახოს
    if (bottomNav) bottomNav.style.display = 'none';

    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 5px; padding-bottom: 150px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px;">
                <button onclick="renderCart()" style="background: #f5f5f7; border: none; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <span style="font-size: 20px;">←</span>
                </button>
                <h2 style="font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 0;">მიტანის მონაცემები</h2>
            </div>

            <div style="background: #fff; padding: 24px; border-radius: 28px; border: 1px solid #f2f2f7; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="margin-bottom: 18px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #86868b; margin-bottom: 8px; margin-left: 4px;">სრული სახელი</label>
                    <input type="text" id="order-name" placeholder="მაგ: გიორგი ბერიძე" 
                        style="width: 100%; padding: 16px; border-radius: 14px; border: 1px solid #e5e5e7; background: #f9f9fb; font-size: 15px; outline: none; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 18px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #86868b; margin-bottom: 8px; margin-left: 4px;">ტელეფონის ნომერი</label>
                    <input type="tel" id="order-phone" placeholder="599 XX XX XX" 
                        style="width: 100%; padding: 16px; border-radius: 14px; border: 1px solid #e5e5e7; background: #f9f9fb; font-size: 15px; outline: none; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 25px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #86868b; margin-bottom: 8px; margin-left: 4px;">მიტანის მისამართი</label>
                    <textarea id="order-address" placeholder="ქალაქი, ქუჩა, კორპუსი..." 
                        style="width: 100%; padding: 16px; border-radius: 14px; border: 1px solid #e5e5e7; background: #f9f9fb; font-size: 15px; outline: none; height: 90px; resize: none; box-sizing: border-box;"></textarea>
                </div>

                <button onclick="goToPayment()" style="width: 100%; padding: 18px; border-radius: 18px; border: none; background: #000; color: white; font-size: 16px; font-weight: 700; cursor: pointer;">
                    გადახდაზე გადასვლა →
                </button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPayment() {
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const address = document.getElementById('order-address').value.trim();

    if (!name || !phone || !address) {
        showToast("გთხოვთ შეავსოთ მონაცემები ⚠️");
        return;
    }

    let totalSum = 0;
    state.cart.forEach(item => {
        const productData = state.products.find(p => p.product_id === item.id || p.id === item.id);
        const correctPrice = productData ? (productData.final_price || productData.price) : item.price;
        const priceNum = typeof correctPrice === 'string' ? parseFloat(correctPrice.replace(/[^\d.]/g, '')) : parseFloat(correctPrice);
        totalSum += (priceNum * (item.quantity || 1));
    });

    const finalAmount = totalSum.toFixed(2);
    // ვინახავთ მონაცემებს დროებით ობიექტში
    state.tempOrder = { name, phone, address, totalAmount: finalAmount, paymentMethod: "" };

    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 5px; padding-bottom: 120px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px;">
                <button onclick="checkout()" style="background: #f5f5f7; border: none; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <span style="font-size: 20px;">←</span>
                </button>
                <h2 style="font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 0;">გადახდა</h2>
            </div>

            <div style="background: #f5f5f7; padding: 25px; border-radius: 22px; text-align: center; margin-bottom: 25px;">
                <span style="font-size: 14px; color: #86868b;">ზუსტი გადასახდელი:</span>
                <div style="font-size: 34px; font-weight: 800; color: #0071e3; margin-top: 5px;">${finalAmount} ₾</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div onclick="selectPaymentMethod('საბანკო გადარიცხვა', this)" class="pay-option" style="background: white; padding: 18px; border-radius: 20px; border: 2px solid #f5f5f7; display: flex; align-items: center; gap: 15px; cursor: pointer;">
                    <div style="font-size: 24px;">🏦</div>
                    <div style="font-weight: 700;">საბანკო გადარიცხვა</div>
                </div>

                <div id="bank-details-box" style="display: none; background: #f0f7ff; padding: 18px; border-radius: 20px; border: 1px solid #0071e3; margin-top: -5px;">
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; font-weight: 700; color: #1d1d1f;">მიმღები: შპს მაღაზია</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <div id="iban-text" style="background: white; padding: 10px; border-radius: 10px; border: 1px solid #d0e8ff; font-family: monospace; font-weight: 700; flex-grow: 1; font-size: 13px;">GE00TB0000000000000000</div>
                            <button onclick="copyIBAN()" style="background: #0071e3; color: white; border: none; padding: 0 12px; border-radius: 10px; font-size: 11px; cursor: pointer;">Copy</button>
                        </div>
                        <p style="font-size: 11px; color: #856404; margin: 0; background: #fff9e6; padding: 8px; border-radius: 8px;">
                            ℹ️ დანიშნულებაში მიუთითეთ თქვენი სახელი და გვარი.
                        </p>
                    </div>
                </div>

                <div onclick="selectPaymentMethod('ბარათით გადახდა', this)" class="pay-option" style="background: white; padding: 18px; border-radius: 20px; border: 2px solid #f5f5f7; display: flex; align-items: center; gap: 15px; cursor: pointer;">
                    <div style="font-size: 24px;">💳</div>
                    <div style="font-weight: 700;">ბარათით გადახდა</div>
                </div>

                <div onclick="selectPaymentMethod('ბარათით კურიერთან', this)" class="pay-option" style="background: white; padding: 18px; border-radius: 20px; border: 2px solid #f5f5f7; display: flex; align-items: center; gap: 15px; cursor: pointer;">
                    <div style="font-size: 24px;">🛵</div>
                    <div style="font-weight: 700;">ბარათით კურიერთან</div>
                </div>
            </div>

            <button id="final-submit-btn" onclick="handleFinalOrder()" style="width: 100%; margin-top: 30px; padding: 20px; border-radius: 20px; border: none; background: #000; color: white; font-size: 16px; font-weight: 700; cursor: pointer;">
                შეკვეთის დასრულება
            </button>
        </div>
    `;
}

async function handleFinalOrder() {
    if (!state.tempOrder || !state.tempOrder.paymentMethod) {
        showToast("გთხოვთ აირჩიოთ გადახდის მეთოდი ⚠️");
        return;
    }

    const btn = document.getElementById('final-submit-btn');
    btn.disabled = true;
    btn.innerText = "იგზავნება...";

    const orderId = "#ORD-" + Math.floor(Date.now() / 1000);

    const orderData = {
        action: 'addOrder',
        orderId: orderId,
        date: new Date().toLocaleString('ka-GE'),
        userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "Web-User",
        customerName: state.tempOrder.name,
        phone: state.tempOrder.phone,
        address: state.tempOrder.address,
        items: state.cart.map(item => 
            `${item.name_ge || item.name} (${item.color}, ${item.size}) x${item.quantity}`
        ).join(', '),
        total: state.tempOrder.totalAmount,
        Promo: "None",
        payment_method: state.tempOrder.paymentMethod,
        status: "Pending"
    };

    const SCRIPT_URL = CONFIG.API_URL;

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        showToast("შეკვეთა წარმატებულია! 🎉");
        
        state.cart = [];
        if (typeof updateCartBadge === 'function') updateCartBadge();
        localStorage.removeItem('cart');

        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error("Error:", error);
        showToast("ვერ მოხერხდა გაგზავნა ❌");
        btn.disabled = false;
        btn.innerText = "შეკვეთის დასრულება";
    }
}

// --- აუცილებელი ფუნქციები გადახდის მეთოდების მუშაობისთვის ---

window.selectPaymentMethod = function(method, element) {
    // 1. მოვნიშნოთ ყველა ვარიანტი როგორც "აურჩეველი"
    document.querySelectorAll('.pay-option').forEach(opt => {
        opt.style.borderColor = '#f2f2f7';
        opt.style.background = 'white';
    });

    // 2. მოვნიშნოთ არჩეული ვარიანტი
    element.style.borderColor = '#0071e3';
    element.style.background = '#f0f7ff';
    
    // 3. შევინახოთ არჩეული მეთოდი state-ში
    if (!state.tempOrder) state.tempOrder = {};
    state.tempOrder.paymentMethod = method;
    
    // 4. ბანკის რეკვიზიტების გამოჩენა/დამალვა
    const bankBox = document.getElementById('bank-details-box');
    if (bankBox) {
        bankBox.style.display = (method === 'საბანკო გადარიცხვა') ? 'block' : 'none';
    }
};

window.copyIBAN = function() {
    const ibanText = document.getElementById('iban-text')?.innerText;
    if (!ibanText) return;

    navigator.clipboard.writeText(ibanText).then(() => {
        showToast("IBAN დაკოპირდა! ✅");
    }).catch(() => {
        // fallback მეთოდი თუ clipboard-ზე წვდომა არ არის
        const el = document.createElement('textarea');
        el.value = ibanText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast("IBAN დაკოპირდა! ✅");
    });
};

async function renderProfile() {
    const grid = document.getElementById('products-grid');
    const hero = document.getElementById('hero');
    const mainTitle = document.getElementById('new-arrivals-title');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // პროფილში მენიუ უნდა ჩანდეს
    if (bottomNav) bottomNav.style.display = 'flex';
    
    if (!grid) return;
    if (hero) hero.style.display = 'none';
    if (mainTitle) mainTitle.style.display = 'none';

    // Telegram-ის მონაცემების ამოღება
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const userName = user ? `${user.first_name} ${user.last_name || ''}` : "სტუმარი";
    const userPhoto = user?.photo_url || "https://ui-avatars.com/api/?name=" + userName + "&background=0071e3&color=fff";
    const userId = user ? String(user.id) : "Web-User";

    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 10px; padding-bottom: 120px;">
            <div style="background: white; padding: 30px 20px; border-radius: 32px; border: 1px solid #f2f2f7; text-align: center; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                <div style="position: relative; display: inline-block;">
                    <img src="${userPhoto}" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid #f5f5f7;">
                    <div style="position: absolute; bottom: 5px; right: 5px; width: 18px; height: 18px; background: #34c759; border: 3px solid #fff; border-radius: 50%;"></div>
                </div>
                <h3 style="font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 15px 0 5px 0;">${userName}</h3>
                <p style="font-size: 13px; color: #86868b; margin: 0;">ID: ${userId}</p>
            </div>

            <h2 style="font-size: 18px; font-weight: 700; color: #1d1d1f; margin: 0 0 15px 10px;">შეკვეთების ისტორია</h2>
            
            <div id="orders-history-list">
                <p style="text-align: center; color: #86868b; padding: 20px;">იტვირთება...</p>
            </div>
        </div>
    `;

    // შეკვეთების ჩატვირთვა
    loadUserOrders(userId);
}

async function loadUserOrders(userId) {
    const listContainer = document.getElementById('orders-history-list');
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        
        // ვფილტრავთ შეკვეთებს userId-ით
        const myOrders = data.orders ? data.orders.filter(o => String(o.userId) === userId) : [];

        if (myOrders.length === 0) {
            listContainer.innerHTML = `
                <div style="background: #fbfbfd; padding: 40px 20px; border-radius: 24px; text-align: center; border: 1px dashed #d1d1d6;">
                    <p style="color: #86868b; font-size: 14px;">შეკვეთები ჯერ არ გაგიკეთებიათ</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = myOrders.reverse().map(order => {
            // სტატუსის ფერები
            let color = "#ff9500"; // Pending
            if (order.status === "გზაშია") color = "#0071e3";
            if (order.status === "ჩაბარდა") color = "#34c759";
            if (order.status === "გაუქმდა") color = "#ff3b30";

            return `
                <div style="background: white; padding: 16px; border-radius: 22px; border: 1px solid #f2f2f7; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="font-size: 14px; font-weight: 700; color: #1d1d1f;">${order.orderId}</span>
                        <span style="font-size: 11px; color: #86868b;">${order.date.split(',')[0]}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 13px; color: #424245;">${order.total} ₾</div>
                        <div style="background: ${color}15; color: ${color}; padding: 5px 12px; border-radius: 10px; font-size: 12px; font-weight: 700;">
                            ${order.status}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        listContainer.innerHTML = `<p style="color: #ff3b30; text-align: center;">შეცდომა ჩატვირთვისას</p>`;
    }
}
