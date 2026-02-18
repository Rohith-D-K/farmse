// Reliable, high-quality images for common Indian produce
// Using Unsplash source with specific photo IDs to ensure consistency (no random images)

export const PRODUCT_IMAGES: Record<string, string> = {
    // Vegetables
    'Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
    'Potato': 'https://images.unsplash.com/photo-1518977676605-dc56fe611136?auto=format&fit=crop&w=500&q=80',
    'Onion': 'https://images.unsplash.com/photo-1508747703725-7197b963baa7?auto=format&fit=crop&w=500&q=80',
    'Carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80',
    'Spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80',
    'Cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=500&q=80',
    'Cabbage': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80', // Need better cabbage
    'Brinjal': 'https://images.unsplash.com/photo-1664993356133-728b261159cc?auto=format&fit=crop&w=500&q=80', // Eggplant
    'Eggplant': 'https://images.unsplash.com/photo-1664993356133-728b261159cc?auto=format&fit=crop&w=500&q=80',
    'Okra': 'https://images.unsplash.com/photo-1425543103986-226d3d8d1713?auto=format&fit=crop&w=500&q=80', // Ladyfinger
    'Ladyfinger': 'https://images.unsplash.com/photo-1425543103986-226d3d8d1713?auto=format&fit=crop&w=500&q=80',
    'Peas': 'https://images.unsplash.com/photo-1592323360825-f35559313a2a?auto=format&fit=crop&w=500&q=80',
    'Chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=500&q=80',
    'Green Chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=500&q=80',
    'Cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80',
    'Garlic': 'https://images.unsplash.com/photo-1615485499752-61d2d3a31c5d?auto=format&fit=crop&w=500&q=80',
    'Ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',

    // Fruits
    'Apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80',
    'Banana': 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=500&q=80',
    'Mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=500&q=80',
    'Orange': 'https://images.unsplash.com/photo-1547514354-d3a8e2e20302?auto=format&fit=crop&w=500&q=80',
    'Grapes': 'https://images.unsplash.com/photo-1537640538965-cf0c9e841fce?auto=format&fit=crop&w=500&q=80',
    'Papaya': 'https://images.unsplash.com/photo-1617112848923-cc5c3ac3333c?auto=format&fit=crop&w=500&q=80',
    'Watermelon': 'https://images.unsplash.com/photo-1563114257-4d3a06283b79?auto=format&fit=crop&w=500&q=80',
    'Pomegranate': 'https://images.unsplash.com/photo-1588329623631-09852825854b?auto=format&fit=crop&w=500&q=80',

    // Grains & Others
    'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
    'Basmati Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
    'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
    'Corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80',
    'Sugarcane': 'https://images.unsplash.com/photo-1547525389-76cb1d6bf304?auto=format&fit=crop&w=500&q=80',

    // Default
    'All': 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=500&q=80', // Mixed basket
    'default': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=500&q=60' // Generic farm
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
