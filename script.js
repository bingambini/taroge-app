// 1. ტელეგრამის ობიექტის ინიციალიზაცია
const tg = window.Telegram.WebApp;

// 2. აიძულე გაფართოება რამდენჯერმე (დაზღვევისთვის)
tg.ready();
tg.expand();

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
    API_URL: 'https://script.google.com/macros/s/AKfycbwIFL56xyH2ZVrbaWmY_tNBN7LzVwG5CNg2MAP0hg4s7YsH15vPdXOOLYr9jO80B4SAbQ/exec'
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
        
        setTimeout(() => { tg.expand(); }, 200);
        setTimeout(() => { tg.expand(); }, 500);
        setTimeout(() => { tg.expand(); }, 1000);
    }
    loadData();
});

async function loadData() {
    // 1. მყისიერი რენდერი ქეშიდან
    const cachedEssential = localStorage.getItem('essential_data');
    if (cachedEssential) {
        try {
            const cached = JSON.parse(cachedEssential);
            state.products = cached.products || [];
            if (cached.headerConfig) applyHeaderDesign(cached.headerConfig);
            if (cached.heroToUse) applyHeroDesign(cached.heroToUse);
            renderProducts();
        } catch(e) { console.warn("Cache error:", e); }
    } else {
        showLoader();
    }

    try {
        // --- ეტაპი 1: მხოლოდ კრიტიკული მონაცემების წამოღება (Action: getEssentialData) ---
        // აქ ვამატებთ პარამეტრს, რომ სერვერმა სწრაფად გვიპასუხოს
        const essentialUrl = CONFIG.API_URL + (CONFIG.API_URL.includes('?') ? '&' : '?') + 'action=getEssentialData';
        const response = await fetch(essentialUrl);
        const data = await response.json();
        
        state.products = data.products || [];
        const heroToUse = data.heroConfigs || data.heroConfig;
        
        // ქეშის განახლება
        localStorage.setItem('essential_data', JSON.stringify({
            products: state.products,
            headerConfig: data.headerConfig,
            heroToUse: heroToUse
        }));

        // ვიზუალის განახლება
        if (data.headerConfig) {
            window.lastHeaderConfig = data.headerConfig; 
            applyHeaderDesign(data.headerConfig);
        }
        
        if (heroToUse) {
            applyHeroDesign(heroToUse);
            const heroSection = document.getElementById('hero');
            if (heroSection) heroSection.style.display = 'block';
        }

        renderProducts();
        hideLoader(); // აპლიკაცია მზადაა!

        // --- ეტაპი 2: ფონური ჩატვირთვა (Action: getAppData - სრული მონაცემები) ---
        const fullDataUrl = CONFIG.API_URL + (CONFIG.API_URL.includes('?') ? '&' : '?') + 'action=getAppData';
        
        fetch(fullDataUrl)
            .then(res => res.json())
            .then(fullData => {
                // გადავცემთ მონაცემებს ფონურ დამამუშავებელს
                loadDetailsInBackground(fullData);
            })
            .catch(err => console.warn("Background fetch failed:", err));

    } catch (error) {
        console.error("ჩატვირთვა ვერ მოხერხდა:", error);
        hideLoader();
    }
}

// ეს ფუნქცია უცვლელია, უბრალოდ დარწმუნდი რომ გაქვს
function loadDetailsInBackground(allData) {
    console.log("Starting background optimization...");
    state.productDetails = allData.productDetails || [];
    state.paymentSettings = allData.paymentSettings || { active_gateway: 'off' };
    state.orders = allData.orders || []; // თუ orders-იც გჭირდება
    console.log("Background data ready. ✅");
}

function applyHeaderDesign(config) {
    if (!config || config.Status !== 'active') return;
    const logoElement = document.getElementById('logo'); 
    const logoIcon = document.getElementById('logo-icon');
    const headerElement = document.querySelector('.header');
    
    // ვამატებთ კონტეინერის ძებნას აიქონისთვის
    const infoContainer = document.getElementById('info-btn-container');

    if (config.Shop_Name && logoElement) logoElement.innerText = config.Shop_Name;
    if (config.H_BG && headerElement) headerElement.style.background = config.H_BG;
    if (config.H_Text && logoElement) logoElement.style.color = config.H_Text;
    if (config.Icon_Color && logoIcon) logoIcon.style.color = config.Icon_Color;
    if (config.H_Height && headerElement) headerElement.style.height = config.H_Height + 'px';
    
    // აიქონის ჩასმის ლოგიკა (ტელეფონის ლამაზი აიქონი)
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

// --- ბანერის დიზაინის შესწორება (მრავალჯერადი სლაიდერი) ---
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
            padding-left: 16px; 
            padding-right: 16px;
            box-sizing: border-box;
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
                        margin-top: 20px; 
                        margin-bottom: 25px; 
                        height: ${config.B_Height || 200}px; 
                        display: flex; 
                        align-items: center;
                        box-shadow: 0 15px 30px rgba(0,0,0,0.12);
                        transform: translateY(-5px);
                        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    ">
                        <div style="position: relative; z-index: 2; width: 60%;">
                            <h2 style="color: ${config.B_Title_Color || '#fff'}; font-size: 20px; margin-bottom: 8px; font-weight: 700;">${config.B_Title || ''}</h2>
                            <p style="color: #fff; opacity: 0.9; margin-bottom: 15px; font-size: 13px;">${config.B_Subtitle || ''}</p>
                            <button style="padding: 8px 18px; border-radius: 10px; border: none; background: white; font-weight: 800; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: #1d1d1f;">
                                ${config.B_Btn_Text || 'ყიდვა'}
                            </button>
                        </div>
${config.B_Image ? `
    <img src="${config.B_Image}" style="
        position: absolute; 
        right: -15px; /* ოდნავ გამოწევა მარჯვენა კიდიდან */
        top: 50%;
        transform: translateY(-50%) rotate(-10deg); /* ცენტრირება ვერტიკალურად და მცირე დახრა */
        height: 110%; /* ბანერზე ოდნავ მაღალი, რომ ზემოთ-ქვემოთ გადავიდეს */
        width: 50%; /* მკაცრად ბანერის ნახევარი */
        object-fit: contain; /* სურათი არ დაიჭიმოს და ჩაეტიოს კონტეინერში */
        z-index: 3;
        filter: drop-shadow(-20px 20px 15px rgba(0,0,0,0.3)); /* ჩრდილი უფრო ბუნებრივია */
        pointer-events: none; /* რომ სურათზე დაჭერამ ხელი არ შეუშალოს ბანერის კლიკს */
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

// --- "ახალი კოლექცია" და პროდუქტების რენდერი (ოპტიმიზირებული Lazy Loading-ით) ---
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
        const id = String(product.product_id).trim().toLowerCase();
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
    });

    uniqueProducts.forEach(product => {
        const currentProductId = String(product.product_id).trim().toLowerCase();
        
        const productVariants = state.productDetails.filter(d => 
            String(d.product_id).trim().toLowerCase() === currentProductId
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
        
        // 2. ფერების ლოგიკა
        const allColorsInDatabase = productVariants.map(v => v.Colors).filter(c => c && c !== 'undefined');
        const uniqueColors = [...new Set(allColorsInDatabase.map(c => c.trim()))];
        
        const displayedColors = uniqueColors.slice(0, 4);
        const remainingCount = uniqueColors.length - displayedColors.length;
        
        const statusBadge = productVariants.find(v => v.Badge_Status)?.Badge_Status || "";
        const discountVal = parseInt(productVariants.find(v => v.sale_full)?.sale_full || product.discount_percent || 0);

        const card = document.createElement('div');
        card.className = 'product-card';
        
        card.style.boxShadow = "0 15px 30px rgba(0,0,0,0.12)";
        card.style.borderRadius = "20px";
        card.style.background = "#ffffff";
        card.style.overflow = "hidden";
        card.style.transform = "translateY(-5px)";
        card.style.transition = "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)";
        
        card.onclick = () => openProductDetails(product.product_id);
        
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; width: 100%; height: 160px; background: #fbfbfb; display: flex; align-items: center; justify-content: center; border-radius: 20px 20px 0 0; overflow: hidden;">
                <img src="${product.photo_url_1}" 
                     loading="lazy" 
                     decoding="async"
                     class="product-img" 
                     style="max-width: 85%; max-height: 85%; object-fit: contain; transition: opacity 0.4s ease-in-out;"
                     onload="this.style.opacity='1'"
                     onerror="this.src='https://placehold.co/400x400?text=No+Image'">
                
                <div style="position: absolute; top: 0; left: 0; display: flex; flex-direction: column; z-index: 10;">
                    ${discountVal > 0 ? `
                        <div style="background: linear-gradient(135deg, #ff3b30, #ff7f50); color: white; padding: 5px 12px; border-radius: 20px 0 12px 0; font-size: 11px; font-weight: 800; box-shadow: 2px 2px 8px rgba(255,59,48,0.2);">
                            -${discountVal}%
                        </div>` : ''}
                    
                    ${statusBadge && statusBadge !== 'undefined' ? `
                        <div style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); color: #1d1d1f; padding: 4px 12px; border-radius: ${discountVal > 0 ? '0 0 12px 0' : '20px 0 12px 0'}; font-size: 10px; font-weight: 800; text-transform: uppercase; border-right: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 4px;">
                            ${statusBadge.toLowerCase() === 'hot' ? '🔥 ' : ''}${statusBadge}
                        </div>` : ''}
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
    // 1. მონაცემების მოძიება
    const product = state.products.find(p => String(p.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase());
    if (!product) return;

    const allVariants = state.productDetails.filter(d => 
        String(d.product_id).trim().toLowerCase() === String(productId).trim().toLowerCase() && 
        parseInt(d.stock_quantity || 0) > 0
    );

    // 2. სურათების დამუშავება
    let extraImages = [];
    allVariants.forEach(v => {
        if (v.image2) extraImages.push(v.image2);
        if (v.image3) extraImages.push(v.image3);
        if (v.image4) extraImages.push(v.image4);
        if (v.image5) extraImages.push(v.image5);
        if (v.image6) extraImages.push(v.image6);
    });

    const allPhotos = [...new Set([product.photo_url_1, ...extraImages])].filter(url => url && url.length > 5);
    const uniqueColors = [...new Set(allVariants.map(v => v.Colors).filter(c => c))];
    
    selectedColor = null;
    selectedSize = null;

    // 3. Overlay-ს შექმნა
    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    overlay.id = 'active-overlay';

    // 4. შიდა დამხმარე ფუნქციები (Window scope-ში, რომ HTML-იდან გამოიძახო)
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
                 style="flex: 0 0 auto; padding: 12px 20px; border: 1.5px solid #e5e5e7; border-radius: 14px; cursor: pointer; font-weight: 600; min-width: 55px; text-align: center; background: white; transition: 0.2s;">
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

    window.checkSelection = function() {
        const btn = document.getElementById('add-to-cart-btn');
        if (!btn) return;

        if (selectedColor && selectedSize) {
            btn.disabled = false;
            btn.style.background = '#0071e3';
            btn.style.color = 'white';
            btn.style.boxShadow = '0 8px 20px rgba(0, 113, 227, 0.3)';
            btn.innerText = 'კალათაში დამატება';
            btn.onclick = () => handleAddToCart(product.product_id, selectedColor, selectedSize);
        } else if (selectedColor || selectedSize) {
            btn.disabled = true;
            btn.style.background = '#48484a';
            btn.style.color = '#ffffff';
            btn.innerText = selectedColor ? 'აირჩიეთ ზომა' : 'აირჩიეთ ფერი';
        } else {
            btn.disabled = true;
            btn.style.background = '#f2f2f7';
            btn.style.color = '#aeaeb2';
            btn.innerText = 'აირჩიეთ ფერი და ზომა';
        }
    };

    // 5. HTML სტრუქტურა
    overlay.innerHTML = `
        <div class="detail-container" style="max-height: 92vh; border-radius: 32px 32px 0 0; background: white; position: fixed; bottom: 0; width: 100%; overflow-y: auto; box-shadow: 0 -15px 35px rgba(0,0,0,0.2); font-family: -apple-system, sans-serif;">
            <div style="padding: 0 24px 30px; position: relative;">
                
                <div style="position: relative; display: flex; justify-content: center; padding: 20px 0 10px 0;">
                    <img id="main-detail-img" src="${allPhotos[0]}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 20px;">
                    <button onclick="closeProductDetail()" style="position: absolute; top: 15px; right: 0; background: rgba(242, 242, 247, 0.8); backdrop-filter: blur(5px); border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: #8e8e93; font-size: 18px; z-index: 30; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">✕</button>
                </div>

                ${allPhotos.length > 1 ? `
                <div style="display: flex; gap: 10px; justify-content: center; padding-bottom: 20px; flex-wrap: wrap;">
                    ${allPhotos.map((img, idx) => `
                        <img src="${img}" class="thumb-item" onclick="changeMainImage('${img}', this)" 
                             style="width: 54px; height: 54px; object-fit: cover; border-radius: 12px; border: 2px solid ${idx === 0 ? '#0071e3' : '#f2f2f7'}; cursor: pointer;">
                    `).join('')}
                </div>
                ` : ''}

                <div style="text-align: left;">
                    <p style="color: #bcbcbc; text-transform: uppercase; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; margin-bottom: 2px;">${product.brand}</p>
                    <h2 style="font-size: 19px; font-weight: 700; color: #1d1d1f; line-height: 1.2; margin-bottom: 4px;">${product.name_ge}</h2>
                    <div style="margin-bottom: 16px;"><span style="font-size: 22px; font-weight: 800; color: #0071e3;">${product.final_price} ₾</span></div>
                    
                    <div style="margin-bottom: 18px;">
                        <p style="font-size: 12px; font-weight: 700; color: #8e8e93; margin-bottom: 8px; text-transform: uppercase;">ფერი</p>
                        <div style="display: flex; gap: 14px;">
                            ${uniqueColors.map(c => `<div class="color-dot-option" data-color="${c}" onclick="updateSizeOptions('${c}')" style="width: 36px; height: 36px; border-radius: 50%; background: ${translateColor(c)}; border: 1px solid #e5e5e7; cursor: pointer;"></div>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <p style="font-size: 12px; font-weight: 700; color: #8e8e93; margin-bottom: 8px; text-transform: uppercase;">ზომა</p>
                        <div id="size-options-container" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
                            <p style="color: #c7c7cc; font-size: 13px; font-style: italic;">ჯერ აირჩიეთ ფერი...</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 5px;">
                        <button class="main-btn" id="add-to-cart-btn" disabled style="width: 100%; padding: 18px; border-radius: 16px; border: none; background: #f2f2f7; color: #aeaeb2; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.3s;">აირჩიეთ ფერი და ზომა</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    console.log("Overlay წარმატებით დაემატა DOM-ში");
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
    
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (page === 'categories') {
        showCategoriesHub();
    } else {
        // თუ კატეგორიებიდან გამოვდივართ, უნდა აღვადგინოთ HTML სტრუქტურა
        // რადგან showCategoriesHub-მა ის წაშალა
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
                
                // ვიყენებთ შენახულ კონფიგურაციას ბანერის აღსადგენად
                if (window.lastHeroConfig) {
                    applyHeroDesign(window.lastHeroConfig);
                } else if (typeof state !== 'undefined' && state.headerConfig) {
                    // რეზერვი: თუ window.lastHeroConfig არ არსებობს, ვცდით state-იდან
                    applyHeroDesign(state.headerConfig);
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
                <h2 style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 0;">შეკვეთის მონაცემები</h2>
            </div>

            <div style="background: #fff; padding: 24px; border-radius: 28px; border: 1px solid #f2f2f7; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <div style="margin-bottom: 18px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: #86868b; margin-bottom: 8px; margin-left: 4px;">სრული სახელი</label>
                    <input type="text" id="order-name" placeholder="მაგ: გიორგი გიორგაძე" 
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
    state.tempOrder = { name, phone, address, totalAmount: finalAmount, paymentMethod: "" };

    // ვიღებთ გადახდის პარამეტრებს state-დან
    const activeGateway = (state.paymentSettings && state.paymentSettings.active_gateway) ? state.paymentSettings.active_gateway : 'off';

    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 5px; padding-bottom: 120px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px;">
                <button onclick="checkout()" style="background: #f5f5f7; border: none; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <span style="font-size: 20px;">←</span>
                </button>
                <h2 style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 0;">გადახდა</h2>
            </div>

            <div style="background: #f5f5f7; padding: 25px; border-radius: 22px; text-align: center; margin-bottom: 25px;">
                <span style="font-size: 14px; color: #86868b;">სულ გადასახდელი:</span>
                <div style="font-size: 34px; font-weight: 800; color: #0071e3; margin-top: 5px;">${finalAmount} ₾</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div onclick="selectPaymentMethod('საბანკო გადარიცხვა', this)" class="pay-option" style="background: white; padding: 18px; border-radius: 20px; border: 2px solid #f5f5f7; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s;">
                    <div style="font-size: 24px;">🏦</div>
                    <div style="font-weight: 700;">საბანკო გადარიცხვა</div>
                </div>
                <div id="bank-details-box" style="display: none; background: #f0f7ff; padding: 18px; border-radius: 20px; border: 1px solid #0071e3; margin-top: -5px;">
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <span style="font-size: 12px; font-weight: 700;">მიმღები: შპს მაღაზია</span>
                        <div style="display: flex; gap: 8px;">
                            <div id="iban-text" style="background: white; padding: 10px; border-radius: 10px; border: 1px solid #d0e8ff; font-family: monospace; font-weight: 700; flex-grow: 1; font-size: 13px;">GE00TB0000000000000000</div>
                            <button onclick="copyIBAN()" style="background: #0071e3; color: white; border: none; padding: 0 12px; border-radius: 10px; font-size: 11px; cursor: pointer;">Copy</button>
                        </div>
                    </div>
                </div>

                ${activeGateway !== 'off' ? `
                <div onclick="selectPaymentMethod('ბარათით გადახდა', this)" class="pay-option" style="background: white; padding: 18px; border-radius: 20px; border: 2px solid #f5f5f7; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s;">
                    <div style="font-size: 24px;">💳</div>
                    <div style="font-weight: 700;">ბარათით გადახდა</div>
                </div>
                <div id="card-details-box" style="display: none; background: #f0f7ff; padding: 15px; border-radius: 20px; border: 1px solid #0071e3; margin-top: -5px;">
                    <p style="font-size: 12px; color: #0071e3; margin: 0;">✅ ონლაინ გადახდა აქტიურია. შეკვეთის შემდეგ გადახვალთ დაცულ გვერდზე.</p>
                </div>
                ` : ''}

                <div onclick="selectPaymentMethod('ბარათით კურიერთან', this)" class="pay-option" style="background: white; padding: 18px; border-radius: 20px; border: 2px solid #f5f5f7; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: 0.2s;">
                    <div style="font-size: 24px;">🛵</div>
                    <div style="font-weight: 700;">კურიერთან გადახდა</div>
                </div>
                <div id="delivery-details-box" style="display: none; background: #f4fcf4; padding: 15px; border-radius: 20px; border: 1px solid #d4edda; margin-top: -5px;">
                    <p style="font-size: 12px; color: #155724; margin: 0;">✅ გადაიხადეთ ნაღდი ანგარიშსწორებით ან ტერმინალით კურიერთან.</p>
                </div>
            </div>

            <button id="final-submit-btn" disabled onclick="handleFinalOrder()" style="width: 100%; margin-top: 30px; padding: 20px; border-radius: 20px; border: none; background: #f2f2f7; color: #aeaeb2; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.3s;">
                აირჩიე ანგარიშსწორების მეთოდი
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

        showToast("თქვენი შეკვეთა წარმატებით გაიგზავნა! 🎉");
        
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

window.selectPaymentMethod = function(method, element) {
    const btn = document.getElementById('final-submit-btn');
    const bankBox = document.getElementById('bank-details-box');
    const cardBox = document.getElementById('card-details-box');
    const deliveryBox = document.getElementById('delivery-details-box');

    // თუ უკვე არჩეულზე ვაჭერთ - ავკეცოთ
    if (state.tempOrder.paymentMethod === method) {
        state.tempOrder.paymentMethod = "";
        element.style.borderColor = '#f5f5f7';
        element.style.background = 'white';
        if(bankBox) bankBox.style.display = 'none';
        if(cardBox) cardBox.style.display = 'none';
        if(deliveryBox) deliveryBox.style.display = 'none';

        btn.disabled = true;
        btn.style.background = '#f2f2f7';
        btn.style.color = '#aeaeb2';
        btn.innerText = 'აირჩიე ანგარიშსწორების მეთოდი';
        return;
    }

    // ახალი მეთოდის არჩევა
    document.querySelectorAll('.pay-option').forEach(opt => {
        opt.style.borderColor = '#f5f5f7';
        opt.style.background = 'white';
    });

    element.style.borderColor = '#0071e3';
    element.style.background = '#f0f7ff';
    state.tempOrder.paymentMethod = method;

    // დეტალების მართვა (Accordion)
    if(bankBox) bankBox.style.display = (method === 'საბანკო გადარიცხვა') ? 'block' : 'none';
    if(cardBox) cardBox.style.display = (method === 'ბარათით გადახდა') ? 'block' : 'none';
    if(deliveryBox) deliveryBox.style.display = (method === 'ბარათით კურიერთან') ? 'block' : 'none';

    // ღილაკის გააქტიურება
    btn.disabled = false;
    btn.style.background = '#000';
    btn.style.color = 'white';
    btn.innerText = 'შეკვეთის დასრულება';
};

window.copyIBAN = function() {
    const ibanText = document.getElementById('iban-text')?.innerText;
    if (!ibanText) return;

    navigator.clipboard.writeText(ibanText).then(() => {
        showToast("IBAN დაკოპირდა! ✅");
    }).catch(() => {
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
    
    if (bottomNav) bottomNav.style.display = 'flex';
    
    if (!grid) return;
    if (hero) hero.style.display = 'none';
    if (mainTitle) mainTitle.style.display = 'none';

    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const userName = user ? `${user.first_name} ${user.last_name || ''}` : "სტუმარი";
    const userPhoto = user?.photo_url || "https://ui-avatars.com/api/?name=" + userName + "&background=0071e3&color=fff";
    const userId = user ? String(user.id) : "Web-User";

    grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 10px; padding-bottom: 120px;">
            <div style="background: white; padding: 15px 20px; border-radius: 24px; border: 1px solid #f2f2f7; display: flex; align-items: center; gap: 15px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="position: relative;">
                    <img src="${userPhoto}" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid #f5f5f7;">
                    <div style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; background: #34c759; border: 2px solid #fff; border-radius: 50%;"></div>
                </div>
                <div style="text-align: left;">
                    <h3 style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 0;">${userName}</h3>
                    <p style="font-size: 11px; color: #86868b; margin: 2px 0 0 0;">ID: ${userId}</p>
                </div>
            </div>

            <h2 style="font-size: 18px; font-weight: 700; color: #1d1d1f; margin: 0 0 15px 10px;">შეკვეთების ისტორია</h2>
            
            <div id="orders-history-list">
                <p style="text-align: center; color: #86868b; padding: 20px;">იტვირთება...</p>
            </div>
        </div>
    `;

    loadUserOrders(userId);
}

async function loadUserOrders(userId) {
    const listContainer = document.getElementById('orders-history-list');
    if (!listContainer) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        
        const myOrders = data.orders ? data.orders.filter(o => String(o.userId) === userId) : [];

        if (myOrders.length === 0) {
            listContainer.innerHTML = `
                <div style="background: #fbfbfd; padding: 40px 20px; border-radius: 24px; text-align: center; border: 1px dashed #d1d1d6;">
                    <p style="color: #86868b; font-size: 14px;">შეკვეთები ჯერ არ გაგიკეთებიათ</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = myOrders.reverse().map(order => {
            let color = "#ff9500"; 
            if (order.status === "გზაშია") color = "#0071e3";
            if (order.status === "ჩაბარდა") color = "#34c759";
            if (order.status === "გაუქმდა") color = "#ff3b30";

return `
    <div style="background: white; padding: 18px; border-radius: 24px; border: 1px solid #f2f2f7; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.01);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <div>
                <span style="font-size: 14px; font-weight: 800; color: #1d1d1f; display: block;">#ORD-${order.orderId.toString().slice(-8)}</span>
                <span style="font-size: 11px; color: #86868b;">${order.date ? order.date.split(',')[0] : ''}</span>
            </div>
            <span style="background: ${color}15; color: ${color}; padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; min-width: 85px; line-height: 1;">
                ${order.status.trim()}
            </span>
        </div>

        <div style="background: #f9f9fb; border-radius: 16px; padding: 12px 15px; margin-bottom: 12px; border: 1px solid #f2f2f7; display: flex; align-items: center; justify-content: center; text-align: center; min-height: 50px;">
            <div style="font-size: 12px; color: #424245; line-height: 1.4; white-space: pre-line; font-weight: 500; width: 100%;">
                ${order.items.trim()}
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #f5f5f7;">
            <span style="font-size: 13px; color: #86868b;">ჯამი:</span>
            <span style="font-size: 16px; font-weight: 800; color: #0071e3;">${order.total} ₾</span>
        </div>
    </div>
`;
        }).join('');

    } catch (e) {
        listContainer.innerHTML = `<p style="color: #ff3b30; text-align: center;">შეცდომა ჩატვირთვისას</p>`;
    }
}

// კატეგორიების ჰაბის ჩვენება - იძულებითი სრული სიგანით
function showCategoriesHub() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = ''; 

    mainContent.innerHTML = `
        <div class="categories-page-wrapper" style="animation: fadeIn 0.4s ease; padding-bottom: 30px; width: 100%;">
            <div style="padding: 25px 16px 15px 16px;">
                <h1 style="font-size: 22px; font-weight: 800; letter-spacing: -0.7px; margin: 0; color: #1d1d1f;">კატალოგი</h1>
                <p style="color: #86868b; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">აირჩიეთ ძებნის მეთოდი</p>
            </div>
            
            <div class="categories-hub" style="display: flex; flex-direction: column; gap: 12px; padding: 0 16px; width: 100%; box-sizing: border-box;">
                
                <div class="hub-banner-large" onclick="handleHubClick('brands')" 
                     style="background: #eef7ff; border: 1px solid #d8e9f9; border-radius: 24px; padding: 25px; cursor: pointer; min-height: 110px; display: flex; flex-direction: column; justify-content: center; width: 100%; box-sizing: border-box;">
                    <div class="banner-title" style="color: #0071e3; font-size: 20px; font-weight: 800;">ბრენდები</div>
                    <div class="banner-desc" style="color: #0071e3; opacity: 0.7; font-size: 14px; margin-top: 4px; font-weight: 500;">თქვენი ფავორიტი მწარმოებლები</div>
                </div>

                <div style="display: flex; gap: 12px; width: 100%; align-items: stretch;">
                    <div class="hub-banner-small" onclick="handleHubClick('sale')" 
                         style="background: #fff0f0; border: 1px solid #ffe2e2; border-radius: 24px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; flex: 1; min-height: 140px; box-sizing: border-box;">
                        <div class="banner-title" style="color: #ff3b30; font-size: 18px; font-weight: 800;">Sale</div>
                        <div class="banner-desc" style="color: #ff3b30; opacity: 0.7; font-size: 13px; margin-top: 4px; font-weight: 500;">საუკეთესო ფასები</div>
                    </div>

                    <div class="hub-banner-small" onclick="handleHubClick('new')" 
                         style="background: #f0fff4; border: 1px solid #e2f9e9; border-radius: 24px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; flex: 1; min-height: 140px; box-sizing: border-box;">
                        <div class="banner-title" style="color: #34c759; font-size: 18px; font-weight: 800;">სიახლე</div>
                        <div class="banner-desc" style="color: #34c759; opacity: 0.7; font-size: 13px; margin-top: 4px; font-weight: 500;">ბოლო კოლექცია</div>
                    </div>
                </div>

                <div class="hub-banner-large" onclick="handleHubClick('filters')" 
                     style="background: #fff8f0; border: 1px solid #f9eada; border-radius: 24px; padding: 25px; cursor: pointer; min-height: 110px; display: flex; flex-direction: column; justify-content: center; width: 100%; box-sizing: border-box;">
                    <div class="banner-title" style="color: #ff9500; font-size: 19px; font-weight: 800;">ზომა და ფერი</div>
                    <div class="banner-desc" style="color: #ff9500; opacity: 0.7; font-size: 14px; margin-top: 4px; font-weight: 500;">მოერგეთ თქვენს სტილს</div>
                </div>
            </div>
        </div>
    `;

    updateActiveTab('categories');
    window.scrollTo(0, 0);
}

function handleHubClick(type) {
    if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    if (type === 'brands') {
        renderBrandsList(); 
    } else if (type === 'sale') {
        const saleProducts = state.products.filter(product => {
            const currentId = String(product.product_id).trim().toLowerCase();
            const details = state.productDetails.find(d => 
                String(d.product_id).trim().toLowerCase() === currentId
            );
            if (details) {
                const currentPrice = parseFloat(details.Price) || 0;
                const oldPrice = parseFloat(details.Old_Price) || 0;
                return oldPrice > currentPrice;
            }
            return false;
        }).sort((a, b) => {
            const discountA = parseInt(state.productDetails.find(d => String(d.product_id).trim().toLowerCase() === String(a.product_id).trim().toLowerCase())?.sale_full) || 0;
            const discountB = parseInt(state.productDetails.find(d => String(d.product_id).trim().toLowerCase() === String(b.product_id).trim().toLowerCase())?.sale_full) || 0;
            return discountB - discountA;
        });

        if (saleProducts.length > 0) {
            renderCustomPage(saleProducts, "ფასდაკლებები 🔥", "საუკეთესო შეთავაზებები");
        } else {
            alert('ამჟამად ფასდაკლებები არ არის');
        }

    } else if (type === 'new') {
        const newProducts = state.products.filter(product => {
            const currentId = String(product.product_id).trim().toLowerCase();
            const details = state.productDetails.find(d => 
                String(d.product_id).trim().toLowerCase() === currentId
            );
            return details && String(details.Badge_Status).trim().toLowerCase() === 'new';
        });

        if (newProducts.length > 0) {
            renderCustomPage(newProducts, "სიახლეები ✨", "ახალი კოლექცია");
        } else {
            alert('ახალი პროდუქტები ჯერ არ არის დამატებული');
        }

    } else if (type === 'filters') {
        // --- ფილტრაციის ლოგიკა (ფასი, ფერი, ზომა) ---
        const allColors = new Set();
        const allSizes = new Set();
        
        state.productDetails.forEach(d => {
            // ვიყენებთ String() კონვერტაციას, რომ ციფრებზე split error არ ამოაგდოს
            if (d.Colors && d.Colors !== 'undefined') {
                allColors.add(String(d.Colors).trim());
            }
            if (d.Sizes && d.Sizes !== 'undefined') {
                allSizes.add(String(d.Sizes).trim());
            }
        });

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="filter-page" style="padding: 20px 16px; animation: fadeIn 0.3s; padding-bottom: 100px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                    <button onclick="showCategoriesHub()" style="background:none; border:none; padding:0; cursor:pointer;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <h1 style="font-size: 22px; font-weight: 800; margin:0; color: #1d1d1f;">ფილტრი 🔍</h1>
                </div>

                <p style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin: 0 0 12px 4px;">ფასი</p>
                <div style="display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">
                    <div onclick="applyQuickFilter('price', 0, 50)" style="background: #f5f5f7; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer;">50₾-მდე</div>
                    <div onclick="applyQuickFilter('price', 50, 150)" style="background: #f5f5f7; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer;">50₾ - 150₾</div>
                    <div onclick="applyQuickFilter('price', 150, 9999)" style="background: #f5f5f7; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer;">150₾ +</div>
                </div>

                <p style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin: 0 0 12px 4px;">ფერი</p>
                <div style="display: flex; gap: 12px; margin-bottom: 25px; overflow-x: auto; padding: 5px 4px;">
                    ${Array.from(allColors).map(color => `
                        <div onclick="applyQuickFilter('color', '${color}')" style="width: 32px; height: 32px; border-radius: 50%; background: ${translateColor(color)}; border: 2px solid #fff; box-shadow: 0 0 0 1px #e5e5e5; flex-shrink: 0; cursor: pointer;"></div>
                    `).join('')}
                </div>

                <p style="font-size: 15px; font-weight: 700; color: #1d1d1f; margin: 0 0 12px 4px;">ზომა</p>
                <div style="display: flex; gap: 10px; margin-bottom: 30px; overflow-x: auto; padding-bottom: 5px;">
                    ${Array.from(allSizes).map(size => `
                        <div onclick="applyQuickFilter('size', '${size}')" style="background: #fff; border: 1.5px solid #e5e5e5; padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">${size}</div>
                    `).join('')}
                </div>

                <div id="filter-results-grid" class="products-grid"></div>
            </div>
        `;
        // ვაჩვენებთ ყველა პროდუქტს საწყის ეტაპზე
        setTimeout(() => {
            const resGrid = document.getElementById('filter-results-grid');
            if (resGrid) {
                const oldId = resGrid.id;
                resGrid.id = 'products-grid';
                renderProducts(state.products);
                resGrid.id = oldId;
            }
        }, 50);

    } else {
        alert('ეს სექცია მალე გააქტიურდება');
    }
}

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


