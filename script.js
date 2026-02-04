const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";

const tg = window.Telegram.WebApp;
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- 1. ინიციალიზაცია და ჩატვირთვა ---
async function init() {
    tg.ready();
    tg.expand();
    
    try {
        const res = await fetch(API_URL, { redirect: 'follow' });
        storeData = await res.json();
        
        console.log("მონაცემები ჩაიტვირთა:", storeData);

        if (storeData.header) renderHeader(storeData.header);
        if (storeData.banner) renderBanner(storeData.banner);
        
        // ვამოწმებთ, რომ Latest ობიექტი არსებობს
        if (storeData.latest && storeData.latest.items) {
            renderProducts(storeData.latest.items);
        }

        if (storeData.navigation) renderNavigation(storeData.navigation);
        
        hidePreloader();
    } catch (e) {
        console.error("ჩატვირთვის შეცდომა:", e);
        hidePreloader(); // შეცდომის დროსაც ვმალავთ, რომ ეკრანი არ გაიჭედოს
    }
}

function hidePreloader() {
    const loader = document.getElementById('app-preloader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

// --- 2. პროდუქტების რენდერინგი მთავარზე ---
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = items.map((p, index) => {
        // ვეძებთ დეტალებს Image_URLs სვეტისთვის (დიდი ასოებით ID)
        const d = storeData.productDetails.find(det => String(det.ID) === String(p.id || p.ID));
        
        // სურათის აღება: ჯერ Image_URLs, მერე images
        let img = "https://via.placeholder.com/150";
        if (d && d.Image_URLs) {
            img = d.Image_URLs.split(',')[0].trim();
        } else if (p.images) {
            img = p.images.split(',')[0].trim();
        }

        // სახელის და ფასის აღება (დიდი ასოების მხარდაჭერით)
        const name = p.name || p.Name || "პროდუქტი";
        const price = p.price || p.Price || "0";

        return `
            <div onclick="goToProductDetails('${p.id || p.ID}')" class="bg-white p-4 rounded-[30px] shadow-sm border border-slate-100 active:scale-95 transition-all">
                <div class="h-28 flex items-center justify-center mb-3">
                    <img src="${img}" class="max-h-full object-contain" onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <h4 class="font-bold text-[11px] truncate text-slate-700">${name}</h4>
                <p class="text-blue-600 font-black text-sm mt-1">${price}₾</p>
            </div>`;
    }).join('');
}

// --- 3. პროდუქტის დეტალური გვერდი ---
function goToProductDetails(id) {
    // ვეძებთ პროდუქტს დეტალების ცხრილში (დიდი ასოებით ID)
    const d = storeData.productDetails.find(det => String(det.ID) === String(id));
    if (!d) return;

    const images = d.Image_URLs ? d.Image_URLs.split(',') : [];
    const sizes = d.Sizes ? String(d.Sizes).split(',') : [];
    const colors = d.Colors ? String(d.Colors).split(',') : [];

    document.getElementById('details-content').innerHTML = `
        <div class="px-4 pt-4 pb-20">
            <div class="w-full h-64 bg-slate-50 rounded-[30px] flex items-center justify-center overflow-hidden mb-6">
                <img src="${images[0] ? images[0].trim() : ''}" class="max-w-full max-h-full object-contain">
            </div>
            
            <h1 class="text-2xl font-black text-slate-800">${d.Name || d.name}</h1>
            <div class="flex items-center justify-between mt-2">
                <span class="text-3xl font-black text-blue-600">${d.Price || d.price}₾</span>
                <span class="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-400 font-bold">ID: ${d.ID}</span>
            </div>

            <p class="text-slate-500 text-sm mt-6 leading-relaxed">${d.Description || 'აღწერა არ არის'}</p>

            <div class="mt-8">
                <h4 class="text-[10px] font-black text-slate-400 uppercase mb-3">ზომა</h4>
                <div class="flex flex-wrap gap-2">
                    ${sizes.map(s => `<button onclick="selectOpt(this, 'size')" class="px-4 py-2 border border-slate-100 rounded-xl text-sm font-bold opt-btn">${s.trim()}</button>`).join('')}
                </div>
            </div>

            <div class="mt-6">
                <h4 class="text-[10px] font-black text-slate-400 uppercase mb-3">ფერი</h4>
                <div class="flex flex-wrap gap-2">
                    ${colors.map(c => `<button onclick="selectOpt(this, 'color')" class="px-4 py-2 border border-slate-100 rounded-xl text-sm font-bold opt-btn">${c.trim()}</button>`).join('')}
                </div>
            </div>

            <div class="fixed bottom-6 left-4 right-4">
                <button id="buy-btn" disabled onclick="handleAddToCart('${d.ID}')" class="w-full bg-slate-200 text-slate-400 py-5 rounded-[25px] font-black text-lg shadow-xl transition-all">აირჩიე ზომა და ფერი</button>
            </div>
        </div>
    `;
    
    document.getElementById('product-details-page').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ოპციების არჩევა
function selectOpt(btn, type) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.opt-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white', 'selected');
        b.classList.add('border-slate-100');
    });
    
    btn.classList.add('bg-blue-600', 'text-white', 'selected');
    btn.classList.remove('border-slate-100');
    
    checkForm();
}

function checkForm() {
    const selections = document.querySelectorAll('.selected').length;
    const btn = document.getElementById('buy-btn');
    if (selections >= 2) {
        btn.disabled = false;
        btn.innerText = "კალათაში დამატება";
        btn.className = "w-full bg-blue-600 text-white py-5 rounded-[25px] font-black text-lg shadow-xl active:scale-95 transition-all";
    }
}

// ინიციალიზაცია
init();
