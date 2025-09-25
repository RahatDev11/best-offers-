// Firebase SDK imports (সব প্রয়োজনীয় ইম্পোর্ট)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// === এখানে 'get' যোগ করা হয়েছে ===
import { getDatabase, ref, onValue, set, push, remove, update, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
    storageBucket: "nahid-6714.appspot.com",
    messagingSenderId: "505741217147",
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de",
    measurementId: "G-QZ7CTRKHCW"
};

// Global Variables
let app, auth, database, provider;
let products = []; // Firebase থেকে লোড হওয়া সব প্রোডাক্ট
let cart = []; 
let eventSlider;
const ADMIN_EMAIL = "mdnahidislam6714@gmail.com";


// --- Firebase Initialization ---
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    provider = new GoogleAuthProvider();
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}


// --- Utility Functions ---

window.showToast = function(a, type = "success") {
    const b = document.createElement("div");
    const icon = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    const color = type === "success" ? "bg-green-500" : "bg-red-500";
    b.className = `fixed bottom-24 right-4 ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`, b.innerHTML = `<i class="${icon} mr-2"></i> ${a}`, document.body.appendChild(b), setTimeout(() => {
        b.remove()
    }, 3e3)
};


// --- Cart Management ---

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    if (products.length > 0 && window.location.pathname.includes('index.html')) {
        displayProductsAsCards(products);
    }
}

function updateCartSidebarUI() {
    const cartItemsEl = document.getElementById("cartItems");
    const cartCountEl = document.getElementById("cartCount");
    const totalPriceEl = document.getElementById("totalPrice");

    if (!cartItemsEl || !cartCountEl || !totalPriceEl) return;
    cartItemsEl.innerHTML = "";
    let totalPrice = 0;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length > 0) {
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            const itemEl = document.createElement("div");
            itemEl.className = "flex items-center justify-between p-2 border-b text-black";
            itemEl.innerHTML = `<div class="flex items-center"><img src="${item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded mr-3"><div><p class="font-semibold text-sm">${item.name}</p><p class="text-xs text-gray-600">${item.quantity} x ${item.price}৳</p></div></div><div class="flex items-center"><p class="font-semibold mr-3">${itemTotal.toFixed(2)}৳</p><button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button></div>`;
            cartItemsEl.appendChild(itemEl);
        });
    } else {
        cartItemsEl.innerHTML = '<p class="text-center text-gray-500">Apnar cart khali.</p>';
    }
    cartCountEl.textContent = totalItems;
    totalPriceEl.textContent = `Mot mullo: ${totalPrice.toFixed(2)} Taka`;
}

function updateFloatingBarUI() {
    const a = document.getElementById("place-order-bar");
    if (!a) return;
    if (cart.length === 0) return void a.classList.add("hidden");
    a.classList.remove("hidden");
    const b = cart.reduce((c, d) => c + d.quantity, 0),
        c = cart.reduce((d, e) => d + parseFloat(e.price) * e.quantity, 0);
    document.getElementById("bar-item-count").textContent = b, document.getElementById("bar-total-price").textContent = c.toFixed(2)
}

window.getUserId = function() {
    if (auth && auth.currentUser) {
        return auth.currentUser.uid;
    } else {
        let userId = localStorage.getItem('tempUserId');
        if (!userId) {
            userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tempUserId', userId);
        }
        return userId;
    }
};

window.loadCart = function() {
    const userId = getUserId();
    if (auth && auth.currentUser) {
        const cartRef = ref(database, `carts/${userId}`);
        onValue(cartRef, (snapshot) => {
            const data = snapshot.val();
            cart = data || [];
            updateAllCartUIs();
        });
    } else {
        const localCart = localStorage.getItem("anyBeautyCart");
        cart = localCart ? JSON.parse(localCart) : [];
        updateAllCartUIs();
    }
};

window.saveCart = function() {
    localStorage.setItem("anyBeautyCart", JSON.stringify(cart));
    if (auth && auth.currentUser) {
        const userId = getUserId();
        const cartRef = ref(database, `carts/${userId}`);
        set(cartRef, cart);
    }
    updateAllCartUIs();
};

window.addToCart = function(a) {
    const b = products.find(c => c.id === a);
    if (!b) return;
    const c = cart.find(d => d.id === a);
    c ? c.quantity++ : cart.push({ ...b, quantity: 1, name: b.name, price: b.price, image: b.image });
    saveCart();
    showToast(`${b.name} carte jog kora hoyeche`, "success");
};

window.updateQuantity = function(a, b) {
    const c = cart.find(d => d.id === a);
    c && (c.quantity += b, c.quantity <= 0 && (cart = cart.filter(d => d.id !== a)), saveCart());
};

window.removeFromCart = function(a) {
    cart = cart.filter(b => b.id !== a);
    saveCart();
};

window.checkout = function() {
    if (cart.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(cart));
        window.location.href = 'order-form.html';
    } else {
        showToast("Apnar cart khali!", "error");
    }
};

window.buyNow = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const tempCart = [{...product, quantity: 1}];
    localStorage.setItem('cartItems', JSON.stringify(tempCart));
    window.location.href = 'order-form.html?source=buy';
};


// --- Auth Functions ---
// ... (এই সেকশনের কোড অপরিবর্তিত থাকবে)
window.openLoginModal=function(){loginWithGmail()};window.closeModal=function(a){const b=document.getElementById(a);b&&b.classList.add("hidden")};window.loginWithGmail=function(){auth&&provider?signInWithPopup(auth,provider).then(a=>{const b=a.user;showToast(`Login shofol! Shagotom, ${b.displayName}`),saveUserToFirebase(b)}).catch(a=>{console.error("Login Error:",a.message),"auth/popup-blocked"===a.code||"auth/cancelled-popup-request"===a.code?(showToast("Popup block kora hoyeche. Redirect kora hocche..."),signInWithRedirect(auth,provider)):showToast("Login beartho hoyeche: "+a.message)}):showToast("Firebase Auth load hoyni.")};window.updateLoginButton=function(a){const b=document.getElementById("mobileLoginButton"),c=document.getElementById("desktopLoginButton");if(!b||!c)return;if(a){const d=a.displayName||a.email.split("@")[0],e=`\n            <div class="flex flex-col">\n                <span class="flex items-center text-black font-semibold">\n                    ${a.photoURL?`<img src="${a.photoURL}" alt="User Profile" class="w-6 h-6 rounded-full mr-2">`:`<i class="fas fa-user-circle mr-2 bg-red-500 text-white p-1 rounded-full"></i>`}\n                    ${d}\n                </span>\n                <button onclick="confirmLogout()" class="text-left text-sm text-red-500 hover:underline mt-1">Logout</button>\n            </div>`;b.innerHTML=e,c.innerHTML=e}else{const f=`<button class="flex items-center w-full" onclick="openLoginModal()"><i class="fas fa-user-circle mr-2 bg-red-500 text-white p-1 rounded-full"></i><span class="text-black font-semibold">লগইন</span></button>`;b.innerHTML=f;const g=`<button class="flex items-center" onclick="openLoginModal()"><i class="fas fa-user-circle mr-2 bg-red-500 text-white p-1 rounded-full"></i><span class="text-black">লগইন</span></button>`;c.innerHTML=g}};window.confirmLogout=function(){confirm("Apni ki logout korte nishchit?")&&logout()};window.logout=function(){auth&&signOut(auth).then(()=>{showToast("Logout shofol hoyeche.")}).catch(a=>{showToast("Logout beartho hoyeche: "+a.message)})};window.saveUserToFirebase=function(a){database&&onValue(ref(database,`users/${a.uid}`),b=>{b.exists()||set(ref(database,`users/${a.uid}`),{name:a.displayName,email:a.email,photoURL:a.photoURL,createdAt:(new Date).toISOString()})},{onlyOnce:!0})};

// --- Product Display and Slider ---
// ... (এই সেকশনের কোড অপরিবর্তিত থাকবে)
window.showProductDetail=function(a){window.location.href=`product-detail.html?id=${a}`};function showLoadingSpinner(){const a=document.getElementById("productList");if(a){a.innerHTML="";for(let b=0;b<8;b++){const c=document.createElement("div");c.className="bg-white rounded-xl shadow overflow-hidden flex flex-col",c.innerHTML='<div class="bg-gray-300 h-36 w-full animate-pulse"></div><div class="p-3 flex flex-col flex-grow pink-bg" style="background-color: #F4A7B9;"><div class="flex-grow"><div class="bg-gray-200 opacity-50 h-5 w-3/4 rounded animate-pulse mb-3"></div></div><div><div class="bg-gray-200 opacity-50 h-6 w-1/2 rounded animate-pulse mb-4"></div><div class="space-y-2"><div class="bg-gray-200 h-9 w-full rounded animate-pulse"></div><div class="border border-white/50 h-9 w-full rounded animate-pulse"></div></div></div></div>',a.appendChild(c)}}}
function displayProductsAsCards(a){const b=document.getElementById("productList");if(!b)return;b.innerHTML="";a.forEach(c=>{const d=cart.find(e=>e.id===c.id),f=!!d,g="w-full bg-white rounded-lg font-semibold flex items-center h-10 transition-colors",h=f?`\n            <div class="${g} justify-around">\n                <button onclick="updateQuantity('${c.id}', -1)" class="px-3 text-xl font-bold" style="color: #F4A7B9 !important;">-</button>\n                <span class="text-lg" style="color: #F4A7B9 !important;">${d.quantity}</span>\n                <button onclick="updateQuantity('${c.id}', 1)" class="px-3 text-xl font-bold" style="color: #F4A7B9 !important;">+</button>\n            </div>`:`<button onclick="addToCart('${c.id}')" class="${g} justify-center text-sm hover:bg-gray-100" style="color: #F4A7B9 !important;">Add To Cart</button>`,i=document.createElement("div");i.className="bg-white rounded-xl shadow overflow-hidden flex flex-col";const j=c.image?c.image.split(",")[0].trim():"https://via.placeholder.com/150";i.innerHTML=`\n            <img src="${j}" alt="${c.name}" class="w-full h-36 object-cover cursor-pointer" onclick="showProductDetail('${c.id}')" onerror="this.src='https://via.placeholder.com/150'">\n            <div class="p-3 text-white flex flex-col flex-grow pink-bg" style="background-color: #F4A7B9;">\n                <div class="flex-grow">\n                    <h3 class="font-semibold text-lg h-10 line-clamp-2" onclick="showProductDetail('${c.id}')">${c.name}</h3>\n                </div>\n                <div>\n                    <p class="text-xl font-bold mt-2">BDT ${c.price}</p>\n                    <div class="mt-4 space-y-2">\n                        ${h}\n                        <button onclick="buyNow('${c.id}')" class="w-full pink-bg border border-white text-white py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-lipstick transition-colors" style="background-color: #F4A7B9; --tw-text-opacity: 1; color: white;">Buy Now</button>\n                    </div>\n                </div>\n            </div>`,b.appendChild(i)})}
function initializeProductSlider(a){const b=document.getElementById("new-product-slider-wrapper");if(!b)return;if(b.innerHTML="",0===a.length)b.innerHTML='<div class="swiper-slide"><div class="relative w-full h-64 md:h-80 bg-gray-200 flex items-center justify-center"><p class="text-gray-500">No featured products selected.</p></div></div>';else a.forEach(c=>{const d=c.image?c.image.split(",")[0].trim():"https://via.placeholder.com/400",e=document.createElement("div");e.className="swiper-slide",e.innerHTML=`<div class="relative w-full h-64 md:h-80"><img src="${d}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${c.name}</h3><p class="text-white text-lg">BDT ${c.price}</p><button onclick="showProductDetail('${c.id}')" class="mt-4 text-white py-2 px-4 rounded-lg self-start hover:bg-lipstick-dark transition-colors pink-bg" style="background-color: #F4A7B9;">Shop Now</button></div></div>`,b.appendChild(e)});void 0!==typeof Swiper&&new Swiper(".new-product-slider",{loop:a.length>1,autoplay:{delay:3e3,disableOnInteraction:!1},pagination:{el:".swiper-pagination",clickable:!0},effect:"fade",fadeEffect:{crossFade:!0}})}

// --- Event Management ---
// ... (এই সেকশনের কোড অপরিবর্তিত থাকবে)
function displayEvents(){const a=document.getElementById("event-slider-wrapper");if(!a)return;onValue(ref(database,"events"),b=>{a.innerHTML="";const c=[];if(b.exists()&&b.forEach(d=>{d.val().isActive&&c.push({id:d.key,...d.val()})}),c.length>0)c.slice(0,3).forEach(d=>{let e;e=d.imageUrl?`<div class="swiper-slide rounded-lg shadow-lg border border-pink-100 bg-cover bg-center" style="background-image: url(${d.imageUrl}); height: 160px;"><div class="w-full h-full bg-black bg-opacity-50 rounded-lg p-6 flex flex-col justify-center items-center text-center text-white"><h3 class="text-xl md:text-2xl font-bold">${d.title||""}</h3><p class="mt-1 text-sm md:text-base">${d.description||""}</p></div></div>`:`<div class="swiper-slide bg-white p-6 flex flex-col justify-center items-center text-center rounded-lg shadow-lg border border-pink-100" style="height: 160px;"><h3 class="text-xl md:text-2xl font-bold text-lipstick-dark">${d.title||""}</h3><p class="text-gray-600 mt-1 text-sm md:text-base">${d.description||""}</p></div>`,a.innerHTML+=e});else a.innerHTML='<div class="swiper-slide text-center p-6 bg-white rounded-lg">কোনো নতুন ইভেন্ট নেই।</div>';void 0!==typeof Swiper&&(eventSlider&&eventSlider.destroy(!0,!0),eventSlider=new Swiper(".event-slider",{loop:c.length>1,autoplay:{delay:3500},pagination:{el:".swiper-pagination",clickable:!0}}))})}

// --- Admin Functions ---
// ... (এই সেকশনের কোড অপরিবর্তিত থাকবে)
window.checkAdminAndShowUploadForm=function(a){const c="mdnahidislam6714@gmail.com",d=["product-management","slider-management","event-update"],e=a&&a.email===c;d.forEach(f=>{const g=document.getElementById(f);g&&g.classList.toggle("hidden",!e)}),e&&(displayAdminProducts(),displayAdminSliderProducts(),displayAdminEvents())};window.addImageField=()=>{const a=document.getElementById("imageInputs"),b=a.getElementsByTagName("input").length;a.innerHTML+=`<input type="text" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ${b+1}">`};function displayAdminProducts(){const a=document.getElementById("productListAdmin");a&&onValue(ref(database,"products"),b=>{if(a.innerHTML="",b.exists())b.forEach(c=>{const d=c.key,e=c.val(),f=e.image?e.image.split(",")[0].trim():"https://via.placeholder.com/40";a.innerHTML+=`<div class="p-2 border rounded-md flex items-center justify-between"><div class="flex items-center"><img src="${f}" class="w-10 h-10 object-cover rounded mr-3" onerror="this.src='https://via.placeholder.com/40'"><p class="font-semibold">${e.name}</p></div><div class="space-x-2"><button onclick="editProduct('${d}')" class="text-blue-500"><i class="fas fa-edit"></i></button><button onclick="deleteProduct('${d}')" class="text-red-500"><i class="fas fa-trash"></i></button></div></div>`})})}
window.editProduct=a=>{onValue(ref(database,`products/${a}`),b=>{if(b.exists()){const c=b.val();document.getElementById("productId").value=a,document.getElementById("productName").value=c.name||"",document.getElementById("productPrice").value=c.price||"",document.getElementById("productCategory").value=c.category||"cosmetics",document.getElementById("productStockStatus").value=c.stockStatus||"in_stock",document.getElementById("productDescription").value=c.description||"",document.getElementById("productTags").value=c.tags||"";const d=document.getElementById("imageInputs");d.innerHTML="";const e=c.image?c.image.split(","):[""];e.forEach((f,g)=>{d.innerHTML+=`<input type="text" value="${f.trim()}" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ${g+1}">`}),window.scrollTo(0,document.getElementById("product-management").offsetTop)}},{onlyOnce:!0})};window.deleteProduct=a=>{confirm("আপনি কি এই প্রোডাক্টটি মুছে ফেলতে চান?")&&remove(ref(database,`products/${a}`)).then(()=>showToast("প্রোডাক্ট ডিলিট হয়েছে।"))};window.resetProductForm=()=>{document.getElementById("productForm").reset(),document.getElementById("productId").value="",document.getElementById("imageInputs").innerHTML='<input type="text" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ১">'};function displayAdminSliderProducts(){const a=document.getElementById("sliderProductListAdmin");a&&onValue(ref(database,"products"),b=>{if(a.innerHTML="",b.exists())b.forEach(c=>{const d=c.key,e=c.val();a.innerHTML+=`<div class="p-2 border rounded-md flex items-center justify-between"><div class="flex items-center"><input type="checkbox" id="slider_check_${d}" class="form-checkbox h-5 w-5 mr-3" onchange="updateSliderStatus('${d}', 'isInSlider', this.checked)" ${e.isInSlider?"checked":""}><label for="slider_check_${d}" class="font-semibold">${e.name}</label></div><div class="flex items-center"><label class="text-sm mr-2">Serial:</label><input type="number" value="${e.sliderOrder||""}" placeholder="e.g., 1" onchange="updateSliderStatus('${d}', 'sliderOrder', this.value)" class="w-16 p-1 border rounded text-center"></div></div>`})})}
window.updateSliderStatus=(a,b,c)=>{const d={};d[`/products/${a}/${b}`]="sliderOrder"===b&&c?Number(c):c,update(ref(database),d)};function displayAdminEvents(){const a=document.getElementById("eventListAdmin");a&&onValue(ref(database,"events"),b=>{if(a.innerHTML="",b.exists())b.forEach(c=>{const d=c.key,e=c.val();a.innerHTML+=`<div class="p-3 bg-gray-50 rounded-lg flex justify-between items-center border"><div><p class="font-bold">${e.title||"No Title"} <span class="text-sm font-normal">- ${e.isActive?'<span class="text-green-600 font-bold">Active</span>':'<span class="text-gray-500">Inactive</span>'}</span></p>${e.imageUrl?`<img src="${e.imageUrl}" class="w-16 h-10 object-cover rounded mt-1" onerror="this.style.display='none'">`:""}</div><div class="space-x-2"><button onclick="editEvent('${d}')" class="text-blue-500"><i class="fas fa-edit"></i></button><button onclick="deleteEvent('${d}')" class="text-red-500"><i class="fas fa-trash"></i></button></div></div>`})})}
window.editEvent=a=>{onValue(ref(database,`events/${a}`),b=>{b.exists()&&(c=b.val(),document.getElementById("eventId").value=a,document.getElementById("eventTitle").value=c.title||"",document.getElementById("eventDescription").value=c.description||"",document.getElementById("eventImageUrl").value=c.imageUrl||"",document.getElementById("eventIsActive").checked=c.isActive||!1,window.scrollTo(0,document.getElementById("event-update").offsetTop))},{onlyOnce:!0})};var c;window.deleteEvent=a=>{confirm("এই ব্যানারটি মুছে ফেলতে চান?")&&remove(ref(database,`events/${a}`))};window.resetEventForm=()=>{document.getElementById("eventForm").reset(),document.getElementById("eventId").value=""};function initializeAdminForms(){const a=document.getElementById("productForm");a&&a.addEventListener("submit",a=>{a.preventDefault();const b=document.getElementById("productId").value,c=Array.from(document.querySelectorAll("#imageInputs .image-input")).map(d=>d.value.trim()).filter(Boolean).join(", "),d={name:document.getElementById("productName").value,price:document.getElementById("productPrice").value,category:document.getElementById("productCategory").value,stockStatus:document.getElementById("productStockStatus").value,description:document.getElementById("productDescription").value,tags:document.getElementById("productTags").value,image:c},e=b?ref(database,`products/${b}`):push(ref(database,"products"));set(e,d).then(()=>{showToast(`প্রোডাক্ট সফলভাবে ${b?"আপডেট":"যোগ"} হয়েছে!`),resetProductForm()})});const b=document.getElementById("eventForm");b&&b.addEventListener("submit",a=>{a.preventDefault();const c=document.getElementById("eventId").value,d={title:document.getElementById("eventTitle").value.trim(),description:document.getElementById("eventDescription").value.trim(),imageUrl:document.getElementById("eventImageUrl").value.trim(),isActive:document.getElementById("eventIsActive").checked};if(!d.title&&!d.description&&!d.imageUrl)return showToast("কমপক্ষে একটি তথ্য দিন।","error");const e=c?ref(database,`events/${c}`):push(ref(database,"events"));set(e,d).then(()=>{showToast("ব্যানার সেভ হয়েছে!"),resetEventForm()})})}

// --- Search and Filtering ---
// ... (এই সেকশনের কোড অপরিবর্তিত থাকবে)
window.displaySearchResults=function(a,b,c){const d=document.getElementById(b);if(!d)return void console.error(`Search results container not found: ${b}`);if(d.innerHTML="",0===a.length)return void d.classList.add("hidden");d.className="absolute w-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-64 overflow-y-auto",d.className+="desktop"===c?" top-full left-0":" top-full left-0",a.slice(0,5).forEach(e=>{const f=document.createElement("a");f.href=`product-detail.html?id=${e.id}`,f.className="flex items-center p-2 hover:bg-gray-100 cursor-pointer text-gray-800 border-b last:border-b-0",f.innerHTML=`\n            <img src="${e.image?e.image.split(",")[0].trim():"https://via.placeholder.com/30"}" class="w-8 h-8 object-cover rounded mr-2" onerror="this.src='https://via.placeholder.com/30'">\n            <span class="text-sm font-medium">${e.name}</span>\n            <span class="ml-auto text-xs text-red-500">${e.price}৳</span>\n        `,f.onclick=()=>{d.classList.add("hidden")},d.appendChild(f)}),d.classList.remove("hidden"),console.log(`Search results displayed: ${a.length} items for ${c}.`)};window.searchProductsMobile=function(){const a=document.getElementById("searchInput").value.toLowerCase().trim(),b=document.getElementById("searchResults");if(0===products.length)return console.warn("Products data not loaded yet. Cannot search."),void(b&&b.classList.add("hidden"));if(!a)return void(b&&b.classList.add("hidden"));const c=products.filter(d=>d.name.toLowerCase().includes(a)||(d.tags&&d.tags.toLowerCase().includes(a)));displaySearchResults(c,"searchResults","mobile")};window.searchProductsDesktop=function(){const a=document.getElementById("searchInputDesktop").value.toLowerCase().trim(),b=document.getElementById("searchResultsDesktop");if(0===products.length)return console.warn("Products data not loaded yet. Cannot search."),void(b&&b.classList.add("hidden"));if(!a)return void(b&&b.classList.add("hidden"));const c=products.filter(d=>d.name.toLowerCase().includes(a)||(d.tags&&d.tags.toLowerCase().includes(a)));displaySearchResults(c,"searchResultsDesktop","desktop")};window.filterProducts=function(a){let b;const c=a.toLowerCase();b="all"===c?products:products.filter(d=>d.category&&d.category.toLowerCase()===c),displayProductsAsCards(b),closeSidebar();const d=document.getElementById("desktopSubMenuBar");d&&d.classList.add("hidden");const e=document.getElementById("productListSection")||document.getElementById("productList");e?e.scrollIntoView({behavior:"smooth"}):window.scrollTo(0,0),showToast(`${a.toUpperCase()} ক্যাটাগরির ${b.length}টি প্রোডাক্ট দেখানো হচ্ছে।`)};

// --- Main Application Initialization ---

function main() {
    if (typeof $ !== 'undefined') {
        $("#header").load("header.html", () => {
            if (auth && auth.currentUser) updateLoginButton(auth.currentUser);
            const searchInputMobile = document.getElementById('searchInput');
            if (searchInputMobile) searchInputMobile.addEventListener('input', searchProductsMobile);
            const searchInputDesktop = document.getElementById('searchInputDesktop');
            if (searchInputDesktop) searchInputDesktop.addEventListener('input', searchProductsDesktop);
        });
        $("#footer").load("footer.html");
    }

    try {
        onAuthStateChanged(auth, (user) => {
            updateLoginButton(user);
            checkAdminAndShowUploadForm(user);
            loadCart(); 
        });
        getRedirectResult(auth).then((result) => {
            if (result && result.user) {
                showToast(`Login shofol! Shagotom, ${result.user.displayName}`);
                saveUserToFirebase(result.user);
            }
        });

        const productsRef = ref(database, "products/");
        onValue(productsRef, d => {
            if (d.exists()) {
                const data = d.val();
                products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                
                // শুধুমাত্র index.html পেজে কার্ড এবং স্লাইডার দেখাবে
                if (window.location.pathname.includes('index.html')) {
                    const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));
                    initializeProductSlider(sliderProducts);
                    displayProductsAsCards(products); 
                }
            } else if (window.location.pathname.includes('index.html')) {
                document.getElementById("productList").innerHTML = "<p class='col-span-full text-center'>Kono product paoa jayni.</p>";
            }
        });
        
        if (window.location.pathname.includes('index.html')) {
            showLoadingSpinner();
            displayEvents();
            initializeAdminForms();
        }
    } catch (e) {
        console.error("Firebase Error:", e);
        showToast("Firebase connection beartho hoyeche.", "error");
    }
}
document.addEventListener('DOMContentLoaded', main);


// --- UI Event Listeners ---
// ... (এই সেকশনের কোড অপরিবর্তিত থাকবে)
window.openSidebar=function(){const a=document.getElementById("sidebarOverlay"),b=document.getElementById("sidebar");a&&b&&(a.classList.remove("hidden"),a.classList.add("active"),b.classList.remove("-translate-x-full"),b.classList.add("slide-in"))};window.closeSidebar=function(){const a=document.getElementById("sidebarOverlay"),b=document.getElementById("sidebar");if(a&&b){b.classList.add("-translate-x-full"),a.classList.remove("active"),a.classList.add("hidden");const c=document.getElementById("subMenuMobile"),d=document.getElementById("arrowIcon");c&&d&&(c.classList.add("hidden"),d.classList.remove("rotate-180"),d.classList.add("fa-chevron-down"),d.classList.remove("fa-chevron-up"))}};window.handleMenuItemClick=function(){};window.handleSubMenuItemClick=function(a){filterProducts(a);const b=document.getElementById("subMenuMobile");b&&b.classList.add("hidden"),closeSidebar()};window.toggleSubMenuMobile=function(a){a.stopPropagation();const b=document.getElementById("subMenuMobile"),c=document.getElementById("arrowIcon");b&&c&&(b.classList.toggle("hidden"),c.classList.toggle("rotate-180"),c.classList.toggle("fa-chevron-down"),c.classList.toggle("fa-chevron-up"))};window.toggleSubMenuDesktop=function(){const a=document.getElementById("desktopSubMenuBar"),b=document.getElementById("desktopArrowIcon");a&&b&&(a.classList.toggle("hidden"),a.classList.toggle("slide-down"),b.classList.toggle("rotate-180"),b.classList.toggle("fa-chevron-down"),b.classList.remove("fa-chevron-up"))};window.openCartSidebar=function(){const a=document.getElementById("cartSidebar"),b=document.getElementById("cartOverlay");a&&b&&(a.classList.remove("translate-x-full"),b.classList.remove("hidden"))};window.closeCartSidebar=function(){const a=document.getElementById("cartSidebar"),b=document.getElementById("cartOverlay");a&&b&&(a.classList.add("translate-x-full"),b.classList.add("hidden"))};window.focusMobileSearch=function(){const a=document.getElementById("mobileSearchBar");if(a){a.classList.toggle("hidden"),a.classList.toggle("show");const b=document.getElementById("searchInput");b&&b.focus()}};document.addEventListener("click",a=>{const b=document.getElementById("sidebarOverlay"),c=document.getElementById("subMenuMobile"),d=document.getElementById("desktopSubMenuBar"),e=document.getElementById("cartSidebar");b&&!a.target.closest("#sidebar")&&!a.target.closest('button[onclick="openSidebar()"]')&&closeSidebar(),c&&!a.target.closest("#subMenuMobile")&&!a.target.closest('button[onclick="toggleSubMenuMobile(event)"]')&&(c.classList.add("hidden"),d=document.getElementById("arrowIcon"),d&&(d.classList.remove("rotate-180"),d.classList.add("fa-chevron-down"),d.classList.remove("fa-chevron-up"))),d&&!a.target.closest("#desktopSubMenuBar")&&!a.target.closest('button[onclick="toggleSubMenuDesktop()"]')&&(d.classList.add("hidden"),d.classList.remove("slide-down"),b=document.getElementById("desktopArrowIcon"),b&&(b.classList.remove("rotate-180"),b.classList.add("fa-chevron-down"),b.classList.remove("fa-chevron-up"))),e&&!a.target.closest("#cartSidebar")&&!a.target.closest("#cartButton")&&closeCartSidebar();const f=document.getElementById("searchResults"),g=document.getElementById("searchResultsDesktop");f&&!f.contains(a.target)&&!a.target.closest("#searchInput")&&f.classList.add("hidden"),g&&!g.contains(a.target)&&!a.target.closest("#searchInputDesktop")&&g.classList.add("hidden")});

// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC (নতুন যোগ করা অংশ)
// =================================================================

async function initializeProductDetailPage() {
    const productContent = document.getElementById('productContent');
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (!productContent) return; 

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        showToast('প্রোডাক্ট আইডি পাওয়া যায়নি!', 'error');
        loadingSpinner.innerHTML = '<p class="text-red-500">প্রোডাক্ট আইডি পাওয়া যায়নি।</p>';
        return;
    }

    try {
        const productRef = ref(database, 'products/' + productId);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            const product = { id: productId, ...snapshot.val() };
            displayProductDetails(product);
            loadingSpinner.style.display = 'none';
            productContent.classList.remove('hidden');
        } else {
            showToast('প্রোডাক্ট পাওয়া যায়নি!', 'error');
            loadingSpinner.innerHTML = '<p class="text-red-500">দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি।</p>';
        }
    } catch (error) {
        console.error("Firebase থেকে প্রোডাক্ট লোড করতে সমস্যা:", error);
        showToast('প্রোডাক্ট লোড করতে সমস্যা হয়েছে!', 'error');
        loadingSpinner.innerHTML = `<p class="text-red-500">ত্রুটি: ${error.message}</p>`;
    }
}

function displayProductDetails(product) {
    document.title = product.name || "প্রোডাক্ট বিস্তারিত";
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productPrice').textContent = `দাম: ${product.price} টাকা`;
    document.getElementById('productDescription').textContent = product.description;

    const detailsExtraContainer = document.getElementById('productDetailsExtra');
    const stockStatus = product.stockStatus === 'in_stock'
        ? '<span class="text-green-600 font-semibold">স্টকে আছে</span>'
        : '<span class="text-red-600 font-semibold">স্টকে নেই</span>';
    
    let extraHTML = `<p class="text-gray-700 mb-4 font-medium"><strong>স্টক:</strong> ${stockStatus}</p>`;

    if (product.stockStatus === 'in_stock') {
        extraHTML += `
            <div class="flex items-center space-x-3 my-4">
                <span class="text-gray-700 font-medium">পরিমাণ:</span>
                <div class="flex items-center border border-gray-300 rounded-lg">
                    <button onclick="changeDetailQuantity(-1)" class="bg-gray-200 px-4 py-2 font-bold">-</button>
                    <input type="number" id="quantityDetailInput" value="1" min="1" class="w-16 text-center border-0 focus:ring-0">
                    <button onclick="changeDetailQuantity(1)" class="bg-gray-200 px-4 py-2 font-bold">+</button>
                </div>
            </div>`;
    }
    detailsExtraContainer.innerHTML = extraHTML;

    const actionButtonsContainer = document.getElementById('actionButtons');
    const whatsappMessage = `প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা\nআমি এই প্রোডাক্টটি কিনতে আগ্রহী।`;
    const whatsappLink = `https://wa.me/8801931866636?text=${encodeURIComponent(whatsappMessage)}`;
    
    let buttonsHTML = `
        <button id="buyNowDetailBtn" onclick="buyNowWithQuantity('${product.id}')" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center">
            <i class="fas fa-credit-card mr-2"></i>এখনই কিনুন
        </button>
        <button id="addToCartDetailBtn" onclick="addToCartWithQuantity('${product.id}')" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center">
            <i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন
        </button>
        <a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center">
            <i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার
        </a>`;

    actionButtonsContainer.innerHTML = buttonsHTML;
    
    if (product.stockStatus !== 'in_stock') {
        document.getElementById('buyNowDetailBtn').disabled = true;
        document.getElementById('addToCartDetailBtn').disabled = true;
        document.getElementById('buyNowDetailBtn').classList.add('opacity-50', 'cursor-not-allowed');
        document.getElementById('addToCartDetailBtn').classList.add('opacity-50', 'cursor-not-allowed');
    }

    const images = product.image ? product.image.split(',').map(img => img.trim()).filter(Boolean) : [];
    setupImageGallery(images);
}

window.changeDetailQuantity = function(amount) {
    const input = document.getElementById('quantityDetailInput');
    let currentValue = parseInt(input.value);
    if (isNaN(currentValue)) currentValue = 1;
    const newValue = currentValue + amount;
    if (newValue >= 1) {
        input.value = newValue;
    }
}

window.addToCartWithQuantity = function(productId) {
    const quantity = parseInt(document.getElementById('quantityDetailInput').value);
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity, image: product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/100' });
    }
    saveCart();
    showToast(`${quantity}টি ${product.name} কার্টে যোগ করা হয়েছে`, "success");
    openCartSidebar();
}

window.buyNowWithQuantity = function(productId) {
    const quantity = parseInt(document.getElementById('quantityDetailInput').value);
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const tempCart = [{ ...product, quantity: quantity, image: product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/100' }];
    localStorage.setItem('cartItems', JSON.stringify(tempCart));
    window.location.href = 'order-form.html?source=buy';
}

let galleryImages = [];
let currentImageModalIndex = 0;

function setupImageGallery(images) {
    galleryImages = images;
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    thumbnailContainer.innerHTML = '';

    if (images.length > 0) {
        mainImage.src = images[0];
        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.className = 'thumbnail';
            if (index === 0) thumb.classList.add('active');
            thumb.onclick = () => {
                mainImage.src = img;
                currentImageModalIndex = index;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbnailContainer.appendChild(thumb);
        });
    } else {
        mainImage.src = 'https://via.placeholder.com/500x400.png?text=No+Image';
    }
    mainImage.addEventListener('click', openImageModal);
}

function openImageModal() {
    if (galleryImages.length === 0) return;
    const modal = document.getElementById('imageModal');
    modal.style.display = 'flex';
    updateModalImage();
    document.getElementById('modalCloseBtn').onclick = closeImageModal;
    document.getElementById('modalPrevBtn').onclick = () => changeModalImage(-1);
    document.getElementById('modalNextBtn').onclick = () => changeModalImage(1);
}

function closeImageModal() { document.getElementById('imageModal').style.display = 'none'; }
function changeModalImage(direction) {
    currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length;
    updateModalImage();
}
function updateModalImage() { document.getElementById('modalImage').src = galleryImages[currentImageModalIndex]; }

if (window.location.pathname.includes('product-detail.html')) {
    document.addEventListener('DOMContentLoaded', initializeProductDetailPage);
}