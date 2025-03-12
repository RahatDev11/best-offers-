let products = []; // প্রোডাক্ট ডাটা সরাসরি script.js ফাইলে থাকবে
let isAdmin = false;

// প্রোডাক্ট ডাটা
const initialProducts = [
{
        id: "1741801010947",
        name: "Milk shake",
        price: "1350",
        category: "shirts",
        image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800877/1741800666769_dwffvp.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800880/1741800664520_cbqmfn.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741800883/1741800668869_auxbid.jpg",
        tags: "Milk shake, মিল্ক শেক",
        description: "পুরো শরীর চি*কন স্বা*স্থ্য স্থা*য়ী ভাবে মো*টা করুন । 
💯% কার্যকর। 💯% অরিজিনাল  
উপকারিতাঃ 
✅খাদ্য চাহিদা বাড়িয়ে দিবে। 
✅স্থায়ীভাবে মো*টা হবেন। 
✅ খাবারে রুচি বাড়াবে। 
✅ ৫/ ৮কেজি ও*জন বাড়বে প্রতি মাসে।
✅ শরীর দূরবলতা কমাবে। 
✅ কোনো রকম সাইড এ*ফেক্ট ছাড়া। 
✅হরমোন কে ব্যলেন্স করে কাজ করব।
✅আপনার শরীরের সাথে মুখের শেইপ ঠিক করবে।
✅ছেলে এবং মেয়ে উভয় সেবন করতে পারবে।
এটি ১০০% ন্যাচরাল প্রোডাক্ট,প্রাকৃতিক উপাদান দ্বারা তৈরি করা হয়েছে। এতে, কোনো রকম সাইড ইফেক্ট নেই।"
    },
  {
    id: "1741798560687",
    name: "Nothing তো সে ",
    price: "999",
    category: "panjabi",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326259/samples/man-portrait.jpg",
    tags: "Nothing",
    description: "Nothing "
  },
  {
    id: "1741778664261",
    name: "Boxer ",
    price: "999",
    category: "pants",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326259/samples/man-on-a-street.jpg",
    tags: "Boxer",
    description: "Boxer"
  },
  {
    id: "1741723368148",
    name: "মিল্ক সেক",
    price: "1350",
    category: "panjabi",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741665598/FB_IMG_1741595084807_r6dfd9.jpg",
    tags: "মিল্ক সেক, milk shek",
    description: "Milkshake Delivary done "
  },
  {
    id: "1741719021180",
    name: "নাহিদ",
    price: "9999",
    category: "pants",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741665598/FB_IMG_1741595084807_r6dfd9.jpg",
    tags: "নাহিদ",
    description: "নাহিদ"
  },
  {
    id: "1741449736422",
    name: "Fun ",
    price: "999",
    category: "shirts",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326249/samples/food/dessert.jpg",
    tags: "Fun, ",
    description: "Fun "
  },
  {
    id: "1741421645699",
    name: "T-shirt ",
    price: "5999",
    category: "shirts",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741412399/tshirt-8726716_1280_vyvosl.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741412399/tshirt-7979852_1280_fn9tw2.jpg,https://res.cloudinary.com/dnvm88wfi/image/upload/v1741412399/tshirt-7979854_1280_jj0vhg.jpg",
    tags: "T-shirt, ganji, shirt, টিশার্ট, ",
    description: "টি-শার্ট বা টি হচ্ছে এক প্রকার শার্ট, যা ঘাড়ের অংশ থেকে দেহের ওপরাংশে কবন্ধের বেশিরভাগ স্থানকে ঢেকে রাখে। ইংরেজি 'টি' (T) আকৃতির ন্যায় দেখতে, তাই এ পোশাকটির নাম টি-শার্ট হয়েছে। টি-শার্টে সাধারণত কোনো বোতাম বা কলার থাকে না। সচারচর এটি হয় গোলাকার ও খাটো হাতাযুক্ত। যদিও কিছু ক্ষেত্রে মানুষ ভুলবশত খাটো হাতাযুক্ত যে-কোনো শার্ট বা ব্লাউজকেই টি-শার্ট ভেবে ভুল করে। পোলো শার্ট বা অন্যান্য কলারযুক্ত শার্ট প্রকৃতপক্ষে টি-শার্ট নয়। কারণ এ ধরনের শার্টের হাতা কাঁধের পাশ দিয়ে সামান্য একটু বাড়তি থাকে, এবং খাটো হাতার ক্ষেত্রে তা কনুই পর্যন্ত হতে পারে।"
  },
  {
    id: "1741365548108",
    name: "Dog",
    price: "5899",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326251/samples/animals/three-dogs.jpg",
    tags: "Dogs",
    description: "This is dogs"
  },
  {
    id: "1741365548109",
    name: "New Product",
    price: "999",
    image: "https://res.cloudinary.com/dnvm88wfi/image/upload/v1741326248/sample.jpg",
    tags: "new,tag",
    description: "New product description"
  }
];

// প্রোডাক্ট ডাটা লোড করুন
function loadProductsFromData() {
  products = initialProducts; // সরাসরি initialProducts অ্যারে থেকে ডাটা লোড করুন
  localStorage.setItem('products', JSON.stringify(products)); // লোকাল স্টোরেজে সংরক্ষণ করুন
  loadProducts(); // প্রোডাক্ট লোড করুন
}

// মেনু টগল
function toggleMenu() {
  document.getElementById("dropdownMenu").classList.toggle("open");
}

// সাব মেনু টগল
function toggleSubMenu() {
  document.getElementById("subMenu").classList.toggle("hidden");
}

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

// নতুন প্রোডাক্ট ডাটা জেনারেট করুন
document.getElementById("productForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const imageUrls = Array.from(document.querySelectorAll('#imageInputs input'))
    .map(input => input.value.trim())
    .filter(url => url);

  const newProduct = {
    id: Date.now().toString(),
    name: document.getElementById("productName").value,
    price: document.getElementById("productPrice").value,
    category: document.getElementById("productCategory").value,
    image: imageUrls.join(','),
    tags: document.getElementById("productTags").value.split(',').map(tag => tag.trim()),
    description: document.getElementById("productDescription").value
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
        description: "${newProduct.description}"
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

// সার্চ ফাংশনালিটি
function searchProducts() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const searchResults = document.getElementById("searchResults");

  if (searchTerm.trim() === "") {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    loadProducts(); // সার্চ টার্ম খালি হলে সব প্রোডাক্ট দেখান
    return;
  }

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.tags.toLowerCase().includes(searchTerm)
  );
  displaySearchResults(filtered);
}

// সার্চ রেজাল্ট ডিসপ্লে
function displaySearchResults(filteredProducts) {
  const searchResults = document.getElementById("searchResults");
  searchResults.innerHTML = "";

  if (filteredProducts.length === 0) {
    searchResults.innerHTML = `<div class="p-2 text-gray-600">কোনো প্রোডাক্ট পাওয়া যায়নি</div>`;
  } else {
    filteredProducts.forEach(product => {
      const card = document.createElement("div");
      card.className = "search-card p-2 hover:bg-gray-100 cursor-pointer";
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

// সার্চ বারের বাইরে ক্লিক করলে সার্চ রেজাল্ট লুকানো
document.addEventListener("click", (event) => {
  const searchBar = document.getElementById("mainSearchBar");
  const searchResults = document.getElementById("searchResults");

  if (!searchBar.contains(event.target)) {
    searchResults.classList.add("hidden");
  }
});

// সার্চ বার ফোকাস
function focusSearch() {
  const searchBar = document.getElementById('mainSearchBar');
  searchBar.classList.remove('hidden');
  document.getElementById('searchInput').focus();
}

// ডেস্কটপ সার্চ ফাংশন
function searchProductsDesktop() {
  const searchTerm = document.getElementById("searchInputDesktop").value.toLowerCase();
  const searchResults = document.getElementById("searchResultsDesktop");

  if (searchTerm.trim() === "") {
    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");
    loadProducts(); // সার্চ টার্ম খালি হলে সব প্রোডাক্ট দেখান
    return;
  }

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.tags.toLowerCase().includes(searchTerm)
  );
  displaySearchResultsDesktop(filtered);
}

// ডেস্কটপ সার্চ রেজাল্ট ডিসপ্লে
function displaySearchResultsDesktop(filteredProducts) {
  const searchResults = document.getElementById("searchResultsDesktop");
  searchResults.innerHTML = "";

  if (filteredProducts.length === 0) {
    searchResults.innerHTML = `<div class="search-item">কোনো প্রোডাক্ট পাওয়া যায়নি</div>`;
  } else {
    filteredProducts.forEach(product => {
      const item = document.createElement("div");
      item.className = "search-item";
      item.onclick = () => showProductDetail(product.id);

      item.innerHTML = `
        <div class="flex items-center">
          <img src="${product.image.split(',')[0]}" class="w-8 h-8 object-cover rounded-lg mr-2">
          <div>
            <h3 class="text-sm font-bold">${product.name}</h3>
            <p class="text-lipstick text-xs">দাম: ${product.price} টাকা</p>
          </div>
        </div>
      `;
      searchResults.appendChild(item);
    });
  }

  searchResults.classList.remove("hidden");
}

// সার্চ বারের বাইরে ক্লিক করলে সার্চ রেজাল্ট লুকানো
document.addEventListener("click", (event) => {
  const searchBar = document.querySelector(".search-bar");
  const searchResults = document.getElementById("searchResultsDesktop");

  if (!searchBar.contains(event.target)) {
    searchResults.classList.add("hidden");
  }
});

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
  e.stopPropagation();
  const socialIcons = document.getElementById('socialIcons');
  socialIcons.classList.toggle('hidden');
  document.getElementById('shareButton').classList.toggle('hidden');
});

// স্ক্রিনে অন্য কোথাও ক্লিক করলে সোশ্যাল মিডিয়া বাটন লুকানো
document.addEventListener('click', () => {
  const socialIcons = document.getElementById('socialIcons');
  const shareButton = document.getElementById('shareButton');
  if (socialIcons && !socialIcons.classList.contains('hidden')) {
    socialIcons.classList.add('hidden');
    if (shareButton) {
      shareButton.classList.remove('hidden');
    }
  }
});

// সোশ্যাল মিডিয়া বাটনগুলোর উপর ক্লিক করলে ইভেন্ট বাবলিং বন্ধ করুন
document.getElementById('socialIcons').addEventListener('click', (e) => {
  e.stopPropagation();
});

// লগইন ফর্ম খোলার জন্য সার্চ বার ইভেন্ট
document.getElementById('searchInput').addEventListener('input', function (e) {
  if (e.target.value === '3012014') {
    openModal('loginModal');
    e.target.value = ''; // সার্চ বার খালি করুন
  }
});
