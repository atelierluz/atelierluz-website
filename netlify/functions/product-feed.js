

const admin = require('firebase-admin');

// Map elke category-waarde uit Firestore naar de juiste collectie-pagina op de site.
// Pas dit aan/vul aan als er nieuwe categorieën bijkomen.
const CATEGORY_TO_PAGE = {
  'zomer-juwelen': 'collectie-juwelen.html',
  'lederen-handtassen': 'collectie-lederen-handtassen.html',
  'lederen-juwelen': 'collectie-lederen-juwelen.html',
  'lederwerken': 'collectie-lederwerken.html',
};

const SITE_URL = 'https://atelierluz.be';
const BRAND_NAME = 'Atelier Luz';
const DEFAULT_GOOGLE_CATEGORY = 'Apparel & Accessories > Jewelry';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Netlify env vars bewaren newlines niet altijd correct, dus expliciet terugzetten:
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

function escapeXml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildProductLink(product) {
  const page = CATEGORY_TO_PAGE[product.category] || 'collectie.html';
  return `${SITE_URL}/${page}?product=${product.id}`;
}

function buildImageLink(product) {
  return product.imageUrl || (product.images && product.images[0]) || '';
}

function formatPrice(price) {
  const numeric = typeof price === 'number' ? price : parseFloat(price) || 0;
  return `${numeric.toFixed(2)} EUR`;
}

function productToXmlItem(product) {
  const link = buildProductLink(product);
  const imageLink = buildImageLink(product);
  const extraImages = (product.images || [])
    .filter((img) => img && img !== imageLink)
    .slice(0, 10) // Meta staat max 10 extra afbeeldingen toe
    .map((img) => `    <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
    .join('\n');

  return `  <item>
    <g:id>${escapeXml(product.id)}</g:id>
    <g:title>${escapeXml(product.name)}</g:title>
    <g:description>${escapeXml(product.description || product.name)}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(imageLink)}</g:image_link>
${extraImages}
    <g:availability>in stock</g:availability>
    <g:condition>new</g:condition>
    <g:price>${formatPrice(product.price)}</g:price>
    <g:brand>${escapeXml(BRAND_NAME)}</g:brand>
    <g:google_product_category>${escapeXml(DEFAULT_GOOGLE_CATEGORY)}</g:google_product_category>
  </item>`;
}

exports.handler = async function (event, context) {
  try {
    const snapshot = await db.collection('products').get();

    const items = [];
    snapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      // Producten zonder naam, prijs of afbeelding overslaan (onvolledige data)
      if (!product.name || !product.price || (!product.imageUrl && !(product.images && product.images.length))) {
        return;
      }
      items.push(productToXmlItem(product));
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${escapeXml(BRAND_NAME)} - Productfeed</title>
  <link>${SITE_URL}</link>
  <description>Productfeed voor Instagram/Facebook Shopping</description>
${items.join('\n')}
</channel>
</rss>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Feed mag wat gecached worden, Meta haalt 'm sowieso periodiek opnieuw op
        'Cache-Control': 'public, max-age=1800',
      },
      body: xml,
    };
  } catch (error) {
    console.error('Fout bij genereren productfeed:', error);
    return {
      statusCode: 500,
      body: 'Er is een fout opgetreden bij het genereren van de productfeed.',
    };
  }
};