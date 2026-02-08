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

    // 1. ვიღებთ ყველა ვარიანტს ამ ID-სთვის
    const allVariants = state.productDetails.filter(d => 
        String(d.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase() && 
        parseInt(d.stock_quantity || 0) > 0
    );

    // 2. ვიღებთ უნიკალურ ფერებს
    const uniqueColors = [...new Set(allVariants.map(v => v.Colors).filter(c => c))];
    
    // საწყისად ვირჩევთ პირველ ფერს
    let activeColor = uniqueColors[0];
    selectedSize = null; 

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';
    
    // ფუნქცია, რომელიც ანახლებს ზომებს ფერის შეცვლისას
    window.updateSizeOptions = function(color) {
        activeColor = color;
        selectedSize = null; // ზომის არჩევანი იშლება ფერის შეცვლისას
        
        const sizeContainer = document.getElementById('size-options-container');
        const colorNodes = document.querySelectorAll('.color-dot-option');
        
        // ფერების მარკირება
        colorNodes.forEach(node => {
            node.style.borderColor = node.getAttribute('data-color') === color ? '#0071e3' : '#eee';
            node.style.transform = node.getAttribute('data-color') === color ? 'scale(1.1)' : 'scale(1)';
        });

        // ამ ფერის შესაბამისი ზომების გაფილტვრა
        const availableSizes = allVariants
            .filter(v => v.Colors === color)
            .map(v => v.Sizes);

        sizeContainer.innerHTML = availableSizes.map(s => `
            <div class="size-option" onclick="selectSize(this, '${s}')" 
                 style="padding:10px 15px; border:1px solid #ddd; border-radius:12px; cursor:pointer; font-weight: 600; min-width: 45px; text-align: center; transition: 0.2s;">
                ${s}
            </div>
        `).join('');
    };

    overlay.innerHTML = `
        <div class="detail-container" style="max-height: 90vh; overflow-y: auto;">
            <div class="detail-header" style="position: sticky; top: 0; background: white; z-index: 100; padding: 10px; display: flex; justify-content: flex-end;">
                <button onclick="closeProductDetail()" class="close-btn" style="background: #f5f5f7; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">✕</button>
            </div>
            
            <div class="detail-image" style="display: flex; justify-content: center; align-items: center; padding: 20px;">
                <img src="${product.photo_url_1}" style="max-width: 100%; max-height: 250px; object-fit: contain;">
            </div>

            <div class="detail-info" style="padding: 0 20px 30px;">
                <p style="color: #86868b; text-transform: uppercase; font-size: 12px; font-weight: 700; margin-bottom: 5px;">${product.brand}</p>
                <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 15px;">${product.name_ge}</h2>
                
                <div style="margin-bottom: 25px;">
                    <span style="font-size: 24px; font-weight: 800; color: #1d1d1f;">${product.final_price} ₾</span>
                </div>

                <p style="font-size: 13px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px;">ფერები:</p>
                <div style="display: flex; gap: 12px; margin-bottom: 25px;">
                    ${uniqueColors.map(c => `
                        <div class="color-dot-option" 
                             data-color="${c}"
                             onclick="updateSizeOptions('${c}')" 
                             style="width: 34px; height: 34px; border-radius: 50%; background: ${translateColor(c)}; border: 2px solid #eee; cursor: pointer; transition: 0.3s; box-shadow: inset 0 0 3px rgba(0,0,0,0.1);">
                        </div>
                    `).join('')}
                </div>

                <p style="font-size: 13px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px;">აირჩიე ზომა:</p>
                <div id="size-options-container" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px;">
                    </div>

                <button class="main-btn" id="add-to-cart-btn" onclick="handleAddToCart('${product.product_id}')" 
                        style="width: 100%; padding: 16px; border-radius: 14px; border: none; background: #0071e3; color: white; font-size: 16px; font-weight: 700; cursor: pointer;">
                    კალათაში დამატება
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // პირველივე ფერის ზომების ჩატვირთვა
    if (uniqueColors.length > 0) {
        updateSizeOptions(uniqueColors[0]);
    }
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
