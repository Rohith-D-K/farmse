import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface CartItem {
    productId: string;
    cropName: string;
    price: number;
    quantity: number;
    maxQuantity: number;
    image: string;
    location: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        // Load cart from localStorage on init
        const savedCart = localStorage.getItem('farmse_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('farmse_cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (product: any, quantity: number) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.productId === product.id);

            if (existingItem) {
                // Update quantity if item already in cart
                return prevItems.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: Math.min(item.quantity + quantity, product.quantity) }
                        : item
                );
            } else {
                // Add new item to cart
                return [...prevItems, {
                    productId: product.id,
                    cropName: product.cropName,
                    price: product.price,
                    quantity: quantity,
                    maxQuantity: product.quantity,
                    image: product.image,
                    location: product.location
                }];
            }
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setItems(prevItems =>
            prevItems.map(item =>
                item.productId === productId
                    ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
                    : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const getTotalItems = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getTotalItems,
            getTotalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
