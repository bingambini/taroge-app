/**
 * 1. ძირითადი კონფიგურაცია
 * API_URL - ბმული, საიდანაც მოაქვს მონაცემები Google Sheets-იდან
 */
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzfoJLltxIO6mkRgRs1H-kf7eubu9quktfij9czu50-kqgPM_Hqc9sBUUZtiJe8qqrCAw/exec'
};

/**
 * 2. აპლიკაციის მდგომარეობა (State)
 * აქ ინახება ჩატვირთული პროდუქტები, დეტალები და კალათა
 */
let state = {
    products: [],
    productDetails: [],
    design: {},
    cart: []
};

let selectedSize = null; // არჩეული ზომის დროებითი შენახვა

/**
 * 3. ფერების მთარგმნელი
 * ტექსტური ფერები გადაჰყავს CSS-ისთვის გასაგებ ფორმატში
 */
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

/**
 * 4. ლოუდერის მართვა
 * ფუნქციები ჩატვირთვის ინდიკატორის გამოჩენისა და გაქრობისთვის
 */
function showLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.remove('loader-hidden'); 
}

function hideLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.add('loader-hidden'); 
}

/**
 * 5. საწყისი ჩატვირთვა
 * როცა გვერდი გაიხსნება, ამზადებს Telegram-ს და იწყებს მონაცემების წამოღებას
 */
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    loadData();
});

/**
 * 6. მონაცემების წამოღება (Fetch)
 * უკავშირდება Google Sheets-ს და ავსებს state-ს
 */
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

/**
 * 7. ჰედერის დიზაინის მორგება
 * აყენებს ლოგოს, მაღაზიის სახელს და ფერებს ცხრილის მიხედვით
 */
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

/**
 * 8. მთავარი ბანერის (Hero) დიზაინი
 * აშენებს სარეკლამო ბლოკს ტექსტით და ფოტოთი
 */
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

/**
 * 9. პროდუქტების გამოჩენა მთავარ გვერდზე
 * ქმნის ბარათებს ფერებით, ფასით და ბეიჯებით
 */
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
            <div class="product-image-container">
                <img src="${product.photo_url_1}" loading="lazy" class="product-img">
                <div class="badge-container">
                    ${discountVal > 0 ? `<div class="discount-badge">-${discountVal}%</div>` : ''}
                    ${statusBadge && statusBadge !== 'undefined' ? `<div class="status-badge">${statusBadge}</div>` : ''}
                </div>
            </div>
            <div class="product-details">
                <div class="brand-row">
                    <p class="brand-name">${product.brand || ''}</p>
                    <div class="color-preview">
                        ${uniqueColors.map(color => `<div style="background: ${translateColor(color.trim())};" class="tiny-color-dot"></div>`).join('')}
                    </div>
                </div>
                <h3 class="product-title">${product.name_ge}</h3>
                <div class="price-row">
                    <span class="price-tag">${product.final_price} ₾</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

/**
 * 10. პროდუქტის დეტალური გვერდი (Overlay)
 * ხსნის ფანჯარას, სადაც მომხმარებელი ირჩევს ფერს და ზომას
 */
function openProductDetails(productId) {
    const product = state.products.find(p => String(p.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase());
    if (!product) return;

    const allVariants = state.productDetails.filter(d => 
        String(d.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase() && 
        parseInt(d.stock_quantity || 0) > 0
    );

    const uniqueColors = [...new Set(allVariants.map(v => v.Colors).filter(c => c))];
    let activeColor = null;
    selectedSize = null;

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';
    
    // შიდა ფუნქცია: ზომების განახლება ფერის არჩევისას
    window.updateSizeOptions = function(color) {
        activeColor = color;
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
                 style="flex: 0 0 auto; padding: 12px 20px; border: 1.5px solid #e5e5e7; border-radius: 14px; cursor: pointer; font-weight: 600; min-width: 55px; text-align: center; transition: all 0.2s ease; background: white;">
                ${s}
            </div>
        `).join('');
        
        checkSelection();
    };

    // შიდა ფუნქცია: ზომის მონიშვნა
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

    // შიდა ფუნქცია: ღილაკის გააქტიურების შემოწმება
    function checkSelection() {
        const btn = document.getElementById('add-to-cart-btn');
        if (activeColor && selectedSize) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.background = '#0071e3';
            btn.innerText = 'კალათაში დამატება';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.background = '#86868b';
            btn.innerText = 'აირჩიეთ ფერი და ზომა';
        }
    }

    overlay.innerHTML = `
        <div class="detail-container">
            <div class="detail-header">
                <button onclick="closeProductDetail()" class="close-x">✕</button>
            </div>
            <div class="detail-img-box">
                <img src="${product.photo_url_1}" style="max-width: 90%; max-height: 240px; object-fit: contain;">
            </div>
            <div class="detail-content">
                <p class="brand-label">${product.brand}</p>
                <h2 class="product-name-large">${product.name_ge}</h2>
                <div class="price-large">${product.final_price} ₾</div>

                <p class="section-title">ფერი</p>
                <div class="color-options">
                    ${uniqueColors.map(c => `
                        <div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" 
                             style="background: ${translateColor(c)};">
                        </div>
                    `).join('')}
                </div>

                <p class="section-title">ზომა</p>
                <div id="size-options-container" class="horizontal-scroll-sizes">
                    <p style="color: #86868b; font-size: 12px;">ჯერ აირჩიეთ ფერი...</p>
                </div>

                <div style="margin-top: 20px;">
                    <button class="main-btn" id="add-to-cart-btn" disabled 
                            onclick="handleAddToCart('${product.product_id}', '${activeColor}', '${selectedSize}')">
                        აირჩიეთ ფერი და ზომა
                    </button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

/**
 * 11. დეტალური ფანჯრის დახურვა
 */
function closeProductDetail() { 
    document.getElementById('active-overlay')?.remove(); 
    document.body.style.overflow = 'auto';
    selectedSize = null;
}

/**
 * 12. კალათაში დამატება
 * ამატებს არჩეულ პროდუქტს მასივში და ანახლებს კალათის ნიშნულს (Badge)
 */
function handleAddToCart(productId, color, size) {
    state.cart.push({ id: productId, color: color, size: size });
    
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

/**
 * 13. ნავიგაციის მენიუს მართვა
 */
function handleNavChange(page, element) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
}
