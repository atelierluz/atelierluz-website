// kleurenbibliotheek.js
// Centrale bibliotheek met alle beschikbare kleuren

// LOKALE KLEUREN BIBLIOTHEEK (zonder tekst in de bolletjes)
const KLEUREN_BIBLIOTHEEK = [
    { id: 'cognac', name: 'Warm Cognac', imageUrl: 'https://placehold.co/100x100/C17B4A/white' },
    { id: 'diep-bruin', name: 'Diep Bruin', imageUrl: 'https://placehold.co/100x100/5C3D2E/white' },
    { id: 'zwart', name: 'Zwart (Ebony)', imageUrl: 'https://placehold.co/100x100/2C2420/white' },
    { id: 'camel', name: 'Natuur (Camel)', imageUrl: 'https://placehold.co/100x100/D8B08C/white' },
    { id: 'kastanje', name: 'Kastanjebruin', imageUrl: 'https://placehold.co/100x100/9E6F4D/white' },
    { id: 'zand', name: 'Zandkleur', imageUrl: 'https://placehold.co/100x100/D1BFAe/white' },
    { id: 'koper', name: 'Koper', imageUrl: 'https://placehold.co/100x100/B87333/white' },
    { id: 'noten', name: 'Notenhout', imageUrl: 'https://placehold.co/100x100/C5A07A/white' },
    { id: 'olijf', name: 'Olijfgroen', imageUrl: 'https://placehold.co/100x100/6B8E23/white' },
    { id: 'bordeaux', name: 'Bordeauxrood', imageUrl: 'https://placehold.co/100x100/722F37/white' },
    { id: 'grijs', name: 'Antraciet', imageUrl: 'https://placehold.co/100x100/4A4A4A/white' },
    { id: 'blauw', name: 'Diepblauw', imageUrl: 'https://placehold.co/100x100/1E3A5F/white' }
];

// Exporteer voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KLEUREN_BIBLIOTHEEK };
}