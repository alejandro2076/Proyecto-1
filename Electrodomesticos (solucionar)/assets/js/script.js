document.addEventListener('DOMContentLoaded', function () {
    console.log("Script loaded and DOMContentLoaded fired.");

    // ----------------------------------------------------------------
    // ---                  VARIABLES GLOBALES Y SELECTORES         ---\
    // ----------------------------------------------------------------

    let cart = [];
    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    // products ya NO se cargará desde JavaScript, se leerá del HTML
    let currentProductData = null; // Usado para el modal de detalles
    let tempCartForInvoice = [];
    let tempTotalForInvoice = 0;
    let currentStep = 0;

    // --- Selectores del DOM ---\
    const loginIcon = document.getElementById('login-icon');
    const userStatus = document.getElementById('user-status');
    const authModal = document.getElementById('auth-modal');
    const authModalTitle = authModal.querySelector('h2');
    const closeAuth = document.querySelector('.close-auth');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModal = document.querySelector('.close-cart-modal');
    const cartIcon = document.querySelector('.cart-icon');
    const productPanel = document.getElementById('product-panel'); // Si no se usa, se puede eliminar
    const productModal = document.getElementById('product-modal');
    const modalProductDetails = document.getElementById('modal-product-details');
    const closeProductModal = document.querySelector('.close-product-modal');
    const productList = document.getElementById('product-list'); // Contenedor de las tarjetas de producto
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    const continueShoppingButton = document.getElementById('continue-shopping');
    const downloadInvoiceButton = document.getElementById('download-invoice-button');
    const paymentStatusMessage = document.getElementById('payment-status-message');
    const paymentConfirmationModal = document.getElementById('payment-confirmation-modal');
    const confirmPaymentButton = document.getElementById('confirm-payment-button');
    const cancelPaymentButton = document.getElementById('cancel-payment-button');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Selectores del formulario de autenticación
    const authForm = document.getElementById('auth-form');
    const authEmailInput = document.getElementById('auth-email');
    const authUsernameInput = document.getElementById('auth-username');
    const authPasswordInput = document.getElementById('auth-password');
    const authConfirmPasswordInput = document.getElementById('auth-confirm-password');
    const authButton = document.getElementById('auth-button');
    const toggleAuthModeLink = document.getElementById('toggle-auth-mode');
    const registerFields = document.querySelectorAll('.register-field');


    // ----------------------------------------------------------------
    // ---                 FUNCIONES DE AUTENTICACIÓN               ---\
    // ----------------------------------------------------------------

    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    function saveCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
    }

    function updateLoginStatus() {
        if (currentUser) {
            userStatus.textContent = `Hola, ${currentUser.username}`;
            loginIcon.removeEventListener('click', showAuthModal);
            loginIcon.addEventListener('click', showUserPanel); // Asume que hay un panel de usuario
        } else {
            userStatus.textContent = 'Iniciar Sesión';
            loginIcon.removeEventListener('click', showUserPanel);
            loginIcon.addEventListener('click', showAuthModal);
        }
    }

    function showAuthModal() {
        authModal.classList.add('show');
        // Asegura que el formulario esté en modo "Iniciar Sesión" por defecto al abrir
        authModalTitle.textContent = 'Iniciar Sesión';
        authButton.textContent = 'Iniciar Sesión';
        registerFields.forEach(field => field.classList.remove('active'));
        authForm.reset();
    }

    function hideAuthModal() {
        authModal.classList.remove('show');
    }

    function showUserPanel() {
        // Implementar la lógica para mostrar un panel de usuario o un menú de cierre de sesión
        if (confirm(`¿Deseas cerrar sesión, ${currentUser.username}?`)) {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateLoginStatus();
            alert('Sesión cerrada correctamente.');
        }
    }

    toggleAuthModeLink.addEventListener('click', function (e) {
        e.preventDefault();
        const isRegisterMode = authButton.textContent === 'Registrarse';

        if (isRegisterMode) {
            authModalTitle.textContent = 'Iniciar Sesión';
            authButton.textContent = 'Iniciar Sesión';
            registerFields.forEach(field => field.classList.remove('active'));
        } else {
            authModalTitle.textContent = 'Registrarse';
            authButton.textContent = 'Registrarse';
            registerFields.forEach(field => field.classList.add('active'));
        }
        authForm.reset(); // Limpia el formulario al cambiar de modo
    });


    authForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const isRegisterMode = authButton.textContent === 'Registrarse';

        if (isRegisterMode) {
            const username = authUsernameInput.value;
            const confirmPassword = authConfirmPasswordInput.value;

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }
            if (users.some(user => user.email === email)) {
                alert('Este correo electrónico ya está registrado.');
                return;
            }
            const newUser = {
                username,
                email,
                password
            };
            users.push(newUser);
            saveUsers();
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            // Cambiar a modo de inicio de sesión automáticamente después del registro
            authModalTitle.textContent = 'Iniciar Sesión';
            authButton.textContent = 'Iniciar Sesión';
            registerFields.forEach(field => field.classList.remove('active'));
            authForm.reset();
        } else {
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                saveCurrentUser(user);
                updateLoginStatus();
                hideAuthModal();
                alert(`¡Bienvenido de nuevo, ${user.username}!`);
            } else {
                alert('Credenciales incorrectas.');
            }
        }
    });

    closeAuth.addEventListener('click', hideAuthModal);
    window.addEventListener('click', function (event) {
        if (event.target === authModal) {
            hideAuthModal();
        }
        if (event.target === productModal) {
            hideProductModal();
        }
        if (event.target === cartModal) {
            hideCartModal();
        }
        if (event.target === paymentConfirmationModal) {
            hidePaymentConfirmationModal();
        }
    });


    // ----------------------------------------------------------------
    // ---                 FUNCIONES DE PRODUCTOS                   ---\
    // ----------------------------------------------------------------

    // Ya no es necesario loadInitialProducts() porque los productos están en el HTML.
    // La lista de productos se leerá del DOM.

    function showProductModal(product) {
        if (!product) {
            console.error("No product data to show in modal.");
            return;
        }

        modalProductDetails.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
                <h2>${product.name}</h2>
                <p>${product.description}</p>
                <div class="price">$${product.price.toFixed(2)}</div>
                <div class="product-quantity">
                    <label for="modal-quantity">Cantidad:</label>
                    <input type="number" id="modal-quantity" value="1" min="1" class="item-quantity-input">
                </div>
                <button class="add-to-cart-button" data-product-id="${product.id}">Añadir al Carrito</button>
            </div>
        `;
        // Ajustar el evento del botón "Añadir al Carrito" dentro del modal
        modalProductDetails.querySelector('.add-to-cart-button').addEventListener('click', function () {
            const quantity = parseInt(modalProductDetails.querySelector('#modal-quantity').value);
            addToCart(product, quantity);
            hideProductModal();
        });

        productModal.classList.add('show');
    }

    function hideProductModal() {
        productModal.classList.remove('show');
    }

    closeProductModal.addEventListener('click', hideProductModal);


    // ----------------------------------------------------------------
    // ---                 FUNCIONES DEL CARRITO                    ---\
    // ----------------------------------------------------------------

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }

    function loadCart() {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        renderCartItems();
        updateCartCount();
    }

    function addToCart(product, quantity) {
        if (!currentUser) {
            alert('Debes iniciar sesión para añadir productos al carrito.');
            showAuthModal();
            return;
        }

        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product,
                quantity
            });
        }
        saveCart();
        renderCartItems();
        alert(`${quantity} x ${product.name} añadido al carrito.`);
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        renderCartItems();
    }

    function updateCartItemQuantity(productId, newQuantity) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                removeFromCart(productId);
            } else {
                item.quantity = newQuantity;
                saveCart();
                renderCartItems();
            }
        }
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-gray-500">Tu carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>$${item.price.toFixed(2)} c/u</p>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <input type="number" value="${item.quantity}" min="1" class="item-quantity-input" data-product-id="${item.id}">
                        <button class="remove-from-cart" data-product-id="${item.id}">Eliminar</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
                total += item.price * item.quantity;
            });
        }
        cartTotalSpan.textContent = `$${total.toFixed(2)}`;
    }

    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    function showCartModal() {
        renderCartItems(); // Asegura que el carrito esté actualizado al abrir
        cartModal.classList.add('show');
    }

    function hideCartModal() {
        cartModal.classList.remove('show');
    }

    // Event Listeners del Carrito
    cartIcon.addEventListener('click', showCartModal);
    closeCartModal.addEventListener('click', hideCartModal);

    cartItemsContainer.addEventListener('click', function (event) {
        if (event.target.classList.contains('remove-from-cart')) {
            const productId = parseInt(event.target.dataset.productId);
            removeFromCart(productId);
        }
    });

    cartItemsContainer.addEventListener('change', function (event) {
        if (event.target.classList.contains('item-quantity-input')) {
            const productId = parseInt(event.target.dataset.productId);
            const newQuantity = parseInt(event.target.value);
            updateCartItemQuantity(productId, newQuantity);
        }
    });

    continueShoppingButton.addEventListener('click', hideCartModal);

    checkoutButton.addEventListener('click', function () {
        if (cart.length === 0) {
            alert('Tu carrito está vacío. No puedes proceder al pago.');
            return;
        }
        if (!currentUser) {
            alert('Debes iniciar sesión para proceder al pago.');
            showAuthModal();
            return;
        }
        // Guarda el carrito actual y el total para la factura
        tempCartForInvoice = [...cart];
        tempTotalForInvoice = parseFloat(cartTotalSpan.textContent.replace('$', ''));
        showPaymentConfirmationModal();
    });


    // ----------------------------------------------------------------
    // ---                 FUNCIONES DE PAGO Y FACTURA              ---\
    // ----------------------------------------------------------------

    function showPaymentConfirmationModal() {
        hideCartModal(); // Cierra el carrito
        paymentConfirmationModal.classList.add('show');
    }

    function hidePaymentConfirmationModal() {
        paymentConfirmationModal.classList.remove('show');
    }

    confirmPaymentButton.addEventListener('click', function () {
        // Simular un procesamiento de pago
        paymentStatusMessage.style.display = 'block';
        paymentStatusMessage.classList.remove('success', 'error');
        paymentStatusMessage.textContent = 'Procesando pago...';

        setTimeout(() => {
            const paymentSuccessful = Math.random() > 0.1; // 90% de éxito

            if (paymentSuccessful) {
                paymentStatusMessage.textContent = '¡Pago exitoso! Gracias por tu compra.';
                paymentStatusMessage.classList.add('success');
                cart = []; // Vaciar el carrito
                saveCart();
                renderCartItems(); // Actualizar el carrito vacío en la UI
                // Opcional: mostrar la factura aquí o después de un breve delay
            } else {
                paymentStatusMessage.textContent = 'Error en el pago. Por favor, inténtalo de nuevo.';
                paymentStatusMessage.classList.add('error');
            }
            hidePaymentConfirmationModal(); // Cierra el modal de confirmación
            showCartModal(); // Vuelve a mostrar el carrito para ver el mensaje de estado

        }, 1500); // Simular 1.5 segundos de procesamiento
    });

    cancelPaymentButton.addEventListener('click', function () {
        hidePaymentConfirmationModal();
        showCartModal(); // Vuelve a mostrar el carrito si se cancela
    });

    downloadInvoiceButton.addEventListener('click', function () {
        if (tempCartForInvoice.length === 0) {
            alert('No hay productos en el carrito para generar una factura.');
            return;
        }

        const {
            jsPDF
        } = window.jspdf;
        const doc = new jsPDF();

        // Título
        doc.setFontSize(22);
        doc.text("Factura de Compra - ElectroHogar", 105, 20, null, null, "center");

        // Datos del cliente
        doc.setFontSize(12);
        doc.text(`Cliente: ${currentUser ? currentUser.username : 'Invitado'}`, 14, 40);
        doc.text(`Correo: ${currentUser ? currentUser.email : 'N/A'}`, 14, 47);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 54);

        // Tabla de productos
        const tableColumn = ["Producto", "Cantidad", "Precio Unitario", "Subtotal"];
        const tableRows = [];

        tempCartForInvoice.forEach(item => {
            const productData = [
                item.name,
                item.quantity,
                `$${item.price.toFixed(2)}`,
                `$${(item.price * item.quantity).toFixed(2)}`
            ];
            tableRows.push(productData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            headStyles: {
                fillColor: '#192b55',
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: '#f9f9f9'
            },
            didDrawPage: function (data) {
                // Footer en cada página
                doc.setFontSize(10);
                doc.text("Gracias por su compra!", data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // Total
        doc.setFontSize(16);
        doc.text(`Total a Pagar: $${tempTotalForInvoice.toFixed(2)}`, doc.internal.pageSize.width - data.settings.margin.right, doc.autoTable.previous.finalY + 10, null, null, "right");


        doc.save(`factura_electrohogar_${currentUser ? currentUser.username.replace(/\s/g, '_') : 'invitado'}_${new Date().toISOString().slice(0,10)}.pdf`);
    });

    // ----------------------------------------------------------------
    // ---                 EVENTOS PRINCIPALES                      ---\
    // ----------------------------------------------------------------

    // Escucha clics en el contenedor de productos para delegación de eventos
    productList.addEventListener('click', function (event) {
        // Clic en la tarjeta de producto (para abrir el modal de detalles)
        let productCard = event.target.closest('.product-card');
        if (productCard) {
            const productId = parseInt(productCard.dataset.productId);
            // Reconstruir el objeto producto a partir del HTML de la tarjeta
            const productName = productCard.querySelector('h3').textContent;
            // Definir las descripciones directamente en el JavaScript para pasarlas al modal
            const productDescriptions = {
                1: "Refrigerador inteligente con pantalla táctil, control de alimentos y conectividad Wi-Fi.",
                2: "Lavadora de carga superior con tecnología Smart Inverter para mayor eficiencia.",
                3: "Televisor inteligente con resolución 4K, HDR y Android TV integrado.",
                4: "Microondas de 1.2 pies cúbicos con tecnología Inverter y sensor de cocción.",
                5: "Aspiradora sin cable de alta potencia con cabezal limpiador de gran tamaño.",
                6: "Cafetera de cápsulas con tecnología Centrifusion para café y espresso.",
                7: "Aire acondicionado tipo split con tecnología Dual Inverter para ahorro energético.",
                8: "Horno tostador de convección con capacidad para pizza de 12 pulgadas.",
                9: "Sonido envolvente, conexión Bluetooth y Wi-Fi, control por voz.",
                10: "Secadora eléctrica de 7.0 pies cúbicos con sensor de humedad."
            };
            const productDescription = productDescriptions[productId] || "Descripción no disponible."; // Obtener la descripción por ID
            const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
            const productImage = productCard.querySelector('img').src;

            const product = {
                id: productId,
                name: productName,
                description: productDescription,
                price: productPrice,
                image: productImage
            };
            showProductModal(product);
        }

        // Clic en el botón "Agregar al Carrito" dentro de la tarjeta
        if (event.target.classList.contains('add-to-cart-button')) {
            const productId = parseInt(event.target.dataset.productId);
            if (productCard) {
                const productName = productCard.querySelector('h3').textContent;
                // Usar la descripción almacenada para añadir al carrito también, si es necesario
                const productDescriptions = { // Duplicar para el botón, o pasar el 'product' completo
                    1: "Refrigerador inteligente con pantalla táctil, control de alimentos y conectividad Wi-Fi.",
                    2: "Lavadora de carga superior con tecnología Smart Inverter para mayor eficiencia.",
                    3: "Televisor inteligente con resolución 4K, HDR y Android TV integrado.",
                    4: "Microondas de 1.2 pies cúbicos con tecnología Inverter y sensor de cocción.",
                    5: "Aspiradora sin cable de alta potencia con cabezal limpiador de gran tamaño.",
                    6: "Cafetera de cápsulas con tecnología Centrifusion para café y espresso.",
                    7: "Aire acondicionado tipo split con tecnología Dual Inverter para ahorro energético.",
                    8: "Horno tostador de convección con capacidad para pizza de 12 pulgadas.",
                    9: "Sonido envolvente, conexión Bluetooth y Wi-Fi, control por voz.",
                    10: "Secadora eléctrica de 7.0 pies cúbicos con sensor de humedad."
                };
                const productDescription = productDescriptions[productId] || "Descripción no disponible.";

                const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
                const productImage = productCard.querySelector('img').src;

                const productToAdd = {
                    id: productId,
                    name: productName,
                    description: productDescription,
                    price: productPrice,
                    image: productImage
                };
                addToCart(productToAdd, 1); // Añade 1 por defecto desde el botón de la tarjeta
            }
        }
    });


    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const productName = card.querySelector('h3').textContent.toLowerCase();
            // Ya no hay <p> con descripción en la tarjeta, solo se busca en el nombre
            // Si la búsqueda también debe incluir descripciones, estas tendrían que estar en un atributo de datos
            // o en un objeto de datos de productos en JS
            if (productName.includes(searchTerm)) {
                card.style.display = 'flex'; // Muestra la tarjeta si coincide
            } else {
                card.style.display = 'none'; // Oculta la tarjeta si no coincide
            }
        });
    }

    searchButton.addEventListener('click', filterProducts);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterProducts();
        } else if (searchInput.value === '') {
            // Si el campo de búsqueda está vacío, muestra todas las tarjetas
            document.querySelectorAll('.product-card').forEach(card => card.style.display = 'flex');
        }
    });

    // ----------------------------------------------------------------
    // ---                 INICIALIZACIÓN AL CARGAR LA PÁGINA       ---\
    // ----------------------------------------------------------------

    // Ya no es necesario llamar a loadInitialProducts() aquí.
    loadCart();
    if (localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    }
    updateLoginStatus();
    // Asegura que el título del modal sea "Iniciar Sesión" por defecto al cargar la página
    if (authModalTitle) {
        authModalTitle.textContent = 'Iniciar Sesión';
    }
    console.log("Initialization complete. Products are loaded directly from HTML.");
});