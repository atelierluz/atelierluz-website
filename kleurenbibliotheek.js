// kleurenbibliotheek.js
// Centrale bibliotheek met alle beschikbare kleuren

// Beschikbare categorieën
const KLEUREN_CATEGORIEEN = ['Zomerkleuren', 'Kroko leder', 'Overige kleuren'];

// Kleuren per categorie (alfabetisch gesorteerd)
const KLEUREN_BIBLIOTHEEK = {
    'Zomerkleuren': [
        { id: 'appelgroen', name: 'Appelgroen' },
        { id: 'babyroze', name: 'Babyroze' },
        { id: 'fuchsia', name: 'Fuchsia' },
        { id: 'geel', name: 'Geel' },
        { id: 'kobaltblauw', name: 'Kobaltblauw' },
        { id: 'lichtgrijs-zomer', name: 'Lichtgrijs' },
        { id: 'oranje', name: 'Oranje' },
        { id: 'rood', name: 'Rood' },
        { id: 'turquoise', name: 'Turquoise' }
    ],
    'Kroko leder': [
        { id: 'camel-kroko', name: 'Camel' },
        { id: 'jeans-blauw', name: 'Jeans blauw' },
        { id: 'zwart-kroko', name: 'Zwart' }
    ],
    'Overige kleuren': [
        { id: 'beige', name: 'Beige' },
        { id: 'donkergrijs', name: 'Donkergrijs' },
        { id: 'grijs-zwart', name: 'Grijs / zwart' },
        { id: 'kakigroen', name: 'Kaki groen' },
        { id: 'koffiebruin', name: 'Koffiebruin' },
        { id: 'lichtgrijs-overig', name: 'Lichtgrijs' },
        { id: 'middengrijs', name: 'Middengrijs' },
        { id: 'mintgroen', name: 'Mintgroen' },
        { id: 'paars', name: 'Paars / Aubergine' },
        { id: 'roestbruin', name: 'Roestbruin' },
        { id: 'taupe', name: 'Taupe' },
        { id: 'zwart-overig', name: 'Zwart' }
    ]
};

// Exporteer voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KLEUREN_BIBLIOTHEEK, KLEUREN_CATEGORIEEN };
}