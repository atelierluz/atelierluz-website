// winkelwagen.js

const STRIPE_PUBLIC_KEY = 'pk_test_51TWGa1RtQWOKpGNnpgZ3SLLskhPiL2ttupZIgJz5ZZmLJK1oFBFQ80gIJVwTyL8AKpRRvBjs5XZ7eaHd9J3DjDbZ003U9WxZG3';
let stripe = null;

// Winkelwagen data
let cart = [];
let verzendMethode = 'verzenden'; // 'verzenden' of 'afhalen'

// Verzendkosten instellingen
const VERZENDKOSTEN = 6.95;
const GRATIS_VERZENDING_VANAF = 100;

function loadCart() {
    const saved = localStorage.getItem('atelierLuzCart');
    if (saved) {
        cart = JSON.parse(saved);
    }

    const savedVerzendMethode = localStorage.getItem('atelierLuzVerzendMethode');
    if (savedVerzendMethode) {
        verzendMethode = savedVerzendMethode;
    }

    updateCartCount();
    renderCartPage();

    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
    }
}

function saveCart() {
    localStorage.setItem('atelierLuzCart', JSON.stringify(cart));
}

function saveVerzendMethode() {
    localStorage.setItem('atelierLuzVerzendMethode', verzendMethode);
}

function addToCart(product) {
    const existingIndex = cart.findIndex(item => item.id === product.id &&
        JSON.stringify(item.selectedColor) === JSON.stringify(product.selectedColor));

    if (existingIndex !== -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            selectedColor: product.selectedColor || null,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    const colorMsg = product.selectedColor ? ` (${product.selectedColor.name})` : '';
    showNotification(`${product.name}${colorMsg} toegevoegd!`);
    renderCartPage();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCartPage();
}

function updateQuantity(index, newQty) {
    if (cart[index]) {
        if (newQty <= 0) {
            removeFromCart(index);
        } else {
            cart[index].quantity = newQty;
            saveCart();
            renderCartPage();
        }
    }
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count').forEach(badge => {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    });
}

function showNotification(msg) {
    let notif = document.querySelector('.cart-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.className = 'cart-notification';
        document.body.appendChild(notif);
    }
    notif.textContent = msg;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2000);
}

function getSubtotaal() {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

function getVerzendkosten() {
    if (verzendMethode === 'afhalen') {
        return 0;
    }

    const subtotaal = getSubtotaal();
    if (subtotaal >= GRATIS_VERZENDING_VANAF) {
        return 0;
    }
    return VERZENDKOSTEN;
}

function getTotaal() {
    return getSubtotaal() + getVerzendkosten();
}

function setVerzendMethode(methode) {
    verzendMethode = methode;
    saveVerzendMethode();
    renderCartPage();
}

function renderCartPage() {
    const container = document.getElementById('cartContainer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <h3>Je winkelwagen is leeg</h3>
                <p>Ontdek onze collectie en vind jouw perfecte stuk</p>
                <a href="collectie.html" class="btn-primary">Naar collectie</a>
            </div>
        `;
        return;
    }

    let html = '<div class="cart-items">';

    cart.forEach((item, index) => {
        const colorInfo = item.selectedColor ? `<div style="font-size: 0.8rem; color: #b29a7a; margin-top: 4px;"><i class="fas fa-palette"></i> Kleur: ${escapeHtml(item.selectedColor.name)}</div>` : '';

        html += `
            <div class="cart-item">
                <img src="${item.imageUrl || 'https://placehold.co/100x100/f5ede3/8b6946?text=Geen+foto'}" alt="${escapeHtml(item.name)}">
                <div class="cart-item-details">
                    <h4>${escapeHtml(item.name)}</h4>
                    <div>€ ${item.price.toFixed(2)}</div>
                    ${colorInfo}
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity(${index}, ${(item.quantity || 1) - 1})">-</button>
                        <span>${item.quantity || 1}</span>
                        <button onclick="updateQuantity(${index}, ${(item.quantity || 1) + 1})">+</button>
                        <button onclick="removeFromCart(${index})">Verwijder</button>
                    </div>
                </div>
                <div class="cart-item-subtotal">€ ${((item.price * (item.quantity || 1))).toFixed(2)}</div>
            </div>
        `;
    });

    const subtotaal = getSubtotaal();
    const verzendkosten = getVerzendkosten();
    const totaal = getTotaal();
    const isGratisVerzending = verzendMethode === 'verzenden' && subtotaal >= GRATIS_VERZENDING_VANAF;

    html += '</div>';

    // Verzendopties sectie
    html += `
        <div class="shipping-options">
            <h4><i class="fas fa-truck"></i> Levermethode</h4>
            <div class="shipping-option ${verzendMethode === 'verzenden' ? 'selected' : ''}" onclick="setVerzendMethode('verzenden')">
                <input type="radio" name="shipping" id="shipping_verzenden" ${verzendMethode === 'verzenden' ? 'checked' : ''}>
                <label for="shipping_verzenden">Verzenden (PostNL / Bpost)</label>
                <span class="shipping-price">
                    ${isGratisVerzending ? '€ 0,00 (gratis)' : verzendkosten > 0 ? '€ ' + verzendkosten.toFixed(2) : '€ 0,00'}
                </span>
            </div>
            <div class="shipping-option ${verzendMethode === 'afhalen' ? 'selected' : ''}" onclick="setVerzendMethode('afhalen')">
                <input type="radio" name="shipping" id="shipping_afhalen" ${verzendMethode === 'afhalen' ? 'checked' : ''}>
                <label for="shipping_afhalen">Afhalen in atelier (Stiemerbeekstraat 25, Genk)</label>
                <span class="shipping-price">€ 0,00</span>
            </div>
    `;

    if (verzendMethode === 'verzenden' && subtotaal < GRATIS_VERZENDING_VANAF) {
        const verschil = GRATIS_VERZENDING_VANAF - subtotaal;
        html += `
            <div class="free-shipping-threshold">
                <i class="fas fa-gift"></i> Nog € ${verschil.toFixed(2)} besteden voor gratis verzending!
            </div>
        `;
    }

    if (isGratisVerzending) {
        html += `
            <div class="free-shipping-info">
                <i class="fas fa-check-circle"></i> Gefeliciteerd! Je hebt gratis verzending verdiend.
            </div>
        `;
    }

    html += '</div>';

    // Samenvatting
    html += '<div class="cart-summary">';
    html += `<div><span>Subtotaal:</span><span>€ ${subtotaal.toFixed(2)}</span></div>`;

    if (verzendMethode === 'verzenden' && verzendkosten > 0) {
        html += `<div><span>Verzending:</span><span>€ ${verzendkosten.toFixed(2)}</span></div>`;
    } else if (verzendMethode === 'verzenden' && isGratisVerzending) {
        html += `<div><span>Verzending:</span><span><span style="color: #16a34a;">Gratis</span> <span style="text-decoration: line-through; color: #b29a7a;">€ ${VERZENDKOSTEN.toFixed(2)}</span></span></div>`;
    } else if (verzendMethode === 'afhalen') {
        html += `<div><span>Afhalen:</span><span><span style="color: #16a34a;">Gratis</span></span></div>`;
    }

    html += `<div class="total"><span>Totaal:</span><span>€ ${totaal.toFixed(2)}</span></div>`;
    html += `<button id="checkoutBtn" class="checkout-btn"><i class="fas fa-credit-card"></i> Afrekenen met Stripe</button>`;
    html += '</div>';

    container.innerHTML = html;
    document.getElementById('checkoutBtn')?.addEventListener('click', startCheckout);
}

async function startCheckout() {
    if (cart.length === 0) {
        showNotification('Winkelwagen is leeg');
        return;
    }

    const btn = document.getElementById('checkoutBtn');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bezig...';
    btn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/stripe-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cart.map(item => ({
                    id: item.id,
                    name: item.name + (item.selectedColor ? ` (${item.selectedColor.name})` : ''),
                    price: item.price,
                    imageUrl: item.imageUrl,
                    quantity: item.quantity || 1,
                    selectedColor: item.selectedColor
                })),
                verzendMethode: verzendMethode,
                verzendkosten: getVerzendkosten(),
                subtotaal: getSubtotaal(),
                totaal: getTotaal()
            })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) throw new Error(result.error.message);

    } catch (error) {
        showNotification(error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exporteer functies voor gebruik in andere pagina's
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.setVerzendMethode = setVerzendMethode;

// Start bij laden
document.addEventListener('DOMContentLoaded', loadCart);