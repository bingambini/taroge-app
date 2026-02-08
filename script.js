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

function showLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.remove('loader-hidden'); 
}

function hideLoader() { 
    const loader = document.getElementById('loader-wrapper');
    if (loader) loader.classList.add('loader-hidden'); 
}

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

// 6. პროდუქტების რენდერი (გასწორებული ფერების ლოგიკით)
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.products.forEach(product => {
        // ID-ის გასუფთავება ზედმეტი ჰარებისგან
        const currentProductId = String(product.product_id).trim().toLowerCase();

        // 1. ვეძებთ ყველა ვარიანტს Product_Details-ში
        const productVariants = state.productDetails.filter(d => 
            String(d.product_id).trim().toLowerCase() === currentProductId
        );

        // 2. მხოლოდ იმ ფერებს ვიღებთ, სადაც მარაგია
        const availableVariants = productVariants.filter(v => parseInt(v.stock_quantity || 0) > 0);
        const uniqueColors = [...new Set(availableVariants.map(v => v.Colors).filter(c => c))];
        
        // 3. ბეიჯის ტექსტი (ავიღებთ პირველივე ვარიანტიდან)
        const statusBadge = productVariants.find(v => v.Badge_Status)?.Badge_Status || "";

        // 4. ფასდაკლების პროცენტი (Products ტაბიდან)
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
                            return `<div style="width: 14px; height: 14px; border-radius: 50%; background: ${hexColor}; border: 1px solid #e5e5e5; box-shadow: inset 0 0 2px rgba(0,0,0,0.1);"></div>`;
                        }).join('')}
                    </div>
                </div>
                
                <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 10px 0; height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; color: #1d1d1f;">
                    ${product.name_ge}
                </h3>
                
                <div style="margin-top: auto; display: flex; align-items: baseline; gap: 8px;">
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
    let activeColor = null;
    selectedSize = null;

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';
    
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

        // ჰორიზონტალური სკროლისთვის ვიყენებთ flex-nowrap-ს
        sizeContainer.innerHTML = availableSizes.map(s => `
            <div class="size-option" onclick="selectSize(this, '${s}')" 
                 style="flex: 0 0 auto; padding: 12px 20px; border: 1.5px solid #e5e5e7; border-radius: 14px; cursor: pointer; font-weight: 600; min-width: 55px; text-align: center; transition: all 0.2s ease; background: white;">
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
        <div class="detail-container" style="max-height: 85vh; border-radius: 24px 24px 0 0; background: white;">
            <div class="detail-header" style="padding: 12px 20px 0; display: flex; justify-content: flex-end;">
                <button onclick="closeProductDetail()" style="background: #f5f5f7; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: #86868b;">✕</button>
            </div>
            
            <div style="display: flex; justify-content: center; padding: 0 20px;">
                <img src="${product.photo_url_1}" style="max-width: 90%; max-height: 240px; object-fit: contain;">
            </div>

            <div style="padding: 15px 25px 30px;">
                <p style="color: #0071e3; text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; margin-bottom: 4px;">${product.brand}</p>
                <h2 style="font-size: 22px; font-weight: 700; color: #1d1d1f; line-height: 1.2; margin-bottom: 8px;">${product.name_ge}</h2>
                
                <div style="margin-bottom: 20px;">
                    <span style="font-size: 26px; font-weight: 800; color: #1d1d1f;">${product.final_price} ₾</span>
                </div>

                <p style="font-size: 13px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px;">ფერი</p>
                <div style="display: flex; gap: 14px; margin-bottom: 20px;">
                    ${uniqueColors.map(c => `
                        <div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" 
                             style="width: 30px; height: 30px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer; transition: all 0.3s ease;">
                        </div>
                    `).join('')}
                </div>

                <p style="font-size: 13px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px;">ზომა</p>
                <div id="size-options-container" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; -webkit-overflow-scrolling: touch; scrollbar-width: none;">
                    <p style="color: #86868b; font-size: 12px;">ჯერ აირჩიეთ ფერი...</p>
                </div>

                <div style="margin-top: 20px;">
                    <button class="main-btn" id="add-to-cart-btn" disabled 
                            onclick="handleAddToCart('${product.product_id}', '${activeColor}', '${selectedSize}')" 
                            style="width: 100%; padding: 18px; border-radius: 16px; border: none; background: #86868b; color: white; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: 0.5;">
                        აირჩიეთ ფერი და ზომა
                    </button>
                </div>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

    // მთავარი შემოწმების ფუნქცია
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
        <div class="detail-container" style="max-height: 92vh; border-radius: 30px 30px 0 0;">
            <div class="detail-header" style="padding: 15px 20px 5px; display: flex; justify-content: flex-end;">
                <button onclick="closeProductDetail()" style="background: #f5f5f7; border: none; width: 35px; height: 35px; border-radius: 50%; font-size: 14px; cursor: pointer; color: #86868b;">✕</button>
            </div>
            
            <div style="display: flex; justify-content: center; padding: 10px 20px;">
                <img src="${product.photo_url_1}" style="max-width: 100%; max-height: 280px; object-fit: contain;">
            </div>

            <div style="padding: 20px 25px 40px;">
                <p style="color: #0071e3; text-transform: uppercase; font-size: 13px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; font-family: 'SF Pro Display', sans-serif;">${product.brand}</p>
                <h2 style="font-size: 24px; font-weight: 700; color: #1d1d1f; line-height: 1.2; margin-bottom: 12px;">${product.name_ge}</h2>
                
                <div style="margin-bottom: 30px;">
                    <span style="font-size: 28px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.5px;">${product.final_price} ₾</span>
                </div>

                <p style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 15px;">ფერი</p>
                <div style="display: flex; gap: 15px; margin-bottom: 30px;">
                    ${uniqueColors.map(c => `
                        <div class="color-dot-option" 
                             data-color="${c}"
                             onclick="updateSizeOptions('${c}')" 
                             style="width: 32px; height: 32px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                        </div>
                    `).join('')}
                </div>

                <p style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 15px;">ზომა</p>
                <div id="size-options-container" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 35px; min-height: 48px;">
                    </div>

                <button class="main-btn" id="add-to-cart-btn" disabled 
                        onclick="handleAddToCart('${product.product_id}', '${activeColor}', '${selectedSize}')" 
                        style="width: 100%; padding: 20px; border-radius: 18px; border: none; background: #86868b; color: white; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; opacity: 0.5;">
                    აირჩიეთ ფერი და ზომა
                </button>
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
