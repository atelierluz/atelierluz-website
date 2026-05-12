// netlify/functions/stripe-checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { cart, verzendMethode, verzendkosten, subtotaal, totaal } = JSON.parse(event.body);

        if (!cart || cart.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Cart is empty' })
            };
        }

        // Bouw de line items voor Stripe
        const lineItems = [];

        // Producten toevoegen
        cart.forEach(item => {
            let productName = item.name;
            if (item.selectedColor && item.selectedColor.name) {
                productName = `${item.name} - ${item.selectedColor.name}`;
            }

            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: productName,
                        images: item.imageUrl ? [item.imageUrl] : [],
                        metadata: {
                            product_id: item.id,
                            selected_color: item.selectedColor ? item.selectedColor.name : '',
                            color_image: item.selectedColor ? item.selectedColor.imageUrl : ''
                        }
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            });
        });

        // Verzendkosten toevoegen (alleen als er verzendkosten zijn en verzenden is gekozen)
        if (verzendMethode === 'verzenden' && verzendkosten > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Verzending (BE/NL)',
                    },
                    unit_amount: Math.round(verzendkosten * 100),
                },
                quantity: 1,
            });
        }

        // Metadata voor de bestelling
        const metadata = {
            cart_items: JSON.stringify(cart.map(item => ({
                id: item.id,
                name: item.name,
                color: item.selectedColor ? item.selectedColor.name : '',
                quantity: item.quantity,
                price: item.price
            }))),
            verzendMethode: verzendMethode,
            subtotaal: subtotaal.toFixed(2),
            totaal: totaal.toFixed(2)
        };

        // Maak de Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'bancontact', 'ideal'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.URL || 'https://atelierluz.netlify.app'}/betalen-succes.html`,
            cancel_url: `${process.env.URL || 'https://atelierluz.netlify.app'}/winkelwagen.html`,
            metadata: metadata,
            shipping_address_collection: verzendMethode === 'verzenden' ? {
                allowed_countries: ['BE', 'NL']
            } : undefined,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ sessionId: session.id })
        };

    } catch (error) {
        console.error('Stripe checkout error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};