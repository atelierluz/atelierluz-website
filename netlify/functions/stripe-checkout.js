// netlify/functions/stripe-checkout.js

const Stripe = require('stripe');

exports.handler = async (event, context) => {
    // Alleen POST requests toestaan
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
        const { cart } = JSON.parse(event.body);

        if (!cart || cart.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Winkelwagen is leeg' })
            };
        }

        // Bouw de line items voor Stripe
        const lineItems = cart.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: item.imageUrl ? [item.imageUrl] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity || 1,
        }));

        // Verzendkosten toevoegen (€6,95)
        lineItems.push({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Verzending (België/Nederland)',
                },
                unit_amount: 695,
            },
            quantity: 1,
        });

        // Maak Stripe Checkout sessie
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            success_url: `${event.headers.origin}/betalen-succes.html`,
            cancel_url: `${event.headers.origin}/winkelwagen.html`,
            line_items: lineItems,
            shipping_address_collection: {
                allowed_countries: ['NL', 'BE'],
            },
            payment_method_types: ['card', 'ideal', 'bancontact'],
            phone_number_collection: {
                enabled: true,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ sessionId: session.id })
        };

    } catch (error) {
        console.error('Stripe error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};