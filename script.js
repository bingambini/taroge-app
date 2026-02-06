// Configuration
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyaw4FwC-ERm_wDXNZYkcDBTtU2CkepINX6gCBL8Q3UTnAtu_g1oqSf23bsDI11zjy5PA/exec'
};

// State
const state = {
    design: {},
    content: {},
    newArrivals: [],
    saleProducts: [],
    cart: []
};

// Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        // Load configuration
        await loadAppConfig();
        
        // Apply design
        applyDesign();
        
        // Apply content
        applyContent();
        
        // Load products
        await Promise.all([
            loadNewArrivals(),
            loadSaleProducts()
        ]);
        
        // Render products
        renderNewArrivals();
        renderSaleProducts();
        
        // Setup interactions
        setupScrollEffects();
        
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Load app configuration from Google Sheets
async function loadAppConfig() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getAppConfig`);
        const data = await response.json();
        state.design = data.design || {};
        state.content = data.content || {};
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Load new arrivals
async function loadNewArrivals() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getNewArrivals`);
        const data = await response.json();
        state.newArrivals = data.products || [];
    } catch (error) {
        console.error('Failed to load new arrivals:', error);
    }
}

// Load sale products
async function loadSaleProducts() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getSaleProducts`);
        const data = await response.json();
        state.saleProducts = data.products || [];
    } catch (error) {
        console.error('Failed to load sale products:', error);
    }
}

// Apply design from Google Sheets
function applyDesign() {
    const root = document.documentElement;
    
    // Apply colors
    if (state.design.colors) {
        Object.keys(state.design.colors).forEach(key => {
            root.style.setProperty(`--color-${key.replace(/_/g, '-')}`, state.design.colors[key]);
        });
    }
    
    // Apply typography
    if (state.design.typography) {
        Object.keys(state.design.typography).forEach(key => {
            root.style.setProperty(`--${key.replace(/_/g, '-')}`, state.design.typography[key]);
        });
    }
    
    // Apply spacing
    if (state.design.spacing) {
        Object.keys(state.design.spacing).forEach(key => {
            root.style.setProperty(`--${key.replace(/_/g, '-')}`, state.design.spacing[key]);
        });
    }
    
    // Apply radius
    if (state.design.radius) {
        Object.keys(state.design.radius).forEach(key => {
            root.style.setProperty(`--${key.replace(/_/g, '-')}`, state.design.radius[key]);
        });
    }
    
    // Apply layout
    if (state.design.layout) {
        Object.keys(state.design.layout).forEach(key => {
            root.style.setProperty(`--${key.replace(/_/g, '-')}`, state.design.layout[key]);
        });
    }
}

// Apply content from Google Sheets
function applyContent() {
    // Logo
    if (state.content.header_logo_text?.content_ge) {
        document.getElementById('logo').textContent = state.content.header_logo_text.content_ge;
    }
    
    // Promo banner
    if (state.content.promo_banner_text?.content_ge) {
        const promoBanner = document.getElementById('promoBanner');
        const promoText = document.getElementById('promoText');
        promoText.textContent = state.content.promo_banner_text.content_ge;
        promoBanner.style.display = 'block';
    }
    
    // Hero section
    const hero = document.getElementById('hero');
    
    if (state.content.hero_image?.url) {
        hero.style.backgroundImage = `url(${state.content.hero_image.url})`;
    }
    
    if (state.content.hero_title?.content_ge) {
        document.getElementById('heroTitle').textContent = state.content.hero_title.content_ge;
    }
    
    if (state.content.hero_subtitle?.content_ge) {
        document.getElementById('heroSubtitle').textContent = state.content.hero_subtitle.content_ge;
    }
    
    if (state.content.hero_button_text?.content_ge) {
        const buttonText = document.getElementById('heroButton').querySelector('span');
        buttonText.textContent = state.content.hero_button_text.content_ge;
    }
    
    // Category banners
    renderCategoryBanners();
    
    // Brands
    renderBrands();
    
    // Section titles
    if (state.content.section_new_title?.content_ge) {
        document.getElementById('newArrivalsTitle').textContent = state.content.section_new_title.content_ge;
    }
    
    if (state.content.section_sale_title?.content_ge) {
        document.getElementById('saleTitle').textContent = state.content.section_sale_title.content_ge;
    }
}

// Render category banners
function renderCategoryBanners() {
    const container = document.getElementById('bannersGrid');
    let html = '';
    
    for (let i = 1; i <= 3; i++) {
        const visibleKey = `category_banner_${i}_visible`;
        const titleKey = `category_banner_${i}_title`;
        const imageKey = `category_banner_${i}_image`;
        const linkKey = `category_banner_${i}_link`;
        
        if (state.content[visibleKey]?.visible) {
            const title = state.content[titleKey]?.content_ge || '';
            const image = state.content[imageKey]?.url || '';
            const link = state.content[linkKey]?.content_ge || '#';
            
            html += `
                <div class="category-banner" style="background-image: url(${image});" onclick="window.location.href='${link}'">
                    <div class="category-banner-content">
                        <h3 class="category-banner-title">${title}</h3>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

// Render brands
function renderBrands() {
    const container = document.getElementById('brandsGrid');
    let html = '';
    
    for (let i = 1; i <= 6; i++) {
        const logoKey = `brand_logo_${i}`;
        
        if (state.content[logoKey]?.url) {
            const name = state.content[logoKey]?.content_ge || '';
            const url = state.content[logoKey]?.url || '';
            
            html += `
                <div class="brand-logo">
                    <img src="${url}" alt="${name}">
                </div>
            `;
        }
    }
    
    if (html) {
        container.innerHTML = html;
    } else {
        document.getElementById('brandsSection').style.display = 'none';
    }
}

// Render new arrivals
function renderNewArrivals() {
    const container = document.getElementById('newArrivalsGrid');
    
    if (state.newArrivals.length === 0) {
        container.innerHTML = '<div class="loading">პროდუქტები არ მოიძებნა</div>';
        return;
    }
    
    const html = state.newArrivals.map(product => createProductCard(product)).join('');
    container.innerHTML = html;
}

// Render sale products
function renderSaleProducts() {
    const container = document.getElementById('saleGrid');
    
    if (state.saleProducts.length === 0) {
        container.innerHTML = '<div class="loading">პროდუქტები არ მოიძებნა</div>';
        return;
    }
    
    const html = state.saleProducts.map(product => createProductCard(product)).join('');
    container.innerHTML = html;
}

// Create product card HTML
function createProductCard(product) {
    const discount = product.discount_percent > 0;
    const isNew = product.is_new;
    
    return `
        <div class="product-card" onclick="viewProduct('${product.product_id}')">
            <div class="product-image-container">
                <img src="${product.photo_url_1}" alt="${product.name_ge}" class="product-image">
                ${discount ? `<div class="product-badge sale">-${product.discount_percent}%</div>` : ''}
                ${isNew && !discount ? `<div class="product-badge new">ახალი</div>` : ''}
            </div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name_ge}</div>
                <div class="product-price">
                    <span class="price-current">${product.final_price} ₾</span>
                    ${discount ? `<span class="price-original">${product.price} ₾</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// View product (placeholder for next stage)
function viewProduct(productId) {
    console.log('View product:', productId);
    // This will be implemented in Stage 2
}

// Setup scroll effects
function setupScrollEffects() {
    const header = document.getElementById('header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}
