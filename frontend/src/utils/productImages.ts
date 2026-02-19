export const PRODUCT_IMAGES: Record<string, string> = {
    // Vegetables from mini folder
    'Tomato': '/produce/tomato.jpg',
    'Spinach': '/produce/spinach.jpg',
    'Carrot': '/produce/carrot.jpg',
    'Okra': '/produce/okra.jpg',
    'Ladyfinger': '/produce/okra.jpg',
    'Cucumber': '/produce/cucumber.jpg',
    'Potato': '/produce/potato.jpg',
    'Cauliflower': '/produce/cauliflower.jpg',
    'Cabbage': '/produce/cabbage.jpg',
    'Chilli': '/produce/chilli.jpg',
    'Green Chilli': '/produce/chilli.jpg',
    'Brinjal': '/produce/brinjal.jpg',
    'Eggplant': '/produce/brinjal.jpg',
    'Beans': '/produce/beans.jpg',
    'Beetroot': '/produce/beetroot.jpg',
    'Onion': '/produce/cabbage.jpg',

    // Fruits from mini folder
    'Apple': '/produce/apple.jpg',
    'Banana': '/produce/banana.jpg',
    'Orange': '/produce/orange.jpg',
    'Grapes': '/produce/grapes.jpg',
    'Green Grapes': '/produce/green-grapes.jpg',
    'Strawberry': '/produce/strawberry.jpg',
    'Watermelon': '/produce/watermelon.jpg',
    'Lemon': '/produce/lemon.avif',
    'Mosambi': '/produce/mosambi.jpg',

    // Default
    'All': '/produce/banner.avif',
    'default': '/produce/banner.avif'
};

export const getImageForCrop = (cropName: string): string => {
    // 1. Direct match
    if (PRODUCT_IMAGES[cropName]) return PRODUCT_IMAGES[cropName];

    // 2. Case insensitive match
    const lowerName = cropName.toLowerCase();
    const key = Object.keys(PRODUCT_IMAGES).find(k => k.toLowerCase() === lowerName);
    if (key) return PRODUCT_IMAGES[key];

    // 3. Partial match (e.g., "Fresh Tomato" -> matches "Tomato")
    const partialKey = Object.keys(PRODUCT_IMAGES).find(k => lowerName.includes(k.toLowerCase()));
    if (partialKey) return PRODUCT_IMAGES[partialKey];

    // 4. Default
    return PRODUCT_IMAGES['default'];
};
