const API_URL = "https://script.google.com/macros/s/AKfycbzlFXWDikCWQFa1FhMMbN0DtaKArKyK6-NoJqN0zK3k4gDsSPz6YK57Hd_B63bOyofPMg/exec";
let storeData = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function init() {
    try {
        const res = await fetch(API_URL);
        storeData = await res.json();
        // აქ დაამატე render ფუნქციები...
        document.getElementById('app-preloader').style.display = 'none';
    } catch (e) { console.error(e); }
}
init();