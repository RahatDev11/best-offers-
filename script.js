// Firebase মডিউল ইম্পোর্ট করুন
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase কনফিগারেশন
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

// Firebase ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

let products = [];
let isAdmin = false;
let cart = [];

// ইউনিক userId জেনারেট করা বা লোড করা
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Firebase থেকে প্রোডাক্ট ডাটা লোড করুন
function loadProductsFromFirebase() {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        products = [];
        if (data) {
            Object.keys(data).forEach(key => {
                products.push({ id: key, ...data[key] });
            });
        }
        console.log("Firebase থেকে প্রোডাক্ট লোড হয়েছে:", products); // ডিবাগিংয়ের জন্য
        loadProducts(); // প্রোডাক্ট লোড করুন
    }, (error) => {
        console.error("Firebase থেকে প্রোডাক্ট লোডে সমস্যা: ", error);
        showToast("প্রোডাক্ট লোড করতে সমস্যা হয়েছে!");
    });
}

// Firebase থেকে কার্ট ডাটা লোড করুন
function loadCartFromFirebase() {
    const userId = getUserId();
    const cartRef = ref(database, `carts/${userId}`);
    onValue(cartRef, (snapshot) => {
        cart = snapshot.val() || [];
        updateCartUI();
    }, (error) => {
        console.error("Firebase থেকে কার্ট লোডে সমস্যা: ", error);
        showToast("কার্ট লোড করতে সমস্যা হয়েছে!");
    });
}

// Firebase-এ কার্ট ডাটা সেভ করুন
function saveCartToFirebase() {
    const userId = getUserId();
    const cartRef = ref(database, `carts/${userId}`);
    set(cartRef, cart)
        .then(() => {
            console.log("কার্ট Firebase-এ সেভ হয়েছে:", cart);
        })
        .catch((error) => {
            console.error("কার্ট সেভ করতে সমস্যা: ", error);
            showToast("কার্ট সেভ করতে সমস্যা হয়েছে!");
        });
}

// Gmail দিয়ে লগইন করার ফাংশন
window.loginWithGmail = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            const allowedEmail = "mdnahidislam6714@gmail.com"; // তোমার Gmail ঠিকানা এখানে দাও

            if (user.email === allowedEmail) {
                // লগইন সফল, এডমিন সেকশন ওপেন করো
                closeModal('loginModal');
                const productUpdateSection = document.getElementById('product-update');
                if (productUpdateSection) productUpdateSection.classList.remove("hidden");
                isAdmin = true;
                showToast("লগইন সফল!");
            } else {
                // অননুমোদিত Gmail, লগআউট করো
                signOut(auth);
                showToast("এই Gmail দিয়ে লগইন করার অনুমতি নেই!");
            }
        })
        .catch((error) => {
            console.error("Gmail লগইন ত্রুটি: ", error);
            showToast("লগইন করতে সমস্যা হয়েছে!");
        });
};

// প্রোডাক্ট ফিল্টার ফাংশন
window.filterProducts = (category) => {
    let filteredProducts;
    if (category === 'all') {
        filteredProducts = products;
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }
    loadProducts(filteredProducts);
};

// প্রোডাক্ট লোড করুন
function loadProducts(filteredProducts = products) {
    const productList = document.getElementById("productList");
    if (!productList) return;

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
}

// প্রোডাক্ট ডিটেইল পেজে রিডাইরেক্ট
function showProductDetail(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// নতুন প্রোডাক্ট ফর্ম সাবমিট
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById("productForm");
    if (productForm) {
        productForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (!isAdmin) {
                alert("শুধুমাত্র এডমিন প্রোডাক্ট আপলোড করতে পারবে!");
                return;
            }

            const imageUrls = Array.from(document.querySelectorAll('#imageInputs input'))
                .map(input => input.value.trim())
                .filter(url => url);

            const newProduct = {
                id: Date.now().toString(),
                name: document.getElementById("productName").value,
                price: parseInt(document.getElementById("productPrice").value),
                category: document.getElementById("productCategory").value,
                image: imageUrls.join(','),
                tags: document.getElementById("productTags").value,
                description: document.getElementById("productDescription").value,
                stockStatus: document.getElementById("productStockStatus").value,
                quantity: parseInt(document.getElementById("productQuantity").value)
            };

            // Firebase-এ প্রোডাক্ট আপলোড করুন
            const productRef = ref(database, `products/${newProduct.id}`);
            set(productRef, newProduct)
                .then(() => {
                    showToast("প্রোডাক্ট সফলভাবে আপলোড হয়েছে!");
                    productForm.reset();
                    document.getElementById("imageInputs").innerHTML = '<input type="text" class="w-full p-2 border rounded mb-2" placeholder="ছবির লিংক">';
                })
                .catch((error) => {
                    console.error("প্রোডাক্ট আপলোডে সমস্যা: ", error);
                    showToast("প্রোডাক্ট আপলোডে সমস্যা হয়েছে!");
                });
        });
    }

    // পরিমাণ ড্রপডাউন অপশন (১-১০০) যোগ করুন
    const quantitySelect = document.getElementById("productQuantity");
    if (quantitySelect) {
        for (let i = 1; i <= 100; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            quantitySelect.appendChild(option);
        }
    }
});

// ছবি ফিল্ড যোগ করুন
window.addImageField = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'w-full p-2 border rounded mb-2';
    input.placeholder = 'ছবির লিংক';
    const imageInputs = document.getElementById("imageInputs");
    if (imageInputs) {
        imageInputs.appendChild(input);
    }
};

// সার্চ ফাংশনালিটি (মোবাইল)
window.searchProducts = () => {
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");

    // ইনপুট এবং রেজাল্ট এলিমেন্ট চেক করা
    if (!searchInput) {
        console.error("সার্চ ইনপুট এলিমেন্ট পাওয়া যায়নি! আইডি: searchInput");
        return;
    }
    if (!searchResults) {
        console.error("সার্চ রেজাল্ট এলিমেন্ট পাওয়া যায়নি! আইডি: searchResults");
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    console.log("সার্চ টার্ম:", searchTerm); // ডিবাগিংয়ের জন্য
    console.log("বর্তমান প্রোডাক্ট লিস্ট:", products); // ডিবাগিংয়ের জন্য

    // সার্চ টার্ম খালি থাকলে রেজাল্ট লুকানো
    if (searchTerm === "") {
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }

    // লগইন মোডাল ওপেন করার জন্য স্পেশাল কোড
    if (searchTerm === "3012014") {
        openModal('loginModal');
        searchInput.value = '';
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }

    // প্রোডাক্ট ফিল্টার করা
    const filtered = products.filter(product => {
        const nameMatch = product.name && typeof product.name === "string" && product.name.toLowerCase().includes(searchTerm);
        const tagsMatch = product.tags && typeof product.tags === "string" && product.tags.toLowerCase().includes(searchTerm);
        return nameMatch || tagsMatch;
    });

    console.log("ফিল্টার করা প্রোডাক্ট:", filtered); // ডিবাগিংয়ের জন্য
    displaySearchResults(filtered, searchResults);
};

// সার্চ ফাংশনালিটি (ডেস্কটপ)
window.searchProductsDesktop = () => {
    const searchInput = document.getElementById("searchInputDesktop");
    const searchResults = document.getElementById("searchResultsDesktop");

    // ইনপুট এবং রেজাল্ট এলিমেন্ট চেক করা
    if (!searchInput) {
        console.error("সার্চ ইনপুট এলিমেন্ট পাওয়া যায়নি! আইডি: searchInputDesktop");
        return;
    }
    if (!searchResults) {
        console.error("সার্চ রেজাল্ট এলিমেন্ট পাওয়া যায়নি! আইডি: searchResultsDesktop");
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    console.log("ডেস্কটপ সার্চ টার্ম:", searchTerm); // ডিবাগিংয়ের জন্য
    console.log("বর্তমান প্রোডাক্ট লিস্ট:", products); // ডিবাগিংয়ের জন্য

    // সার্চ টার্ম খালি থাকলে রেজাল্ট লুকানো
    if (searchTerm === "") {
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }

    // লগইন মোডাল ওপেন করার জন্য স্পেশাল কোড
    if (searchTerm === "3012014") {
        openModal('loginModal');
        searchInput.value = '';
        searchResults.innerHTML = "";
        searchResults.classList.add("hidden");
        return;
    }

    // প্রোডাক্ট ফিল্টার করা
    const filtered = products.filter(product => {
        const nameMatch = product.name && typeof product.name === "string" && product.name.toLowerCase().includes(searchTerm);
        const tagsMatch = product.tags && typeof product.tags === "string" && product.tags.toLowerCase().includes(searchTerm);
        return nameMatch || tagsMatch;
    });

    console.log("ডেস্কটপ ফিল্টার করা প্রোডাক্ট:", filtered); // ডিবাগিংয়ের জন্য
    displaySearchResults(filtered, searchResults);
};

// সার্চ রেজাল্ট ডিসপ্লে
function displaySearchResults(filteredProducts, searchResults) {
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
    console.log("সার্চ রেজাল্ট দেখানো হয়েছে:", filteredProducts.length, "টি প্রোডাক্ট পাওয়া গেছে"); // ডিবাগিংয়ের জন্য
}

// প্রোডাক্ট কার্টে যোগ করার ফাংশন
window.addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        const existingProduct = cart.find(p => p.id === productId);
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCartToFirebase();
        showToast('আপনার প্রোডাক্টটি কার্টে যোগ করা হয়েছে!');
        openCartSidebar();
    } else {
        showToast("প্রোডাক্ট পাওয়া যায়নি!");
    }
};

// কার্ট সাইডবার ওপেন করার ফাংশন
window.openCartSidebar = () => {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
    }
};

// কার্ট সাইডবার ক্লোজ করার ফাংশন
window.closeCartSidebar = () => {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
    }
};

// কার্ট UI ও মোট মূল্য আপডেট
function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;

    cartItems.innerHTML = '';

    cart.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-2';
        item.innerHTML = `
            <div class="flex items-center space-x-4">
                <img src="${product.image ? product.image.split(',')[0] : 'https://via.placeholder.com/50'}" class="w-16 h-16 object-cover rounded-lg" alt="${product.name}" onerror="this.src='https://via.placeholder.com/50'; this.alt='ছবি লোড হয়নি';">
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${product.name || 'নাম পাওয়া যায়নি'}</h3>
                    <p class="text-lipstick font-bold">দাম: ${product.price || '0'} টাকা</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="event.stopPropagation(); decreaseQuantity(${index})" class="bg-lipstick text-white px-2 py-1 rounded">-</button>
                <span class="text-gray-800">${product.quantity || 1}</span>
                <button onclick="event.stopPropagation(); increaseQuantity(${index})" class="bg-lipstick text-white px-2 py-1 rounded">+</button>
            </div>
        `;
        cartItems.appendChild(item);
    });

    const totalPrice = cart.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0);
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) {
        totalPriceElement.textContent = `মোট মূল্য: ${totalPrice} টাকা`;
    }
}

// কার্ট ফাংশনালিটি
window.decreaseQuantity = (index) => {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }
    saveCartToFirebase();
};

window.increaseQuantity = (index) => {
    cart[index].quantity++;
    saveCartToFirebase();
};

// চেকআউট ফাংশন (হোয়াটসঅ্যাপ মেসেজ ফরম্যাট আপডেট করা হয়েছে)
window.checkout = () => {
    if (cart.length === 0) {
        showToast("কার্ট খালি আছে!");
        return;
    }

    const message = cart.map(product => {
        const imageLinks = (product.image || '').split(',').map((img, index) =>
            `ছবি-${index + 1}: ${img.trim()}`).join('\n');
        return `
প্রোডাক্টের নাম: ${product.name || 'নাম পাওয়া যায়নি'}
দাম: ${product.price || '0'} টাকা
পরিমাণ: ${product.quantity || 1}
${imageLinks}
        `;
    }).join('\n\n');

    const totalPrice = cart.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0);
    const finalMessage = encodeURIComponent(`${message}\n\nমোট মূল্য: ${totalPrice} টাকা\nআমি এই প্রোডাক্টগুলো কিনতে চাই!`);
    window.open(`https://wa.me/8801931866636?text=${finalMessage}`, '_blank');
};

// টোস্ট নোটিফিকেশন
window.showToast = (message) => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
};

// মোডাল ব্যবস্থাপনা
window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("hidden");
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("hidden");
};

// শেয়ার বাটন এবং সোশ্যাল মিডিয়া বাটন ব্যবস্থাপনা
document.addEventListener('DOMContentLoaded', () => {
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const socialIcons = document.getElementById('socialIcons');
            const shareButton = document.getElementById('shareButton');
            if (socialIcons && shareButton) {
                socialIcons.classList.toggle('hidden');
                shareButton.classList.toggle('hidden');
            }
        });
    }

    document.addEventListener('click', (e) => {
        const socialIcons = document.getElementById('socialIcons');
        const shareButton = document.getElementById('shareButton');

        if (socialIcons && !socialIcons.classList.contains('hidden') && !e.target.closest('#shareButton') && !e.target.closest('#socialIcons')) {
            socialIcons.classList.add('hidden');
            if (shareButton) shareButton.classList.remove('hidden');
        }
    });

    const socialIcons = document.getElementById('socialIcons');
    if (socialIcons) {
        socialIcons.addEventListener('click', (e) => {
            e.stopPropagation();
            const socialIcons = document.getElementById('socialIcons');
            const shareButton = document.getElementById('shareButton');
            if (socialIcons && shareButton) {
                socialIcons.classList.toggle('hidden');
                shareButton.classList.toggle('hidden');
            }
        });
    }

    document.addEventListener('click', (e) => {
        const socialIcons = document.getElementById('socialIcons');
        const shareButton = document.getElementById('shareButton');

        if (socialIcons && !socialIcons.classList.contains('hidden') && !e.target.closest('#shareButton') && !e.target.closest('#socialIcons')) {
            socialIcons.classList.add('hidden');
            if (shareButton) shareButton.classList.remove('hidden');
        }
    });

    const socialIcons = document.getElementById('socialIcons');
    if (socialIcons) {
        socialIcons.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});
// স্ক্রল করলে সোশ্যাল আইকন ক্লোজ এবং শেয়ার বাটন দেখানো
function closeSocialIconsOnScroll() {
    const socialIcons = document.getElementById('socialIcons');
    const shareButton = document.getElementById('shareButton');

    if (socialIcons && !socialIcons.classList.contains('hidden')) {
        socialIcons.classList.add('hidden');
        if (shareButton) shareButton.classList.remove('hidden');
    }
}

window.addEventListener('scroll', closeSocialIconsOnScroll);
// পণ্য দেখুন বাটনের জন্য স্ক্রোল ফাংশন
window.scrollToProducts = () => {
    filterProducts('all');
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
};
// প্রথম লোড
document.addEventListener("DOMContentLoaded", () => {
    // URL থেকে প্রোডাক্ট আইডি প্যারামিটার নিন
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    // যদি প্রোডাক্ট আইডি থাকে, তাহলে সেই প্রোডাক্টের কার্ডে স্ক্রল করুন
    if (productId) {
        scrollToProduct(productId);
    }

    // Firebase থেকে ডেটা লোড করুন
    loadProductsFromFirebase();
    loadCartFromFirebase();
});

// প্রোডাক্টের কার্ডে স্ক্রল করার ফাংশন
function scrollToProduct(productId) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        productCard.classList.add('border-2', 'border-teal-500');
    }
}
// মোবাইল সাইডবার বন্ধ করার ফাংশন
window.closeSidebar = () => {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (sidebarOverlay && sidebar) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.remove('active');
        sidebarOverlay.classList.add('hidden');
        const subMenuMobile = document.getElementById('subMenuMobile');
        const arrowIcon = document.getElementById('arrowIcon');
        if (subMenuMobile && arrowIcon) {
            subMenuMobile.classList.remove('open');
            arrowIcon.classList.remove('rotate-180');
        }
    }
};

// মেনু আইটেম ক্লিক করার ফাংশন
window.handleMenuItemClick = () => {
    closeSidebar();
};
// সাবমেনু আইটেম ক্লিক করার ফাংশন
window.handleSubMenuItemClick = () => {
    const subMenuMobile = document.getElementById('subMenuMobile');
    if (subMenuMobile) {
        subMenuMobile.classList.remove('open');
    }
    closeSidebar();
};

// সাবমেনু টগল করার ফাংশন
window.toggleSubMenuMobile = (event) => {
    event.stopPropagation();
    const subMenuMobile = document.getElementById('subMenuMobile');
    const arrowIcon = document.getElementById('arrowIcon');
    if (subMenuMobile && arrowIcon) {
        subMenuMobile.classList.toggle('open');
        arrowIcon.classList.toggle('rotate-180');
    }
};

// ডেস্কটপ সাবমেনু টগল করার ফাংশন
window.toggleSubMenuDesktop = () => {
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
    if (desktopSubMenuBar) {
        desktopSubMenuBar.classList.toggle('hidden');
        desktopSubMenuBar.classList.toggle('slide-down');
    }
};
// ডকুমেন্টে ক্লিক ইভেন্ট লিসেনার
document.addEventListener("click", (event) => {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const subMenuMobile = document.getElementById('subMenuMobile');
    const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');

    if (sidebarOverlay && !event.target.closest('#sidebar') && !event.target.closest('button[onclick="openSidebar()"]')) {
        closeSidebar();
    }

    if (subMenuMobile && !event.target.closest('#subMenuMobile') && !event.target.closest('button[onclick="toggleSubMenuMobile(event)"]')) {
        subMenuMobile.classList.remove('open');
        const arrowIcon = document.getElementById('arrowIcon');
        if (arrowIcon) {
            arrowIcon.classList.remove('rotate-180');
        }
    }

    if (desktopSubMenuBar && !event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) {
        desktopSubMenuBar.classList.add('hidden');
        desktopSubMenuBar.classList.remove('slide-down');
    }
});