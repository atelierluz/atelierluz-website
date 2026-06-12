// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const sig = event.headers['stripe-signature'];
    let stripeEvent;

    try {
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verificatie mislukt:', err.message);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;

        // Haal bestelgegevens op uit metadata
        const cartItems = JSON.parse(session.metadata?.cart_items || '[]');
        const verzendMethode = session.metadata?.verzendMethode || 'onbekend';
        const subtotaal = session.metadata?.subtotaal || '0.00';
        const totaal = session.metadata?.totaal || '0.00';

        // Klantgegevens
        const klantEmail = session.customer_details?.email || 'onbekend';
        const klantNaam = session.customer_details?.name || 'onbekend';
        const shippingAddress = session.shipping_details?.address;

        // Bouw adresregel op
        let adresHtml = '';
        if (verzendMethode === 'verzenden' && shippingAddress) {
            adresHtml = `
                <tr>
                    <td style="padding: 8px 0; color: #666;">Leveradres:</td>
                    <td style="padding: 8px 0;">
                        ${shippingAddress.line1 || ''}<br>
                        ${shippingAddress.line2 ? shippingAddress.line2 + '<br>' : ''}
                        ${shippingAddress.postal_code || ''} ${shippingAddress.city || ''}<br>
                        ${shippingAddress.country || ''}
                    </td>
                </tr>
            `;
        } else {
            adresHtml = `
                <tr>
                    <td style="padding: 8px 0; color: #666;">Levermethode:</td>
                    <td style="padding: 8px 0;">Afhalen in atelier (Stiemerbeekstraat 25, Genk)</td>
                </tr>
            `;
        }

        // Bouw productenlijst op
        const productenHtml = cartItems.map(item => `
            <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0e8e0;">
                    ${item.name}${item.color ? ` <span style="color: #b29a7a;">(${item.color})</span>` : ''}
                </td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0e8e0; text-align: center;">${item.quantity}x</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0e8e0; text-align: right;">€ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const verzendkosten = parseFloat(totaal) - parseFloat(subtotaal);
        const verzendkostenHtml = verzendkosten > 0
            ? `<tr><td style="padding: 4px 0; color: #666;">Verzending:</td><td></td><td style="padding: 4px 0; text-align: right;">€ ${verzendkosten.toFixed(2)}</td></tr>`
            : `<tr><td style="padding: 4px 0; color: #666;">Verzending:</td><td></td><td style="padding: 4px 0; text-align: right; color: #16a34a;">Gratis</td></tr>`;

        const emailHtml = `
            <!DOCTYPE html>
            <html lang="nl">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Georgia', serif; background: #fdf6ee; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <div style="background: #5c3d2e; padding: 32px; text-align: center;">
                        <h1 style="color: #f5ede3; font-family: 'Georgia', serif; margin: 0; font-size: 28px;">Atelier Luz</h1>
                        <p style="color: #d4c4ae; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">HANDGEMAAKTE TASSEN & SIERADEN</p>
                    </div>

                    <!-- Inhoud -->
                    <div style="padding: 32px;">
                        <h2 style="color: #5c3d2e; margin-top: 0;">🎉 Nieuwe bestelling ontvangen!</h2>
                        
                        <!-- Klantgegevens -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; width: 140px;">Klant:</td>
                                <td style="padding: 8px 0;"><strong>${klantNaam}</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;">E-mail:</td>
                                <td style="padding: 8px 0;"><a href="mailto:${klantEmail}" style="color: #b29a7a;">${klantEmail}</a></td>
                            </tr>
                            ${adresHtml}
                        </table>

                        <!-- Producten -->
                        <h3 style="color: #5c3d2e; border-bottom: 2px solid #f0e8e0; padding-bottom: 8px;">Bestelde producten</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                            <thead>
                                <tr style="background: #fdf6ee;">
                                    <th style="padding: 8px; text-align: left; color: #5c3d2e;">Product</th>
                                    <th style="padding: 8px; text-align: center; color: #5c3d2e;">Aantal</th>
                                    <th style="padding: 8px; text-align: right; color: #5c3d2e;">Prijs</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productenHtml}
                            </tbody>
                        </table>

                        <!-- Totaal -->
                        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                            <tr>
                                <td style="padding: 4px 0; color: #666;">Subtotaal:</td>
                                <td></td>
                                <td style="padding: 4px 0; text-align: right;">€ ${subtotaal}</td>
                            </tr>
                            ${verzendkostenHtml}
                            <tr style="font-size: 18px; font-weight: bold;">
                                <td style="padding: 12px 0; color: #5c3d2e; border-top: 2px solid #5c3d2e;">Totaal betaald:</td>
                                <td></td>
                                <td style="padding: 12px 0; text-align: right; color: #5c3d2e; border-top: 2px solid #5c3d2e;">€ ${totaal}</td>
                            </tr>
                        </table>

                        <p style="margin-top: 24px; color: #666; font-size: 0.9rem;">
                            Bekijk de volledige betalingsdetails in je 
                            <a href="https://dashboard.stripe.com/payments" style="color: #b29a7a;">Stripe dashboard</a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background: #f5ede3; padding: 20px 32px; text-align: center;">
                        <p style="color: #b29a7a; margin: 0; font-size: 0.85rem;">Atelier Luz · Stiemerbeekstraat 25, 3600 Genk</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            await resend.emails.send({
                from: 'Atelier Luz <bestellingen@atelierluz.be>',
                to: 'info.atelierluz@gmail.com',
                subject: `🛍️ Nieuwe bestelling van ${klantNaam} — € ${totaal}`,
                html: emailHtml,
            });
            console.log('Bestellingsmail verzonden');
        } catch (emailError) {
            console.error('Fout bij verzenden e-mail:', emailError);
        }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
};