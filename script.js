// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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

// --- UI and Core Functions (from index1.html style) ---

window.showProductDetail = function(a) { window.location.href = `product-detail.html?id=${a}` };

window.buyNow = function(productId) {
    // Find the item in the cart
    const cartItem = cart.find(item => item.id === productId);
    
    // Determine the quantity
    const quantity = cartItem ? cartItem.quantity : 1;
    
    // Construct the URL and redirect
    const orderUrl = `order-form.html?id=${productId}&quantity=${quantity}`;
    window.location.href = orderUrl;
};

window.checkout = function() {
    if (cart.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(cart));
        window.location.href = 'order-form.html';
    } else {
        showToast("Apnar cart khali!", "error");
    }
};

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

function initializeProductSlider(a) {
    const b = document.getElementById("new-product-slider-wrapper");
    if (!b) return;
    b.innerHTML = "", a.forEach(c => {
        const d = c.image ? c.image.split(",")[0].trim() : "https://via.placeholder.com/400",
            e = document.createElement("div");
        e.className = "swiper-slide", e.innerHTML = `<div class="relative w-full h-64 md:h-80"><img src="${d}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6"><h3 class="text-white text-2xl font-bold">${c.name}</h3><p class="text-white text-lg">BDT ${c.price}</p><button onclick="showProductDetail('${c.id}')" class="mt-4 text-white py-2 px-4 rounded-lg self-start hover:bg-lipstick-dark transition-colors pink-bg" style="background-color: #F4A7B9;">Shop Now</button></div></div>`, b.appendChild(e)
    }), new Swiper(".new-product-slider", {
        loop: !0,
        autoplay: {
            delay: 3e3,
            disableOnInteraction: !1
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: !0
        },
        effect: "fade",
        fadeEffect: {
            crossFade: !0
        }
    })
}


// --- Cart Management ---

function updateAllCartUIs() {
    updateCartSidebarUI();
    updateFloatingBarUI();
    // Re-render product cards to show updated cart status (e.g., Add to Cart -> +/- buttons)
    if (products.length > 0) {
        displayProductsAsCards(products);
    }
}

// This function is from index1.html, slightly de-minified for clarity
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
            itemEl.innerHTML = `
                <div class="flex items-center">
                    <img src="${item.image || "https://via.placeholder.com/40"}" class="w-10 h-10 object-cover rounded mr-3">
                    <div>
                        <p class="font-semibold text-sm">${item.name}</p>
                        <p class="text-xs text-gray-600">${item.quantity} x ${item.price}৳</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <p class="font-semibold mr-3">${itemTotal.toFixed(2)}৳</p>
                    <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash-alt"></i></button>
                </div>`;
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
        }, { onlyOnce: true }); // Load only once on auth change
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
    c ? c.quantity++ : cart.push({ ...b,
        quantity: 1
    }), saveCart(), showToast(`${b.name} carte jog kora hoyeche`, "success")
};

window.updateQuantity = function(a, b) {
    const c = cart.find(d => d.id === a);
    c && (c.quantity += b, c.quantity <= 0 && (cart = cart.filter(d => d.id !== a)), saveCart())
};

window.removeFromCart = function(a) {
    cart = cart.filter(b => b.id !== a), saveCart()
};


// --- Auth Functions (from original script) ---

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
    
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            showToast(`Login shofol! Shagotom, ${user.displayName}`);
            saveUserToFirebase(user);
        })
        .catch((error) => {
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
    
    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        const commonHTML = `
            <div class="flex flex-col">
                <span class="flex items-center">
                    ${user.photoURL ? `<img src="${user.photoURL}" alt="User Profile" class="w-6 h-6 rounded-full mr-2">` : `<i class="fas fa-user mr-2 bg-red-500 text-white p-1 rounded-full"></i>`}
                    ${displayName}
                </span>
                <button onclick="confirmLogout()" class="text-left text-sm text-red-500 hover:text-red-700 mt-1">Logout</button>
            </div>`;
        if (mobileLoginButton) mobileLoginButton.innerHTML = commonHTML;
        if (desktopLoginButton) desktopLoginButton.innerHTML = commonHTML;
    } else {
        const commonHTMLMobile = `<button class="flex items-center w-full" onclick="openLoginModal()"><i class="fas fa-sign-in-alt mr-2"></i><span>Login</span></button>`;
        if (mobileLoginButton) mobileLoginButton.innerHTML = commonHTMLMobile;
        const commonHTMLDesktop = `<button class="flex items-center" onclick="openLoginModal()"><i class="fas fa-sign-in-alt mr-2"></i><span>Login</span></button>`;
        if (desktopLoginButton) desktopLoginButton.innerHTML = commonHTMLDesktop;
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


// --- Admin Functions ---

window.checkAdminAndShowUploadForm = function(user) {
    const adminEmail = "mdnahidislam6714@gmail.com";
    if (user && user.email === adminEmail) {
        showUploadForm();
    } else {
        hideUploadForm();
    }
};

window.showUploadForm = function() {
    const productUpdateSection = document.getElementById('product-update');
    if (productUpdateSection) productUpdateSection.classList.remove('hidden');
};

window.hideUploadForm = function() {
    const productUpdateSection = document.getElementById('product-update');
    if (productUpdateSection) productUpdateSection.classList.add('hidden');
};


// --- Search Functions ---

window.searchProductsMobile = function() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const searchResults = document.getElementById("searchResults");
    if (!searchResults) return;
    if (searchTerm.trim() === "") {
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }
    const filtered = products.filter(p => (p.name && p.name.toLowerCase().includes(searchTerm)) || (p.tags && p.tags.toLowerCase().includes(searchTerm)));
    displaySearchResults(filtered, "searchResults");
};

window.searchProductsDesktop = function() {
    const searchTerm = document.getElementById("searchInputDesktop").value.toLowerCase();
    const searchResults = document.getElementById("searchResultsDesktop");
    if (!searchResults) return;
    if (searchTerm.trim() === "") {
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }
    const filtered = products.filter(p => (p.name && p.name.toLowerCase().includes(searchTerm)) || (p.tags && p.tags.toLowerCase().includes(searchTerm)));
    displaySearchResults(filtered, "searchResultsDesktop");
};

window.displaySearchResults = function(filtered, resultsContainerId) {
    const resultsContainer = document.getElementById(resultsContainerId);
    if (!resultsContainer) return;

    resultsContainer.innerHTML = "";
    if (filtered.length === 0) {
        resultsContainer.innerHTML = `<div class="p-2 text-gray-600">Kono product paoa jayni</div>`;
    } else {
        filtered.forEach(product => {
            const card = document.createElement("div");
            card.className = "p-2 hover:bg-gray-100 cursor-pointer";
            card.onclick = () => showProductDetail(product.id);
            card.innerHTML = `
                <div class="flex items-center">
                    <img src="${product.image ? product.image.split(',')[0] : 'https://via.placeholder.com/50'}" class="w-12 h-12 object-cover rounded-lg mr-4">
                    <div>
                        <h3 class="text-lg font-bold">${product.name}</h3>
                        <p class="text-lipstick font-bold">Dam: ${product.price} Taka</p>
                    </div>
                </div>`;
            resultsContainer.appendChild(card);
        });
    }
    resultsContainer.classList.remove("hidden");
};


// --- Helper Functions ---

window.showToast = function(a, type = "success") {
    const b = document.createElement("div");
    const icon = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    const color = type === "success" ? "bg-green-500" : "bg-red-500";
    b.className = `fixed bottom-24 right-4 ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50`, b.innerHTML = `<i class="${icon} mr-2"></i> ${a}`, document.body.appendChild(b), setTimeout(() => {
        b.remove()
    }, 3e3)
};


// --- Main Application Initialization ---

function main() {
    $("#header").load("header.html", () => {
        // After header loads, auth listeners can safely update buttons inside it.
        if (auth) {
            updateLoginButton(auth.currentUser);
        }
    });
    $("#footer").load("footer.html");

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        database = getDatabase(app);
        provider = new GoogleAuthProvider();

        onAuthStateChanged(auth, (user) => {
            updateLoginButton(user);
            checkAdminAndShowUploadForm(user);
            // When auth state changes, reload the cart to get user's cart from DB or switch to local
            loadCart(); 
        });

        getRedirectResult(auth).then((result) => {
            if (result && result.user) {
                showToast(`Login shofol! Shagotom, ${result.user.displayName}`);
                saveUserToFirebase(result.user);
            }
        }).catch(error => console.error("Redirect login error:", error));

        showLoadingSpinner();
        const productsRef = ref(database, "products/");
        onValue(productsRef, d => {
            if (d.exists()) {
                const data = d.val();
                products = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                const newProducts = products.slice(0, 5);
                initializeProductSlider(newProducts);
                displayProductsAsCards(products);
            } else {
                document.getElementById("productList").innerHTML = "<p class='col-span-full text-center'>Kono product paoa jayni.</p>";
            }
        });

    } catch (e) {
        console.error("Firebase Error:", e);
        showToast("Firebase connection beartho hoyeche.", "error");
    }
}

document.addEventListener('DOMContentLoaded', main);

// মোবাইল সাইডবার খোলার ফাংশন
window.openSidebar = function() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay && sidebar) {
        sidebarOverlay.classList.remove('hidden');
        sidebarOverlay.classList.add('active');
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('slide-in');
        console.log("মোবাইল সাইডবার খোলা হয়েছে।");
    } else {
        console.error("সাইডবার এলিমেন্ট পাওয়া যায়নি।");
    }
};

// মোবাইল সাইডবার বন্ধ করার ফাংশন
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
        console.log("মোবাইল সাইডবার বন্ধ করা হয়েছে।");
    } else {
        console.error("সাইডবার এলিমেন্ট পাওয়া যায়নি।");
    }
};

// মেনু আইটেম ক্লিক করার ফাংশন
window.handleMenuItemClick = function() {
    closeSidebar();
    console.log("মেনু আইটেম ক্লিক করা হয়েছে।");
};

    // সাবমেনু আইটেম ক্লিক করার ফাংশন
window.handleSubMenuItemClick = function(category) {
    filterProducts(category);
    const subMenuMobile = document.getElementById('subMenuMobile');
    if (subMenuMobile) {
        subMenuMobile.classList.add('hidden');
    }
    closeSidebar();
    console.log("সাবমেনু আইটেম ক্লিক করা হয়েছে। ক্যাটাগরি: ", category);
};

// সাবমেনু টগল করার ফাংশন
window.toggleSubMenuMobile = function(event) {
    event.stopPropagation();
    const subMenuMobile = document.getElementById('subMenuMobile');
    const arrowIcon = document.getElementById('arrowIcon');
    if (subMenuMobile && arrowIcon) {
        subMenuMobile.classList.toggle('hidden');
        arrowIcon.classList.toggle('rotate-180');
        arrowIcon.classList.toggle('fa-chevron-down');
        arrowIcon.classList.toggle('fa-chevron-up');
        console.log("মোবাইল সাবমেনু টগল করা হয়েছে।");
    } else {
        console.error("মোবাইল সাবমেনু এলিমেন্ট পাওয়া যায়নি।");
    }
};

// ডেস্কটপ সাবমেনু টগল করার ফাংশন
window.toggleSubMenuDesktop = function() {
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    const desktopArrowIcon = document.getElementById('desktopArrowIcon');
    if (desktopSubMenuBar && desktopArrowIcon) {
        desktopSubMenuBar.classList.toggle('hidden');
        desktopSubMenuBar.classList.toggle('slide-down');
        desktopArrowIcon.classList.toggle('rotate-180');
        desktopArrowIcon.classList.toggle('fa-chevron-down');
        desktopArrowIcon.classList.remove('fa-chevron-up');
        console.log("ডেস্কটপ সাবমেনু টগল করা হয়েছে।");
    } else {
        console.error("ডেস্কটপ সাবমেনু এলিমেন্ট পাওয়া যায়নি।");
    }
};

// কার্ট সাইডবার কন্ট্রোল
window.openCartSidebar = function() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
        console.log("কার্ট সাইডবার খোলা হয়েছে।");
    } else {
        console.error("কার্ট সাইডবার এলিমেন্ট পাওয়া যায়নি।");
    }
};

window.closeCartSidebar = function() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
        console.log("কার্ট সাইডবার বন্ধ করা হয়েছে।");
    } else {
        console.error("কার্ট সাইডবার এলিমেন্ট পাওয়া যায়নি।");
    }
};

// মোবাইল সার্চ বার ফোকাস
window.focusMobileSearch = function() {
    const mobileSearchBar = document.getElementById('mobileSearchBar');
    if (mobileSearchBar) {
        mobileSearchBar.classList.toggle('hidden');
        mobileSearchBar.classList.toggle('show');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            console.log("মোবাইল সার্চ বার ফোকাস করা হয়েছে।");
        }
    } else {
        console.error("মোবাইল সার্চ বার এলিমেন্ট পাওয়া যায়নি।");
    }
};

// ডকুমেন্টে ক্লিক ইভেন্ট লিসেনার
document.addEventListener("click", (event) => {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const subMenuMobile = document.getElementById('subMenuMobile');
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartButton = document.getElementById('cartButton');

    // মোবাইল সাইডবার বন্ধ করুন
    if (sidebarOverlay && !event.target.closest('#sidebar') && !event.target.closest('button[onclick="openSidebar()"]')) {
        closeSidebar();
    }

    // মোবাইল সাবমেনু বন্ধ করুন
    if (subMenuMobile && !event.target.closest('#subMenuMobile') && !event.target.closest('button[onclick="toggleSubMenuMobile(event)"]')) {
        subMenuMobile.classList.add('hidden');
        const arrowIcon = document.getElementById('arrowIcon');
        if (arrowIcon) {
            arrowIcon.classList.remove('rotate-180');
            arrowIcon.classList.add('fa-chevron-down');
            arrowIcon.classList.remove('fa-chevron-up');
        }
    }

    // ডেস্কটপ সাবমেনু বন্ধ করুন
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

    // কার্ট সাইডবার বন্ধ করুন
    if (cartSidebar && !event.target.closest('#cartSidebar') && !event.target.closest('#cartButton')) {
        closeCartSidebar();
    }

    // মোবাইল সার্চ রেজাল্ট বন্ধ করুন
    const searchInputMobile = document.getElementById('searchInput');
    const searchResultsMobile = document.getElementById('searchResults');
    if (searchInputMobile && searchResultsMobile && !event.target.closest('#searchInput') && !event.target.closest('#searchResults')) {
        searchResultsMobile.classList.add('hidden');
    }

    // ডেস্কটপ সার্চ রেজাল্ট বন্ধ করুন
    const searchInputDesktop = document.getElementById('searchInputDesktop');
    const searchResultsDesktop = document.getElementById('searchResultsDesktop');
    if (searchInputDesktop && searchResultsDesktop && !event.target.closest('#searchInputDesktop') && !event.target.closest('#searchResultsDesktop')) {
        searchResultsDesktop.classList.add('hidden');
    }
});