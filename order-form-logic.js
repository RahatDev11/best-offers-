// =================================================================
// order-form-logic.js
// এখন লগইন না করেও অর্ডার করা যাবে (Guest Checkout Enabled)
// =================================================================

// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
// Auth imports are now used for optional session check and data pre-filling
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; 
import { getMessaging, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// --- Firebase Configuration ---
// !!! আপনার আসল Firebase কনফিগারেশন এখানে দিন !!!
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA", // Replace
    authDomain: "nahid-6714.firebaseapp.com", // Replace
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app", // Replace
    projectId: "nahid-6714", // Replace
    storageBucket: "nahid-6714.firebasestorage.app", // Replace
    messagingSenderId: "505741217147", // Replace
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de", // Replace
    measurementId: "G-QZ7CTRKHCW" // Optional
};
// --- VAPID Key for Push Notifications ---
const VAPID_KEY = 'YJmRy7RwHDamT_Wq9GSpJQm3Iexnkq1K9zvRFu3H_oI'; // Replace

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); 
let messaging = null;

isSupported().then((supported) => {
    if (supported) {
        try {
            messaging = getMessaging(app);
            console.log("Firebase Messaging initialized.");
            initializeForegroundMessageHandler();
        } catch (err) {
            console.error("Error initializing messaging:", err);
        }
    } else {
        console.warn("Firebase Messaging not supported in this browser.");
    }
}).catch(err => {
    console.error("Error checking messaging support:", err);
});

// Global Variables
let checkoutCart = [];
let isBuyNowMode = false;
// Default Guest ID and Email, will be overwritten if user is logged in
window.currentUserId = 'GUEST_' + Date.now(); 
window.currentUserEmail = 'guest@checkout.com'; 

// --- UI Elements ---
const checkoutForm = document.getElementById('checkoutForm');
const loadingIndicator = document.getElementById('loadingIndicator');
const submitButton = document.getElementById('submitButton');
const checkoutItemsContainer = document.getElementById('checkoutItems');
const subTotalDisplay = document.getElementById('subTotalDisplay');
const deliveryFeeDisplay = document.getElementById('deliveryFeeDisplay');
const totalAmountDisplay = document.getElementById('totalAmountDisplay');

// --- Helper Functions ---

// Improved Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-xl text-white flex items-center space-x-3 transition-all duration-300 transform translate-y-0 opacity-100 mb-3`;
    toast.style.backgroundColor = type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#10b981';

    let icon = '';
    if (type === 'error') icon = '<i class="fas fa-times-circle text-xl"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle text-xl"></i>';
    else icon = '<i class="fas fa-check-circle text-xl"></i>';

    toast.innerHTML = `${icon} <p class="text-sm font-medium">${message}</p>`;

    const container = document.getElementById('toast-container');
    container.prepend(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-5');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Load Header and Footer (Basic implementation)
async function loadPartials() {
    try {
        const [headerResponse, footerResponse] = await Promise.all([
            fetch('header.html'),
            fetch('footer.html')
        ]);

        if (headerResponse.ok) {
            document.getElementById('header').innerHTML = await headerResponse.text();
        } else {
            console.error('Failed to load header.html');
        }

        if (footerResponse.ok) {
            document.getElementById('footer').innerHTML = await footerResponse.text();
        } else {
            console.error('Failed to load footer.html');
        }
    } catch (error) {
        console.error('Error loading partials:', error);
    }
}

// --- Cart/Checkout Logic ---

// Calculate and update prices
function calculateAndDisplayPrices(items) {
    let subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryLocation = document.querySelector('input[name="deliveryLocation"]:checked')?.value || 'insideDhaka';
    const deliveryFee = deliveryLocation === 'outsideDhaka' ? 160 : 70;
    const totalAmount = subTotal + deliveryFee;

    // Use toLocaleString('bn-BD') for Bangladeshi number formatting
    subTotalDisplay.textContent = `${subTotal.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;
    totalAmountDisplay.textContent = `${totalAmount.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;

    return { subTotal, deliveryFee, totalAmount };
}

// Render checkout items
function renderCheckoutItems(items) {
    checkoutItemsContainer.innerHTML = '';
    if (!items || items.length === 0) {
        checkoutItemsContainer.innerHTML = '<p class="text-center text-red-500 font-medium p-4">আপনার কার্ট খালি। অর্ডার করার জন্য প্রোডাক্ট যোগ করুন।</p>';
        submitButton.disabled = true;
        return;
    }
    items.forEach(item => {
        const itemHtml = `
            <div class="checkout-item">
                <img src="${item.imageUrl || 'placeholder.jpg'}" alt="${item.name}" loading="lazy">
                <div class="checkout-item-details">
                    <p class="item-name">${item.name} (${item.variant})</p>
                    <p>${item.quantity} x ${item.price.toFixed(2)} টাকা = ${(item.price * item.quantity).toFixed(2)} টাকা</p>
                </div>
            </div>
        `;
        checkoutItemsContainer.innerHTML += itemHtml;
    });

    submitButton.disabled = false;
}

// Fetch cart items from Firebase
async function fetchCart(uid) {
    // Only fetch cart if UID is provided (logged-in user)
    if (!uid) {
         checkoutItemsContainer.innerHTML = '<p class="text-center text-gray-500 italic p-4">আপনি লগইন করেননি। কার্ট লোড করা যাচ্ছে না।</p>';
         return;
    }

    loadingIndicator.classList.remove('hidden');
    const cartRef = ref(database, `carts/${uid}`);
    try {
        const snapshot = await get(cartRef);
        const cartData = snapshot.val();
        let items = [];
        if (cartData) {
            items = Object.keys(cartData).map(key => ({
                cartItemId: key,
                ...cartData[key]
            }));
        }
        checkoutCart = items;
        renderCheckoutItems(checkoutCart);
        calculateAndDisplayPrices(checkoutCart);
    } catch (error) {
        console.error("Error fetching cart:", error);
        showToast("কার্ট লোড করতে সমস্যা হয়েছে।", "error");
        checkoutItemsContainer.innerHTML = '<p class="text-center text-red-500 font-medium p-4">কার্ট লোড করতে ব্যর্থ।</p>';
        submitButton.disabled = true;
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Fetch 'Buy Now' product details
async function fetchBuyNowProduct(productId, quantity, variant) {
     loadingIndicator.classList.remove('hidden');
     const productRef = ref(database, `products/${productId}`);
     try {
         const snapshot = await get(productRef);
         const productData = snapshot.val();

         if (productData) {
             const variantData = productData.variants?.find(v => v.name === variant);
             const price = variantData ? variantData.price : productData.price;

             checkoutCart = [{
                 productId: productId,
                 name: productData.name,
                 imageUrl: productData.imageUrl,
                 variant: variant,
                 price: parseFloat(price),
                 quantity: parseInt(quantity)
             }];

             renderCheckoutItems(checkoutCart);
             calculateAndDisplayPrices(checkoutCart);
         } else {
             showToast("প্রোডাক্ট খুঁজে পাওয়া যায়নি।", "error");
             submitButton.disabled = true;
         }
     } catch (error) {
         console.error("Error fetching buy now product:", error);
         showToast("প্রোডাক্ট লোড করতে সমস্যা হয়েছে।", "error");
         submitButton.disabled = true;
     } finally {
         loadingIndicator.classList.add('hidden');
     }
 }

// Initialize checkout based on URL parameters
function initializeCheckout(uid) {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'buy-now') {
        isBuyNowMode = true;
        const productId = urlParams.get('productId');
        const quantity = urlParams.get('quantity');
        const variant = urlParams.get('variant');

        if (productId && quantity && variant) {
            fetchBuyNowProduct(productId, quantity, variant);
        } else {
            showToast("Buy Now এর জন্য প্রয়োজনীয় তথ্য অনুপস্থিত।", "error");
            submitButton.disabled = true;
        }
    } else {
        isBuyNowMode = false;
        fetchCart(uid); // Load cart if UID is available
    }
}

// Fetch user profile data to pre-fill the form
async function fetchUserProfile(uid) {
    const profileRef = ref(database, `users/${uid}/profile`);
    try {
        const snapshot = await get(profileRef);
        const profile = snapshot.val();
        if (profile) {
             document.getElementById('customerName').value = profile.name || '';
             document.getElementById('phoneNumber').value = profile.phone || '';
             document.getElementById('address').value = profile.address || '';

             const savedLocation = profile.deliveryLocation || 'insideDhaka';
             const radio = document.querySelector(`input[name="deliveryLocation"][value="${savedLocation}"]`);
             if (radio) radio.checked = true;

             handleDeliveryLocationChange();

             if (savedLocation === 'outsideDhaka' && profile.outsideDhakaLocation) {
                 document.getElementById('outsideDhakaLocation').value = profile.outsideDhakaLocation;
             }
        }
    } catch (err) {
        console.error("Error fetching user profile:", err);
    }
    // Always call this to ensure fees are calculated and form state is correct
    handleDeliveryLocationChange();
}

// --- UI Event Handlers ---

// Handle delivery location change (inside/outside Dhaka)
function handleDeliveryLocationChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const outsideGroup = document.getElementById('outsideDhakaLocationGroup');
    const notice = document.getElementById('paymentNotice');
    const deliveryPaymentGroup = document.getElementById('deliveryPaymentGroup');
    const paymentNumberGroup = document.getElementById('paymentNumberGroup');
    const transactionIdGroup = document.getElementById('transactionIdGroup');

    if (location === 'outsideDhaka') {
        outsideGroup.classList.remove('hidden');
        notice.style.display = 'block';
        deliveryPaymentGroup.classList.remove('hidden');

        document.getElementById('outsideDhakaLocation').required = true;
        document.getElementById('deliveryPaymentMethod').required = true;
        document.getElementById('paymentNumber').required = true;
        document.getElementById('transactionId').required = true;

        handleDeliveryPaymentMethodChange(); // Update visibility based on method

    } else { // insideDhaka
        outsideGroup.classList.add('hidden');
        notice.style.display = 'none';
        deliveryPaymentGroup.classList.add('hidden');
        paymentNumberGroup.classList.add('hidden');
        transactionIdGroup.classList.add('hidden');

        document.getElementById('outsideDhakaLocation').required = false;
        document.getElementById('deliveryPaymentMethod').required = false;
        document.getElementById('paymentNumber').required = false;
        document.getElementById('transactionId').required = false;
    }

    calculateAndDisplayPrices(checkoutCart);
}

// Handle delivery payment method change (only affects required fields, not visibility)
function handleDeliveryPaymentMethodChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const method = document.getElementById('deliveryPaymentMethod').value;
    const paymentNumberGroup = document.getElementById('paymentNumberGroup');
    const transactionIdGroup = document.getElementById('transactionIdGroup');

    if (location === 'outsideDhaka') {
        if (method) {
            paymentNumberGroup.classList.remove('hidden');
            transactionIdGroup.classList.remove('hidden');
            document.getElementById('paymentNumber').required = true;
            document.getElementById('transactionId').required = true;
        } else {
            paymentNumberGroup.classList.add('hidden');
            transactionIdGroup.classList.add('hidden');
            document.getElementById('paymentNumber').required = false;
            document.getElementById('transactionId').required = false;
        }
    }
}


// Function to handle form submission
async function handleOrderSubmit(event) {
    event.preventDefault();

    if (checkoutCart.length === 0) {
         showToast("অর্ডার করার জন্য কার্টে কোনো প্রোডাক্ট নেই।", "warning");
         return;
    }

    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const isOutsideDhaka = location === 'outsideDhaka';

    // 1. Collect Form Data
    const formData = {
        customerName: document.getElementById('customerName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        address: document.getElementById('address').value,
        deliveryLocation: location,
        outsideDhakaLocation: isOutsideDhaka ? document.getElementById('outsideDhakaLocation').value : null,
        deliveryNote: document.getElementById('deliveryNote').value,
        productPaymentMethod: document.getElementById('productPaymentMethod').value,
        deliveryPaymentMethod: isOutsideDhaka ? document.getElementById('deliveryPaymentMethod').value : null,
        paymentNumber: isOutsideDhaka ? document.getElementById('paymentNumber').value : null,
        transactionId: isOutsideDhaka ? document.getElementById('transactionId').value : null,
        isGuest: window.currentUserId.startsWith('GUEST_') // New field to track guest orders
    };

    // 2. Calculate Prices
    const { subTotal, deliveryFee, totalAmount } = calculateAndDisplayPrices(checkoutCart);

    // 3. Construct Order Data
    const orderData = {
        ...formData,
        items: checkoutCart.map(item => ({
            productId: item.productId,
            name: item.name,
            variant: item.variant,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
        })),
        subTotal: subTotal,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount,
        userId: window.currentUserId, // Use global ID
        userEmail: window.currentUserEmail, // Use global Email
        orderStatus: 'Pending',
        isBuyNow: isBuyNowMode,
        timestamp: Date.now()
    };

    // Disable button and show loading
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> অর্ডার সাবমিট হচ্ছে...';

    // 4. Save to Firebase Database
    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderData);

        // Add Order ID to the data
        const orderId = newOrderRef.key;
        orderData.orderId = orderId;
        await update(newOrderRef, { orderId: orderId });

        // === Telegram Notification Call ===
        sendTelegramNotification(orderData);
        // ==================================

        // 5. Clear Cart (if not Buy Now AND if logged in)
        if (!isBuyNowMode && !orderData.isGuest) {
            // Only clear the cart if the user was logged in (not a GUEST)
            await set(ref(database, `carts/${window.currentUserId}`), null);
        }
        
        // 6. Success Feedback and Redirect
        showToast(`অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! অর্ডার আইডি: ${orderId}`, "success");

        // Save orderId to localStorage for guest tracking if needed, then redirect
        localStorage.setItem('lastGuestOrderId', orderId);

        setTimeout(() => {
            window.location.href = `order-track.html?orderId=${orderId}`;
        }, 1500);

    } catch (error) {
        console.error("Error placing order:", error);
        showToast("অর্ডার সাবমিট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");

        submitButton.disabled = false;
        submitButton.innerHTML = 'অর্ডার কনফার্ম করুন';
    }
}

// --- Telegram Notification Function ---

// !!! নিরাপত্তা নিশ্চিত করে আপনার আসল Telegram BOT TOKEN এবং CHAT ID এখানে দিন !!!
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; // MUST REPLACE
const CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID'; // MUST REPLACE

function formatOrderForTelegram(orderData) {
    const itemLines = orderData.items.map(item =>
        ` • ${item.name} (${item.variant}) x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} টাকা`
    ).join('\n');

    let addressDetails = `${orderData.address}`;
    if (orderData.deliveryLocation === 'outsideDhaka') {
        addressDetails += ` (${orderData.outsideDhakaLocation})`;
    }

    let paymentDetails = `\n\n💰 পেমেন্ট:\n`;
    if (orderData.deliveryLocation === 'outsideDhaka') {
        paymentDetails += `   • ডেলিভারি চার্জ (১৬০৳ অগ্রিম)\n`;
        paymentDetails += `     - মেথড: ${orderData.deliveryPaymentMethod.toUpperCase()}\n`;
        paymentDetails += `     - প্রেরকের নম্বর: ${orderData.paymentNumber}\n`;
        paymentDetails += `     - TrxID: ${orderData.transactionId}\n`;
    } else {
        paymentDetails += `   • ডেলিভারি চার্জ: ক্যাশ অন ডেলিভারি (COD)\n`;
    }
    paymentDetails += `   • প্রোডাক্ট মূল্য: ক্যাশ অন ডেলিভারি (COD)`;

    const guestMarker = orderData.isGuest ? '🔴 গেস্ট (লগইন ছাড়া) অর্ডার' : '🟢 লগইন করা অর্ডার';

    const message = `
🌟 **নতুন অনলাইন অর্ডার** 🌟
-----------------------------------
${guestMarker}
🆔 অর্ডার আইডি: **${orderData.orderId}**
👤 গ্রাহক: ${orderData.customerName}
📞 ফোন: ${orderData.phoneNumber}
📧 ইমেইল: ${orderData.userEmail}
📦 মোড: ${orderData.isBuyNow ? 'Buy Now' : 'Cart Checkout'}
-----------------------------------
🏠 ডেলিভারি তথ্য:
   • এলাকা: ${orderData.deliveryLocation === 'insideDhaka' ? 'ঢাকার ভেতরে (৭০৳)' : `ঢাকার বাইরে (${orderData.outsideDhakaLocation})`}
   • ঠিকানা: ${addressDetails}
   • নোট: ${orderData.deliveryNote || 'নেই'}
-----------------------------------
🛒 অর্ডার আইটেম:
${itemLines}
-----------------------------------
💵 মোট মূল্য:
   • সাব-টোটাল: ${orderData.subTotal.toFixed(2)} টাকা
   • ডেলিভারি ফি: ${orderData.deliveryFee.toFixed(2)} টাকা
   • মোট প্রদেয়: **${orderData.totalAmount.toFixed(2)} টাকা**
${paymentDetails}
-----------------------------------
⏳ সময়: ${new Date(orderData.timestamp).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}
    `;
    return message.trim();
}

async function sendTelegramNotification(orderData) {
    if (BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || CHAT_ID === 'YOUR_TELEGRAM_CHAT_ID') {
         console.error("Telegram BOT_TOKEN or CHAT_ID is not set. Notification skipped.");
         return;
    }
    const message = formatOrderForTelegram(orderData);
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();
        if (!data.ok) {
            console.error("Failed to send Telegram notification:", data.description);
        }

    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
}

// --- Initialization without Auth Check ---

function initializeOrderForm() {
    loadingIndicator.classList.add('hidden');
    checkoutForm.classList.remove('hidden');

    // Check if user is logged in (optional, for data retrieval/pre-filling only)
    onAuthStateChanged(auth, user => {
        if (user) {
            // User is logged in, use their details
            window.currentUserId = user.uid;
            window.currentUserEmail = user.email;

            // Fetch profile to pre-fill form
            fetchUserProfile(user.uid);
            // Initialize checkout (loads cart for logged-in user)
            initializeCheckout(user.uid);

        } else {
            // User is NOT logged in (Guest). Use default GUEST_ID.
            // Initialize checkout (loads Buy Now product, or shows empty cart for guests)
            initializeCheckout(null);
            // Fallback for form initialization if no profile was fetched
            handleDeliveryLocationChange();
        }
    });
}

// --- Initial Setup on DOM Load ---

document.addEventListener('DOMContentLoaded', () => {
    loadPartials();

    // Attach event listeners to form elements
    if (checkoutForm) {
        document.querySelectorAll('input[name="deliveryLocation"]').forEach(radio => {
            radio.addEventListener('change', handleDeliveryLocationChange);
        });
        const deliveryMethodSelect = document.getElementById('deliveryPaymentMethod');
        if (deliveryMethodSelect) {
            deliveryMethodSelect.addEventListener('change', handleDeliveryPaymentMethodChange);
        }
        checkoutForm.addEventListener('submit', handleOrderSubmit);
    }

    // Setup other UI interactions
    setupShareButton();

    // Start form initialization process
    initializeOrderForm();
});

// --- Social Share Button Logic ---
function setupShareButton() {
    const shareButton = document.getElementById('shareButton');
    const socialIcons = document.getElementById('socialIcons');

    if (shareButton && socialIcons) {
        shareButton.addEventListener('click', () => {
            socialIcons.classList.toggle('hidden');
        });

        document.addEventListener('click', (event) => {
            if (!shareButton.contains(event.target) && !socialIcons.contains(event.target)) {
                socialIcons.classList.add('hidden');
            }
        });
    }
}

function initializeForegroundMessageHandler() {
    onMessage(messaging, (payload) => {
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/firebase-logo.png'
        };

        if (notificationTitle && notificationOptions.body) {
            showToast(`${notificationTitle}: ${notificationOptions.body}`, "warning");
        }
    });
}
