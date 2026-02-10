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
        // ვასუფთავებთ logo-circle კლასის ნაგულისხმევ სტილებს
        logoIcon.style.background = "transparent";
        logoIcon.style.backgroundColor = "transparent";
        logoIcon.style.border = "none";

        // ვიღებთ რადიუსს შიტიდან (რადგან 0 გიწერია, იქნება 0)
        const radius = config.Logo_Radius || "0";

        logoIcon.innerHTML = `<img src="${config.Shop_Logo}" style="width: ${config.Logo_Size || 40}px; height: auto; border-radius: ${radius}; object-fit: contain; display: block;">`;
    }
}

// --- ბანერის დიზაინის შესწორება ---
function applyHeroDesign(config) {
    const heroSection = document.getElementById('hero');
    if (!heroSection || !config || config.Status !== 'active') return;

    // ფუნქცია, რომელიც პოულობს პროდუქტს B_Subtitle-ში მოცემული სახელით
    window.handleHeroClick = function() {
        const searchTerm = (config.B_Subtitle || "").toLowerCase().trim();
        
        // ვეძებთ state.products-ში (სახელით ან ბრენდით)
        const product = state.products.find(p => 
            p.name_ge.toLowerCase().includes(searchTerm) || 
            p.brand.toLowerCase().includes(searchTerm)
        );

        if (product) {
            openProductDetails(product.product_id);
        } else {
            // თუ ვერ იპოვა, ჩვეულებრივ ჩასქროლავს ქვემოთ
            document.getElementById('products-grid').scrollIntoView({behavior:'smooth'});
        }
    };

    // margin-top შევამცირე 20px-დან 5px-მდე
    heroSection.innerHTML = `
        <div class="hero-wrapper" onclick="handleHeroClick()" style="
            cursor: pointer;
            background: ${config.B_Gradient || '#eee'}; 
            border-radius: 24px; 
            padding: 25px; 
            position: relative; 
            overflow: visible; 
            margin-top: 10px; 
            margin-bottom: 25px; 
            margin-left: 15px;
            margin-right: 15px;
            height: ${config.B_Height || 200}px; 
            display: flex; 
            align-items: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
            transform: translateY(-5px);
        ">
            <div style="position: relative; z-index: 2; width: 60%;">
                <h2 style="color: ${config.B_Title_Color || '#fff'}; font-size: 20px; margin-bottom: 8px;">${config.B_Title || ''}</h2>
                <p style="color: #fff; opacity: 0.9; margin-bottom: 15px; font-size: 13px;">${config.B_Subtitle || ''}</p>
                <button style="padding: 8px 18px; border-radius: 10px; border: none; background: white; font-weight: 800; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
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
        </div>`;
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
        
        // 1. ფასის ლოგიკა (Product_Details-ის Price და Old_Price სვეტებიდან)
        let finalDisplayPrice = '---';
        let oldDisplayPrice = null;
        
        const variantWithPrice = productVariants.find(v => v.Price && v.Price !== 'undefined' && v.Price !== '');
        if (variantWithPrice) {
            finalDisplayPrice = variantWithPrice.Price;
            // ვიღებთ Old_Price-ს იმავე ვარიანტიდან
            if (variantWithPrice.Old_Price && variantWithPrice.Old_Price !== 'undefined' && variantWithPrice.Old_Price !== '') {
                oldDisplayPrice = variantWithPrice.Old_Price;
            }
        } else {
            finalDisplayPrice = product.final_price || '---';
        }
        
        // 2. ფერების ჭკვიანი ლოგიკა (მაქსიმუმ 4 წრე + ინდიკატორი)
        const allColorsInDatabase = productVariants.map(v => v.Colors).filter(c => c && c !== 'undefined');
        const uniqueColors = [...new Set(allColorsInDatabase.map(c => c.trim()))];
        
        const displayedColors = uniqueColors.slice(0, 4);
        const remainingCount = uniqueColors.length - displayedColors.length;
        
        const statusBadge = productVariants.find(v => v.Badge_Status)?.Badge_Status || "";
        const discountVal = parseInt(productVariants.find(v => v.sale_full)?.sale_full || product.discount_percent || 0);

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // --- მაქსიმალურად "ამოწეული" ეფექტის სტილები ---
        card.style.boxShadow = "0 15px 30px rgba(0,0,0,0.12)"; // უფრო ღრმა და გაბნეული ჩრდილი
        card.style.borderRadius = "20px"; // ოდნავ მეტი მომრგვალება სირბილისთვის
        card.style.background = "#ffffff";
        card.style.overflow = "hidden";
        card.style.transform = "translateY(-5px)"; // ბარათის ფიზიკური აწევა სივრცეში
        card.style.transition = "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)";
        
        card.onclick = () => openProductDetails(product.product_id);
        
        // --- განახლებული დიზაინი კუთხეში მიკრული ბეიჯებით და ორმაგი ფასით ---
        card.innerHTML = `
            <div class="product-image-container" style="position: relative; width: 100%; height: 160px; background: #fbfbfb; display: flex; align-items: center; justify-content: center; border-radius: 20px 20px 0 0; overflow: hidden;">
                <img src="${product.photo_url_1}" loading="lazy" class="product-img" style="max-width: 85%; max-height: 85%; object-fit: contain;">
                
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
    // 1. ნავიგაციის ვიზუალური მხარე
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
    
    // 2. ელემენტების მოძიება
    const hero = document.getElementById('hero');
    const mainTitle = document.getElementById('new-arrivals-title');
    const productsGrid = document.getElementById('products-grid');
    const bottomNav = document.querySelector('.bottom-nav');

    // 3. ნავიგაციის ლოგიკა გვერდების მიხედვით
    if (page === 'categories') {
        // კატეგორიების დროს ვასუფთავებთ ეკრანს ზედმეტი ბანერებისგან
        if (hero) hero.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none';
        
        // ვიძახებთ კატეგორიების ჩატვირთვას
        showCategoriesHub(); 
        
    } else if (page === 'cart') {
        if (hero) hero.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none';
        renderCart();
        
    } else if (page === 'profile') {
        if (hero) hero.style.display = 'none';
        if (mainTitle) mainTitle.style.display = 'none';
        renderProfile();
        
    } else {
        // ეს არის 'home' - აქ ვაბრუნებთ ყველაფერს საწყის მდგომარეობაში
        if (hero) hero.style.display = 'block';
        if (mainTitle) mainTitle.style.display = 'block';
        if (bottomNav) bottomNav.style.display = 'flex';
        
        // თავიდან ვხატავთ ყველა პროდუქტს
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
                <h2 style="font-size: 18px; font-weight: 800; color: #1d1d1f; margin: 0;">შეკვეთის მონაცემები</h2>
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
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            <span style="font-size: 14px; font-weight: 800; color: #1d1d1f; display: block;">#ORD-${order.orderId.toString().slice(-8)}</span>
                            <span style="font-size: 11px; color: #86868b;">${order.date ? order.date.split(',')[0] : ''}</span>
                        </div>
                        <span style="background: ${color}15; color: ${color}; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 700;">
                            ${order.status}
                        </span>
                    </div>

                    <div style="background: #f9f9fb; border-radius: 16px; padding: 12px; margin-bottom: 12px; border: 1px solid #f2f2f7;">
                        <div style="font-size: 12px; color: #424245; line-height: 1.6; white-space: pre-line;">
                            ${order.items}
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
// --- CATEGORIES HUB LOGIC ---

// კატეგორიების ჰაბის ჩვენება
function showCategoriesHub() {
    // 1. ვპოულობთ მთავარ კონტეინერს ID-ით
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) return;

    // 2. ჯერ ვასუფთავებთ ყველაფერს, რომ ძველი ბანერები წაიშალოს
    mainContent.innerHTML = ''; 

    // 3. ვხატავთ მხოლოდ ახალ ჰაბს
    mainContent.innerHTML = `
        <div class="categories-page-wrapper" style="animation: fadeIn 0.4s ease; padding-bottom: 30px;">
            <div style="padding: 20px 16px 10px 16px;">
                <h1 style="font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin: 0;">კატალოგი</h1>
                <p style="color: #86868b; font-size: 14px; margin: 5px 0 0 0;">აირჩიეთ ძებნის მეთოდი</p>
            </div>
            
            <div class="categories-hub">
                <div class="hub-banner-large banner-brands" onclick="handleHubClick('brands')">
                    <div>
                        <div class="banner-title">ბრენდები</div>
                        <div class="banner-desc">თქვენი ფავორიტი მწარმოებლები</div>
                    </div>
                    <div class="banner-icon">🏷️</div>
                </div>

                <div class="hub-banner-small banner-sale" onclick="handleHubClick('sale')">
                    <div class="banner-title">Sale</div>
                    <div class="banner-desc">საუკეთესო ფასები</div>
                    <div class="banner-icon">🔥</div>
                </div>

                <div class="hub-banner-small banner-new" onclick="handleHubClick('new')">
                    <div class="banner-title">სიახლე</div>
                    <div class="banner-desc">ბოლო კოლექცია</div>
                    <div class="banner-icon">✨</div>
                </div>

                <div class="hub-banner-large banner-style" onclick="handleHubClick('filters')">
                    <div>
                        <div class="banner-title">ზომა და ფერი</div>
                        <div class="banner-desc">მოერგეთ თქვენს სტილს</div>
                    </div>
                    <div class="banner-icon">🎨</div>
                </div>
            </div>
        </div>
    `;

    // ნავიგაციის ტაბის განახლება
    updateActiveTab('categories');
    
    // ეკრანი ავწიოთ ზემოთ
    window.scrollTo(0, 0);
}

// ბანერებზე დაჭერის დამუშავება
function handleHubClick(type) {
    console.log("Category selected:", type);
    
    if (type === 'brands') {
        // აქ შევცვალეთ: alert-ის ნაცვლად ვიძახებთ ფუნქციას
        renderBrandsList(); 
    } else if (type === 'sale') {
        alert('ფასდაკლებები მალე დაემატება');
    } else {
        alert('ეს სექცია მალე გააქტიურდება');
    }
}

// ტაბების გააქტიურების ფუნქცია
function updateActiveTab(tabName) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('span')?.innerText.includes('კატეგორია') && tabName === 'categories') {
            item.classList.add('active');
        }
    });
}

// --- აქედან იწყება ახალი კოდი, რომელიც უნდა მიაყოლო ---

// 1. ბრენდების სიის გამოტანის ფუნქცია
async function renderBrandsList() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div style="text-align:center; padding:50px;"><div class="shoe-animation">👟</div><p>იტვირთება...</p></div>';
    
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        const products = data.productDetails;

        if (!products || !Array.isArray(products)) {
            throw new Error("მონაცემები ვერ მოიძებნა");
        }

        const uniqueBrands = [...new Set(products.map(p => p.brand))].filter(b => b && b.trim() !== "");
        uniqueBrands.sort();

        mainContent.innerHTML = `
            <div style="padding: 20px 12px; animation: fadeIn 0.4s ease;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                    <button onclick="showCategoriesHub()" style="background: #f0f0f2; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">←</button>
                    <h1 style="font-size: 22px; font-weight: 800; margin: 0;">ბრენდები</h1>
                </div>
                
                <div class="brands-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    ${uniqueBrands.map(brandName => {
                        const count = products.filter(p => p.brand === brandName).length;
                        return `
                            <div class="brand-item" onclick="filterByBrand('${brandName}')" 
                                 style="
                                    background: #ffffff; 
                                    height: 100px; 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center; 
                                    justify-content: center; 
                                    border-radius: 18px; 
                                    cursor: pointer; 
                                    border: 1px solid #f2f2f7; 
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.03); 
                                    padding: 10px;
                                    transition: transform 0.2s ease;
                                 "
                            >
                                <div style="font-weight: 800; font-size: 14px; color: #1d1d1f; text-align: center; margin-bottom: 4px; letter-spacing: -0.2px;">
                                    ${brandName}
                                </div>
                                
                                <div style="font-size: 11px; color: #86868b; font-weight: 500; background: #f5f5f7; padding: 2px 8px; border-radius: 10px;">
                                    ${count} მოდელი
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        mainContent.innerHTML = `<p style="padding: 20px; color: red; text-align: center;">შეცდომაა: ${error.message}</p>`;
    }
    window.scrollTo(0, 0);
}

// 2. ფილტრაციის ფუნქცია
async function filterByBrand(brandName) {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = '<div style="text-align:center; padding:50px;"><p>იტვირთება...</p></div>';

    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppData`);
        const data = await response.json();
        
        const allProducts = data.productDetails || [];

        // 1. ჯერ ვფილტრავთ ბრენდის მიხედვით
        const brandEntries = allProducts.filter(p => 
            p.brand && p.brand.trim().toLowerCase() === brandName.trim().toLowerCase()
        );

        // 2. ვაჯგუფებთ მოდელებს სახელით (Name), რომ დუბლიკატები ავიცილოთ
        // და ერთად მოვაგროვოთ ყველა ფერი
        const groupedMap = {};
        
        brandEntries.forEach(entry => {
            const productName = entry.Name || entry.name_ge;
            if (!groupedMap[productName]) {
                groupedMap[productName] = { ...entry };
            }
        });

        // მასივად გადაქცევა რენდერისთვის
        const filtered = Object.values(groupedMap);

        mainContent.innerHTML = `
            <div style="padding: 20px 16px 10px 16px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                    <button onclick="renderBrandsList()" style="background: #f0f0f2; border: none; width: 38px; height: 38px; border-radius: 50%; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;">←</button>
                    <h1 style="font-size: 24px; font-weight: 800; margin: 0;">${brandName}</h1>
                </div>
            </div>
            <div id="products-grid" class="products-grid" style="padding: 0 16px 20px 16px;"></div>
        `;

        renderProducts(filtered);

    } catch (error) {
        console.error("ფილტრაციის შეცდომა:", error);
        mainContent.innerHTML = `<p style="padding:20px; color:red;">შეცდომა მონაცემების წაკითხვისას.</p>`;
    }
    window.scrollTo(0, 0);
}
