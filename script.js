// 1. ტელეგრამის ობიექტის ინიციალიზაცია
const tg = window.Telegram.WebApp;

// 2. აიძულე გაფართოება რამდენჯერმე (დაზღვევისთვის)
tg.ready();
tg.expand();

// ჩაკეტეთ ვერტიკალური სვაიპი, რომ აპლიკაცია არ დაიხუროს ჩამოწევისას
if (tg.disableVerticalSwipes) {
    tg.disableVerticalSwipes();
}

// ზოგიერთ მოწყობილობაზე სჭირდება მცირე დაგვიანება ჩატვირთვისას
setTimeout(() => {
    tg.expand();
}, 200);

setTimeout(() => {
    tg.expand();
}, 500);

// 3. ზედა ზოლის ფერი (Header)
tg.setHeaderColor('#ffffff');
tg.setBackgroundColor('#ffffff');

// --- კონფიგურაცია და მონაცემთა საცავი ---
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxsq8ipEFXn35wez6-EBkMdjbcRV8bffwWvqEXz9TJE91sB9FLPbImL0l-PFXZL4INk/exec'
};

// --- აპლიკაციის მდგომარეობა ---
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
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // დამატებითი დაზღვევა DOM-ის ჩატვირთვისას
        if (tg.disableVerticalSwipes) {
            tg.disableVerticalSwipes();
        }
        
        setTimeout(() => { tg.expand(); }, 200);
        setTimeout(() => { tg.expand(); }, 500);
        setTimeout(() => { tg.expand(); }, 1000);
    }
    loadData();
});

// --- ფუნქცია: მონაცემების წამოღება API-დან და შენახვა state-ში ---
async function loadData() {
    showLoader();
    try {
        // CONFIG.API_URL ახლა უკვე გლობალურად ჩანს
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();
        
        state.products = data.products || [];
        state.productDetails = data.productDetails || [];
        state.paymentSettings = data.paymentSettings || { active_gateway: 'off' };
        
        // პრიორიტეტი 1: ჯერ ვხატავთ ზედა ნაწილს და ბანერებს
        if (data.headerConfig) {
            // ვინახავთ კონფიგურაციას გლობალურად საკონტაქტო მენიუსთვის
            window.lastHeaderConfig = data.headerConfig; 
            applyHeaderDesign(data.headerConfig);
        }
        
        const heroToUse = data.heroConfigs || data.heroConfig;
        if (heroToUse && (Array.isArray(heroToUse) ? heroToUse.length > 0 : Object.keys(heroToUse).length > 0)) {
            applyHeroDesign(heroToUse);
            // აიძულე სექციის ჩვენება
            const heroSection = document.getElementById('hero');
            if (heroSection) heroSection.style.display = 'flex'; // Hero Slider-ს flex სჯობს
        }

        // პრიორიტეტი 2: შემდეგ ვხატავთ პროდუქტებს
        renderProducts();
        
        // როგორც კი მონაცემები დამუშავდება, ეგრევე ვმალავთ Loader-ს
        hideLoader();

    } catch (error) {
        console.error("მონაცემების ჩატვირთვა ვერ მოხერხდა:", error);
        // შეცდომის შეტყობინება მომხმარებლისთვის (სურვილისამებრ)
        hideLoader(); 
    }
}

function applyHeaderDesign(config) {
    if (!config || config.Status !== 'active') return;
    const logoElement = document.getElementById('logo'); 
    const logoIcon = document.getElementById('logo-icon');
    const headerElement = document.querySelector('.header');
    
    const infoContainer = document.getElementById('info-btn-container');

    if (config.Shop_Name && logoElement) logoElement.innerText = config.Shop_Name;
    if (config.H_BG && headerElement) headerElement.style.background = config.H_BG;
    if (config.H_Text && logoElement) logoElement.style.color = config.H_Text;
    if (config.Icon_Color && logoIcon) logoIcon.style.color = config.Icon_Color;
    if (config.H_Height && headerElement) headerElement.style.height = config.H_Height + 'px';
    
    if (infoContainer && !document.getElementById('info-btn')) {
        const infoBtn = document.createElement('div');
        infoBtn.id = 'info-btn';
        infoBtn.onclick = toggleContactModal;
        infoBtn.style.cursor = 'pointer';
        infoBtn.innerHTML = `
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${config.H_Text || '#1d1d1f'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>`;
        infoContainer.appendChild(infoBtn);
    }
    
    if (config.Shop_Logo && logoIcon) {
        logoIcon.style.background = "transparent";
        logoIcon.style.backgroundColor = "transparent";
        logoIcon.style.border = "none";
        const radius = config.Logo_Radius || "0";
        logoIcon.innerHTML = `<img src="${config.Shop_Logo}" style="width: ${config.Logo_Size || 40}px; height: auto; border-radius: ${radius}; object-fit: contain; display: block;">`;
    }
}

function applyHeroDesign(configs) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !configs) return;

    const configList = Array.isArray(configs) ? configs : [configs];
    const activeConfigs = configList.filter(c => c.Status === 'active');
    
    if (activeConfigs.length === 0) {
        heroSection.style.display = 'none';
        return;
    }

    window.lastHeroConfig = activeConfigs;

    heroSection.innerHTML = `
        <div class="hero-slider-container" style="
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            width: 100%;
            gap: 12px;
            padding: 0 16px;
            box-sizing: border-box;
            touch-action: pan-x; /* გაყინავს ვერტიკალურ მოძრაობას სლაიდერზე */
        ">
            ${activeConfigs.map((config, index) => `
                <div class="hero-slide-wrapper" style="
                    min-width: 88%; 
                    scroll-snap-align: start;
                    box-sizing: border-box;
                ">
                    <div class="hero-wrapper" onclick="handleHeroClickByIndex(${index})" style="
                        cursor: pointer;
                        background: ${config.B_Gradient || '#eee'}; 
                        border-radius: 20px; 
                        padding: 25px; 
                        position: relative; 
                        overflow: visible; 
                        margin-top: 10px; 
                        margin-bottom: 25px; 
                        height: ${config.B_Height || 200}px; 
                        display: flex; 
                        align-items: center;
                        box-shadow: 0 15px 30px rgba(0,0,0,0.12);
                    ">
                        <div style="position: relative; z-index: 2; width: 60%;">
                            <h2 style="color: ${config.B_Title_Color || '#fff'}; font-size: 20px; margin-bottom: 8px; font-weight: 700;">${config.B_Title || ''}</h2>
                            <p style="color: #fff; opacity: 0.9; margin-bottom: 15px; font-size: 13px;">${config.B_Subtitle || ''}</p>
                            <button style="padding: 8px 18px; border-radius: 10px; border: none; background: white; font-weight: 800; font-size: 13px; color: #1d1d1f;">
                                ${config.B_Btn_Text || 'ყიდვა'}
                            </button>
                        </div>
                        ${config.B_Image ? `
                            <img src="${config.B_Image}" style="
                                position: absolute; 
                                right: -10px; 
                                top: 0px; 
                                height: 115%; 
                                transform: rotate(-8deg); 
                                z-index: 3;
                                filter: drop-shadow(0 20px 15px rgba(0,0,0,0.4));
                            ">` : ''}
                    </div>
                </div>
            `).join('')}
            <div style="min-width: 4px;"></div>
        </div>
        <div class="hero-dots" style="display: flex; justify-content: center; gap: 8px; margin-top: -10px; margin-bottom: 20px;">
            ${activeConfigs.length > 1 ? activeConfigs.map((_, i) => `
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${i === 0 ? '#1d1d1f' : '#d2d2d7'}; transition: all 0.3s;"></div>
            `).join('') : ''}
        </div>
    `;

    const slider = heroSection.querySelector('.hero-slider-container');
    if (slider) {
        // ბლოკავს გვერდის ზევით-ქვევით წასვლას სლაიდერის სქროლვისას
        slider.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientX) > Math.abs(e.touches[0].clientY)) {
                // თუ ჰორიზონტალური მოძრაობაა, არაფერს ვაკეთებთ
            }
        }, { passive: true });

        slider.addEventListener('scroll', () => {
            const slideWidth = slider.offsetWidth * 0.88;
            const index = Math.round(slider.scrollLeft / slideWidth);
            const dots = heroSection.querySelectorAll('.hero-dots div');
            dots.forEach((dot, i) => {
                if(dot) dot.style.background = i === index ? '#1d1d1f' : '#d2d2d7';
            });
        });
    }

    window.handleHeroClickByIndex = function(index) {
        const config = activeConfigs[index];
        const searchTerm = (config.B_Subtitle || "").toLowerCase().trim();
        const product = state.products.find(p => 
            p.name_ge.toLowerCase().includes(searchTerm) || 
            p.brand.toLowerCase().includes(searchTerm)
        );
        if (product) {
            openProductDetails(product.product_id);
        } else {
            const grid = document.getElementById('products-grid');
            if (grid) grid.scrollIntoView({behavior:'smooth'});
        }
    };

    const scrollStyle = document.createElement('style');
    scrollStyle.innerHTML = `.hero-slider-container::-webkit-scrollbar { display: none; }`;
    document.head.appendChild(scrollStyle);
    
    heroSection.style.display = 'block';
}

// --- "ახალი კოლექცია" და პროდუქტების რენდერი ---
function renderProducts(productsToRender) {
    const grid = document.getElementById('products-grid');
    const mainTitle = document.getElementById('new-arrivals-title');
    
    if (!grid) return;
    
    if (mainTitle) {
        mainTitle.style.fontSize = '18px';
        mainTitle.style.margin = '10px 0 15px 5px';
    }

    grid.innerHTML = '';

    let products = productsToRender || state.products;

    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #86868b;">პროდუქტები ვერ მოიძებნა</p>';
        return;
    }

    const seenIds = new Set();
    const uniqueProducts = products.filter(product => {
        if (!product || !product.product_id) return false; // დაზღვევა ცარიელ მონაცემზე
        const id = String(product.product_id).trim().toLowerCase();
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
    });

    uniqueProducts.forEach(product => {
        const currentProductId = String(product.product_id).trim().toLowerCase();
        
        const productVariants = state.productDetails.filter(d => 
            d && d.product_id && String(d.product_id).trim().toLowerCase() === currentProductId
        );
        
        // 1. ფასის ლოგიკა
        let finalDisplayPrice = '---';
        let oldDisplayPrice = null;
        
        const variantWithPrice = productVariants.find(v => v.Price && v.Price !== 'undefined' && v.Price !== '');
        if (variantWithPrice) {
            finalDisplayPrice = variantWithPrice.Price;
            if (variantWithPrice.Old_Price && variantWithPrice.Old_Price !== 'undefined' && variantWithPrice.Old_Price !== '') {
                oldDisplayPrice = variantWithPrice.Old_Price;
            }
        } else {
            finalDisplayPrice = product.final_price || '---';
        }
        
        // 2. ფერების ლოგიკა (გამოიყენება translateColor ფუნქცია)
        const allColorsInDatabase = productVariants.map(v => v.Colors).filter(c => c && c !== 'undefined');
        const uniqueColors = [...new Set(allColorsInDatabase.map(c => c.trim()))];
        
        const displayedColors = uniqueColors.slice(0, 4);
        const remainingCount = uniqueColors.length - displayedColors.length;
        
        const statusBadge = productVariants.find(v => v.Badge_Status)?.Badge_Status || "";
        const discountVal = parseInt(productVariants.find(v => v.sale_full)?.sale_full || product.discount_percent || 0);

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; width: 100%; height: 160px; background: #fbfbfb; display: flex; align-items: center; justify-content: center; border-radius: 20px 20px 0 0; overflow: hidden;">
                <img src="${product.photo_url_1}" loading="lazy" class="product-img" style="max-width: 85%; max-height: 85%; object-fit: contain;">
                <div style="position: absolute; top: 0; left: 0; display: flex; flex-direction: column; z-index: 10;">
                    ${discountVal > 0 ? `<div style="background: linear-gradient(135deg, #ff3b30, #ff7f50); color: white; padding: 5px 12px; border-radius: 20px 0 12px 0; font-size: 11px; font-weight: 800;">-${discountVal}%</div>` : ''}
                    ${statusBadge && statusBadge !== 'undefined' ? `<div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); color: #1d1d1f; padding: 4px 12px; border-radius: ${discountVal > 0 ? '0 0 12px 0' : '20px 0 12px 0'}; font-size: 10px; font-weight: 800;">${statusBadge.toLowerCase() === 'hot' ? '🔥 ' : ''}${statusBadge}</div>` : ''}
                </div>
            </div>
            <div class="product-details" style="padding: 14px 12px; display: flex; flex-direction: column; flex-grow: 1; background: white; border-radius: 0 0 20px 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <p style="font-size: 10px; color: #86868b; text-transform: uppercase; margin: 0; font-weight: 700;">${product.brand || ''}</p>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div style="display: flex; gap: 3px;">
                            ${displayedColors.map(color => `<div style="width: 10px; height: 10px; border-radius: 50%; background: ${translateColor(color)}; border: 1px solid #e5e5e5;"></div>`).join('')}
                        </div>
                        ${remainingCount > 0 ? `<span style="font-size: 10px; color: #86868b; font-weight: 700;">+${remainingCount}</span>` : ''}
                    </div>
                </div>
                <h3 style="font-size: 13px; font-weight: 600; margin: 0 0 10px 0; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.2; color: #1d1d1f;">
                    ${product.name_ge}
                </h3>
                <div style="margin-top: auto; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px; font-weight: 800; color: #000;">${finalDisplayPrice} ₾</span>
                    ${oldDisplayPrice ? `<span style="font-size: 12px; color: #86868b; text-decoration: line-through; font-weight: 500;">${oldDisplayPrice} ₾</span>` : ''}
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

    let extraImages = [];
    allVariants.forEach(v => {
        ['image2', 'image3', 'image4', 'image5', 'image6'].forEach(key => {
            if (v[key] && v[key].length > 5) extraImages.push(v[key]);
        });
    });

    const allPhotos = [...new Set([product.photo_url_1, ...extraImages])].filter(url => url && url.length > 5);
    const uniqueColors = [...new Set(allVariants.map(v => v.Colors).filter(c => c))];
    
    selectedColor = null;
    selectedSize = null;

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';

    // ფანჯრის ფუნქციები
    window.changeMainImage = function(url, el) {
        const mainImg = document.getElementById('main-detail-img');
        if (mainImg) mainImg.src = url;
        document.querySelectorAll('.thumb-item').forEach(img => img.style.borderColor = '#f2f2f7');
        el.style.borderColor = '#0071e3';
    };

    window.updateSizeOptions = function(color) {
        selectedColor = color;
        selectedSize = null; 
        document.querySelectorAll('.color-dot-option').forEach(node => {
            node.style.boxShadow = node.getAttribute('data-color') === color ? '0 0 0 2px white, 0 0 0 4px #0071e3' : 'none';
            node.style.transform = node.getAttribute('data-color') === color ? 'scale(1.1)' : 'scale(1)';
        });

        const sizeContainer = document.getElementById('size-options-container');
        const availableSizes = allVariants.filter(v => v.Colors === color).map(v => v.Sizes);
        sizeContainer.innerHTML = availableSizes.map(s => `
            <div class="size-option" onclick="selectSize(this, '${s}')" style="flex: 0 0 auto; padding: 12px 20px; border: 1.5px solid #e5e5e7; border-radius: 14px; cursor: pointer; font-weight: 600; min-width: 55px; text-align: center; background: white;">
                ${s}
            </div>`).join('');
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

    window.checkSelection = function() {
        const btn = document.getElementById('add-to-cart-btn');
        if (!btn) return;
        if (selectedColor && selectedSize) {
            btn.disabled = false;
            btn.style.background = '#0071e3';
            btn.style.color = 'white';
            btn.innerText = 'კალათაში დამატება';
            btn.onclick = () => handleAddToCart(product.product_id, selectedColor, selectedSize);
        } else {
            btn.disabled = true;
            btn.style.background = '#f2f2f7';
            btn.style.color = '#aeaeb2';
            btn.innerText = selectedColor ? 'აირჩიეთ ზომა' : 'აირჩიეთ ფერი';
        }
    };

    overlay.innerHTML = `
        <div class="detail-container" style="max-height: 92vh; border-radius: 32px 32px 0 0; background: white; position: fixed; bottom: 0; width: 100%; overflow-y: auto; z-index: 1000;">
            <div style="padding: 0 24px 30px; position: relative;">
                <div style="position: relative; display: flex; justify-content: center; padding: 20px 0 10px 0;">
                    <img id="main-detail-img" src="${allPhotos[0]}" style="width: 100%; max-height: 250px; object-fit: contain;">
                    <button onclick="closeProductDetail()" style="position: absolute; top: 15px; right: 0; background: #f2f2f7; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer;">✕</button>
                </div>
                ${allPhotos.length > 1 ? `<div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 15px;">${allPhotos.map((img, idx) => `<img src="${img}" class="thumb-item" onclick="changeMainImage('${img}', this)" style="width: 54px; height: 54px; object-fit: cover; border-radius: 12px; border: 2px solid ${idx === 0 ? '#0071e3' : '#f2f2f7'};">`).join('')}</div>` : ''}
                <p style="color: #86868b; font-size: 10px; font-weight: 700; text-transform: uppercase;">${product.brand}</p>
                <h2 style="font-size: 19px; font-weight: 700; margin-bottom: 4px;">${product.name_ge}</h2>
                <div style="margin-bottom: 16px;"><span style="font-size: 22px; font-weight: 800; color: #0071e3;">${product.final_price} ₾</span></div>
                <div style="margin-bottom: 18px;">
                    <p style="font-size: 12px; font-weight: 700; color: #8e8e93; margin-bottom: 8px;">ფერი</p>
                    <div style="display: flex; gap: 14px;">
                        ${uniqueColors.map(c => `<div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" style="width: 36px; height: 36px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer;"></div>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <p style="font-size: 12px; font-weight: 700; color: #8e8e93; margin-bottom: 8px;">ზომა</p>
                    <div id="size-options-container" style="display: flex; gap: 10px; overflow-x: auto;">
                        <p style="color: #c7c7cc; font-size: 13px;">ჯერ აირჩიეთ ფერი...</p>
                    </div>
                </div>
                <button class="main-btn" id="add-to-cart-btn" disabled style="width: 100%; padding: 18px; border-radius: 16px; border: none; font-weight: 700;">აირჩიეთ ფერი და ზომა</button>
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
    // უსაფრთხო შედარება String-ის გამოყენებით
    const productData = state.products.find(p => String(p.product_id) === String(productId));

    const existingItem = state.cart.find(item => 
        String(item.id) === String(productId) && 
        item.color === color && 
        item.size === size
    );

    // ფასის ამოღება
    const finalPrice = productData ? (productData.final_price || productData.price) : 0;

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        state.cart.push({ 
            id: productId,
            product_id: productId,
            name_ge: productData ? (productData.name_ge || productData.name) : "პროდუქტი", 
            price: finalPrice, 
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
        btn.style.boxShadow = "0 8px 20px rgba(76, 217, 100, 0.3)";
    }
    
    // ტაქტილური ვიბრაცია (თუ ტელეგრამშია)
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
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
    // 1. ნავიგაციის ვიზუალური განახლება
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // 2. გვერდების გადართვა
    if (page === 'categories') {
        showCategoriesHub();
    } else {
        // სტრუქტურის აღდგენა
        mainContent.innerHTML = `
            <section id="hero" class="hero-section" style="display: none;"></section>
            <section id="content-section" class="section">
                <h2 id="new-arrivals-title" class="section-title">ახალი კოლექცია</h2>
                <div id="products-grid" class="products-grid"></div>
            </section>
        `;

        const hero = document.getElementById('hero');
        const mainTitle = document.getElementById('new-arrivals-title');

        if (page === 'cart') {
            if (hero) hero.style.display = 'none';
            if (mainTitle) mainTitle.style.display = 'none';
            renderCart();
        } else if (page === 'profile') {
            if (hero) hero.style.display = 'none';
            if (mainTitle) mainTitle.style.display = 'none';
            renderProfile();
        } else {
            // 'home' გვერდი
            if (hero) {
                hero.style.display = 'block';
                // პრიორიტეტი: შენახული ბანერების კონფიგურაცია
                if (window.lastHeroConfig) {
                    applyHeroDesign(window.lastHeroConfig);
                }
            }
            if (mainTitle) mainTitle.style.display = 'block';
            
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) bottomNav.style.display = 'flex';
            
            renderProducts();
        }
    }
    window.scrollTo(0, 0);
}

function renderCart() {
    const grid = document.getElementById('products-grid');
    const hero = document.getElementById('hero');
    const mainTitle = document.getElementById('new-arrivals-title');
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';
    
    if (!grid) return;
    if (hero) hero.style.display = 'none';
    if (mainTitle) mainTitle.style.display = 'none';

    grid.innerHTML = '';
    
    const cartHeader = document.createElement('h2');
    cartHeader.style.cssText = 'grid-column: 1/-1; margin: 15px 0 15px 5px; font-size: 22px; font-weight: 800; color: #1d1d1f;';
    cartHeader.innerText = 'ჩემი კალათა';
    grid.appendChild(cartHeader);

    if (state.cart.length === 0) {
        grid.innerHTML += `<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 50px; margin-bottom: 15px;">🛒</div>
            <p style="color: #86868b; font-size: 16px;">კალათა ცარიელია</p>
            <button onclick="handleNavChange('home', document.querySelector('.nav-item'))" style="margin-top: 20px; padding: 12px 24px; border-radius: 20px; border: none; background: #0071e3; color: white; font-weight: 600;">საყიდლებზე დაბრუნება</button>
        </div>`;
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
        const itemTotal = parseFloat(item.price || product.final_price) * item.quantity;
        totalSum += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.style.cssText = 'grid-column: 1/-1; display: flex; align-items: center; gap: 12px; background: white; padding: 14px; border-radius: 22px; margin-bottom: 12px; position: relative; border: 1px solid #f2f2f7; box-shadow: 0 4px 10px rgba(0,0,0,0.02);';
        
        cartItem.innerHTML = `
            <img src="${product.photo_url_1}" style="width: 80px; height: 80px; object-fit: contain; background: #f5f5f7; border-radius: 14px;">
            <div style="flex-grow: 1;">
                <h4 style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin-bottom: 2px;">${product.name_ge}</h4>
                <p style="font-size: 12px; color: #86868b; margin-bottom: 10px;">${item.color} • ${item.size}</p>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: 800; color: #000; font-size: 15px;">${itemTotal.toFixed(2)} ₾</span>
                    <div style="display: flex; align-items: center; background: #f2f2f7; border-radius: 10px; padding: 4px 12px; gap: 14px;">
                        <button onclick="changeQuantity(${index}, -1)" style="border:none; background:none; font-size: 20px; color: #0071e3; cursor: pointer; font-weight: bold;">−</button>
                        <span style="font-size: 14px; font-weight: 800; min-width: 20px; text-align: center;">${item.quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)" style="border:none; background:none; font-size: 20px; color: #0071e3; cursor: pointer; font-weight: bold; ${item.quantity >= stockLimit ? 'opacity: 0.3; pointer-events: none;' : ''}">+</button>
                    </div>
                </div>
            </div>
            <button onclick="removeFromCart(${index})" style="position: absolute; right: 12px; top: 12px; background: #f2f2f7; border: none; color: #86868b; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">✕</button>
        `;
        grid.appendChild(cartItem);
    });

    const footer = document.createElement('div');
    footer.style.cssText = 'grid-column: 1/-1; margin-top: 15px; padding: 24px; background: #f5f5f7; border-radius: 28px;';
    footer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="color: #86868b; font-size: 16px; font-weight: 600;">სულ:</span>
            <strong style="color: #1d1d1f; font-size: 24px; font-weight: 800;">${totalSum.toFixed(2)} ₾</strong>
        </div>
        <button onclick="checkout()" style="width: 100%; padding: 18px; border-radius: 16px; border: none; background: #0071e3; color: white; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 20px rgba(0, 113, 227, 0.2);">შეკვეთის გაფორმება</button>
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
            showToast("მარაგში მეტი არ არის ✋");
            if(window.Telegram && Telegram.WebApp.HapticFeedback) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
            return;
        }
    }
    
    item.quantity += delta;
    if (item.quantity < 1) {
        state.cart.splice(index, 1);
    }
    
    if(window.Telegram && Telegram.WebApp.HapticFeedback) Telegram.WebApp.HapticFeedback.impactOccurred('light');
    
    updateCartBadge();
    renderCart();
}

// ... removeFromCart და showToast იგივე რჩება ...

function checkout() {
    const grid = document.getElementById('products-grid');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (!grid) return;
    if (bottomNav) bottomNav.style.display = 'none';

    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 5px; padding-bottom: 100px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px;">
                <button onclick="renderCart()" style="background: #f5f5f7; border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">←</button>
                <h2 style="font-size: 20px; font-weight: 800; color: #1d1d1f; margin: 0;">მიწოდების ინფორმაცია</h2>
            </div>

            <div style="background: #fff; padding: 24px; border-radius: 30px; border: 1px solid #f2f2f7;">
                ${['order-name', 'order-phone', 'order-address'].map((id, i) => {
                    const labels = ['სრული სახელი', 'ტელეფონის ნომერი', 'მისამართი'];
                    const types = ['text', 'tel', 'text'];
                    const placeholders = ['მაგ: ანა ბერიძე', '5XX XX XX XX', 'ქალაქი, ქუჩა...'];
                    return `
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13px; font-weight: 700; color: #86868b; margin-bottom: 8px; margin-left: 4px;">${labels[i]}</label>
                        ${id === 'order-address' ? 
                            `<textarea id="${id}" placeholder="${placeholders[i]}" style="width: 100%; padding: 16px; border-radius: 14px; border: 1.5px solid #f2f2f7; background: #f9f9fb; font-size: 15px; height: 90px; resize: none; box-sizing: border-box;"></textarea>` :
                            `<input type="${types[i]}" id="${id}" placeholder="${placeholders[i]}" style="width: 100%; padding: 16px; border-radius: 14px; border: 1.5px solid #f2f2f7; background: #f9f9fb; font-size: 15px; box-sizing: border-box;">`
                        }
                    </div>`;
                }).join('')}
                <button onclick="goToPayment()" style="width: 100%; padding: 18px; border-radius: 16px; border: none; background: #000; color: white; font-size: 16px; font-weight: 700; margin-top: 10px;">გადახდაზე გადასვლა →</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleFinalOrder() {
    if (!state.tempOrder || !state.tempOrder.paymentMethod) {
        showToast("გთხოვთ აირჩიოთ გადახდის მეთოდი ⚠️");
        return;
    }

    const btn = document.getElementById('final-submit-btn');
    btn.disabled = true;
    btn.innerText = "მუშავდება...";
    btn.style.opacity = "0.7";

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

    try {
        // ვაგზავნით მონაცემებს
        await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        // წარმატების ეფექტები
        if (window.Telegram?.WebApp?.HapticFeedback) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        showToast("შეკვეთა მიღებულია! 🎉");
        
        // კალათის გასუფთავება
        state.cart = [];
        updateCartBadge();
        localStorage.removeItem('cart');

        // წარმატების ეკრანი
        const grid = document.getElementById('products-grid');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                <h2 style="font-size: 22px; font-weight: 800; color: #1d1d1f;">მადლობა შეკვეთისთვის!</h2>
                <p style="color: #86868b; margin-top: 10px;">თქვენი შეკვეთის ნომერია: ${orderId}</p>
                <button onclick="window.location.reload()" style="margin-top: 30px; padding: 16px 32px; border-radius: 16px; border: none; background: #0071e3; color: white; font-weight: 700;">მთავარზე დაბრუნება</button>
            </div>
        `;

    } catch (error) {
        console.error("Order Error:", error);
        showToast("ვერ მოხერხდა გაგზავნა ❌");
        btn.disabled = false;
        btn.innerText = "შეკვეთის დასრულება";
    }
}
async function loadUserOrders(userId) {
    const listContainer = document.getElementById('orders-history-list');
    if (!listContainer) return;

    try {
        // ვვარაუდობთ, რომ API-ს აქვს getOrders მოქმედება
        const response = await fetch(`${CONFIG.API_URL}?action=getOrders&userId=${userId}`);
        const orders = await response.json();

        if (!orders || orders.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #86868b; padding: 40px;">შეკვეთები ჯერ არ გაქვთ</p>`;
            return;
        }

        listContainer.innerHTML = orders.reverse().map(order => {
            // სტატუსის ფერები
            const statusColors = {
                'Pending': { bg: '#fff9e6', text: '#d4a017', label: 'მუშავდება' },
                'Completed': { bg: '#e6f9ec', text: '#28a745', label: 'დასრულებული' },
                'Cancelled': { bg: '#f9e6e6', text: '#dc3545', label: 'გაუქმებული' }
            };
            const style = statusColors[order.status] || { bg: '#f5f5f7', text: '#86868b', label: order.status };

            return `
                <div style="background: white; padding: 18px; border-radius: 20px; border: 1px solid #f2f2f7; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #aeaeb2; text-transform: uppercase;">${order.orderId}</span>
                            <h4 style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${order.total} ₾</h4>
                        </div>
                        <span style="background: ${style.bg}; color: ${style.text}; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800;">${style.label}</span>
                    </div>
                    <p style="font-size: 12px; color: #86868b; line-height: 1.4; margin-bottom: 8px;">${order.items}</p>
                    <div style="font-size: 10px; color: #aeaeb2; border-top: 1px solid #f5f5f7; pt: 8px; margin-top: 8px;">
                        📅 ${order.date}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        listContainer.innerHTML = `<p style="text-align: center; color: #ff3b30; padding: 20px;">მონაცემების ჩატვირთვა ვერ მოხერხდა</p>`;
    }
}

function applyQuickFilter(type, value, secondaryValue = null) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    let filteredProducts = [];

    if (type === 'price') {
        filteredProducts = state.products.filter(p => {
            const price = parseFloat(p.final_price || p.price);
            return price >= value && price <= secondaryValue;
        });
    } else if (type === 'color') {
        filteredProducts = state.products.filter(p => {
            const details = state.productDetails.filter(d => String(d.product_id) === String(p.product_id));
            return details.some(d => String(d.Colors).trim() === value);
        });
    } else if (type === 'size') {
        filteredProducts = state.products.filter(p => {
            const details = state.productDetails.filter(d => String(d.product_id) === String(p.product_id));
            return details.some(d => String(d.Sizes).trim() === value);
        });
    }

    // შედეგების რენდერი
    const resGrid = document.getElementById('filter-results-grid');
    if (resGrid) {
        resGrid.innerHTML = '';
        if (filteredProducts.length === 0) {
            resGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #86868b; padding: 40px;">პროდუქტები ვერ მოიძებნა 🔍</p>`;
        } else {
            // დროებით ვუცვლით ID-ს renderProducts-ისთვის
            const originalId = resGrid.id;
            resGrid.id = 'products-grid';
            renderProducts(filteredProducts);
            resGrid.id = originalId;
        }
    }
}
function translateColor(color) {
    const colors = {
        'შავი': '#000000',
        'თეთრი': '#ffffff',
        'წითელი': '#ff3b30',
        'ლურჯი': '#0071e3',
        'მწვანე': '#34c759',
        'ყვითელი': '#ffcc00',
        'ნაცრისფერი': '#8e8e93',
        'ვარდისფერი': '#ff2d55',
        'ყავისფერი': '#a2845e'
    };
    return colors[color.trim()] || '#e5e5e5';
}
// დაამატე ეს CSS შენს style თეგში ან ფაილში
const style = document.createElement('style');
style.innerHTML = `
    .hub-banner-large:active, .hub-banner-small:active {
        transform: scale(0.97);
        transition: 0.1s;
    }
    .categories-hub > div {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .filter-page div::-webkit-scrollbar {
        display: none; /* მალავს სკროლბარს მობილურზე */
    }
`;
document.head.appendChild(style);


// აი აქ ჩასვი:
function applyQuickFilter(filterType, param1, param2) {
    if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    const filtered = state.products.filter(product => {
        const currentId = String(product.product_id).trim().toLowerCase();
        const details = state.productDetails.find(d => 
            String(d.product_id).trim().toLowerCase() === currentId
        );

        if (!details) return false;

        if (filterType === 'price') {
            const price = parseFloat(details.Price) || 0;
            return price >= param1 && price <= param2;
        }

        if (filterType === 'color') {
            const colors = String(details.Colors).toLowerCase();
            return colors.includes(param1.toLowerCase());
        }

        if (filterType === 'size') {
            const sizes = String(details.Sizes).toLowerCase();
            return sizes.includes(param1.toLowerCase());
        }

        return true;
    });

    const resGrid = document.getElementById('filter-results-grid');
    if (resGrid) {
        const tempId = resGrid.id;
        resGrid.id = 'products-grid';
        renderProducts(filtered);
        resGrid.id = tempId;
        
        if (filtered.length === 0) {
            resGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #86868b;">ამ ფილტრით პროდუქტები ვერ მოიძებნა</p>';
        }
    }
}

// დამხმარე ფუნქცია გვერდის დასარენდერებლად (კოდი რომ არ გაორდეს)
function renderCustomPage(products, title, subtitle) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="custom-page-wrapper" style="animation: fadeIn 0.4s ease; padding-bottom: 80px;">
            <div style="padding: 25px 16px 15px 16px; display: flex; align-items: center; gap: 12px;">
                <button onclick="showCategoriesHub()" style="background: none; border: none; padding: 0; cursor: pointer;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div>
                    <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #1d1d1f;">${title}</h1>
                    <p style="color: #86868b; font-size: 13px; margin: 2px 0 0 0;">${subtitle}</p>
                </div>
            </div>
            <div id="custom-products-grid" class="products-grid" style="padding: 0 16px;"></div>
        </div>
    `;

    const customGrid = document.getElementById('custom-products-grid');
    const tempId = customGrid.id;
    customGrid.id = 'products-grid'; 
    renderProducts(products);
    customGrid.id = tempId;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
   
// ტაბების გააქტიურების ფუნქცია
function updateActiveTab(tabName) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        const label = item.querySelector('span')?.innerText;
        if (label && label.includes('კატეგორია') && tabName === 'categories') {
            item.classList.add('active');
        }
    });
}

// 1. ბრენდების სიის გამოტანის ფუნქცია (ოპტიმიზირებული)
// 1. ბრენდების სიის გამოტანის ფუნქცია (ოპტიმიზირებული)
function renderBrandsList() {
    const mainContent = document.getElementById('main-content');
    
    // ვიყენებთ უკვე არსებულ მონაცემებს state-დან ინტერნეტის ლოდინის გარეშე
    const products = state.productDetails || [];

    if (products.length === 0) {
        mainContent.innerHTML = '<div style="text-align:center; padding:50px;"><div class="shoe-animation">👟</div><p>იტვირთება...</p></div>';
        // თუ state ცარიელია, ვცდილობთ მონაცემების თავიდან წამოღებას
        loadData().then(() => renderBrandsList());
        return;
    }

    const uniqueBrands = [...new Set(products.map(p => p.brand))].filter(b => b && b.trim() !== "");
    uniqueBrands.sort();

    mainContent.innerHTML = `
        <div style="padding: 20px 12px; animation: fadeIn 0.4s ease;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <button onclick="showCategoriesHub()" style="background: #f0f0f2; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">←</button>
                <h1 style="font-size: 22px; font-weight: 800; margin: 0;">ბრენდები</h1>
            </div>
            
            <div class="brands-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                ${uniqueBrands.map(brandName => {
                    const count = products.filter(p => p.brand === brandName).length;
                    return `
                        <div class="brand-item" onclick="filterByBrand('${brandName}')" 
                             style="background: #ffffff; height: 100px; display: flex; align-items: center; justify-content: center; border-radius: 18px; cursor: pointer; border: 1px solid #f2f2f7; box-shadow: 0 4px 12px rgba(0,0,0,0.03); padding: 10px; transition: transform 0.2s ease; position: relative; margin-top: 5px;">
                            
                            <div style="position: absolute; top: -6px; right: -4px; background: #1d1d1f; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                ${count}
                            </div>

                            <div style="font-weight: 800; font-size: 14px; color: #1d1d1f; text-align: center; letter-spacing: -0.2px;">
                                ${brandName}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

// 2. ფილტრაციის ფუნქცია (წამიერი ლოკალური ფილტრი)
function filterByBrand(brandName) {
    if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    const mainContent = document.getElementById('main-content');
    const allProducts = state.productDetails || [];

    // ფილტრაცია პირდაპირ მეხსიერებიდან
    const brandEntries = allProducts.filter(p => 
        p.brand && p.brand.trim().toLowerCase() === brandName.trim().toLowerCase()
    );

    const groupedMap = {};
    brandEntries.forEach(entry => {
        const productName = entry.Name || entry.name_ge;
        if (!groupedMap[productName]) {
            groupedMap[productName] = { ...entry };
        }
    });

    const filtered = Object.values(groupedMap);

    mainContent.innerHTML = `
        <div style="padding: 20px 16px 10px 16px; animation: fadeIn 0.3s ease;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <button onclick="renderBrandsList()" style="background: #f0f0f2; border: none; width: 38px; height: 38px; border-radius: 50%; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;">←</button>
                <h1 style="font-size: 24px; font-weight: 800; margin: 0;">${brandName}</h1>
            </div>
        </div>
        <div id="products-grid" class="products-grid" style="padding: 0 16px 20px 16px;"></div>
    `;

    renderProducts(filtered);
    window.scrollTo(0, 0);
}

// --- 1. ფუნქცია: მენიუს გამოჩენა/დამალვა ---
function toggleContactModal() {
    const modal = document.getElementById('contact-modal');
    const overlay = document.getElementById('modal-overlay');
    const tg = window.Telegram?.WebApp;
    
    if (!modal || !overlay) {
        console.error("მოდალური ფანჯრის ელემენტები ვერ მოიძებნა!");
        return;
    }

    if (modal.style.top === '0px') {
        // დახურვა
        modal.style.top = '-65%';
        overlay.style.display = 'none';
        if (tg?.BackButton) tg.BackButton.hide();
    } else {
        // გახსნა
        renderContactModal(); // მონაცემების გენერირება
        modal.style.top = '0px';
        overlay.style.display = 'block';
        
        // Telegram-ის Back Button ინტეგრაცია
        if (tg?.BackButton) {
            tg.BackButton.show();
            tg.BackButton.offClick(); // დუბლირების თავიდან ასაცილებლად
            tg.BackButton.onClick(() => toggleContactModal());
        }
    }
}

// --- 2. ფუნქცია: მონაცემების ჩაწერა ფანჯარაში ---
function renderContactModal() {
    const list = document.getElementById('contact-list');
    const config = window.lastHeaderConfig || {};
    if (!list) return;

    // ფუნქცია, რომელიც უსაფრთხოდ ასუფთავებს ნომერს
    const cleanPhone = (val) => val ? String(val).replace('+', '').replace(/\s/g, '') : '';

    const contacts = [
        { label: 'ტელეფონი', val: config.Shop_Phone, icon: '📞', link: `tel:${config.Shop_Phone}`, color: '#34c759' },
        { label: 'მისამართი', val: config.Shop_Address, icon: '📍', link: `https://www.google.com/maps/search/${encodeURIComponent(config.Shop_Address || '')}`, color: '#ff3b30' },
        { label: 'Facebook', val: config.Shop_Facebook ? 'გვეწვიეთ ფეისბუქზე' : null, icon: '🔵', link: config.Shop_Facebook, color: '#1877f2' },
        { label: 'Instagram', val: config.Shop_Insta, icon: '📸', link: String(config.Shop_Insta || '').includes('http') ? config.Shop_Insta : `https://instagram.com/${String(config.Shop_Insta || '').replace('@','')}`, color: '#e1306c' },
        { label: 'TikTok', val: config.Shop_TikTok ? 'ჩვენი ვიდეოები' : null, icon: '📱', link: config.Shop_TikTok, color: '#000000' },
        { label: 'WhatsApp', val: config.Shop_WhatsApp ? 'მოგვწერეთ WhatsApp-ზე' : null, icon: '🟢', link: `https://wa.me/${cleanPhone(config.Shop_WhatsApp)}`, color: '#25d366' },
        { label: 'Email', val: config.Shop_Email, icon: '✉️', link: `mailto:${config.Shop_Email}`, color: '#5856d6' }
    ];

    const active = contacts.filter(c => c.val && String(c.val).trim() !== '' && String(c.val) !== 'undefined');

list.innerHTML = active.map(c => `
    <a href="${c.link}" target="_blank" style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: white; border-radius: 16px; text-decoration: none; color: #1c1c1e; border: 1px solid rgba(0,0,0,0.03); margin-bottom: 4px;">
        <div style="font-size: 18px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f5f5f7; border-radius: 10px; border-left: 3px solid ${c.color};">${c.icon}</div>
        <div style="display: flex; flex-direction: column;">
            <span style="font-size: 9px; color: #8e8e93; font-weight: 700; text-transform: uppercase;">${c.label}</span>
            <span style="font-size: 13px; font-weight: 600;">${c.val}</span>
        </div>
    </a>
`).join('');
}


