// Firebase SDK imports (সব প্রয়োজনীয় ইম্পোর্ট)
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


// --- Cart Management (অপরিবর্তিত) ---

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    if (products.length > 0) {
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
        }, { onlyOnce: true });
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
    
    const cartItem = cart.find(item => item.id === productId);
    const quantity = cartItem ? cartItem.quantity : 1;
    
    const tempCart = [{ id: productId, quantity: quantity, name: product.name, price: product.price, image: product.image }];
    localStorage.setItem('cartItems', JSON.stringify(tempCart));
    
    window.location.href = 'order-form.html?source=buy';
};


// --- Auth Functions (অপরিবর্তিত) ---

window.openLoginModal = function() {
    loginWithGmail();
};
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
};
window.loginWithGmail = function() {
    if (!auth || !provider) return showToast("Firebase Auth load hoyni.");
    signInWithPopup(auth, provider).then((result) => {
        const user = result.user;
        showToast(`Login shofol! Shagotom, ${user.displayName}`);
        saveUserToFirebase(user);
    }).catch((error) => {
        console.error("Login Error:", error.message);
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
            showToast("Popup block kora hoyeche. Redirect kora hocche...");
            signInWithRedirect(auth, provider);
        } else {
            showToast("Login beartho hoyeche: " + error.message);
        }
    });
};

window.updateLoginButton = function(user) {
    const mobileLoginButton = document.getElementById('mobileLoginButton');
    const desktopLoginButton = document.getElementById('desktopLoginButton');
    if(!mobileLoginButton || !desktopLoginButton) return;
    
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const commonHTML = `
            <div class="flex flex-col">
                <span class="flex items-center text-black font-semibold">
                    ${user.photoURL ? `<img src="${user.photoURL}" alt="User Profile" class="w-6 h-6 rounded-full mr-2">` : `<i class="fas fa-user-circle mr-2 bg-red-500 text-white p-1 rounded-full"></i>`}
                    ${displayName}
                </span>
                <button onclick="confirmLogout()" class="text-left text-sm text-red-500 hover:underline mt-1">Logout</button>
            </div>`;
        mobileLoginButton.innerHTML = commonHTML;
        desktopLoginButton.innerHTML = commonHTML;
    } else {
        const commonHTMLMobile = `<button class="flex items-center w-full" onclick="openLoginModal()"><i class="fas fa-user-circle mr-2 bg-red-500 text-white p-1 rounded-full"></i><span class="text-black font-semibold">লগইন</span></button>`;
        mobileLoginButton.innerHTML = commonHTMLMobile;
        const commonHTMLDesktop = `<button class="flex items-center" onclick="openLoginModal()"><i class="fas fa-user-circle mr-2 bg-red-500 text-white p-1 rounded-full"></i><span class="text-black">লগইন</span></button>`;
        desktopLoginButton.innerHTML = commonHTMLDesktop;
    }
};

window.confirmLogout = function() {
    if (confirm("Apni ki logout korte nishchit?")) {
        logout();
    }
};
window.logout = function() {
    if (!auth) return;
    signOut(auth).then(() => {
        showToast("Logout shofol hoyeche.");
    }).catch((error) => {
        showToast("Logout beartho hoyeche: " + error.message);
    });
};
window.saveUserToFirebase = function(user) {
    if (!database) return;
    const userRef = ref(database, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
        if (!snapshot.exists()) {
            set(userRef, {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString()
            });
        }
    }, { onlyOnce: true });
};


// --- Product Display and Slider (অপরিবর্তিত) ---

window.showProductDetail = function(a) { window.location.href = `product-detail.html?id=${a}` };

function showLoadingSpinner() {
    const a = document.getElementById("productList");
    if (a) {
        a.innerHTML = "";
        for (let b = 0; b < 8; b++) {
            const c = document.createElement("div");
            c.className = "bg-white rounded-xl shadow overflow-hidden flex flex-col";
            c.innerHTML = '<div class="bg-gray-300 h-36 w-full animate-pulse"></div><div class="p-3 flex flex-col flex-grow pink-bg" style="background-color: #F4A7B9;"><div class="flex-grow"><div class="bg-gray-200 opacity-50 h-5 w-3/4 rounded animate-pulse mb-3"></div></div><div><div class="bg-gray-200 opacity-50 h-6 w-1/2 rounded animate-pulse mb-4"></div><div class="space-y-2"><div class="bg-gray-200 h-9 w-full rounded animate-pulse"></div><div class="border border-white/50 h-9 w-full rounded animate-pulse"></div></div></div></div>';
            a.appendChild(c);
        }
    }
}

function displayProductsAsCards(productsToDisplay) {
    const productList = document.getElementById("productList");
    if (!productList) return;
    productList.innerHTML = "";

    productsToDisplay.forEach(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const isInCart = !!cartItem;

        const commonClasses = "w-full bg-white rounded-lg font-semibold flex items-center h-10 transition-colors";

        let cartControlsHTML = isInCart ?
            `
            <div class="${commonClasses} justify-around">
                <button onclick="updateQuantity('${product.id}', -1)" class="px-3 text-xl font-bold" style="color: #F4A7B9 !important;">-</button>
                <span class="text-lg" style="color: #F4A7B9 !important;">${cartItem.quantity}</span>
                <button onclick="updateQuantity('${product.id}', 1)" class="px-3 text-xl font-bold" style="color: #F4A7B9 !important;">+</button>
            </div>` :
            `<button onclick="addToCart('${product.id}')" class="${commonClasses} justify-center text-sm hover:bg-gray-100" style="color: #F4A7B9 !important;">Add To Cart</button>`;

        const productCard = document.createElement('div');
        productCard.className = "bg-white rounded-xl shadow overflow-hidden flex flex-col";
        const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/150";

        productCard.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" class="w-full h-36 object-cover cursor-pointer" onclick="showProductDetail('${product.id}')" onerror="this.src='https://via.placeholder.com/150'">
            <div class="p-3 text-white flex flex-col flex-grow pink-bg" style="background-color: #F4A7B9;">
                <div class="flex-grow">
                    <h3 class="font-semibold text-lg h-10 line-clamp-2" onclick="showProductDetail('${product.id}')">${product.name}</h3>
                </div>
                <div>
                    <p class="text-xl font-bold mt-2">BDT ${product.price}</p>
                    <div class="mt-4 space-y-2">
                        ${cartControlsHTML}
                        <button onclick="buyNow('${product.id}')" class="w-full pink-bg border border-white text-white py-2 rounded-lg font-semibold text-sm hover:bg-white hover:text-lipstick transition-colors" style="background-color: #F4A7B9; --tw-text-opacity: 1; color: white;">Buy Now</button>
                    </div>
                </div>
            </div>`;
        productList.appendChild(productCard);
    });
}

function initializeProductSlider(sliderProducts) {
    const wrapper = document.getElementById("new-product-slider-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = "";
    
    if (sliderProducts.length === 0) {
        wrapper.innerHTML = `<div class="swiper-slide"><div class="relative w-full h-64 md:h-80 bg-gray-200 flex items-center justify-center"><p class="text-gray-500">No featured products selected.</p></div></div>`;
    } else {
        sliderProducts.forEach(product => {
            const imageUrl = product.image ? product.image.split(",")[0].trim() : "https://via.placeholder.com/400";
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            slide.innerHTML = `<div class="relative w-full h-64 md:h-80"><img src="${imageUrl}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${product.name}</h3><p class="text-white text-lg">BDT ${product.price}</p><button onclick="showProductDetail('${product.id}')" class="mt-4 text-white py-2 px-4 rounded-lg self-start hover:bg-lipstick-dark transition-colors pink-bg" style="background-color: #F4A7B9;">Shop Now</button></div></div>`;
            wrapper.appendChild(slide);
        });
    }
    
    if (typeof Swiper !== 'undefined') {
        new Swiper(".new-product-slider", {
            loop: sliderProducts.length > 1,
            autoplay: { delay: 3000, disableOnInteraction: false },
            pagination: { el: ".swiper-pagination", clickable: true },
            effect: "fade",
            fadeEffect: { crossFade: true }
        });
    }
}


// --- Event Management (অপরিবর্তিত) ---

function displayEvents() {
    const wrapper = document.getElementById('event-slider-wrapper');
    if (!wrapper) return;
    const eventsRef = ref(database, 'events');
    onValue(eventsRef, (snapshot) => {
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
        
        if (typeof Swiper !== 'undefined') {
            if (eventSlider) eventSlider.destroy(true, true);
            eventSlider = new Swiper('.event-slider', { loop: activeEvents.length > 1, autoplay: { delay: 3500 }, pagination: { el: '.swiper-pagination', clickable: true } });
        }
    });
}


// --- Admin Functions (অপরিবর্তিত) ---

window.checkAdminAndShowUploadForm = function(user) {
    const adminEmail = "mdnahidislam6714@gmail.com";
    const sections = ['product-management', 'slider-management', 'event-update'];
    const show = user && user.email === adminEmail;
    
    sections.forEach(id => {
        const section = document.getElementById(id);
        if(section) section.classList.toggle('hidden', !show);
    });

    if (show) {
        displayAdminProducts();
        displayAdminSliderProducts();
        displayAdminEvents();
    }
};

window.addImageField = () => {
    const container = document.getElementById('imageInputs');
    const inputCount = container.getElementsByTagName('input').length;
    container.innerHTML += `<input type="text" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ${inputCount + 1}">`;
};

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
                container.innerHTML += `<div class="p-2 border rounded-md flex items-center justify-between"><div class="flex items-center"><img src="${img}" class="w-10 h-10 object-cover rounded mr-3" onerror="this.src='https://via.placeholder.com/40'"><p class="font-semibold">${p.name}</p></div><div class="space-x-2"><button onclick="editProduct('${id}')" class="text-blue-500"><i class="fas fa-edit"></i></button><button onclick="deleteProduct('${id}')" class="text-red-500"><i class="fas fa-trash"></i></button></div></div>`;
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
window.deleteProduct = (id) => { if (confirm('আপনি কি এই প্রোডাক্টটি মুছে ফেলতে চান?')) remove(ref(database, `products/${id}`)).then(() => showToast('প্রোডাক্ট ডিলিট হয়েছে।')); };
window.resetProductForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imageInputs').innerHTML = '<input type="text" class="w-full p-2 border rounded mb-2 image-input" placeholder="ছবির লিংক ১">';
};

function displayAdminSliderProducts() {
    const container = document.getElementById('sliderProductListAdmin');
    if (!container) return;
    onValue(ref(database, 'products'), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const key = child.key;
                const product = child.val();
                container.innerHTML += `<div class="p-2 border rounded-md flex items-center justify-between"><div class="flex items-center"><input type="checkbox" id="slider_check_${key}" class="form-checkbox h-5 w-5 mr-3" onchange="updateSliderStatus('${key}', 'isInSlider', this.checked)" ${product.isInSlider ? 'checked' : ''}><label for="slider_check_${key}" class="font-semibold">${product.name}</label></div><div class="flex items-center"><label class="text-sm mr-2">Serial:</label><input type="number" value="${product.sliderOrder || ''}" placeholder="e.g., 1" onchange="updateSliderStatus('${key}', 'sliderOrder', this.value)" class="w-16 p-1 border rounded text-center"></div></div>`;
            });
        }
    });
}
window.updateSliderStatus = (id, field, value) => {
    const updates = {};
    updates[`/products/${id}/${field}`] = (field === 'sliderOrder' && value) ? Number(value) : value;
    update(ref(database), updates);
};

function displayAdminEvents() {
    const container = document.getElementById('eventListAdmin');
    if (!container) return;
    onValue(ref(database, 'events'), (snapshot) => {
        container.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const key = childSnapshot.key;
                const event = childSnapshot.val();
                container.innerHTML += `<div class="p-3 bg-gray-50 rounded-lg flex justify-between items-center border"><div><p class="font-bold">${event.title || 'No Title'} <span class="text-sm font-normal">- ${event.isActive ? '<span class="text-green-600 font-bold">Active</span>' : '<span class="text-gray-500">Inactive</span>'}</span></p>${event.imageUrl ? `<img src="${event.imageUrl}" class="w-16 h-10 object-cover rounded mt-1" onerror="this.style.display='none'">` : ''}</div><div class="space-x-2"><button onclick="editEvent('${key}')" class="text-blue-500"><i class="fas fa-edit"></i></button><button onclick="deleteEvent('${key}')" class="text-red-500"><i class="fas fa-trash"></i></button></div></div>`;
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


function initializeAdminForms() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('productId').value;
            const images = Array.from(document.querySelectorAll('#imageInputs .image-input')).map(input => input.value.trim()).filter(Boolean).join(', ');
            const productData = { name: document.getElementById('productName').value, price: document.getElementById('productPrice').value, category: document.getElementById('productCategory').value, stockStatus: document.getElementById('productStockStatus').value, description: document.getElementById('productDescription').value, tags: document.getElementById('productTags').value, image: images };
            const productRef = id ? ref(database, `products/${id}`) : push(ref(database, 'products'));
            set(productRef, productData).then(() => {
                showToast(`প্রোডাক্ট সফলভাবে ${id ? 'আপডেট' : 'যোগ'} হয়েছে!`);
                resetProductForm();
            });
        });
    }

    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('eventId').value;
            const data = { title: document.getElementById('eventTitle').value.trim(), description: document.getElementById('eventDescription').value.trim(), imageUrl: document.getElementById('eventImageUrl').value.trim(), isActive: document.getElementById('eventIsActive').checked };
            if (!data.title && !data.description && !data.imageUrl) return showToast('কমপক্ষে একটি তথ্য দিন।', 'error');
            const eventRef = id ? ref(database, `events/${id}`) : push(ref(database, 'events'));
            set(eventRef, data).then(() => {
                showToast('ব্যানার সেভ হয়েছে!');
                resetEventForm();
            });
        });
    }
}

// --- সংশোধিত সার্চ এবং ফিল্টারিং ফাংশন ---

/**
 * সার্চ সাজেশন ডিসপ্লে করে।
 * @param {Array} filteredProducts - ফিল্টার করা প্রোডাক্টের তালিকা।
 * @param {string} resultsContainerId - রেজাল্ট দেখানোর HTML এলিমেন্টের আইডি।
 * @param {string} type - 'mobile' বা 'desktop'।
 */
window.displaySearchResults = function(filteredProducts, resultsContainerId, type) {
    const searchResults = document.getElementById(resultsContainerId);
    if (!searchResults) {
        console.error(`Search results container not found: ${resultsContainerId}`);
        return;
    }

    searchResults.innerHTML = '';
    if (filteredProducts.length === 0) {
        searchResults.classList.add("hidden");
        return;
    }

    // সাজেশন বক্সের স্টাইল ও পজিশনিং নিশ্চিত করুন (z-50 এবং absolute)
    searchResults.className = 'absolute w-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-64 overflow-y-auto';
    if (type === 'desktop') {
        // ডেস্কটপে ইনপুট ফিল্ডের ঠিক নিচে দেখানোর জন্য
        searchResults.className += ' top-full left-0';
    } else { // mobile
        // মোবাইলে ইনপুট ফিল্ডের ঠিক নিচে দেখানোর জন্য
        searchResults.className += ' top-full left-0'; 
    }

    filteredProducts.slice(0, 5).forEach(product => {
        const item = document.createElement('a');
        item.href = `product-detail.html?id=${product.id}`;
        item.className = 'flex items-center p-2 hover:bg-gray-100 cursor-pointer text-gray-800 border-b last:border-b-0';
        item.innerHTML = `
            <img src="${product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/30'}" class="w-8 h-8 object-cover rounded mr-2" onerror="this.src='https://via.placeholder.com/30'">
            <span class="text-sm font-medium">${product.name}</span>
            <span class="ml-auto text-xs text-red-500">${product.price}৳</span>
        `;
        item.onclick = () => {
            searchResults.classList.add("hidden");
        };
        searchResults.appendChild(item);
    });

    searchResults.classList.remove("hidden");
    console.log(`Search results displayed: ${filteredProducts.length} items for ${type}.`);
};

/**
 * মোবাইল সার্চ বার থেকে সার্চ করে সাজেশন দেখায়।
 */
window.searchProductsMobile = function() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');

    if (products.length === 0) {
        console.warn("Products data not loaded yet. Cannot search.");
        if (searchResults) searchResults.classList.add("hidden");
        return;
    }
    
    if (!query) {
        if (searchResults) searchResults.classList.add("hidden");
        return;
    }
    
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.tags && p.tags.toLowerCase().includes(query))
    );
    
    displaySearchResults(filteredProducts, 'searchResults', 'mobile');
};

/**
 * ডেস্কটপ সার্চ বার থেকে সার্চ করে সাজেশন দেখায়।
 */
window.searchProductsDesktop = function() {
    const query = document.getElementById('searchInputDesktop').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResultsDesktop');

    if (products.length === 0) {
        console.warn("Products data not loaded yet. Cannot search.");
        if (searchResults) searchResults.classList.add("hidden");
        return;
    }

    if (!query) {
        if (searchResults) searchResults.classList.add("hidden");
        return;
    }

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.tags && p.tags.toLowerCase().includes(query))
    );

    displaySearchResults(filteredProducts, 'searchResultsDesktop', 'desktop');
};


/**
 * মেনু থেকে ক্যাটাগরি অনুযায়ী প্রোডাক্ট ফিল্টার করে।
 */
window.filterProducts = function(category) {
    let filtered;
    const categoryLower = category.toLowerCase();

    if (categoryLower === 'all') {
        filtered = products;
    } else {
        filtered = products.filter(p => p.category && p.category.toLowerCase() === categoryLower);
    }

    displayProductsAsCards(filtered);
    
    closeSidebar();
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    if (desktopSubMenuBar) desktopSubMenuBar.classList.add('hidden');
    
    const productListSection = document.getElementById('productListSection') || document.getElementById('productList');
    if (productListSection) {
        productListSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo(0, 0);
    }
    
    showToast(`${category.toUpperCase()} ক্যাটাগরির ${filtered.length}টি প্রোডাক্ট দেখানো হচ্ছে।`);
};


// --- Main Application Initialization ---

function main() {
    // হেডার লোড করা এবং লিসেনার যুক্ত করা (jQuery ব্যবহার করে)
    if (typeof $ !== 'undefined') {
        $("#header").load("header.html", () => {
            console.log("Header content loaded successfully. Attaching search listeners.");
            
            // লগইন স্ট্যাটাস আপডেট
            if (auth && auth.currentUser) updateLoginButton(auth.currentUser);
            
            // **গুরুত্বপূর্ণ: ইভেন্ট লিসেনার যুক্ত করা**
            const searchInputMobile = document.getElementById('searchInput');
            if (searchInputMobile) {
                searchInputMobile.addEventListener('input', searchProductsMobile);
                console.log("Mobile search listener attached successfully to #searchInput.");
            } else {
                console.error("ERROR: Mobile search input ID 'searchInput' not found in header.html.");
            }
            
            const searchInputDesktop = document.getElementById('searchInputDesktop');
            if (searchInputDesktop) {
                searchInputDesktop.addEventListener('input', searchProductsDesktop);
                console.log("Desktop search listener attached successfully to #searchInputDesktop.");
            } else {
                console.error("ERROR: Desktop search input ID 'searchInputDesktop' not found in header.html.");
            }
        });
        $("#footer").load("footer.html");
    } else {
        console.error("jQuery is not loaded. Cannot load header/footer.");
        showToast("UI লোড করতে ব্যর্থ: jQuery নেই।", "error");
    }

    try {
        // Auth state listener setup
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

        // Load Products data
        showLoadingSpinner();
        const productsRef = ref(database, "products/");
        onValue(productsRef, d => {
            if (d.exists()) {
                const data = d.val();
                products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                console.log(`Product data loaded from Firebase: ${products.length} items.`);
                
                const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));
                initializeProductSlider(sliderProducts);
                displayProductsAsCards(products); 
            } else {
                console.warn("No products found in Firebase.");
                document.getElementById("productList").innerHTML = "<p class='col-span-full text-center'>Kono product paoa jayni.</p>";
            }
        });
        
        displayEvents();
        initializeAdminForms();

    } catch (e) {
        console.error("Firebase Error:", e);
        showToast("Firebase connection beartho hoyeche.", "error");
    }
}

document.addEventListener('DOMContentLoaded', main);


// --- UI Event Listeners (অপরিবর্তিত) ---

window.openSidebar = function() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay && sidebar) {
        sidebarOverlay.classList.remove('hidden');
        sidebarOverlay.classList.add('active');
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('slide-in');
    }
};

window.closeSidebar = function() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay && sidebar) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.remove('active');
        sidebarOverlay.classList.add('hidden');
        const subMenuMobile = document.getElementById('subMenuMobile');
        const arrowIcon = document.getElementById('arrowIcon');
        if (subMenuMobile && arrowIcon) {
            subMenuMobile.classList.add('hidden');
            arrowIcon.classList.remove('rotate-180');
            arrowIcon.classList.add('fa-chevron-down');
            arrowIcon.classList.remove('fa-chevron-up');
        }
    }
};

window.handleMenuItemClick = function() {
    // ...
};

window.handleSubMenuItemClick = function(category) {
    filterProducts(category); 
    const subMenuMobile = document.getElementById('subMenuMobile');
    if (subMenuMobile) {
        subMenuMobile.classList.add('hidden');
    }
    closeSidebar();
};

window.toggleSubMenuMobile = function(event) {
    event.stopPropagation();
    const subMenuMobile = document.getElementById('subMenuMobile');
    const arrowIcon = document.getElementById('arrowIcon');
    if (subMenuMobile && arrowIcon) {
        subMenuMobile.classList.toggle('hidden');
        arrowIcon.classList.toggle('rotate-180');
        arrowIcon.classList.toggle('fa-chevron-down');
        arrowIcon.classList.toggle('fa-chevron-up');
    }
};

window.toggleSubMenuDesktop = function() {
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    const desktopArrowIcon = document.getElementById('desktopArrowIcon');
    if (desktopSubMenuBar && desktopArrowIcon) {
        desktopSubMenuBar.classList.toggle('hidden');
        desktopSubMenuBar.classList.toggle('slide-down');
        desktopArrowIcon.classList.toggle('rotate-180');
        desktopArrowIcon.classList.toggle('fa-chevron-down');
        desktopArrowIcon.classList.remove('fa-chevron-up');
    }
};

window.openCartSidebar = function() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
    }
};

window.closeCartSidebar = function() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
    }
};

window.focusMobileSearch = function() {
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    if (mobileSearchBar) {
        mobileSearchBar.classList.toggle('hidden');
        mobileSearchBar.classList.toggle('show');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
};

// Global click handler to close UI elements
document.addEventListener("click", (event) => {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const subMenuMobile = document.getElementById('subMenuMobile');
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    const cartSidebar = document.getElementById('cartSidebar');

    if (sidebarOverlay && !event.target.closest('#sidebar') && !event.target.closest('button[onclick="openSidebar()"]')) {
        closeSidebar();
    }
    if (subMenuMobile && !event.target.closest('#subMenuMobile') && !event.target.closest('button[onclick="toggleSubMenuMobile(event)"]')) {
        subMenuMobile.classList.add('hidden');
        const arrowIcon = document.getElementById('arrowIcon');
        if (arrowIcon) {
            arrowIcon.classList.remove('rotate-180');
            arrowIcon.classList.add('fa-chevron-down');
            arrowIcon.classList.remove('fa-chevron-up');
        }
    }
    if (desktopSubMenuBar && !event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) {
        desktopSubMenuBar.classList.add('hidden');
        desktopSubMenuBar.classList.remove('slide-down');
        const desktopArrowIcon = document.getElementById('desktopArrowIcon');
        if (desktopArrowIcon) {
            desktopArrowIcon.classList.remove('rotate-180');
            desktopArrowIcon.classList.add('fa-chevron-down');
            desktopArrowIcon.classList.remove('fa-chevron-up');
        }
    }
    if (cartSidebar && !event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) {
        closeCartSidebar();
    }
    
    // সার্চ রেজাল্ট বন্ধ করুন (সাজেশনের বাইরে ক্লিক করলে)
    const searchResultsMobile = document.getElementById('searchResults');
    const searchResultsDesktop = document.getElementById('searchResultsDesktop');
    
    if (searchResultsMobile && !searchResultsMobile.contains(event.target) && !event.target.closest('#searchInput')) {
        searchResultsMobile.classList.add('hidden');
    }
    if (searchResultsDesktop && !searchResultsDesktop.contains(event.target) && !event.target.closest('#searchInputDesktop')) {
        searchResultsDesktop.classList.add('hidden');
    }
});
