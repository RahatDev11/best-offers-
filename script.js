// =================================================================
// SECTION: FIREBASE INITIALIZATION & CONFIGURATION
// =================================================================

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, get, query, orderByChild, equalTo, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
let products = [];
let cart = [];
let eventSlider;

// Firebase Initialization
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    provider = new GoogleAuthProvider();
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// =================================================================
// SECTION: UTILITY & HELPER FUNCTIONS
// =================================================================

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    const icon = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    const color = type === "success" ? "bg-green-500" : "bg-red-500";
    toast.className = `fixed bottom-24 right-4 ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`;
    toast.innerHTML = `<i class="${icon} mr-2"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove() }, 3000);
};

// === START: TELEGRAM NOTIFICATION FUNCTION (NEW CODE) ===
/**
 * Netlify Function কে কল করে Telegram এ নোটিফিকেশন পাঠায়।
 * @param {object} orderData - অর্ডারের সমস্ত তথ্য
 */
async function sendTelegramNotification(orderData) {
    // Netlify Function কে কল করা হচ্ছে, যেটি Telegram এ মেসেজ পাঠাবে
    try {
        const response = await fetch('/.netlify/functions/telegram_notifier', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData) 
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log("Telegram notification sent successfully.");
            // showToast(`নোটিফিকেশন পাঠানো হয়েছে (ID: ${orderData.orderId})`, "success"); 
            return { success: true };
        } else {
            console.error("Failed to send Telegram notification. Error:", result.message || "Unknown error");
            // showToast(`নোটিফিকেশন পাঠানো যায়নি। Error: ${result.message}`, "error"); 
            return { success: false, message: result.message };
        }

    } catch (error) {
        console.error("Network error calling Netlify Function:", error);
        // showToast("নোটিফিকেশন সিস্টেমে নেটওয়ার্ক ত্রুটি।", "error"); 
        return { success: false, message: "Network or Server error" };
    }
}
// === END: TELEGRAM NOTIFICATION FUNCTION (NEW CODE) ===


// =================================================================
// SECTION: CART MANAGEMENT
// =================================================================

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        displayProductsAsCards(products);
    }
}

function updateCartSidebarUI() {
    const cartItemsEl = document.getElementById("cartItems");
    const cartCountEl = document.getElementById("cartCount");
    const totalPriceEl = document.getElementById("totalPrice");
    if (!cartItemsEl || !cartCountEl) return;
    
    cartItemsEl.innerHTML = "";
    let totalPrice = 0;
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    if (cart.length > 0) {
        cart.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            totalPrice += itemTotal;
            const itemEl = document.createElement("div");
            itemEl.className = "flex items-center justify-between p-2 border-b text-black";
            itemEl.innerHTML = `<div class="flex items-center"><img src="${item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-10 h-10 object-cover rounded mr-3"><div><p class="font-semibold text-sm">${item.name}</p><p class="text-xs text-gray-600">${item.quantity} x ${item.price}৳</p></div></div><div class="flex items-center"><p class="font-semibold mr-3">${itemTotal.toFixed(2)}৳</p><button onclick="window.removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button></div>`;
            cartItemsEl.appendChild(itemEl);
        });
    } else {
        cartItemsEl.innerHTML = '<p class="text-center text-gray-500">আপনার কার্ট খালি।</p>';
    }
    cartCountEl.textContent = totalItems;
    if(totalPriceEl) totalPriceEl.textContent = `মোট মূল্য: ${totalPrice.toFixed(2)} টাকা`;
}

function updateFloatingBarUI() {
    const bar = document.getElementById("place-order-bar");
    if (!bar) return;
    if (cart.length === 0) { bar.classList.add("hidden"); return; }
    bar.classList.remove("hidden");
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 0), 0);
    document.getElementById("bar-item-count").textContent = totalItems;
    document.getElementById("bar-total-price").textContent = totalPrice.toFixed(2);
}

function getUserId() {
    if (auth && auth.currentUser) return auth.currentUser.uid;
    let userId = localStorage.getItem('tempUserId');
    if (!userId) {
        userId = 'guest_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('tempUserId', userId);
    }
    return userId;
};

function loadCart() {
    const userId = getUserId();
    if (auth && auth.currentUser) {
        onValue(ref(database, `carts/${userId}`), (snapshot) => {
            cart = snapshot.val() || [];
            updateAllCartUIs();
        });
    } else {
        const localCart = localStorage.getItem("anyBeautyCart");
        cart = localCart ? JSON.parse(localCart) : [];
        updateAllCartUIs();
    }
};

function saveCart() {
    localStorage.setItem("anyBeautyCart", JSON.stringify(cart));
    if (auth && auth.currentUser) {
        set(ref(database, `carts/${getUserId()}`), cart);
    }
    updateAllCartUIs();
};

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    showToast(`${product.name} কার্টে যোগ করা হয়েছে`, "success");
};

function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
        saveCart();
    }
};

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
};

function checkout() {
    if (cart.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(cart));
        window.location.href = 'order-form.html';
    } else {
        showToast("আপনার কার্ট খালি!", "error");
    }
};

function buyNow(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const tempCart = [{ ...product, quantity: 1 }];
    localStorage.setItem('cartItems', JSON.stringify(tempCart));
    window.location.href = `order-form.html?source=buy&id=${productId}`;
};

// =================================================================
// SECTION: AUTHENTICATION
// =================================================================

function openLoginModal() {
    document.getElementById('loginModal')?.classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
}

function loginWithGmail() {
    signInWithPopup(auth, provider).then(result => {
        const user = result.user;
        showToast(`স্বাগতম, ${user.displayName}`);
        saveUserToFirebase(user);
        closeModal('loginModal');
    }).catch(error => console.error("Login Error:", error.message));
};

function updateLoginButton(user) {
    const mobileBtn = document.getElementById('mobileLoginButton');
    const desktopBtn = document.getElementById('desktopLoginButton');
    if (!mobileBtn || !desktopBtn) return;
    
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const html = `<div class="flex flex-col"><span class="flex items-center text-black font-semibold">${user.photoURL ? `<img src="${user.photoURL}" class="w-6 h-6 rounded-full mr-2">` : ''}${displayName}</span><button onclick="window.confirmLogout()" class="text-left text-sm text-red-500 hover:underline mt-1">লগআউট</button></div>`;
        mobileBtn.innerHTML = html;
        desktopBtn.innerHTML = html;
    } else {
        const html = `<button class="flex items-center" onclick="window.openLoginModal()"><i class="fas fa-user-circle mr-2"></i><span class="text-black">লগইন</span></button>`;
        mobileBtn.innerHTML = `<button class="flex items-center w-full" onclick="window.openLoginModal()"><i class="fas fa-user-circle mr-2"></i><span class="text-black font-semibold">লগইন</span></button>`;
        desktopBtn.innerHTML = html;
    }
};

function confirmLogout() {
    if (confirm("আপনি কি লগআউট করতে চান?")) logout();
}

function logout() {
    signOut(auth).then(() => showToast("সফলভাবে লগআউট হয়েছেন।"));
}

function saveUserToFirebase(user) {
    const userRef = ref(database, `users/${user.uid}`);
    get(userRef).then(snapshot => {
        if (!snapshot.exists()) {
            set(userRef, { name: user.displayName, email: user.email, photoURL: user.photoURL, createdAt: new Date().toISOString() });
        }
    });
};

// =================================================================
// SECTION: UI & DISPLAY LOGIC (HOME PAGE)
// =================================================================

function showProductDetail(id) {
    window.location.href = `product-detail.html?id=${id}`;
}

function showLoadingSpinner() {
    const productList = document.getElementById("productList");
    if (productList) {
        productList.innerHTML = Array(8).fill('<div class="bg-white rounded-xl shadow overflow-hidden animate-pulse"><div class="bg-gray-300 h-36 w-full"></div><div class="p-3"><div class="h-5 bg-gray-200 rounded w-3/4 mb-3"></div><div class="h-6 bg-gray-200 rounded w-1/2"></div></div></div>').join('');
    }
}

function displayProductsAsCards(productsToDisplay) {
    const productList = document.getElementById("productList");
    if (!productList) return;
    productList.innerHTML = "";

    productsToDisplay.forEach(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const cartControlsHTML = cartItem
            ? `<div class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-around"><button onclick="window.updateQuantity('${product.id}', -1)" class="px-3 text-xl font-bold text-lipstick-dark">-</button><span class="text-lg text-lipstick-dark">${cartItem.quantity}</span><button onclick="window.updateQuantity('${product.id}', 1)" class="px-3 text-xl font-bold text-lipstick-dark">+</button></div>`
            : `<button onclick="window.addToCart('${product.id}')" class="w-full bg-white rounded-lg font-semibold flex items-center h-10 justify-center text-sm text-lipstick-dark hover:bg-gray-100">Add To Cart</button>`;

        const productCard = document.createElement('div');
        productCard.className = "bg-white rounded-xl shadow overflow-hidden flex flex-col";
        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/150";

        productCard.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" class="w-full h-36 object-cover cursor-pointer" onclick="window.showProductDetail('${product.id}')">
            <div class="p-3 text-white flex flex-col flex-grow" style="background-color: #F4A7B9;">
                <div class="flex-grow"><h3 class="font-semibold text-lg h-10 line-clamp-2 cursor-pointer" onclick="window.showProductDetail('${product.id}')">${product.name}</h3></div>
                <div>
                    <p class="text-xl font-bold mt-2">${product.price} টাকা</p>
                    <div class="mt-4 space-y-2">${cartControlsHTML}<button onclick="window.buyNow('${product.id}')" class="w-full border border-white text-white py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-lipstick-dark transition-colors">Buy Now</button></div>
                </div>
            </div>`;
        productList.appendChild(productCard);
    });
}

function initializeProductSlider(sliderProducts) {
    const wrapper = document.getElementById("new-product-slider-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = sliderProducts.map(product => {
        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/400";
        return `<div class="swiper-slide"><div class="relative w-full h-64 md:h-80"><img src="${imageUrl}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${product.name}</h3><p class="text-white text-lg">${product.price} টাকা</p><button onclick="window.showProductDetail('${product.id}')" class="mt-4 bg-lipstick-dark text-white py-2 px-4 rounded-lg self-start hover:bg-opacity-80">Shop Now</button></div></div></div>`;
    }).join('');
    
    if (typeof Swiper !== 'undefined') {
        new Swiper(".new-product-slider", { loop: sliderProducts.length > 1, autoplay: { delay: 3000 }, pagination: { el: ".swiper-pagination", clickable: true }, effect: "fade" });
    }
}

function displayEvents() {
    const wrapper = document.getElementById('event-slider-wrapper');
    if (!wrapper) return;
    onValue(ref(database, 'events'), (snapshot) => {
        const activeEvents = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => { if (child.val().isActive) activeEvents.push(child.val()); });
        }
        wrapper.innerHTML = activeEvents.length > 0
            ? activeEvents.slice(0, 3).map(event => event.imageUrl
                ? `<div class="swiper-slide rounded-lg shadow-lg bg-cover bg-center" style="height: 160px; background-image: url(${event.imageUrl});"><div class="w-full h-full bg-black bg-opacity-50 rounded-lg p-6 flex flex-col justify-center items-center text-center text-white"><h3 class="text-xl font-bold">${event.title || ''}</h3><p class="mt-1">${event.description || ''}</p></div></div>`
                : `<div class="swiper-slide bg-white p-6 flex flex-col justify-center items-center text-center rounded-lg shadow-lg" style="height: 160px;"><h3 class="text-xl font-bold text-lipstick-dark">${event.title || ''}</h3><p class="text-gray-600 mt-1">${event.description || ''}</p></div>`
            ).join('')
            : '<div class="swiper-slide text-center p-6 bg-white rounded-lg">কোনো নতুন ইভেন্ট নেই।</div>';

        if (typeof Swiper !== 'undefined') {
            if (eventSlider) eventSlider.destroy(true, true);
            eventSlider = new Swiper('.event-slider', { loop: activeEvents.length > 1, autoplay: { delay: 3500 }, pagination: { el: '.swiper-pagination', clickable: true } });
        }
    });
}

// =================================================================
// SECTION: SEARCH & FILTERING
// =================================================================

function displaySearchResults(filtered, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = filtered.slice(0, 5).map(p => `
        <a href="product-detail.html?id=${p.id}" class="flex items-center p-2 hover:bg-gray-100 text-gray-800 border-b">
            <img src="${p.image ? p.image.split(',')[0].trim() : 'https://via.placeholder.com/40'}" class="w-8 h-8 object-cover rounded mr-2">
            <span class="text-sm">${p.name}</span><span class="ml-auto text-xs text-red-500">${p.price}৳</span>
        </a>`).join('');
    container.classList.toggle('hidden', filtered.length === 0);
};

function searchProductsMobile() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.tags?.toLowerCase().includes(query)) : [];
    displaySearchResults(filtered, 'searchResults');
};

function searchProductsDesktop() {
    const query = document.getElementById('searchInputDesktop').value.toLowerCase().trim();
    const filtered = query ? products.filter(p => p.name.toLowerCase().includes(query) || p.tags?.toLowerCase().includes(query)) : [];
    displaySearchResults(filtered, 'searchResultsDesktop');
};

function filterProducts(category) {
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    displayProductsAsCards(filtered);
    closeSidebar();
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    if (desktopSubMenuBar) desktopSubMenuBar.classList.add('hidden');
    document.getElementById('productList')?.scrollIntoView({ behavior: 'smooth' });
};

// =================================================================
// SECTION: HEADER & SIDEBAR UI CONTROLS
// =================================================================

function openSidebar() {
    document.getElementById('sidebarOverlay')?.classList.remove('hidden');
    document.getElementById('sidebar')?.classList.remove('-translate-x-full');
};
function closeSidebar() {
    document.getElementById('sidebarOverlay')?.classList.add('hidden');
    document.getElementById('sidebar')?.classList.add('-translate-x-full');
};
function toggleSubMenuMobile(event) {
    event.stopPropagation();
    document.getElementById('subMenuMobile')?.classList.toggle('hidden');
    document.getElementById('arrowIcon')?.classList.toggle('rotate-180');
};
function handleSubMenuItemClick(category) {
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        filterProducts(category);
    } else {
        window.location.href = `index.html?filter=${category}`;
    }
    closeSidebar();
};
function toggleSubMenuDesktop() {
    document.getElementById('desktopSubMenuBar')?.classList.toggle('hidden');
    document.getElementById('desktopArrowIcon')?.classList.toggle('rotate-180');
};
function openCartSidebar() {
    document.getElementById('cartSidebar')?.classList.remove('translate-x-full');
    document.getElementById('cartOverlay')?.classList.remove('hidden');
};
function closeCartSidebar() {
    document.getElementById('cartSidebar')?.classList.add('translate-x-full');
    document.getElementById('cartOverlay')?.classList.add('hidden');
};
function focusMobileSearch() {
    document.getElementById('mobileSearchBar')?.classList.toggle('hidden');
    document.getElementById('searchInput')?.focus();
};

// =================================================================
// SECTION: PRODUCT DETAIL PAGE LOGIC
// =================================================================

async function initializeProductDetailPage() {
    const productContent = document.getElementById('productContent');
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (!productContent) return; 

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        showToast('প্রোডাক্ট আইডি পাওয়া যায়নি!', 'error');
        if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">প্রোডাক্ট আইডি পাওয়া যায়নি।</p>';
        return;
    }

    try {
        const productRef = ref(database, 'products/' + productId);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            const product = { id: productId, ...snapshot.val() };
            displayProductDetails(product);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            productContent.classList.remove('hidden');
        } else {
            showToast('প্রোডাক্ট পাওয়া যায়নি!', 'error');
            if (loadingSpinner) loadingSpinner.innerHTML = '<p class="text-red-500">দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি।</p>';
        }
    } catch (error) {
        showToast('প্রোডাক্ট লোড করতে সমস্যা হয়েছে!', 'error');
        if (loadingSpinner) loadingSpinner.innerHTML = `<p class="text-red-500">ত্রুটি: ${error.message}</p>`;
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
        extraHTML += `<div class="flex items-center space-x-3 my-4"><span class="text-gray-700 font-medium">পরিমাণ:</span><div class="flex items-center border border-gray-300 rounded-lg"><button onclick="window.changeDetailQuantity(-1)" class="bg-gray-200 px-4 py-2 font-bold">-</button><input type="number" id="quantityDetailInput" value="1" min="1" class="w-16 text-center border-0 focus:ring-0"><button onclick="window.changeDetailQuantity(1)" class="bg-gray-200 px-4 py-2 font-bold">+</button></div></div>`;
    }
    detailsExtraContainer.innerHTML = extraHTML;

    const actionButtonsContainer = document.getElementById('actionButtons');
    const whatsappMessage = `প্রোডাক্ট: ${product.name}\nদাম: ${product.price} টাকা\nআমি এই প্রোডাক্টটি কিনতে আগ্রহী।`;
    const whatsappLink = `https://wa.me/8801931866636?text=${encodeURIComponent(whatsappMessage)}`;
    
    let buttonsHTML = `<button id="buyNowDetailBtn" onclick="window.buyNowWithQuantity('${product.id}')" class="w-full sm:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center"><i class="fas fa-credit-card mr-2"></i>এখনই কিনুন</button><button id="addToCartDetailBtn" onclick="window.addToCartWithQuantity('${product.id}')" class="w-full sm:w-auto bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 font-semibold flex items-center justify-center"><i class="fas fa-cart-plus mr-2"></i>কার্টে যোগ করুন</button><a href="${whatsappLink}" target="_blank" class="w-full sm:w-auto bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold inline-flex items-center justify-center"><i class="fab fa-whatsapp mr-2"></i>WhatsApp এ অর্ডার</a>`;
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

function changeDetailQuantity(amount) { const input = document.getElementById('quantityDetailInput'); if(!input) return; let currentValue = parseInt(input.value); if (isNaN(currentValue)) currentValue = 1; const newValue = currentValue + amount; if (newValue >= 1) input.value = newValue; }
function addToCartWithQuantity(productId) { const quantity = parseInt(document.getElementById('quantityDetailInput').value); const product = products.find(p => p.id === productId); if (!product) return; const cartItem = cart.find(item => item.id === productId); if (cartItem) cartItem.quantity += quantity; else cart.push({ ...product, quantity: quantity, image: product.image ? product.image.split(',')[0].trim() : '' }); saveCart(); showToast(`${quantity}টি ${product.name} কার্টে যোগ করা হয়েছে`, "success"); openCartSidebar(); }
function buyNowWithQuantity(productId) { const quantity = parseInt(document.getElementById('quantityDetailInput').value); const product = products.find(p => p.id === productId); if (!product) return; const tempCart = [{ ...product, quantity: quantity, image: product.image ? product.image.split(',')[0].trim() : '' }]; localStorage.setItem('cartItems', JSON.stringify(tempCart)); window.location.href = `order-form.html?source=buy&id=${productId}&quantity=${quantity}`; }

let galleryImages = []; let currentImageModalIndex = 0;
function setupImageGallery(images) { galleryImages = images; const mainImage = document.getElementById('mainImage'); const thumbnailContainer = document.getElementById('thumbnailContainer'); thumbnailContainer.innerHTML = ''; if (images.length > 0) { mainImage.src = images[0]; images.forEach((img, index) => { const thumb = document.createElement('img'); thumb.src = img; thumb.className = 'thumbnail'; if (index === 0) thumb.classList.add('active'); thumb.onclick = () => { mainImage.src = img; currentImageModalIndex = index; document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }; thumbnailContainer.appendChild(thumb); }); } else { mainImage.src = 'https://via.placeholder.com/500x400.png?text=No+Image'; } mainImage.addEventListener('click', openImageModal); }
function openImageModal() { if (galleryImages.length === 0) return; const modal = document.getElementById('imageModal'); modal.style.display = 'flex'; updateModalImage(); document.getElementById('modalCloseBtn').onclick = closeImageModal; document.getElementById('modalPrevBtn').onclick = () => changeModalImage(-1); document.getElementById('modalNextBtn').onclick = () => changeModalImage(1); }
function closeImageModal() { document.getElementById('imageModal').style.display = 'none'; }
function changeModalImage(direction) { currentImageModalIndex = (currentImageModalIndex + direction + galleryImages.length) % galleryImages.length; updateModalImage(); }
function updateModalImage() { document.getElementById('modalImage').src = galleryImages[currentImageModalIndex]; }

// =================================================================
// SECTION: ORDER TRACK PAGE LOGIC
// =================================================================

async function initializeOrderTrackPage() {
    const loadingContainer = document.getElementById('loadingContainer');
    const loginPromptContainer = document.getElementById('loginPromptContainer');
    const orderListContainer = document.getElementById('orderListContainer');
    const noOrdersContainer = document.getElementById('noOrdersContainer');

    onAuthStateChanged(auth, async user => {
        if(loadingContainer) loadingContainer.classList.remove('hidden');
        if(loginPromptContainer) loginPromptContainer.classList.add('hidden');
        if(orderListContainer) orderListContainer.classList.add('hidden');
        if(noOrdersContainer) noOrdersContainer.classList.add('hidden');

        if (user) {
            await migrateLocalOrdersToUser(user);
            await loadUserOrders(user.email);
        } else {
            if(loginPromptContainer) loginPromptContainer.classList.remove('hidden');
            const loginButton = document.getElementById('loginButton');
            if(loginButton) loginButton.onclick = () => loginWithGmail();
            await loadLocalOrders();
        }
        
        if(loadingContainer) loadingContainer.classList.add('hidden');
    });
}

async function loadLocalOrders() { const localOrderKeys = JSON.parse(localStorage.getItem('myLocalOrders') || '[]'); const noOrdersContainer = document.getElementById('noOrdersContainer'); if (localOrderKeys.length === 0) { if(noOrdersContainer) noOrdersContainer.classList.remove('hidden'); return; } try { const ordersPromises = localOrderKeys.map(key => get(ref(database, `orders/${key}`))); const ordersSnapshots = await Promise.all(ordersPromises); const orders = ordersSnapshots.filter(snapshot => snapshot.exists()).map(snapshot => ({ key: snapshot.key, ...snapshot.val() })); if (orders.length > 0) { orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); displayOrderCards(orders); document.getElementById('orderListContainer').classList.remove('hidden'); } else { if(noOrdersContainer) noOrdersContainer.classList.remove('hidden'); } } catch (error) { showToast("লোকাল অর্ডার আনতে সমস্যা হয়েছে!", 'error'); if(noOrdersContainer) noOrdersContainer.classList.remove('hidden'); } }
async function loadUserOrders(userEmail) { const noOrdersContainer = document.getElementById('noOrdersContainer'); try { const ordersRef = ref(database, 'orders'); const userOrdersQuery = query(ordersRef, orderByChild('userEmail'), equalTo(userEmail)); const snapshot = await get(userOrdersQuery); const orders = []; if (snapshot.exists()) { snapshot.forEach(child => orders.push({ key: child.key, ...child.val() })); orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)); displayOrderCards(orders); document.getElementById('orderListContainer').classList.remove('hidden'); } else { if(noOrdersContainer) noOrdersContainer.classList.remove('hidden'); } } catch (error) { showToast("আপনার অর্ডার আনতে সমস্যা হয়েছে!", 'error'); if(noOrdersContainer) noOrdersContainer.classList.remove('hidden'); } }
async function migrateLocalOrdersToUser(user) { const localOrderKeys = JSON.parse(localStorage.getItem('myLocalOrders') || '[]'); if (localOrderKeys.length === 0) return; const updates = {}; localOrderKeys.forEach(key => { updates[`/orders/${key}/userEmail`] = user.email; updates[`/orders/${key}/userId`] = user.uid; }); try { await update(ref(database), updates); localStorage.removeItem('myLocalOrders'); } catch (error) { console.error('Failed to migrate orders:', error); } }
function displayOrderCards(orders) { const container = document.getElementById('orderListContainer'); if(!container) return; container.innerHTML = ''; orders.forEach(order => { const productSummary = order.cartItems?.map(item => `${item.name} (x${item.quantity})`).join(', ') || 'N/A'; const statusText = getStatusText(order.status); const statusColor = getStatusColor(order.status); const card = document.createElement('div'); card.className = 'order-card bg-white p-5 rounded-lg shadow-sm mb-4 cursor-pointer'; card.innerHTML = `<div class="flex flex-col md:flex-row justify-between md:items-center gap-4"><div><p class="text-sm text-gray-500">অর্ডার আইডি</p><p class="font-bold text-gray-800">${order.orderId || 'N/A'}</p></div><div class="md:w-1/3"><p class="text-sm text-gray-500">প্রোডাক্টস</p><p class="font-semibold text-gray-700 truncate" title="${productSummary}">${productSummary}</p></div><div><p class="text-sm text-gray-500">মোট মূল্য</p><p class="font-bold text-gray-800">${order.totalAmount || 0} টাকা</p></div><div class="text-center"><p class="text-sm text-gray-500">স্ট্যাটাস</p><span class="px-3 py-1 text-sm font-bold rounded-full ${statusColor.bg} ${statusColor.text}">${statusText}</span></div></div>`; card.onclick = () => showOrderDetailsModal(order); container.appendChild(card); }); }
function showOrderDetailsModal(order) { const modal = document.getElementById('orderModal'); const modalContent = document.getElementById('modalContent'); if(!modal || !modalContent) return; const status = order.status || 'processing'; const progress = calculateProgress(status); const progressSteps = ['processing', 'confirmed', 'packaging', 'shipped', 'delivered']; let progressHTML = `<div class="progress-steps mb-2"><div class="progress-bar-fill" style="width: ${progress}%"></div>`; progressSteps.forEach(step => { const stepIndex = progressSteps.indexOf(step); const currentIndex = progressSteps.indexOf(status); const isActive = currentIndex >= stepIndex; progressHTML += `<div class="progress-step ${isActive ? 'active' : ''}">${getStepIcon(step)}</div>`; }); progressHTML += `</div><div class="flex justify-between text-xs text-gray-500 px-1"><span>প্রসেসিং</span><span>কনফার্মড</span><span>প্যাকেজিং</span><span>ডেলিভারি</span><span>সম্পন্ন</span></div>`; let timelineHTML = ''; if (order.statusHistory) { order.statusHistory.slice().reverse().forEach((history, index) => { timelineHTML += `<div class="timeline-item relative pb-4 ${index === 0 ? 'active' : ''}"><div class="timeline-icon">${getStatusIcon(history.status)}</div><p class="font-semibold text-gray-800">${getStatusText(history.status)}</p><p class="text-sm text-gray-500">${new Date(history.updatedAt).toLocaleString('bn-BD')}</p></div>`; }); } let cartItemsHTML = ''; order.cartItems?.forEach(item => { cartItemsHTML += `<div class="flex items-center gap-4 py-2 border-b last:border-b-0"><img src="${item.image?.split(',')[0].trim() || 'https://via.placeholder.com/60'}" class="w-16 h-16 object-cover rounded-md"><div class="flex-grow"><p class="font-semibold">${item.name}</p><p class="text-sm text-gray-600">${item.quantity} x ${item.price} টাকা</p></div><p class="font-bold text-gray-800">${item.quantity * item.price} টাকা</p></div>`; }); modalContent.innerHTML = `<div class="mb-6"><h2 class="text-2xl font-bold text-lipstick-dark">অর্ডার বিস্তারিত</h2><p class="text-sm text-gray-500">অর্ডার আইডি: ${order.orderId}</p></div><div class="mb-8">${progressHTML}</div><div class="grid grid-cols-1 md:grid-cols-2 gap-8"><div><h3 class="font-bold text-lg mb-3 text-gray-800">স্ট্যাটাস হিস্টোরি</h3><div class="timeline">${timelineHTML}</div></div><div><h3 class="font-bold text-lg mb-3 text-gray-800">অর্ডার করা প্রোডাক্ট</h3><div class="space-y-2">${cartItemsHTML}</div><div class="text-right mt-4 border-t pt-2"><p class="text-gray-600">ডেলিভারি ফি: <span class="font-bold">${order.deliveryFee} টাকা</span></p><p class="text-lg text-gray-800">সর্বমোট: <span class="font-bold text-lipstick-dark">${order.totalAmount} টাকা</span></p></div></div></div>`; modal.style.display = 'flex'; document.getElementById('modalClose').onclick = () => modal.style.display = 'none'; modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; }; }
function getStatusText(status) { const statuses = { processing: 'প্রসেসিং', confirmed: 'কনফার্মড', packaging: 'প্যাকেজিং', shipped: 'ডেলিভারি হয়েছে', delivered: 'সম্পন্ন হয়েছে', failed: 'ব্যর্থ', cancelled: 'ক্যানসেলড' }; return statuses[status] || 'অজানা'; }
function getStatusColor(status) { const colors = { processing: { text: 'text-yellow-800', bg: 'bg-yellow-100' }, confirmed: { text: 'text-blue-800', bg: 'bg-blue-100' }, packaging: { text: 'text-purple-800', bg: 'bg-purple-100' }, shipped: { text: 'text-cyan-800', bg: 'bg-cyan-100' }, delivered: { text: 'text-green-800', bg: 'bg-green-100' }, failed: { text: 'text-red-800', bg: 'bg-red-100' }, cancelled: { text: 'text-gray-800', bg: 'bg-gray-200' } }; return colors[status] || colors.cancelled; }
function calculateProgress(status) { const progressMap = { processing: 0, confirmed: 25, packaging: 50, shipped: 75, delivered: 100, failed: 0, cancelled: 0 }; return progressMap[status] ?? 0; }
function getStatusIcon(status) { const icons = { processing: 'fas fa-cogs', confirmed: 'fas fa-check', packaging: 'fas fa-box-open', shipped: 'fas fa-truck', delivered: 'fas fa-home', failed: 'fas fa-times-circle', cancelled: 'fas fa-ban' }; return `<i class="${icons[status] || 'fas fa-question'}"></i>`; }
function getStepIcon(status) { const icons = { processing: '1', confirmed: '2', 'packaging': '3', shipped: '4', delivered: '<i class="fas fa-check"></i>' }; return icons[status]; }


// =================================================================
// SECTION: GLOBAL FUNCTION ASSIGNMENT (গুরুত্বপূর্ণ)
// =================================================================

Object.assign(window, {
    // Global Utilities
    showToast,
    sendTelegramNotification, // <--- আপনার নতুন ফাংশন
    // Header UI
    openSidebar, closeSidebar, toggleSubMenuMobile, handleSubMenuItemClick,
    toggleSubMenuDesktop, openCartSidebar, closeCartSidebar, focusMobileSearch,
    // Auth
    openLoginModal, closeModal, loginWithGmail, confirmLogout, logout,
    // Cart & Checkout
    filterProducts, searchProductsMobile, searchProductsDesktop, checkout,
    buyNow, addToCart, updateQuantity, removeFromCart,
    // Product Detail
    showProductDetail, changeDetailQuantity, addToCartWithQuantity, buyNowWithQuantity,
    initializeProductDetailPage, initializeOrderTrackPage, // order track init functions added to window
});

// =================================================================
// SECTION: MAIN INITIALIZATION
// =================================================================

function main() {
    // jQuery দিয়ে হেডার এবং ফুটার লোড
    if (typeof $ !== 'undefined') {
        $("#header").load("header.html", () => {
            console.log("Header loaded successfully.");
            onAuthStateChanged(auth, user => updateLoginButton(user));
            loadCart();
        });
        $("#footer").load("footer.html");
    }

    // সব প্রোডাক্ট লোড করা
    const productsRef = ref(database, "products/");
    onValue(productsRef, snapshot => {
        if (snapshot.exists()) {
            products = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
            
            const currentPage = window.location.pathname;
            if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
                const urlParams = new URLSearchParams(window.location.search);
                const filterCategory = urlParams.get('filter');
                if (filterCategory) {
                    filterProducts(filterCategory);
                } else {
                    displayProductsAsCards(products);
                }
                const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));
                initializeProductSlider(sliderProducts);
            }
        }
    });

    // পেজ অনুযায়ী নির্দিষ্ট ফাংশন চালানো
    const currentPage = window.location.pathname;
    if (currentPage.endsWith('/') || currentPage.endsWith('index.html')) {
        showLoadingSpinner();
        displayEvents();
    }
    if (currentPage.includes('product-detail.html')) {
        initializeProductDetailPage();
    }
    if (currentPage.includes('order-track.html')) {
        initializeOrderTrackPage();
    }
}

document.addEventListener('DOMContentLoaded', main);

// গ্লোবাল ক্লিক হ্যান্ডলার
document.addEventListener("click", (event) => {
    if (!event.target.closest('#sidebar') && !event.target.closest('button[onclick="openSidebar()"]')) closeSidebar();
    if (!event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) closeCartSidebar();
    if (!event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) document.getElementById('desktopSubMenuBar')?.classList.add('hidden');
    
    const searchResultsMobile = document.getElementById('searchResults');
    const searchResultsDesktop = document.getElementById('searchResultsDesktop');
    if (searchResultsMobile && !searchResultsMobile.contains(event.target) && !event.target.closest('#searchInput')) { searchResultsMobile.classList.add('hidden'); }
    if (searchResultsDesktop && !searchResultsDesktop.contains(event.target) && !event.target.closest('#searchInputDesktop')) { searchResultsDesktop.classList.add('hidden'); }
});
