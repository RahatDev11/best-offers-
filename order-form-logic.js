// =================================================================
// order-form-logic.js (Updated & Secure Version)
// এখন লগইন না করেও অর্ডার করা যাবে (Guest Checkout Enabled)
// টেলিগ্রাম নোটিফিকেশন Netlify Function-এর মাধ্যমে নিরাপদভাবে পাঠানো হবে।
// =================================================================

// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; 
import { getMessaging, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
    storageBucket: "nahid-6714.firebasestorage.app",
    messagingSenderId: "505741217147",
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de",
    measurementId: "G-QZ7CTRKHCW"
};

// --- VAPID Key for Push Notifications ---
// Note: Ensure this VAPID key is correctly configured in your Firebase project for push notifications.
const VAPID_KEY = 'YJmRy7RwHDamT_Wq9GSpJQm3Iexnkq1K9zvRFu3H_oI';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); 
let messaging = null;

// Initialize Firebase Messaging
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
    const toastContainer = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-xl text-white flex items-center space-x-3 transition-all duration-300 transform translate-y-0 opacity-100 mb-3`;
    toast.style.backgroundColor = type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#10b981';

    let icon = '';
    if (type === 'error') icon = '<i class="fas fa-times-circle text-xl"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle text-xl"></i>';
    else icon = '<i class="fas fa-check-circle text-xl"></i>';

    toast.innerHTML = `${icon} <p class="text-sm font-medium">${message}</p>`;
    
    // Ensure toast-container exists for proper positioning
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-md';
        document.body.appendChild(container);
    }
    document.getElementById('toast-container').prepend(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-5');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load Header and Footer
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

function calculateAndDisplayPrices(items) {
    let subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryLocation = document.querySelector('input[name="deliveryLocation"]:checked')?.value || 'insideDhaka';
    const deliveryFee = deliveryLocation === 'outsideDhaka' ? 160 : 70;
    const totalAmount = subTotal + deliveryFee;

    subTotalDisplay.textContent = `${subTotal.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;
    totalAmountDisplay.textContent = `${totalAmount.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} টাকা`;

    return { subTotal, deliveryFee, totalAmount };
}

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
                <img src="${item.image || 'placeholder.jpg'}" alt="${item.name}" loading="lazy">
                <div class="checkout-item-details">
                    <p class="item-name">${item.name} (${item.variant || ''})</p>
                    <p>${item.quantity} x ${item.price.toFixed(2)} টাকা = ${(item.price * item.quantity).toFixed(2)} টাকা</p>
                </div>
            </div>
        `;
        checkoutItemsContainer.innerHTML += itemHtml;
    });
    submitButton.disabled = false;
}

async function fetchCart(uid) {
    if (!uid) {
         checkoutItemsContainer.innerHTML = '<p class="text-center text-gray-500 italic p-4">আপনি লগইন করেননি। কার্ট লোড করা যাচ্ছে না।</p>';
         return;
    }

    loadingIndicator.classList.remove('hidden');
    const cartRef = ref(database, `carts/${uid}`);
    try {
        const cartData = (await get(cartRef)).val();
        checkoutCart = cartData ? Object.values(cartData) : [];
        renderCheckoutItems(checkoutCart);
        calculateAndDisplayPrices(checkoutCart);
    } catch (error) {
        console.error("Error fetching cart:", error);
        showToast("কার্ট লোড করতে সমস্যা হয়েছে।", "error");
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

async function fetchBuyNowProduct(productId, quantity, variant) {
     loadingIndicator.classList.remove('hidden');
     const productRef = ref(database, `products/${productId}`);
     try {
         const productData = (await get(productRef)).val();
         if (productData) {
             const price = productData.price;
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
     } finally {
         loadingIndicator.classList.add('hidden');
     }
}

function initializeCheckout(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'buy-now') {
        isBuyNowMode = true;
        const productId = urlParams.get('productId');
        const quantity = urlParams.get('quantity') || 1;
        const variant = urlParams.get('variant') || 'Default';
        fetchBuyNowProduct(productId, quantity, variant);
    } else {
        isBuyNowMode = false;
        if (user) {
            fetchCart(user.uid);
        } else {
            const localCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
            checkoutCart = localCart;
            renderCheckoutItems(checkoutCart);
            calculateAndDisplayPrices(checkoutCart);
        }
    }
}

async function fetchUserProfile(uid) {
    const profileRef = ref(database, `users/${uid}/profile`);
    try {
        const profile = (await get(profileRef)).val();
        if (profile) {
             document.getElementById('customerName').value = profile.name || '';
             document.getElementById('phoneNumber').value = profile.phone || '';
             document.getElementById('address').value = profile.address || '';
        }
    } catch (err) {
        console.error("Error fetching user profile:", err);
    }
    handleDeliveryLocationChange();
}

// --- UI Event Handlers ---

function handleDeliveryLocationChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const outsideGroup = document.getElementById('outsideDhakaLocationGroup');
    const notice = document.getElementById('paymentNotice');
    const deliveryPaymentGroup = document.getElementById('deliveryPaymentGroup');
    
    const isOutsideDhaka = location === 'outsideDhaka';

    outsideGroup.classList.toggle('hidden', !isOutsideDhaka);
    notice.style.display = isOutsideDhaka ? 'block' : 'none';
    deliveryPaymentGroup.classList.toggle('hidden', !isOutsideDhaka);

    document.getElementById('outsideDhakaLocation').required = isOutsideDhaka;
    document.getElementById('deliveryPaymentMethod').required = isOutsideDhaka;
    
    handleDeliveryPaymentMethodChange();
    calculateAndDisplayPrices(checkoutCart);
}

function handleDeliveryPaymentMethodChange() {
    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const method = document.getElementById('deliveryPaymentMethod').value;
    const paymentNumberGroup = document.getElementById('paymentNumberGroup');
    const transactionIdGroup = document.getElementById('transactionIdGroup');
    
    const shouldShow = location === 'outsideDhaka' && method;
    paymentNumberGroup.classList.toggle('hidden', !shouldShow);
    transactionIdGroup.classList.toggle('hidden', !shouldShow);
    document.getElementById('paymentNumber').required = shouldShow;
    document.getElementById('transactionId').required = shouldShow;
}

// ========================================================================
// >>>>>>>>>> START: SECURE TELEGRAM NOTIFICATION FUNCTION <<<<<<<<<<
// ========================================================================
/**
 * Calls a serverless Netlify Function to send a Telegram notification.
 * This is the SECURE way to handle notifications, as API keys are not exposed.
 * @param {object} orderData - The complete order data to be sent.
 */
async function sendTelegramNotification(orderData) {
    try {
        // Calling the Netlify Function endpoint.
        const response = await fetch('/.netlify/functions/telegram_notifier', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData) // Sending the order data to the function.
        });

        if (response.ok) {
            console.log("Telegram notification request sent successfully.");
        } else {
            // Log error details from the function if available.
            const errorResult = await response.json();
            console.error("Failed to send Telegram notification.", errorResult.message || 'Unknown error.');
        }
    } catch (error) {
        console.error("Network error: Could not call the Netlify Function for Telegram.", error);
    }
}
// ========================================================================
// >>>>>>>>>>> END: SECURE TELEGRAM NOTIFICATION FUNCTION <<<<<<<<<<<
// ========================================================================

// --- Form Submission Handler ---

async function handleOrderSubmit(event) {
    event.preventDefault();

    if (checkoutCart.length === 0) {
         showToast("অর্ডার করার জন্য কার্টে কোনো প্রোডাক্ট নেই।", "warning");
         return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> অর্ডার সাবমিট হচ্ছে...';

    const location = document.querySelector('input[name="deliveryLocation"]:checked').value;
    const isOutsideDhaka = location === 'outsideDhaka';

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
        isGuest: window.currentUserId.startsWith('GUEST_')
    };

    const { subTotal, deliveryFee, totalAmount } = calculateAndDisplayPrices(checkoutCart);

    const orderData = {
        ...formData,
        items: checkoutCart,
        subTotal,
        deliveryFee,
        totalAmount,
        userId: window.currentUserId,
        userEmail: window.currentUserEmail,
        orderStatus: 'Pending',
        isBuyNow: isBuyNowMode,
        timestamp: Date.now()
    };

    try {
        const newOrderRef = push(ref(database, 'orders'));
        await set(newOrderRef, orderData);

        const orderId = newOrderRef.key;
        await update(newOrderRef, { orderId: orderId });
        orderData.orderId = orderId; // Add orderId for notification

        // Securely send notification via Netlify Function
        sendTelegramNotification(orderData);

        // Store orderId in localStorage for guest users
        if (orderData.isGuest) {
            let myOrders = JSON.parse(localStorage.getItem('myOrders')) || [];
            myOrders.push(orderId);
            localStorage.setItem('myOrders', JSON.stringify(myOrders));
        }

        // Clear cart based on user type
        if (orderData.isGuest) {
            localStorage.removeItem('cartItems');
        } else if (!isBuyNowMode) {
            await set(ref(database, `carts/${window.currentUserId}`), null);
        }
        
        showToast(`অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে! অর্ডার আইডি: ${orderId}`, "success");

        window.location.href = `thank-you.html?orderId=${orderId}`;

    } catch (error) {
        console.error("Error placing order:", error);
        showToast("অর্ডার সাবমিট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
        submitButton.disabled = false;
        submitButton.innerHTML = 'অর্ডার কনফার্ম করুন';
    }
}

// --- Initialization ---

function initializePage() {
    loadingIndicator.classList.add('hidden');
    checkoutForm.classList.remove('hidden');

    onAuthStateChanged(auth, user => {
        if (user) {
            window.currentUserId = user.uid;
            window.currentUserEmail = user.email;
            fetchUserProfile(user.uid);
            initializeCheckout(user);
        } else {
            initializeCheckout(null);
            handleDeliveryLocationChange();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPartials();
    
    if (checkoutForm) {
        document.querySelectorAll('input[name="deliveryLocation"]').forEach(radio => {
            radio.addEventListener('change', handleDeliveryLocationChange);
        });
        document.getElementById('deliveryPaymentMethod')?.addEventListener('change', handleDeliveryPaymentMethodChange);
        checkoutForm.addEventListener('submit', handleOrderSubmit);
    }

    setupShareButton();
    initializePage();
});

// --- Other UI Logic ---
function setupShareButton() {
    const shareButton = document.getElementById('shareButton');
    const socialIcons = document.getElementById('socialIcons');

    if (shareButton && socialIcons) {
        shareButton.addEventListener('click', () => socialIcons.classList.toggle('hidden'));
        document.addEventListener('click', (event) => {
            if (!shareButton.contains(event.target) && !socialIcons.contains(event.target)) {
                socialIcons.classList.add('hidden');
            }
        });
    }
}

function initializeForegroundMessageHandler() {
    onMessage(messaging, (payload) => {
        const { title, body } = payload.notification;
        if (title && body) {
            showToast(`${title}: ${body}`, "info");
        }
    });
}