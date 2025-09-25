// =================================================================
// SECTION: MOCK DATA & UTILITY FUNCTIONS
// =================================================================

// টেস্টিং এর জন্য মক কার্ট ডেটা
const MOCK_CART_ITEMS = [
    { id: "mock_p1", name: "পরীক্ষা পণ্য A (2 পিস)", price: 1250, quantity: 2 },
    { id: "mock_p2", name: "পরীক্ষা পণ্য B (1 পিস)", price: 500, quantity: 1 }
];

// টোস্ট নোটিফিকেশন ফাংশন
function showToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement("div");
    const icon = type === "success" ? "fas fa-check-circle" : (type === "warning" ? "fas fa-exclamation-triangle" : (type === "error" ? "fas fa-times-circle" : "fas fa-info-circle"));
    const color = type === "success" ? "bg-green-500" : (type === "warning" ? "bg-yellow-600" : (type === "error" ? "bg-red-500" : "bg-blue-500"));
    toast.className = `min-w-[250px] ${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 transform transition-all translate-y-full opacity-0`;
    toast.innerHTML = `<i class="${icon} mr-3"></i> ${message}`;
    container.appendChild(toast);
    
    // Show animation
    setTimeout(() => { toast.classList.remove('translate-y-full', 'opacity-0'); toast.classList.add('translate-y-0', 'opacity-100'); }, 10);
    // Hide animation
    setTimeout(() => { toast.classList.remove('translate-y-0', 'opacity-100'); toast.classList.add('translate-y-full', 'opacity-0'); }, 5000);
    // Remove from DOM
    setTimeout(() => { toast.remove(); }, 5500);
};
window.showToast = showToast; // HTML থেকে কল করার জন্য

// ডেলিভারি ফি গণনা করা
function getSelectedDeliveryFee() {
    const selectedRadio = document.querySelector('input[name="deliveryLocation"]:checked');
    const location = selectedRadio ? selectedRadio.value : 'inside_dhaka'; 
    return location === 'outside_dhaka' ? 120 : 80;
}

// কার্ট আইটেম ডিসপ্লে করা
function displayCartItemsOnOrderForm() {
    const cartItems = MOCK_CART_ITEMS;
    const itemsContainer = document.getElementById('orderCartSummary');
    const cartTotalEl = document.getElementById('cartTotal');
    const grandTotalEl = document.getElementById('grandTotal');
    
    if (!itemsContainer || cartItems.length === 0) {
        if (itemsContainer) itemsContainer.innerHTML = '<p class="text-center text-gray-500">মক কার্ট খালি।</p>';
        return;
    }

    let subTotalPrice = 0;
    itemsContainer.innerHTML = cartItems.map(item => {
        const itemTotal = parseFloat(item.price || 0) * (item.quantity || 0);
        subTotalPrice += itemTotal;
        return `<div class="flex justify-between border-b border-dashed pb-2 mb-2"><span class="text-gray-700">${item.name}</span><span class="font-semibold">${itemTotal.toFixed(2)}৳</span></div>`;
    }).join('');

    const deliveryFee = getSelectedDeliveryFee(); 
    const grandTotal = subTotalPrice + deliveryFee;

    if(cartTotalEl) cartTotalEl.textContent = subTotalPrice.toFixed(2);
    if(grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2);

    const deliveryFeeDisplay = document.getElementById('deliveryFeeDisplay');
    if(deliveryFeeDisplay) deliveryFeeDisplay.textContent = deliveryFee.toFixed(2);
}
window.displayCartItemsOnOrderForm = displayCartItemsOnOrderForm;

// ডেলিভারি লোকেশন চেঞ্জ হলে সামারি আপডেট
function handleDeliveryLocationChange() {
    displayCartItemsOnOrderForm(); 
}
window.handleDeliveryLocationChange = handleDeliveryLocationChange;

// =================================================================
// SECTION: CORE SUBMISSION LOGIC (Mock)
// =================================================================

async function handleOrderSubmit(event) {
    event.preventDefault();

    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    // A. ফর্ম ডেটা সংগ্রহ
    const customerName = document.getElementById('customerName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('shippingAddress').value.trim();
    const deliveryMethod = document.getElementById('deliveryPaymentMethod').value;
    
    const selectedDeliveryLocation = document.querySelector('input[name="deliveryLocation"]:checked');
    const deliveryLocation = selectedDeliveryLocation ? selectedDeliveryLocation.value : 'inside_dhaka';
    const deliveryFee = getSelectedDeliveryFee(); 

    const cartItems = MOCK_CART_ITEMS;
    const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    const totalAmount = (parseFloat(subTotal) + deliveryFee).toFixed(2);

    // B. ভ্যালিডেশন
    if (!customerName || !phoneNumber || !address) {
        showToast("দয়া করে সকল তথ্য পূরণ করুন।", "warning");
        return;
    }
    
    // C. PHP-এর জন্য ডেটা স্ট্রাকচার তৈরি
    const orderData = {
        customerName: customerName,
        phoneNumber: phoneNumber,
        address: address,
        deliveryLocation: deliveryLocation === 'inside_dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে',
        deliveryFee: deliveryFee,
        totalAmount: totalAmount,
        subTotal: subTotal,
        paymentMethod: deliveryMethod,
        cartItems: cartItems,
        orderDate: new Date().toISOString(),
        // টেস্টিং এর জন্য একটি র্যান্ডম Order ID তৈরি করা হলো
        orderId: 'TEST-' + Math.floor(Math.random() * 90000) + 10000, 
        status: "processing" 
    };
    
    // D. ✨ PHP ফাইলে ডেটা পাঠানো ✨
    try {
        showToast("নোটিফিকেশন পাঠানো হচ্ছে... কিছুক্ষণ অপেক্ষা করুন।", "info");
        
        // **গুরুত্বপূর্ণ:** এখানে 'send_telegram_notification.php' কে কল করা হচ্ছে।
        // এই ফাইলটি আপনার অনলাইন সার্ভারে থাকতে হবে, লোকাল কম্পিউটারে নয়।
        const response = await fetch('/.netlify/functions/telegram_notifier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData) 
        });

        // যদি PHP ফাইলটি সার্ভারে না থাকে, তবে এখানে একটি নেটওয়ার্ক এরর আসতে পারে।
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showToast(`সফল! অর্ডার আইডি ${orderData.orderId} Telegram-এ পাঠানো হয়েছে।`, "success");
            console.log("Success:", result);
        } else {
            // PHP থেকে আসা এরর মেসেজ ডিসপ্লে করা
            showToast(`ব্যর্থ! নোটিফিকেশন যায়নি। Error: ${result.message}`, "error");
            console.error("Error sending notification:", result);
        }

    } catch (error) {
        showToast("❌ নেটওয়ার্ক বা সার্ভার ত্রুটি! `send_telegram_notification.php` ফাইলটি সার্ভারে আছে কিনা দেখুন।", "error");
        console.error("Network or Fetch failed:", error);
    }
}
window.handleOrderSubmit = handleOrderSubmit;

// =================================================================
// SECTION: INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // ফর্ম এবং ইভেন্ট লিসেনার সেট আপ
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        // ডেলিভারি অপশন চেঞ্জ হলে কার্ট সামারি আপডেট করা
        document.querySelectorAll('input[name="deliveryLocation"]').forEach(radio => {
            radio.addEventListener('change', handleDeliveryLocationChange);
        });
        
        // ফর্ম সাবমিট ইভেন্ট সেট করা
        checkoutForm.addEventListener('submit', handleOrderSubmit);
    }

    // প্রথমবার পেজ লোড হলে কার্ট সামারি ডিসপ্লে করা
    displayCartItemsOnOrderForm();
});
