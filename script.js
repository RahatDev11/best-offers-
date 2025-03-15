let products = []; // প্রোডাক্ট ডাটা সরাসরি script.js ফাইলে থাকবে
let isAdmin = false;

// প্রোডাক্ট ডাটা
const initialProducts = [
  {
        id: "1742051688734",
        name: "Prem dulhan 6 pcs",
        price: "190",
        category: "mehandi",
        image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1742034017/1742033818555_n0pibz.jpg",
        tags: "Prem, dulhan, ",
        description: "প্রেম দুলহান মেহেদি হল একটি জনপ্রিয় ভারতীয় মেহেদি ব্র্যান্ড, যা বিশেষ করে উৎসব এবং বিশেষ অনুষ্ঠানের জন্য ব্যবহার করা হয়। এটি সাধারণত প্রাকৃতিক হেনা দিয়ে তৈরি করা হয় এবং এতে কোনো ক্ষতিকারক রাসায়নিক থাকে না",
        stockStatus: "in_stock",
        quantity: "39"
    },
  {
        id: "1742034562001",
        name: "কাশ্মীরি মেহেদী",
        price: "35",
        category: "mehandi",
        image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1742034019/1742033775697_tovzsu.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1742034015/1742033780107_x2fjnv.jpg",
        tags: "মেহেন্দি, মেহেদী, mehedi, mehandi",
        description: " কাশ্মিরি ফাস্টকালার কোন এর গুনগত মান এবং দীর্ঘ সময় রঙ ধরে রাখার জন্য বিখ্যাত। এটি ত্বকের জন্য নিরাপদ। কাশ্মিরি ফাস্টকালার কোন মেহেদি পাতার নির্যাস থেকে তৈরি হয় এবং মেহেদির মতো রঙ হয়।",
        stockStatus: "in_stock",
        quantity: "39"
    },
  {
        id: "1741892639007",
        name: "Milk shake",
        price: "1350",
        category: "skincare",
        image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800877/1741800666769_dwffvp.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800880/1741800664520_cbqmfn.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800883/1741800668869_auxbid.jpg",
        tags: "Milk shake, মিল্ক শেক",
        description: "Milkshake Delivary done🥰🌿ও*জন বাড়ানোর জন্য আপনার পছন্দের সেরা পণ্যটি ডিসকাউন্ট মূল্যে লুফে নিন🥀🌿কোনোরকম এডভান্স করতে হবেনা!  পণ্য হাতে পেয়ে চেক করবেন এবং সবকিছু ঠিকঠাক থাকলে পেমেন্ট করবেন! 🪴১০০% অ*রিজিনাল এবং ১০০% জেনুইন প্রোডাক্ট দেওয়া হবে ইনশাআল্লাহ 💥👉 দাম মাত্র ১৩৫০ টাকা 👈এখনই অর্ডার করুন ",
        stockStatus: "in_stock",
        quantity: "39"
    }
];

// প্রোডাক্ট ডাটা লোড করুন
function loadProductsFromData() {
  products = initialProducts; // সরাসরি initialProducts অ্যারে থেকে ডাটা লোড করুন
  localStorage.setItem('products', JSON.stringify(products)); // লোকাল স্টোরেজে সংরক্ষণ করুন
  loadProducts(); // প্রোডাক্ট লোড করুন
}

// মোবাইল সাইডবার খোলার ফাংশন
function openSidebar() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    sidebarOverlay.classList.remove('hidden'); // ওভারলে দেখান
    sidebarOverlay.classList.add('active'); // ওভারলে দেখা যাবে
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('slide-in');
}

// মোবাইল সাইডবার বন্ধ করার ফাংশন
function closeSidebar() {
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.remove('active'); // ওভারলে লুকান
    sidebarOverlay.classList.add('hidden'); // ওভারলে লুকান
}

// মেনু আইটেম ক্লিক করার ফাংশন
function handleMenuItemClick() {
    closeSidebar(); // সাইডবার বন্ধ করুন
}

// সাবমেনু আইটেম ক্লিক করার ফাংশন
function handleSubMenuItemClick() {
    const subMenuMobile = document.getElementById('subMenuMobile');
    subMenuMobile.classList.remove('open'); // সাবমেনু বন্ধ করুন
    closeSidebar(); // সাইডবার বন্ধ করুন
}

// সাবমেনু টগল করার ফাংশন
function toggleSubMenuMobile(event) {
    event.stopPropagation();
    const subMenuMobile = document.getElementById('subMenuMobile');
    const arrowIcon = document.getElementById('arrowIcon');
    
    subMenuMobile.classList.toggle('open'); // সাবমেনু টগল করুন
    arrowIcon.classList.toggle('rotate-180'); // ডাউন এরো ঘোরানো
}
//সাব মেনুডাউন অ্যারো যোগ করা
function toggleSubMenuMobile(event) {
    event.stopPropagation();
    const subMenuMobile = document.getElementById('subMenuMobile');
    const arrowIcon = document.getElementById('arrowIcon');
    
    subMenuMobile.classList.toggle('open'); // সাবমেনু টগল করুন
    arrowIcon.classList.toggle('rotate-180'); // ডাউন এরো ঘোরানো
}

// ডেস্কটপ সাবমেনু টগল করার ফাংশন
function toggleSubMenuDesktop() {
  const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
  desktopSubMenuBar.classList.toggle('hidden');
  desktopSubMenuBar.classList.toggle('slide-down'); // এনিমেশন যোগ করুন
}

// ডেস্কটপ সাবমেনু আইটেমগুলিতে ক্লিক ইভেন্ট যোগ করুন
document.querySelectorAll('#desktopSubMenuBar a').forEach(link => {
  link.addEventListener('click', (e) => {
    const category = e.target.getAttribute('href').replace('#', '');
    filterProducts(category); // প্রোডাক্ট ফিল্টার ফাংশন কল করুন
  });
});

// প্রোডাক্ট ফিল্টার ফাংশন
function filterProducts(category) {
  const filteredProducts = category === 'all' ? products : products.filter(product => product.category === category);
  loadProducts(filteredProducts); // ফিল্টার করা প্রোডাক্ট লোড করুন
}

// ডকুমেন্টে ক্লিক ইভেন্ট লিসেনার
document.addEventListener("click", (event) => {
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const subMenuMobile = document.getElementById('subMenuMobile');
  const desktopSubMenuBar = document.getElementById('desktopSubMenuBar');
  const subMenuButton = document.querySelector('button[onclick="toggleSubMenuDesktop()"]');

  // মোবাইল সাইডবার বন্ধ করুন
  if (!event.target.closest('#sidebar') && !event.target.closest('button[onclick="openSidebar()"]')) {
    closeSidebar();
  }

  // মোবাইল সাবমেনু বন্ধ করুন
  if (!event.target.closest('#subMenuMobile') && !event.target.closest('button[onclick="toggleSubMenuMobile(event)"]')) {
    subMenuMobile.classList.add('hidden'); // hidden ক্লাস যোগ করুন
  }

  // ডেস্কটপ সাবমেনু বন্ধ করুন
  if (!event.target.closest('#desktopSubMenuBar') && !event.target.closest('button[onclick="toggleSubMenuDesktop()"]')) {
    desktopSubMenuBar.classList.add('hidden');
    desktopSubMenuBar.classList.remove('slide-down'); // এনিমেশন সরান
  }
});
// মোডাল ব্যবস্থাপনা
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// এডমিন লগইন
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const number = document.getElementById("loginNumber").value;
  const password = document.getElementById("loginPassword").value;

  if (number === '01825620497' && password === '3012014') {
    closeModal('loginModal');
    document.getElementById('product-update').classList.remove("hidden");
    isAdmin = true;
  } else {
    alert('ভুল লগইন তথ্য!');
  }
});

// প্রোডাক্ট ফিল্টার ফাংশন
function filterProducts(category) {
    const filteredProducts = category === 'all' ? products : products.filter(product => product.category === category);
    loadProducts(filteredProducts);
}

// মেনু এবং সাবমেনু ক্লিক ইভেন্ট যোগ করুন
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        const category = e.target.getAttribute('href').replace('#', '');
        filterProducts(category);
    });
});

document.querySelectorAll('#subMenu a, #subMenuMobile a').forEach(link => {
    link.addEventListener('click', (e) => {
        const category = e.target.getAttribute('href').replace('#', '');
        filterProducts(category);
    });
});

// প্রোডাক্ট লোড করুন
function loadProducts(filteredProducts = products) {
  const productList = document.getElementById("productList");
  productList.innerHTML = ""; // প্রথমে সব প্রোডাক্ট ডিলিট করুন

  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer";
    card.setAttribute("data-product-id", product.id); // প্রোডাক্ট আইডি যোগ করুন
    card.onclick = () => showProductDetail(product.id);

    const imageLinks = product.image.split(',').map((img, index) =>
      `ছবি-${index + 1}: ${img.trim()}`).join('\n');

    const whatsappMessage = encodeURIComponent(`
প্রোডাক্টের নাম: ${product.name}
দাম: ${product.price} টাকা
${imageLinks}
আমি এই প্রোডাক্টটি কিনতে চাই!
    `);

    card.innerHTML = `
      <img src="${product.image.split(',')[0]}" class="w-full h-48 object-cover mb-4 rounded-lg">
      <h3 class="text-lg font-bold mb-2">${product.name}</h3>
      <p class="text-lipstick font-bold mb-2">দাম: ${product.price} টাকা</p>
      <p class="text-gray-600 mb-4">${product.description.substring(0, 80)}...</p>
      <div class="flex justify-between items-center">
        <button onclick="event.stopPropagation(); showProductDetail('${product.id}')" class="text-blue-500 hover:underline">বিস্তারিত দেখুন</button>
        <a href="https://wa.me/8801931866636?text=${whatsappMessage}" 
           target="_blank" 
           class="bg-lipstick text-white px-3 py-1 rounded text-sm hover:bg-lipstick-dark">
          কিনুন
        </a>
      </div>
    `;
    productList.appendChild(card);
  });
}

// প্রোডাক্ট ডিটেইল পেজে রিডাইরেক্ট
function showProductDetail(productId) {
  window.location.href = `product-detail.html?id=${productId}`;
}
document.addEventListener("DOMContentLoaded", () => {
    // পরিমাণ ড্রপডাউন অপশন (১-১০০) যোগ করুন
    const quantitySelect = document.getElementById("productQuantity");
    for (let i = 1; i <= 100; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        quantitySelect.appendChild(option);
    }
});
// নতুন প্রোডাক্ট ডাটা জেনারেট করুন
document.getElementById("productForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // ছবির URL গুলো সংগ্রহ করুন
  const imageUrls = Array.from(document.querySelectorAll('#imageInputs input'))
    .map(input => input.value.trim())
    .filter(url => url);

  // নতুন প্রোডাক্ট অবজেক্ট তৈরি করুন
  const newProduct = {
    id: Date.now().toString(), // ইউনিক আইডি জেনারেট করুন
    name: document.getElementById("productName").value, // প্রোডাক্টের নাম
    price: document.getElementById("productPrice").value, // দাম
    category: document.getElementById("productCategory").value, // ক্যাটাগরি
    image: imageUrls.join(','), // ছবির URL গুলো কমা দিয়ে যুক্ত করুন
    tags: document.getElementById("productTags").value.split(',').map(tag => tag.trim()), // ট্যাগ গুলো কমা দিয়ে আলাদা করুন
    description: document.getElementById("productDescription").value, // বিবরণ
    stockStatus: document.getElementById("productStockStatus").value, // স্টক স্ট্যাটাস
    quantity: document.getElementById("productQuantity").value // পরিমাণ
  };

  // প্রোডাক্ট ডেটা অ্যারে যোগ করুন
  products.push(newProduct);

  // লোকাল স্টোরেজে ডাটা আপডেট করুন
  localStorage.setItem('products', JSON.stringify(products));

  // প্রোডাক্ট লোড করুন
  loadProducts();

  // কোড জেনারেট করুন
  document.getElementById("generatedCode").textContent =
    `{
        id: "${newProduct.id}",
        name: "${newProduct.name}",
        price: "${newProduct.price}",
        category: "${newProduct.category}",
        image: "${newProduct.image}",
        tags: "${newProduct.tags.join(', ')}",
        description: "${newProduct.description}",
        stockStatus: "${newProduct.stockStatus}",
        quantity: "${newProduct.quantity}"
    },`;
});
// ছবি ফিল্ড যোগ করুন
function addImageField() {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'w-full p-2 border rounded mb-2';
  input.placeholder = 'ছবির লিংক';
  document.getElementById("imageInputs").appendChild(input);
}

// মোবাইল সার্চ বার ফোকাস
function focusMobileSearch() {
  const mobileSearchBar = document.getElementById('mobileSearchBar');
  mobileSearchBar.classList.toggle('hidden');
  mobileSearchBar.classList.toggle('show'); // নতুন ক্লাস যোগ
  document.getElementById('searchInput').focus();
}


// সার্চ ফাংশনালিটি (মোবাইল)
function searchProducts() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const searchResults = document.getElementById("searchResults");

  if (searchTerm.trim() === "") {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    return;
  }

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.tags.toLowerCase().includes(searchTerm)
  );
  displaySearchResults(filtered, searchResults);
}

// সার্চ ফাংশনালিটি (ডেস্কটপ)
function searchProductsDesktop() {
  const searchTerm = document.getElementById("searchInputDesktop").value.toLowerCase();
  const searchResults = document.getElementById("searchResultsDesktop");

  if (searchTerm.trim() === "") {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    return;
  }

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.tags.toLowerCase().includes(searchTerm)
  );
  displaySearchResults(filtered, searchResults);
}

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
          <img src="${product.image.split(',')[0]}" class="w-12 h-12 object-cover rounded-lg mr-4">
          <div>
            <h3 class="text-lg font-bold">${product.name}</h3>
            <p class="text-lipstick font-bold">দাম: ${product.price} টাকা</p>
          </div>
        </div>
      `;
      searchResults.appendChild(card);
    });
  }

  searchResults.classList.remove("hidden");
}


// স্ক্রল ইভেন্ট লিসেনার
window.addEventListener('scroll', () => {
  closeAllMenusOnScroll();
});

// স্ক্রল করলে মেনু এবং সার্চ বার ক্লোজ করার ফাংশন
function closeAllMenusOnScroll() {
  const subMenu = document.getElementById('subMenu');
  const subMenuMobile = document.getElementById('subMenuMobile');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const mobileSearchBar = document.getElementById('mobileSearchBar');

  // ডেস্কটপ সাবমেনু ক্লোজ করুন
  if (subMenu && !subMenu.classList.contains('hidden')) {
    subMenu.classList.add('hidden');
  }

  // মোবাইল সাবমেনু ক্লোজ করুন
  if (subMenuMobile && !subMenuMobile.classList.contains('hidden')) {
    subMenuMobile.classList.add('hidden');
  }

  // মোবাইল মেনু ক্লোজ করুন
  if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
    dropdownMenu.classList.add('hidden');
  }

  // মোবাইল সার্চ বার ক্লোজ করুন
  if (mobileSearchBar && !mobileSearchBar.classList.contains('hidden')) {
    mobileSearchBar.classList.add('hidden');
  }
}
// কোড কপি করুন
function copyCode() {
  const code = document.getElementById("generatedCode").textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('কোড কপি করা হয়েছে!');
  });
}

// পণ্য দেখুন বাটনের জন্য স্ক্রোল ফাংশন
function scrollToProducts() {
  const productsSection = document.getElementById('products');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// পণ্য দেখুন বাটনে ক্লিক করলে প্রোডাক্ট রিলোড করুন
function reloadProducts() {
  const productList = document.getElementById("productList");
  productList.innerHTML = ""; // প্রথমে সব প্রোডাক্ট ডিলিট করুন
  loadProductsFromData(); // তারপর প্রোডাক্ট লোড করুন
}

// প্রথম লোড
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#dropdownMenu') && !event.target.closest('button[onclick="toggleMenu()"]')) {
      document.getElementById("dropdownMenu").classList.remove("open");
    }
  });

  // URL থেকে প্রোডাক্ট আইডি প্যারামিটার নিন
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  // যদি প্রোডাক্ট আইডি থাকে, তাহলে সেই প্রোডাক্টের কার্ডে স্ক্রল করুন
  if (productId) {
    scrollToProduct(productId);
  }
});

// প্রথম লোড
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromData(); // প্রোডাক্ট ডাটা লোড করুন
  loadProducts(); // প্রোডাক্টগুলো ডিসপ্লে করুন
});

// স্লাইডার বাটন ফাংশন
document.addEventListener('DOMContentLoaded', () => {
  const prevSlideBtn = document.getElementById('prevSlide');
  const nextSlideBtn = document.getElementById('nextSlide');

  if (prevSlideBtn && nextSlideBtn) {
    prevSlideBtn.addEventListener('click', () => {
      showPrevSlide();
    });

    nextSlideBtn.addEventListener('click', () => {
      showNextSlide();
    });
  }
});

// প্রোডাক্টের কার্ডে স্ক্রল করার ফাংশন
function scrollToProduct(productId) {
  const productCard = document.querySelector(`[data-product-id="${productId}"]`);
  if (productCard) {
    productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    productCard.classList.add('border-2', 'border-teal-500'); // কার্ডে হাইলাইট করুন
  }
}

// শেয়ার বাটন এবং সোশ্যাল মিডিয়া বাটন ব্যবস্থাপনা
document.getElementById('shareButton').addEventListener('click', (e) => {
  e.stopPropagation(); // ইভেন্ট বাবলিং বন্ধ করুন
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');

  socialIcons.classList.toggle('hidden'); // সোশ্যাল আইকন টগল করুন
  shareButton.classList.toggle('hidden'); // শেয়ার বাটন টগল করুন
});

// স্ক্রিনে অন্য কোথাও ক্লিক করলে সোশ্যাল মিডিয়া বাটন লুকানো এবং শেয়ার বাটন দেখানো
document.addEventListener('click', (e) => {
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');

    // যদি সোশ্যাল আইকন ওপেন থাকে এবং ক্লিক টার্গেট শেয়ার বাটন বা সোশ্যাল আইকন না হয়
  if (socialIcons && !socialIcons.classList.contains('hidden') && !e.target.closest('#shareButton') && !e.target.closest('#socialIcons')) {
    socialIcons.classList.add('hidden'); // সোশ্যাল আইকন লুকান
    shareButton.classList.remove('hidden'); // শেয়ার বাটন দেখান
  }
});

// সোশ্যাল মিডিয়া বাটনগুলোর উপর ক্লিক করলে ইভেন্ট বাবলিং বন্ধ করুন
document.getElementById('socialIcons').addEventListener('click', (e) => {
  e.stopPropagation();
});

// স্ক্রল করলে সোশ্যাল আইকন ক্লোজ এবং শেয়ার বাটন দেখানো
function closeSocialIconsOnScroll() {
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');

  // সোশ্যাল আইকন ক্লোজ করুন
  if (socialIcons && !socialIcons.classList.contains('hidden')) {
    socialIcons.classList.add('hidden');
    shareButton.classList.remove('hidden'); // শেয়ার বাটন দেখান
  }
}

// স্ক্রল ইভেন্ট লিসেনার
window.addEventListener('scroll', closeSocialIconsOnScroll);
// লগইন ফর্ম খোলার জন্য সার্চ বার ইভেন্ট (মোবাইল)
document.getElementById('searchInput').addEventListener('input', function(e) {
  if (e.target.value === '3012014') {
    openModal('loginModal');
    e.target.value = ''; // সার্চ বার খালি করুন
  }
});

// লগইন ফর্ম খোলার জন্য সার্চ বার ইভেন্ট (ডেস্কটপ)
document.getElementById('searchInputDesktop').addEventListener('input', function(e) {
  if (e.target.value === '3012014') {
    openModal('loginModal');
    e.target.value = ''; // সার্চ বার খালি করুন
  }
});
