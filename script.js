let isAdmin = false;

// মোডাল ওপেন এবং ক্লোজ ফাংশন
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// লগইন মোডাল ওপেন এবং ক্লোজ ফাংশন
function openLoginModal() {
    document.getElementById('loginModal').style.display = "block";
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = "none";
}

// লগআউট ফাংশন
function logout() {
    isAdmin = false;
    document.getElementById('product-update').classList.add('hidden');
    document.getElementById('adminLink').classList.remove('hidden');
    document.getElementById('logoutButton').classList.add('hidden'); // লগআউট বাটন লুকানো
    removeEditDeleteButtons(); // এডিট এবং ডিলিট বাটন সরানো
    alert('লগআউট সফলভাবে সম্পন্ন হয়েছে!');
}

// উইন্ডোতে ক্লিক ইভেন্ট হ্যান্ডলিং
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal, .login-modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    const dropdownMenu = document.getElementById('dropdownMenu');
    if (event.target !== dropdownMenu && !dropdownMenu.contains(event.target) && event.target !== document.querySelector('button[onclick="toggleMenu()"]')) {
        dropdownMenu.style.display = 'none';
    }
}

// মোবাইল মেনু টগল ফাংশন
function toggleMenu() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
}

// মোবাইল মেনু হাইড ফাংশন
function hideMenu() {
    document.getElementById('dropdownMenu').style.display = 'none';
}

// পণ্য সেকশনে স্ক্রোল ফাংশন
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// লগইন ফর্ম সাবমিট ইভেন্ট
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const number = document.getElementById('loginNumber').value;
    const password = document.getElementById('loginPassword').value;

    if (number === '01825620497' && password === '3012024') {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('product-update').classList.remove('hidden');
        document.getElementById('product-update').scrollIntoView();
        isAdmin = true;
        document.getElementById('adminLink').classList.add('hidden');
        document.getElementById('logoutButton').classList.remove('hidden'); // লগআউট বাটন দেখানো
        addEditDeleteButtons(); // এডিট এবং ডিলিট বাটন যোগ করা
        alert('লগইন সফলভাবে সম্পন্ন হয়েছে!');
    } else {
        alert('ভুল লগইন তথ্য!');
    }
});

// পণ্য ফর্ম সাবমিট ইভেন্ট
document.getElementById('productForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productImages = document.getElementById('productImages').files;
    const productDescription = document.getElementById('productDescription').value;

    const productList = document.getElementById('productList');

    const productCard = document.createElement('div');
    productCard.className = 'bg-white p-4 rounded-lg shadow-lg cursor-pointer';
    productCard.onclick = function() { openProductPage(productName, productDescription, productPrice, productImages); };

    const productImage = document.createElement('img');
    productImage.className = 'w-full h-48 object-cover rounded mb-4';
    productImage.src = URL.createObjectURL(productImages[0]);
    productImage.alt = 'পণ্যের ছবি ' + (productList.children.length + 1);

    const productTitle = document.createElement('h3');
    productTitle.className = 'text-lg font-bold mb-2';
    productTitle.textContent = productName;

    const productPriceElement = document.createElement('p');
    productPriceElement.className = 'text-teal-500 font-bold mb-2';
    productPriceElement.textContent = `দাম: ${productPrice} টাকা`;

    const productDesc = document.createElement('p');
    productDesc.textContent = productDescription.length > 100 ? productDescription.substring(0, 100) + '...' : productDescription;

    // এডমিনের জন্য এডিট এবং ডিলিট বাটন যোগ করা
    if (isAdmin) {
        const editButton = document.createElement('button');
        editButton.className = 'bg-yellow-500 text-white px-2 py-1 rounded text-sm mt-2';
        editButton.textContent = 'এডিট';
        editButton.onclick = function(event) {
            event.stopPropagation(); // কার্ড ক্লিক ইভেন্ট বন্ধ করা
            document.getElementById('productName').value = productName;
            document.getElementById('productPrice').value = productPrice;
            document.getElementById('productDescription').value = productDescription;
            document.getElementById('product-update').scrollIntoView();
            productList.removeChild(productCard); // পুরানো পণ্য কার্ড ডিলিট করা
        };

        const deleteButton = document.createElement('button');
        deleteButton.className = 'bg-red-500 text-white px-2 py-1 rounded text-sm mt-2 ml-2';
        deleteButton.textContent = 'ডিলিট';
        deleteButton.onclick = function(event) {
            event.stopPropagation(); // কার্ড ক্লিক ইভেন্ট বন্ধ করা
            productList.removeChild(productCard);
        };

        productCard.appendChild(editButton);
        productCard.appendChild(deleteButton);
    }

    productCard.appendChild(productImage);
    productCard.appendChild(productTitle);
    productCard.appendChild(productPriceElement);
    productCard.appendChild(productDesc);

    productList.appendChild(productCard);

    alert('পণ্য সফলভাবে পোস্ট হয়েছে!');
});

// পণ্য পেজ ওপেন ফাংশন
function openProductPage(name, description, price, images) {
    const imageUrls = Array.from(images).map(image => URL.createObjectURL(image));
    const queryString = `?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&price=${encodeURIComponent(price)}&images=${encodeURIComponent(imageUrls.join(','))}`;
    window.open('product.html' + queryString, '_self');
}

// এডিট এবং ডিলিট বাটন যোগ করার ফাংশন
function addEditDeleteButtons() {
    const productCards = document.querySelectorAll('#productList > div');
    productCards.forEach(card => {
        if (!card.querySelector('.editButton')) {
            const editButton = document.createElement('button');
            editButton.className = 'bg-yellow-500 text-white px-2 py-1 rounded text-sm mt-2 editButton';
            editButton.textContent = 'এডিট';
            editButton.onclick = function(event) {
                event.stopPropagation();
                const productName = card.querySelector('h3').textContent;
                const productPrice = card.querySelector('p.text-teal-500').textContent.replace('দাম: ', '');
                const productDescription = card.querySelector('p:last-child').textContent;
                document.getElementById('productName').value = productName;
                document.getElementById('productPrice').value = productPrice;
                document.getElementById('productDescription').value = productDescription;
                document.getElementById('product-update').scrollIntoView();
                card.remove(); // পুরানো পণ্য কার্ড ডিলিট করা
            };

            const deleteButton = document.createElement('button');
            deleteButton.className = 'bg-red-500 text-white px-2 py-1 rounded text-sm mt-2 ml-2 deleteButton';
            deleteButton.textContent = 'ডিলিট';
            deleteButton.onclick = function(event) {
                event.stopPropagation();
                card.remove();
            };

            card.appendChild(editButton);
            card.appendChild(deleteButton);
        }
    });
}

// এডিট এবং ডিলিট বাটন সরানোর ফাংশন
function removeEditDeleteButtons() {
    const editButtons = document.querySelectorAll('.editButton');
    const deleteButtons = document.querySelectorAll('.deleteButton');
    editButtons.forEach(button => button.remove());
    deleteButtons.forEach(button => button.remove());
}
