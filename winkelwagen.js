// winkelwagen.js

const STRIPE_PUBLIC_KEY = 'pk_test_51TUoFqGk0NdntuoyCLTItjKP2yfirYKgSx7OntsRAkI54519DF2eJTnISG9UJyLyC1Dod1zDRqFDXdTkB19CpoPa00Ab8GYX32';
let stripe = null;

// Winkelwagen data
let cart = [];

function loadCart() {
    const saved = localStorage.getItem('atelierLuzCart');
    if (saved) {
        cart = JSON.parse(saved);
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

// Deze functie wordt gebruikt door productpagina's
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showNotification(`${product.name} toegevoegd!`);
    renderCartPage();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCartPage();
}

function updateQuantity(productId, newQty) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQty <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQty;
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

function getTotal() {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
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
                    name: item.name,
                    price: item.price,
                    imageUrl: item.imageUrl,
                    quantity: item.quantity || 1
                }))
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
    
    cart.forEach(item => {
        html += `
            <div class="cart-item">
                <img src="${item.imageUrl || 'https://placehold.co/100x100/f5ede3/8b6946?text=Geen+foto'}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${escapeHtml(item.name)}</h4>
                    <div>€ ${item.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity('${item.id}', ${(item.quantity || 1) - 1})">-</button>
                        <span>${item.quantity || 1}</span>
                        <button onclick="updateQuantity('${item.id}', ${(item.quantity || 1) + 1})">+</button>
                        <button onclick="removeFromCart('${item.id}')">Verwijder</button>
                    </div>
                </div>
                <div class="cart-item-subtotal">€ ${((item.price * (item.quantity || 1))).toFixed(2)}</div>
            </div>
        `;
    });
    
    const subtotal = getTotal();
    const shipping = 6.95;
    const total = subtotal + shipping;
    
    html += '</div><div class="cart-summary">';
    html += `<div><span>Subtotaal:</span><span>€ ${subtotal.toFixed(2)}</span></div>`;
    html += `<div><span>Verzending (BE/NL):</span><span>€ ${shipping.toFixed(2)}</span></div>`;
    html += `<div class="total"><span>Totaal:</span><span>€ ${total.toFixed(2)}</span></div>`;
    html += `<button id="checkoutBtn" class="checkout-btn"><i class="fas fa-credit-card"></i> Afrekenen met Stripe</button>`;
    html += '</div>';
    
    container.innerHTML = html;
    document.getElementById('checkoutBtn')?.addEventListener('click', startCheckout);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exporteer functies voor gebruik in andere pagina's
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;

// Start bij laden
document.addEventListener('DOMContentLoaded', loadCart);