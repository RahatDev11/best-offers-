// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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
let products = [];
let cart = [];
let eventSlider;

// --- UI and Core Functions ---
window.showProductDetail = (a) => window.location.href = `product-detail.html?id=${a}`;

window.buyNow = (productId) => {
    const item = cart.find(i => i.id === productId);
    const qty = item ? item.quantity : 1;
    window.location.href = `order-form.html?id=${productId}&quantity=${qty}`;
};

window.checkout = () => {
    if (cart.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(cart));
        window.location.href = 'order-form.html';
    } else {
        showToast("Apnar cart khali!", "error");
    }
};

function displayProductsAsCards(productsToDisplay) {
    const productList = document.getElementById("productList");
    if (!productList) return;
    productList.innerHTML = "";
    productsToDisplay.forEach(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const isInCart = !!cartItem;
        const commonClasses = "w-full bg-white rounded-lg font-semibold flex items-center h-10 transition-colors";
        let cartControlsHTML = isInCart ?
            `<div class="${commonClasses} justify-around"><button onclick="updateQuantity('${product.id}', -1)" class="px-3 text-xl font-bold" style="color: #F4A7B9 !important;">-</button><span class="text-lg" style="color: #F4A7B9 !important;">${cartItem.quantity}</span><button onclick="updateQuantity('${product.id}', 1)" class="px-3 text-xl font-bold" style="color: #F4A7B9 !important;">+</button></div>` :
            `<button onclick="addToCart('${product.id}')" class="${commonClasses} justify-center text-sm hover:bg-gray-100" style="color: #F4A7B9 !important;">Add To Cart</button>`;
        const productCard = document.createElement('div');
        productCard.className = "bg-white rounded-xl shadow overflow-hidden flex flex-col";
        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/150";
        productCard.innerHTML = `<img src="${imageUrl}" alt="${product.name}" class="w-full h-36 object-cover cursor-pointer" onclick="showProductDetail('${product.id}')" onerror="this.src='https://via.placeholder.com/150'"><div class="p-3 text-white flex flex-col flex-grow pink-bg" style="background-color: #F4A7B9;"><div class="flex-grow"><h3 class="font-semibold text-lg h-10 line-clamp-2" onclick="showProductDetail('${product.id}')">${product.name}</h3></div><div><p class="text-xl font-bold mt-2">BDT ${product.price}</p><div class="mt-4 space-y-2">${cartControlsHTML}<button onclick="buyNow('${product.id}')" class="w-full pink-bg border border-white text-white py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-lipstick transition-colors" style="background-color: #F4A7B9;">Buy Now</button></div></div></div>`;
        productList.appendChild(productCard);
    });
}

// --- Cart Management ---
function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    if (products.length > 0) displayProductsAsCards(products);
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
            itemEl.innerHTML = `<div class="flex items-center"><img src="${item.image || "https://via.placeholder.com/40"}" class="w-10 h-10 object-cover rounded mr-3"><div><p class="font-semibold text-sm">${item.name}</p><p class="text-xs text-gray-600">${item.quantity} x ${item.price}৳</p></div></div><div class="flex items-center"><p class="font-semibold mr-3">${itemTotal.toFixed(2)}৳</p><button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button></div>`;
            cartItemsEl.appendChild(itemEl);
        });
    } else {
        cartItemsEl.innerHTML = '<p class="text-center text-gray-500">Apnar cart khali.</p>';
    }
    cartCountEl.textContent = totalItems;
    totalPriceEl.textContent = `Mot mullo: ${totalPrice.toFixed(2)} Taka`;
}

function updateFloatingBarUI() {
    const bar = document.getElementById("place-order-bar");
    if (!bar) return;
    if (cart.length === 0) return void bar.classList.add("hidden");
    bar.classList.remove("hidden");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    document.getElementById("bar-item-count").textContent = totalItems;
    document.getElementById("bar-total-price").textContent = totalPrice.toFixed(2);
}

window.getUserId = function() {
    if (auth && auth.currentUser) return auth.currentUser.uid;
    let userId = localStorage.getItem('tempUserId');
    if (!userId) {
        userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('tempUserId', userId);
    }
    return userId;
};

window.loadCart = function() {
    const userId = getUserId();
    if (auth && auth.currentUser) {
        onValue(ref(database, `carts/${userId}`), s => {
            cart = s.val() || [];
            updateAllCartUIs();
        }, { onlyOnce: true });
    } else {
        cart = JSON.parse(localStorage.getItem("anyBeautyCart") || "[]");
        updateAllCartUIs();
    }
};

window.saveCart = function() {
    localStorage.setItem("anyBeautyCart", JSON.stringify(cart));
    if (auth && auth.currentUser) set(ref(database, `carts/${getUserId()}`), cart);
    updateAllCartUIs();
};

window.addToCart = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const cartItem = cart.find(i => i.id === id);
    cartItem ? cartItem.quantity++ : cart.push({ ...product, quantity: 1 });
    saveCart();
    showToast(`${product.name} carte jog kora hoyeche`, "success");
};

window.updateQuantity = (id, amount) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += amount;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
    }
};

window.removeFromCart = (id) => {
    cart = cart.filter(i => i.id !== id);
    saveCart();
};

// --- Auth Functions ---
window.openLoginModal = () => loginWithGmail();
window.closeModal = (id) => document.getElementById(id)?.classList.add('hidden');

window.loginWithGmail = () => {
    if (!auth || !provider) return showToast("Firebase Auth load hoyni.");
    signInWithPopup(auth, provider).then(r => saveUserToFirebase(r.user)).catch(e => {
        if (e.code.includes('popup')) signInWithRedirect(auth, provider);
        else showToast("Login beartho hoyeche.", "error");
    });
};

window.updateLoginButton = (user) => {
    const mobileBtn = document.getElementById('mobileLoginButton');
    const desktopBtn = document.getElementById('desktopLoginButton');
    if (user) {
        const name = user.displayName || user.email.split('@')[0];
        const html = `<div class="flex flex-col"><span class="flex items-center">${user.photoURL ? `<img src="${user.photoURL}" class="w-6 h-6 rounded-full mr-2">` : ''} ${name}</span><button onclick="confirmLogout()" class="text-left text-sm text-red-500 mt-1">Logout</button></div>`;
        if (mobileBtn) mobileBtn.innerHTML = html;
        if (desktopBtn) desktopBtn.innerHTML = html;
    } else {
        const htmlMobile = `<button class="flex items-center w-full" onclick="openLoginModal()"><i class="fas fa-sign-in-alt mr-2"></i><span>Login</span></button>`;
        if (mobileBtn) mobileBtn.innerHTML = htmlMobile;
        const htmlDesktop = `<button class="flex items-center" onclick="openLoginModal()"><i class="fas fa-sign-in-alt mr-2"></i><span>Login</span></button>`;
        if (desktopBtn) desktopBtn.innerHTML = htmlDesktop;
    }
};

window.confirmLogout = () => { if (confirm("Apni ki logout korte nishchit?")) logout(); };
window.logout = () => { if (auth) signOut(auth); };

window.saveUserToFirebase = (user) => {
    onValue(ref(database, `users/${user.uid}`), s => {
        if (!s.exists()) set(ref(database, `users/${user.uid}`), { name: user.displayName, email: user.email, photoURL: user.photoURL, createdAt: new Date().toISOString() });
    }, { onlyOnce: true });
};

// --- Search, Helpers ---
window.showToast = (msg, type = "success") => {
    const el = document.createElement("div");
    el.className = `fixed bottom-24 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-3 rounded-lg shadow-lg z-50`;
    el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
};

// =================================================================
//                 হেডার প্রোডাক্ট স্লাইডার
// =================================================================
function initializeProductSlider(sliderProducts) {
    const wrapper = document.getElementById("new-product-slider-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";
    if (sliderProducts.length === 0) {
        wrapper.innerHTML = `<div class="swiper-slide"><div class="relative w-full h-64 md:h-80 bg-gray-200 flex items-center justify-center"><p class="text-gray-500">No featured products.</p></div></div>`;
    } else {
        sliderProducts.forEach(p => {
            const img = p.image ? p.image.split(",")[0].trim() : "https://via.placeholder.com/400";
            wrapper.innerHTML += `<div class="swiper-slide"><div class="relative w-full h-64 md:h-80"><img src="${img}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${p.name}</h3><p class="text-white text-lg">BDT ${p.price}</p><button onclick="showProductDetail('${p.id}')" class="mt-4 text-white py-2 px-4 rounded-lg self-start hover:bg-lipstick-dark transition-colors pink-bg" style="background-color: #F4A7B9;">Shop Now</button></div></div></div>`;
        });
    }
    new Swiper(".new-product-slider", { loop: sliderProducts.length > 1, autoplay: { delay: 3000 }, pagination: { el: ".swiper-pagination", clickable: true }, effect: "fade", fadeEffect: { crossFade: true } });
}

// =================================================================
//                 ইভেন্ট ব্যানার
// =================================================================
function displayEvents() {
    const wrapper = document.getElementById('event-slider-wrapper');
    if (!wrapper) return;
    onValue(ref(database, 'events'), (snapshot) => {
        wrapper.innerHTML = '';
        const activeEvents = [];
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                if (child.val().isActive) activeEvents.push({ id: child.key, ...child.val() });
            });
        }
        if (activeEvents.length > 0) {
            activeEvents.slice(0, 3).forEach(event => {
                let slideHTML;
                if (event.imageUrl) {
                    slideHTML = `<div class="swiper-slide rounded-lg shadow-lg border border-pink-100 bg-cover bg-center" style="background-image: url(${event.imageUrl}); height: 160px;"><div class="w-full h-full bg-black bg-opacity-50 rounded-lg p-6 flex flex-col justify-center items-center text-center text-white"><h3 class="text-xl md:text-2xl font-bold">${event.title || ''}</h3><p class="mt-1 text-sm md:text-base">${event.description || ''}</p></div></div>`;
                } else {
                    slideHTML = `<div class="swiper-slide bg-white p-6 flex flex-col justify-center items-center text-center rounded-lg shadow-lg border border-pink-100" style="height: 160px;"><h3 class="text-xl md:text-2xl font-bold text-lipstick-dark">${event.title || ''}</h3><p class="text-gray-600 mt-1 text-sm md:text-base">${event.description || ''}</p></div>`;
                }
                wrapper.innerHTML += slideHTML;
            });
        } else {
            wrapper.innerHTML = `<div class="swiper-slide text-center p-6 bg-white rounded-lg">কোনো নতুন ইভেন্ট নেই।</div>`;
        }
        if (eventSlider) eventSlider.destroy(true, true);
        eventSlider = new Swiper('.event-slider', { loop: activeEvents.length > 1, autoplay: { delay: 3500 }, pagination: { el: '.swiper-pagination', clickable: true } });
    });
}

// =================================================================
//                 অ্যাডমিন ফাংশন
// =================================================================
window.addImageField = () => {
    const container = document.getElementById('imageInputs');
    const inputCount = container.getElementsByTagName('input').length;
    container.innerHTML += `<input type="text" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ${inputCount + 1}">`;
};

// --- প্রোডাক্ট ম্যানেজমেন্ট ---
function displayAdminProducts() {
    const container = document.getElementById('productListAdmin');
    if (!container) return;
    onValue(ref(database, 'products'), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const id = child.key;
                const p = child.val();
                const img = p.image ? p.image.split(',')[0].trim() : 'https://via.placeholder.com/40';
                container.innerHTML += `<div class="p-2 border rounded-md flex items-center justify-between">
                    <div class="flex items-center"><img src="${img}" class="w-10 h-10 object-cover rounded mr-3" onerror="this.src='https://via.placeholder.com/40'"><p class="font-semibold">${p.name}</p></div>
                    <div class="space-x-2">
                        <button onclick="editProduct('${id}')" class="text-blue-500"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteProduct('${id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            });
        }
    });
}

window.editProduct = (id) => {
    onValue(ref(database, `products/${id}`), (snapshot) => {
        if (snapshot.exists()) {
            const p = snapshot.val();
            document.getElementById('productId').value = id;
            document.getElementById('productName').value = p.name || '';
            document.getElementById('productPrice').value = p.price || '';
            document.getElementById('productCategory').value = p.category || 'cosmetics';
            document.getElementById('productStockStatus').value = p.stockStatus || 'in_stock';
            document.getElementById('productDescription').value = p.description || '';
            document.getElementById('productTags').value = p.tags || '';

            const imageContainer = document.getElementById('imageInputs');
            imageContainer.innerHTML = '';
            const images = p.image ? p.image.split(',') : [''];
            images.forEach((img, index) => {
                imageContainer.innerHTML += `<input type="text" value="${img.trim()}" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ${index + 1}">`;
            });
            window.scrollTo(0, document.getElementById('product-management').offsetTop);
        }
    }, { onlyOnce: true });
};

window.deleteProduct = (id) => {
    if (confirm('আপনি কি এই প্রোডাক্টটি মুছে ফেলতে চান?')) {
        remove(ref(database, `products/${id}`)).then(() => showToast('প্রোডাক্ট ডিলিট হয়েছে।', 'success'));
    }
};

window.resetProductForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imageInputs').innerHTML = '<input type="text" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ১">';
};

// --- স্লাইডার ম্যানেজমেন্ট ---
function displayAdminSliderProducts() {
    const container = document.getElementById('sliderProductListAdmin');
    if (!container) return;
    onValue(ref(database, 'products'), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const key = child.key;
                const product = child.val();
                container.innerHTML += `<div class="p-2 border rounded-md flex items-center justify-between">
                    <div class="flex items-center">
                        <input type="checkbox" id="slider_check_${key}" class="form-checkbox h-5 w-5 mr-3" onchange="updateSliderStatus('${key}', 'isInSlider', this.checked)" ${product.isInSlider ? 'checked' : ''}>
                        <label for="slider_check_${key}" class="font-semibold">${product.name}</label>
                    </div>
                    <div class="flex items-center">
                        <label class="text-sm mr-2">Serial:</label>
                        <input type="number" value="${product.sliderOrder || ''}" placeholder="e.g., 1" onchange="updateSliderStatus('${key}', 'sliderOrder', this.value)" class="w-16 p-1 border rounded text-center">
                    </div>
                </div>`;
            });
        }
    });
}

window.updateSliderStatus = (id, field, value) => {
    const updates = {};
    updates[`/products/${id}/${field}`] = (field === 'sliderOrder' && value) ? Number(value) : value;
    update(ref(database), updates).then(() => showToast('Slider status updated!', 'success')).catch(()=>showToast('Update failed!', 'error'));
};

// --- ইভেন্ট ম্যানেজমেন্ট ---
function displayAdminEvents() {
    const container = document.getElementById('eventListAdmin');
    if (!container) return;
    onValue(ref(database, 'events'), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const event = childSnapshot.val();
                container.innerHTML += `<div class="p-3 bg-gray-50 rounded-lg flex justify-between items-center border">
                    <div>
                        <p class="font-bold">${event.title || 'No Title'} <span class="text-sm font-normal">- ${event.isActive ? '<span class="text-green-600 font-bold">Active</span>' : '<span class="text-gray-500">Inactive</span>'}</span></p>
                        ${event.imageUrl ? `<img src="${event.imageUrl}" class="w-16 h-10 object-cover rounded mt-1" onerror="this.style.display='none'">` : ''}
                    </div>
                    <div class="space-x-2">
                        <button onclick="editEvent('${key}')" class="text-blue-500"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteEvent('${key}')" class="text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            });
        }
    });
}

window.editEvent = (id) => {
    onValue(ref(database, `events/${id}`), (snapshot) => {
        if(snapshot.exists()){
            const event = snapshot.val();
            document.getElementById('eventId').value = id;
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventImageUrl').value = event.imageUrl || '';
            document.getElementById('eventIsActive').checked = event.isActive || false;
            window.scrollTo(0, document.getElementById('event-update').offsetTop);
        }
    }, { onlyOnce: true });
};

window.deleteEvent = (id) => { if (confirm('এই ব্যানারটি মুছে ফেলতে চান?')) remove(ref(database, `events/${id}`)); };

window.resetEventForm = () => {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
};

// --- মাস্টার অ্যাডমিন কন্ট্রোল ---
window.checkAdminAndShowUploadForm = (user) => {
    const adminEmail = "mdnahidislam6714@gmail.com";
    const sections = ['product-management', 'slider-management', 'event-update'];
    const show = user && user.email === adminEmail;
    sections.forEach(id => document.getElementById(id)?.classList.toggle('hidden', !show));
    if (show) {
        displayAdminProducts();
        displayAdminSliderProducts();
        displayAdminEvents();
    }
};

// =================================================================
//                 Main Application Initialization
// =================================================================
function main() {
    $("#header").load("header.html", () => { if (auth) updateLoginButton(auth.currentUser); });
    $("#footer").load("footer.html");

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        database = getDatabase(app);
        provider = new GoogleAuthProvider();

        onAuthStateChanged(auth, user => {
            updateLoginButton(user);
            checkAdminAndShowUploadForm(user);
            loadCart();
        });
        getRedirectResult(auth).then(r => { if (r && r.user) saveUserToFirebase(r.user); });

        onValue(ref(database, "products/"), d => {
            if (d.exists()) {
                products = Object.entries(d.val()).map(([id, val]) => ({ id, ...val }));
                const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));
                initializeProductSlider(sliderProducts);
                displayProductsAsCards(products);
            }
        });
        displayEvents();

        // প্রোডাক্ট ফর্ম সাবমিট
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('productId').value;
            const images = Array.from(document.querySelectorAll('#imageInputs .image-input')).map(input => input.value.trim()).filter(Boolean).join(', ');
            
            const productData = {
                name: document.getElementById('productName').value,
                price: document.getElementById('productPrice').value,
                category: document.getElementById('productCategory').value,
                stockStatus: document.getElementById('productStockStatus').value,
                description: document.getElementById('productDescription').value,
                tags: document.getElementById('productTags').value,
                image: images
            };
            
            const productRef = id ? ref(database, `products/${id}`) : push(ref(database, 'products'));
            set(productRef, productData).then(() => {
                showToast(`প্রোডাক্ট সফলভাবে ${id ? 'আপডেট' : 'যোগ'} হয়েছে!`);
                resetProductForm();
            });
        });

        // ইভেন্ট ফর্ম সাবমিট
        document.getElementById('eventForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('eventId').value;
            const data = {
                title: document.getElementById('eventTitle').value.trim(),
                description: document.getElementById('eventDescription').value.trim(),
                imageUrl: document.getElementById('eventImageUrl').value.trim(),
                isActive: document.getElementById('eventIsActive').checked,
            };
            if (!data.title && !data.description && !data.imageUrl) return alert('কমপক্ষে একটি তথ্য দিন।');
            
            const eventRef = id ? ref(database, `events/${id}`) : push(ref(database, 'events'));
            set(eventRef, data).then(() => {
                showToast('ব্যানার সেভ হয়েছে!');
                resetEventForm();
            });
        });

    } catch (e) { console.error("Firebase Error:", e); }
}
document.addEventListener('DOMContentLoaded', main);

// --- সাইডবার, মেনু এবং অন্যান্য UI ইন্টারঅ্যাকশন ---
window.openSidebar = () => {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay && sidebar) {
        sidebarOverlay.classList.remove('hidden');
        sidebar.classList.remove('-translate-x-full');
    }
};

window.closeSidebar = () => {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay && sidebar) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    }
};

window.toggleSubMenuMobile = (event) => {
    event.stopPropagation();
    document.getElementById('subMenuMobile')?.classList.toggle('hidden');
    document.getElementById('arrowIcon')?.classList.toggle('rotate-180');
};

window.toggleSubMenuDesktop = () => {
    document.getElementById('desktopSubMenuBar')?.classList.toggle('hidden');
    document.getElementById('desktopArrowIcon')?.classList.toggle('rotate-180');
};

window.openCartSidebar = () => {
    document.getElementById('cartSidebar')?.classList.remove('translate-x-full');
    document.getElementById('cartOverlay')?.classList.remove('hidden');
};

window.closeCartSidebar = () => {
    document.getElementById('cartSidebar')?.classList.add('translate-x-full');
    document.getElementById('cartOverlay')?.classList.add('hidden');
};

window.focusMobileSearch = () => {
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    if (mobileSearchBar) {
        mobileSearchBar.classList.toggle('hidden');
        document.getElementById('searchInput')?.focus();
    }
};

document.addEventListener("click", (event) => {
    if (!event.target.closest('#sidebar') && !event.target.closest('button[onclick="openSidebar()"]')) {
        closeSidebar();
    }
    if (!event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) {
        closeCartSidebar();
    }
});