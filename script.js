// Firebase SDK আমদানি
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithRedirect, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
    storageBucket: "nahid-6714.firestorage.app",
    messagingSenderId: "505741217147",
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de",
    measurementId: "G-QZ7CTRKHCW"
};

// Firebase ইনিশিয়ালাইজেশন
let app, auth, database, provider;
try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App সফলভাবে ইনিশিয়ালাইজ হয়েছে।");
    auth = getAuth(app);
    console.log("Firebase Auth সফলভাবে ইনিশিয়ালাইজ হয়েছে।");
    database = getDatabase(app);
    console.log("Firebase Database সফলভাবে ইনিশিয়ালাইজ হয়েছে।");
    provider = new GoogleAuthProvider();
    console.log("GoogleAuthProvider সফলভাবে লোড হয়েছে।");
} catch (error) {
    console.error("Firebase ইনিশিয়ালাইজেশন ব্যর্থ: ", error.message);
    showToast("Firebase ইনিশিয়ালাইজেশন ব্যর্থ হয়েছে: " + error.message);
}

// গ্লোবাল ভেরিয়েবল
window.auth = auth;
window.database = database;
window.provider = provider;
window.firebaseDatabase = { ref, push, onValue, set }; // Firebase ফাংশনগুলো গ্লোবাল স্কোপে রাখা
let cartItems = [];
let products = [];

// ইউনিক userId জেনারেট করা বা লোড করা
window.getUserId = function() {
    if (auth.currentUser) {
        return auth.currentUser.uid; // Firebase Authentication থেকে ইউজারের uid ব্যবহার করা
    } else {
        // যদি ইউজার লগইন না করে থাকে, তাহলে একটি টেম্পোরারি আইডি জেনারেট করা
        let userId = localStorage.getItem('tempUserId');
        if (!userId) {
            userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tempUserId', userId);
        }
        return userId;
    }
};
// লগইন মডাল খোলার ফাংশন (এখন সরাসরি লগইন শুরু করবে)
window.openLoginModal = function() {
    // মডাল খোলার পরিবর্তে সরাসরি loginWithGmail ফাংশন কল করা হবে
    console.log("লগইন প্রক্রিয়া শুরু হচ্ছে...");
    if (typeof loginWithGmail === 'function') {
        loginWithGmail();
    } else {
        console.error("loginWithGmail ফাংশন পাওয়া যায়নি।");
        if (typeof showToast === 'function') { // showToast ফাংশন থাকলে ব্যবহার করা হবে
            showToast("লগইন প্রক্রিয়া শুরু করতে সমস্যা হয়েছে।");
        }
    }
};

// মডাল বন্ধ করার ফাংশন (এখন আর সরাসরি ব্যবহৃত হবে না লগইনের জন্য)
// তবে এটি রেখে দেওয়া যেতে পারে যদি অন্য কোনো মডালের জন্য প্রয়োজন হয়
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        const modalContent = modal.querySelector('.login-modal-content'); // '.login-modal-content' ক্লাসটি আপনার মডালের কন্টেন্ট ডিভে থাকতে হবে
        if (modalContent) {
             modalContent.classList.remove('scale-100');
        }
        console.log(modalId + " মডাল বন্ধ করা হয়েছে।");
    } else {
        // console.warn("মডাল পাওয়া যায়নি: ", modalId); // লগইন মডাল না থাকলে এটি স্বাভাবিক
    }
};

// Google দিয়ে লগইন করার ফাংশন
window.loginWithGmail = function() {
    if (!auth || !provider) {
        console.error("Firebase Auth বা Google প্রোভাইডার লোড হয়নি।");
        if (typeof showToast === 'function') showToast("Firebase Auth বা Google প্রোভাইডার লোড হয়নি।");
        return;
    }
    
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            if (typeof showToast === 'function') showToast(`লগইন সফল! স্বাগতম, ${user.displayName}`);
            // closeModal('loginModal'); // এই লাইনটির আর প্রয়োজন নেই কারণ মডাল ওপেন হচ্ছে না
            if (typeof updateLoginButton === 'function') updateLoginButton(user);
            if (typeof checkAdminAndShowUploadForm === 'function') checkAdminAndShowUploadForm(user);
            if (typeof loadCartFromFirebase === 'function') loadCartFromFirebase();
            if (typeof saveUserToFirebase === 'function') saveUserToFirebase(user);
            console.log("ইউজার লগইন সফল: ", user.email);
        })
        .catch((error) => {
            console.error("লগইন ত্রুটি (পপআপ): ", error.message, error.code);
            if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
                if (typeof showToast === 'function') showToast("পপআপ ব্লক করা হয়েছে। রিডাইরেক্ট মেথড ব্যবহার করা হচ্ছে...");
                signInWithRedirect(auth, provider);
            } else if (error.code === 'auth/popup-closed-by-user'){
                if (typeof showToast === 'function') showToast("লগইন প্রক্রিয়া বাতিল করা হয়েছে।");
            } 
             else {
                if (typeof showToast === 'function') showToast("লগইন ব্যর্থ হয়েছে: " + error.message);
            }
        });
};

// রিডাইরেক্ট থেকে ফিরে এসে লগইন হ্যান্ডল করা
if (auth) { // auth অবজেক্ট তৈরি হলেই এই কোড রান করবে
    getRedirectResult(auth)
        .then((result) => {
            if (result && result.user) {
                const user = result.user;
                if (typeof showToast === 'function') showToast(`লগইন সফল! স্বাগতম, ${user.displayName}`);
                // closeModal('loginModal'); // এই লাইনটির আর প্রয়োজন নেই
                if (typeof updateLoginButton === 'function') updateLoginButton(user);
                if (typeof checkAdminAndShowUploadForm === 'function') checkAdminAndShowUploadForm(user);
                if (typeof loadCartFromFirebase === 'function') loadCartFromFirebase();
                if (typeof saveUserToFirebase === 'function') saveUserToFirebase(user);
                console.log("ইউজার লগইন সফল (রিডাইরেক্ট): ", user.email);
            }
        })
        .catch((error) => {
            console.error("লগইন ত্রুটি (রিডাইরেক্ট): ", error.message, error.code);
            // কিছু সাধারণ রিডাইরেক্ট ত্রুটি উপেক্ষা করা যেতে পারে যা ইউজার ইন্টারঅ্যাকশনের কারণে হয়
            if (error.code !== 'auth/redirect-cancelled-by-user' && error.code !== 'auth/web-storage-unsupported' && error.code !== 'auth/internal-error') {
                if (typeof showToast === 'function') showToast("লগইন ব্যর্থ হয়েছে (রিডাইরেক্ট): " + error.message);
            }
        });
}

// লগইন বাটন আপডেট করার ফাংশন
window.updateLoginButton = function(user) {
    const mobileLoginButton = document.getElementById('mobileLoginButton');
    const desktopLoginButton = document.getElementById('desktopLoginButton');
    if (user) {
        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'ব্যবহারকারী');
        const commonHTML = `
            <div class="flex flex-col">
                <span class="flex items-center"><i class="fas fa-user mr-2"></i>${displayName}</span>
                <button onclick="confirmLogout()" class="text-left text-sm text-red-500 hover:text-red-700 mt-1">লগআউট</button>
            </div>
        `;
        if (mobileLoginButton) mobileLoginButton.innerHTML = commonHTML;
        if (desktopLoginButton) desktopLoginButton.innerHTML = commonHTML;
        console.log("লগইন বাটন আপডেট করা হয়েছে: ", displayName);
    } else {
        // যখন ইউজার লগইন করা নেই, তখন onclick="openLoginModal()" কল হবে,
        // যা এখন সরাসরি loginWithGmail() কল করবে।
        const commonHTMLMobile = `
            <button class="flex items-center w-full" onclick="openLoginModal()">
                <i class="fas fa-sign-in-alt mr-2"></i>
                <span>লগইন</span>
            </button>
        `;
        if (mobileLoginButton) mobileLoginButton.innerHTML = commonHTMLMobile;

        const commonHTMLDesktop = `
            <button class="flex items-center" onclick="openLoginModal()">
                <i class="fas fa-sign-in-alt mr-2"></i>
                <span>লগইন</span>
            </button>
        `;
        if (desktopLoginButton) desktopLoginButton.innerHTML = commonHTMLDesktop;
        console.log("লগইন বাটন রিসেট করা হয়েছে।");
    }
};

// লগআউট নিশ্চিতকরণ ফাংশন
window.confirmLogout = function() {
    const confirmed = confirm("আপনি কি সত্যিই লগআউট করতে চান?");
    if (confirmed) {
        logout();
    } else {
        console.log("লগআউট বাতিল করা হয়েছে।");
    }
};

// লগআউট ফাংশন
window.logout = function() {
    if (!auth) {
        console.error("Firebase Auth লোড হয়নি।");
        if (typeof showToast === 'function') showToast("Firebase Auth লোড হয়নি।");
        return;
    }
    
    signOut(auth).then(() => {
        if (typeof showToast === 'function') showToast("লগআউট সফল হয়েছে।");
        if (typeof updateLoginButton === 'function') updateLoginButton(null);
        if (typeof updateOrderTrackButton === 'function') updateOrderTrackButton(false);
        if (typeof hideUploadForm === 'function') hideUploadForm();
        // cartItems = []; // আপনি লগআউট করার পর কার্ট খালি করতে না চাইলে এই লাইনটি কমেন্ট করে রাখতে পারেন
        // if (typeof updateCartUI === 'function') updateCartUI();
        if (typeof loadCartFromFirebase === 'function') loadCartFromFirebase(); // টেম্পোরারি ইউজারের কার্ট লোড করার চেষ্টা
        console.log("ইউজার লগআউট সফল।");
    }).catch((error) => {
        console.error("লগআউট ত্রুটি: ", error.message);
        if (typeof showToast === 'function') showToast("লগআউট ব্যর্থ হয়েছে: " + error.message);
    });
};
// এডমিন চেক করার এবং প্রোডাক্ট আপলোড ফর্ম দেখানোর ফাংশন
window.checkAdminAndShowUploadForm = function(user) {
    const adminEmail = "mdnahidislam6714@gmail.com";
    if (user && user.email === adminEmail) {
        updateOrderTrackButton(true);
        showUploadForm();
        console.log("ইউজার এডমিন: ", user.email);
    } else {
        updateOrderTrackButton(false);
        hideUploadForm();
        console.log("ইউজার এডমিন নয়: ", user ? user.email : "কোনো ইউজার নেই");
    }
};

// প্রোডাক্ট আপলোড ফর্ম দেখানোর ফাংশন
window.showUploadForm = function() {
    const productUpdateSection = document.getElementById('product-update');
    if (productUpdateSection) {
        productUpdateSection.classList.remove('hidden');
        console.log("প্রোডাক্ট আপলোড ফর্ম দেখানো হয়েছে।");
    } else {
        console.error("প্রোডাক্ট আপলোড ফর্ম পাওয়া যায়নি।");
        showToast("প্রোডাক্ট আপলোড ফর্ম পাওয়া যায়নি।");
    }
};

// প্রোডাক্ট আপলোড ফর্ম লুকানোর ফাংশন
window.hideUploadForm = function() {
    const productUpdateSection = document.getElementById('product-update');
    if (productUpdateSection) {
        productUpdateSection.classList.add('hidden');
        console.log("প্রোডাক্ট আপলোড ফর্ম লুকানো হয়েছে।");
    } else {
        console.error("প্রোডাক্ট আপলোড ফর্ম পাওয়া যায়নি।");
    }
};

// অর্ডার ট্র্যাক বাটন আপডেট করার ফাংশন
window.updateOrderTrackButton = function(isAdmin) {
    const mobileOrderTrackButton = document.getElementById('mobileOrderTrackButton');
    const desktopOrderTrackButton = document.getElementById('desktopOrderTrackButton');
    if (isAdmin) {
        if (mobileOrderTrackButton) {
            mobileOrderTrackButton.href = "order-list.html";
        }
        if (desktopOrderTrackButton) {
            desktopOrderTrackButton.href = "order-list.html";
        }
        console.log("অর্ডার ট্র্যাক বাটন এডমিন মোডে আপডেট করা হয়েছে।");
    } else {
        if (mobileOrderTrackButton) {
            mobileOrderTrackButton.href = "order-track.html";
        }
        if (desktopOrderTrackButton) {
            desktopOrderTrackButton.href = "order-track.html";
        }
        console.log("অর্ডার ট্র্যাক বাটন ইউজার মোডে আপডেট করা হয়েছে।");
    }
};

// অর্ডার ট্র্যাক বাটন ক্লিক হ্যান্ডলার
window.handleOrderTrackClick = function(event) {
    event.preventDefault();
    const mobileOrderTrackButton = document.getElementById('mobileOrderTrackButton');
    const desktopOrderTrackButton = document.getElementById('desktopOrderTrackButton');
    const href = mobileOrderTrackButton ? mobileOrderTrackButton.href : desktopOrderTrackButton.href;
    window.location.href = href;
    closeSidebar();
    console.log("অর্ডার ট্র্যাক বাটনে ক্লিক করা হয়েছে: ", href);
};

// টোস্ট নোটিফিকেশন দেখানোর ফাংশন
window.showToast = function(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
        console.log("টোস্ট মেসেজ দেখানো হয়েছে: ", message);
    } else {
        console.error("টোস্ট এলিমেন্ট পাওয়া যায়নি।");
        console.log("টোস্ট মেসেজ: ", message);
    }
};
// নতুন ইউজারের ডাটা Firebase-এ সেভ করার ফাংশন
window.saveUserToFirebase = function(user) {
    if (!database) {
        console.error("Firebase Database লোড হয়নি।");
        showToast("Firebase Database লোড হয়নি।");
        return;
    }

    const userRef = ref(database, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
        if (!snapshot.exists()) {
            // ইউজার যদি নতুন হয়, তাহলে ডাটা সেভ করা হবে
            set(userRef, {
                name: user.displayName || "নাম পাওয়া যায়নি",
                email: user.email,
                createdAt: new Date().toISOString()
            })
            .then(() => {
                console.log("ইউজারের ডাটা Firebase-এ সেভ হয়েছে: ", user.email);
            })
            .catch((error) => {
                console.error("ইউজারের ডাটা সেভ করতে ত্রুটি: ", error.message);
                showToast("ইউজারের ডাটা সেভ করতে ত্রুটি হয়েছে: " + error.message);
            });
        } else {
            console.log("ইউজার ইতিমধ্যে ডাটাবেসে আছে: ", user.email);
        }
    }, { onlyOnce: true });
};
// কার্টে আইটেম যোগ করার ফাংশন
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const existingProduct = cartItems.find(p => p.id === productId);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cartItems.push({ ...product, quantity: 1 });
        }
        updateCartUI();
        saveCartToFirebase();
        showToast("প্রোডাক্ট কার্টে যোগ করা হয়েছে!");
        openCartSidebar();
        console.log("কার্টে আইটেম যোগ করা হয়েছে: ", product);
    } else {
        console.error("প্রোডাক্ট পাওয়া যায়নি: ", productId);
        showToast("প্রোডাক্ট পাওয়া যায়নি!");
    }
};

// কার্ট UI আপডেট করার ফাংশন
window.updateCartUI = function() {
  const cartItemsContainer = document.getElementById('cartItems');
  const totalPriceElement = document.getElementById('totalPrice');
  const cartCountElement = document.getElementById('cartCount');
  
  if (!cartItemsContainer || !totalPriceElement || !cartCountElement) {
    console.error("কার্ট UI এলিমেন্ট পাওয়া যায়নি।");
    showToast("কার্ট UI আপডেট করতে সমস্যা হয়েছে।");
    return;
  }
  
  cartItemsContainer.innerHTML = '';
  let totalPrice = 0;
  
  cartItems.forEach((item, index) => {
    totalPrice += (parseFloat(item.price) || 0) * (item.quantity || 1);
    const cartItem = document.createElement('div');
    cartItem.className = 'flex flex-col bg-gray-100 p-3 rounded-lg mb-2';
    cartItem.innerHTML = `
            <h3 class="text-lg font-bold text-gray-800 mb-2">${item.name || 'নাম পাওয়া যায়নি'}</h3>
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <img src="${item.image ? item.image.split(',')[0] : 'https://via.placeholder.com/50'}" class="w-16 h-16 object-cover rounded-lg" alt="${item.name}" onerror="this.src='https://via.placeholder.com/50'; this.alt='ছবি লোড হয়নি';">
                    <p class="text-lipstick font-bold">দাম: ${(parseFloat(item.price) || 0) * (item.quantity || 1)} টাকা</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="decreaseQuantity(${index}, event)" class="bg-lipstick text-white px-2 py-1 rounded">-</button>
                    <span class="text-gray-800">${item.quantity || 1}</span>
                    <button onclick="increaseQuantity(${index}, event)" class="bg-lipstick text-white px-2 py-1 rounded">+</button>
                    <button onclick="removeFromCart(${index}, event)" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    cartItemsContainer.appendChild(cartItem);
  });
  
  totalPriceElement.textContent = `মোট মূল্য: ${totalPrice} টাকা`;
  cartCountElement.textContent = cartItems.length;
  console.log("কার্ট UI আপডেট করা হয়েছে। মোট আইটেম: ", cartItems.length, "মোট মূল্য: ", totalPrice);
};
// কার্ট থেকে আইটেম রিমুভ করার ফাংশন
window.removeFromCart = function(index, event) {
    if (event) {
        event.stopPropagation(); // ইভেন্ট বাবলিং বন্ধ করা
    }
    cartItems.splice(index, 1);
    updateCartUI();
    saveCartToFirebase();
    showToast("প্রোডাক্ট কার্ট থেকে সরানো হয়েছে!");
    console.log("প্রোডাক্ট কার্ট থেকে সরানো হয়েছে। ইনডেক্স: ", index);
};
// কার্ট থেকে পরিমাণ কমানোর ফাংশন
window.decreaseQuantity = function(index, event) {
    if (event) {
        event.stopPropagation(); // ইভেন্ট বাবলিং বন্ধ করা
    }
    if (cartItems[index].quantity > 1) {
        cartItems[index].quantity--;
    } else {
        cartItems.splice(index, 1);
    }
    updateCartUI();
    saveCartToFirebase();
    console.log("পরিমাণ কমানো হয়েছে। ইনডেক্স: ", index);
};

// কার্টে পরিমাণ বাড়ানোর ফাংশন
window.increaseQuantity = function(index, event) {
    if (event) {
        event.stopPropagation(); // ইভেন্ট বাবলিং বন্ধ করা
    }
    cartItems[index].quantity++;
    updateCartUI();
    saveCartToFirebase();
    console.log("পরিমাণ বাড়ানো হয়েছে। ইনডেক্স: ", index);
};
// Firebase-এ কার্ট সেভ করার ফাংশন
window.saveCartToFirebase = function() {
    if (!database) {
        console.error("Firebase Database লোড হয়নি।");
        showToast("Firebase Database লোড হয়নি।");
        return;
    }

    const userId = getUserId();
    const cartRef = ref(database, `carts/${userId}`);
    set(cartRef, cartItems)
        .then(() => {
            console.log("কার্ট Firebase-এ সেভ হয়েছে।");
        })
        .catch((error) => {
            console.error("কার্ট সেভ করতে ত্রুটি: ", error.message);
            showToast("কার্ট সেভ করতে ত্রুটি হয়েছে: " + error.message);
        });
};

// Firebase থেকে কার্ট লোড করার ফাংশন
window.loadCartFromFirebase = function() {
    if (!database) {
        console.error("Firebase Database লোড হয়নি।");
        showToast("Firebase Database লোড হয়নি।");
        return;
    }

    const userId = getUserId();
    const cartRef = ref(database, `carts/${userId}`);
    onValue(cartRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            cartItems = data;
        } else {
            cartItems = [];
        }
        updateCartUI();
        console.log("কার্ট Firebase থেকে লোড হয়েছে। আইটেম সংখ্যা: ", cartItems.length);
    }, (error) => {
        console.error("কার্ট লোড করতে ত্রুটি: ", error.message);
        showToast("কার্ট লোড করতে ত্রুটি হয়েছে: " + error.message);
    });
};

// Firebase থেকে প্রোডাক্ট লোড করার ফাংশন
window.loadProductsFromFirebase = function() {
    if (!database) {
        console.error("Firebase Database লোড হয়নি।");
        showToast("Firebase Database লোড হয়নি।");
        return;
    }

    const productList = document.getElementById('productList');
    if (!productList) {
        console.error("প্রোডাক্ট লিস্ট এলিমেন্ট পাওয়া যায়নি।");
        showToast("প্রোডাক্ট লিস্ট এলিমেন্ট পাওয়া যায়নি।");
        return;
    }

    // Show skeleton loader while products are loading
    showLoadingSpinner();

    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        products = [];
        productList.innerHTML = '';

        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                products.push({ id: key, ...data[key] });
            });
        }

        if (products.length === 0) {
            productList.innerHTML = '<p class="text-center text-gray-600">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
        } else {
            loadProducts(products);
        }
        console.log("প্রোডাক্ট লোড হয়েছে। মোট প্রোডাক্ট: ", products.length);
    }, (error) => {
        console.error("প্রোডাক্ট লোড করতে ত্রুটি: ", error.message);
        productList.innerHTML = '<p class="text-center text-red-600">প্রোডাক্ট লোড করতে ত্রুটি হয়েছে: ' + error.message + '</p>';
        showToast("প্রোডাক্ট লোড করতে ত্রুটি হয়েছে: " + error.message);
    });
};

// প্রোডাক্ট লোড করার ফাংশন
window.loadProducts = function(filteredProducts = products) {
    const productList = document.getElementById("productList");
    if (!productList) {
        console.error("প্রোডাক্ট লিস্ট এলিমেন্ট পাওয়া যায়নি।");
        return;
    }

    productList.innerHTML = "";

    filteredProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer";
        card.setAttribute("data-product-id", product.id);
        card.onclick = () => showProductDetail(product.id);

        const imageLinks = (product.image || '').split(',').map((img, index) =>
            `ছবি-${index + 1}: ${img.trim()}`).join('\n');

        const whatsappMessage = encodeURIComponent(`
প্রোডাক্টের নাম: ${product.name || 'নাম পাওয়া যায়নি'}
দাম: ${product.price || '0'} টাকা
${imageLinks}
আমি এই প্রোডাক্টটি কিনতে চাই!
        `);

        card.innerHTML = `
            <img src="${product.image ? product.image.split(',')[0] : 'https://via.placeholder.com/300'}" class="w-full h-48 object-cover mb-4 rounded-lg" onerror="this.src='https://via.placeholder.com/300'; this.alt='ছবি লোড হয়নি';">
            <h3 class="text-lg font-bold mb-2">${product.name || 'নাম পাওয়া যায়নি'}</h3>
            <p class="text-lipstick font-bold mb-2">দাম: ${product.price || '0'} টাকা</p>
            <p class="text-gray-600 mb-4">${product.description ? product.description.substring(0, 80) + '...' : 'বিবরণ পাওয়া যায়নি'}</p>
            <div class="flex justify-between items-center">
                <button onclick="event.stopPropagation(); showProductDetail('${product.id}')" class="text-blue-500 hover:underline">বিস্তারিত দেখুন</button>
                <div class="flex space-x-2">
                    <a href="https://wa.me/8801931866636?text=${whatsappMessage}" 
                       target="_blank" 
                       class="bg-lipstick text-white px-3 py-1 rounded text-sm hover:bg-lipstick-dark">
                      কিনুন
                    </a>
                    <button onclick="event.stopPropagation(); addToCart('${product.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                      Add to Cart
                    </button>
                </div>
            </div>
        `;
        productList.appendChild(card);
    });
    console.log("প্রোডাক্ট লোড করা হয়েছে। ফিল্টার করা প্রোডাক্ট: ", filteredProducts.length);
};

// প্রোডাক্ট ডিটেইল পেজে রিডাইরেক্ট
window.showProductDetail = function(productId) {
    console.log("প্রোডাক্ট ডিটেইল পেজে যাচ্ছে: ", productId);
    window.location.href = `product-detail.html?id=${productId}`;
};

// প্রোডাক্ট ফিল্টার ফাংশন
window.filterProducts = function(category) {
    let filteredProducts;
    if (category === 'all') {
        filteredProducts = products;
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }
    loadProducts(filteredProducts);
    console.log("প্রোডাক্ট ফিল্টার করা হয়েছে। ক্যাটাগরি: ", category, "ফিল্টার করা প্রোডাক্ট: ", filteredProducts.length);
};

// সার্চ ফাংশনালিটি (মোবাইল)
window.searchProducts = function() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const searchResults = document.getElementById("searchResults");

    if (!searchResults) {
        console.error("সার্চ রেজাল্ট এলিমেন্ট পাওয়া যায়নি।");
        return;
    }

    if (searchTerm.trim() === "") {
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }

    const filtered = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.tags && product.tags.toLowerCase().includes(searchTerm))
    );
    displaySearchResults(filtered, searchResults);
    console.log("মোবাইল সার্চ করা হয়েছে। ফিল্টার করা প্রোডাক্ট: ", filtered.length);
};

// সার্চ ফাংশনালিটি (ডেস্কটপ)
window.searchProductsDesktop = function() {
    const searchTerm = document.getElementById("searchInputDesktop").value.toLowerCase();
    const searchResults = document.getElementById("searchResultsDesktop");

    if (!searchResults) {
        console.error("ডেস্কটপ সার্চ রেজাল্ট এলিমেন্ট পাওয়া যায়নি।");
        return;
    }

    if (searchTerm.trim() === "") {
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }

    const filtered = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm)) ||
        (product.tags && product.tags.toLowerCase().includes(searchTerm))
    );
    displaySearchResults(filtered, searchResults);
    console.log("ডেস্কটপ সার্চ করা হয়েছে। ফিল্টার করা প্রোডাক্ট: ", filtered.length);
};

// সার্চ রেজাল্ট ডিসপ্লে ফাংশন
window.displaySearchResults = function(filteredProducts, searchResults) {
    searchResults.innerHTML = "";

    if (filteredProducts.length === 0) {
        searchResults.innerHTML = `<div class="p-2 text-gray-600">কোনো প্রোডাক্ট পাওয়া যায়নি</div>`;
    } else {
        filteredProducts.forEach(product => {
            const card = document.createElement("div");
            card.className = "p-2 hover:bg-gray-100 cursor-pointer";
            card.onclick = () => showProductDetail(product.id);

            card.innerHTML = `
                <div class="flex items-center">
                    <img src="${product.image ? product.image.split(',')[0] : 'https://via.placeholder.com/50'}" class="w-12 h-12 object-cover rounded-lg mr-4" onerror="this.src='https://via.placeholder.com/50'; this.alt='ছবি লোড হয়নি';">
                    <div>
                        <h3 class="text-lg font-bold">${product.name || 'নাম পাওয়া যায়নি'}</h3>
                        <p class="text-lipstick font-bold">দাম: ${product.price || '0'} টাকা</p>
                    </div>
                </div>
            `;
            searchResults.appendChild(card);
        });
    }

    searchResults.classList.remove("hidden");
    console.log("সার্চ রেজাল্ট দেখানো হয়েছে। ফিল্টার করা প্রোডাক্ট: ", filteredProducts.length);
};

// চেকআউট ফাংশন (অর্ডার ফর্মে রিডাইরেক্ট এবং প্রোডাক্ট পাঠানো)
window.checkout = function() {
    if (cartItems.length === 0) {
        showToast("কার্ট খালি আছে!");
        return;
    }

    // কার্ট আইটেমগুলো লোকাল স্টোরেজে সেভ করা
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.location.href = 'order-form.html?source=cart'; // সঠিক URL-এ রিডাইরেক্ট
    console.log("চেকআউট করা হয়েছে। অর্ডার ফর্মে রিডাইরেক্ট করা হয়েছে।");
};
// ইউজারের অথেনটিকেশন স্টেট পরিবর্তন হলে
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            updateLoginButton(user);
            checkAdminAndShowUploadForm(user);
            loadCartFromFirebase();
            console.log("ইউজার লগইন অবস্থা: লগইন করা আছে।", user.email);
        } else {
            updateLoginButton(null);
            checkAdminAndShowUploadForm(null);
            cartItems = [];
            updateCartUI();
            console.log("ইউজার লগইন অবস্থা: লগইন করা নেই।");
        }
    });
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
    // This is now the single entry point for app logic after DOM is ready
    if (typeof loadProductsFromFirebase === "function") {
        loadProductsFromFirebase();
    }
    if (typeof loadCartFromFirebase === "function") {
        loadCartFromFirebase();
    }
});
