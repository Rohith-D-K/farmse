import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const TOUR_STORAGE_KEY = 'farmse_tour_completed';

export const GuidedTour: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) return;

    const tourKey = `${TOUR_STORAGE_KEY}_${user.role}`;
    if (localStorage.getItem(tourKey)) return;

    // Wait for DOM elements to render
    const timer = setTimeout(() => {
      const tourDriver = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0,0,0,0.6)',
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'farmse-tour-popover',
        nextBtnText: t('common.save') === 'Save' ? 'Next →' : 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done ✓',
        onDestroyed: () => {
          localStorage.setItem(tourKey, 'true');
        },
        steps: user.role === 'buyer' ? getBuyerSteps() : getFarmerSteps(),
      });

      tourDriver.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [user, t]);

  return null;
};

function getBuyerSteps() {
  const steps: any[] = [];

  // Language switcher
  if (document.getElementById('tour-language-switcher')) {
    steps.push({
      element: '#tour-language-switcher',
      popover: {
        title: '🌐 Language',
        description: 'Switch between English, Hindi, Tamil, Telugu, and Kannada.',
        side: 'bottom' as const,
      },
    });
  }

  // Search bar
  if (document.getElementById('tour-search-bar')) {
    steps.push({
      element: '#tour-search-bar',
      popover: {
        title: '🔍 Search Products',
        description: 'Search for crops or locations to find what you need quickly.',
        side: 'bottom' as const,
      },
    });
  }

  // Marketplace banner
  if (document.getElementById('tour-marketplace-banner')) {
    steps.push({
      element: '#tour-marketplace-banner',
      popover: {
        title: '🌾 Fresh from Farm',
        description: 'Browse fresh fruits and vegetables directly from local farmers.',
        side: 'bottom' as const,
      },
    });
  }

  // Category filter
  if (document.getElementById('tour-category-filter')) {
    steps.push({
      element: '#tour-category-filter',
      popover: {
        title: '📂 Categories',
        description: 'Filter products by category to find exactly what you want.',
        side: 'bottom' as const,
      },
    });
  }

  // Product grid
  if (document.getElementById('tour-product-grid')) {
    steps.push({
      element: '#tour-product-grid',
      popover: {
        title: '🛒 Products',
        description: 'Tap any product to see details, add to cart, or chat with the farmer.',
        side: 'top' as const,
      },
    });
  }

  // Cart in bottom nav
  if (document.getElementById('tour-cart-btn')) {
    steps.push({
      element: '#tour-cart-btn',
      popover: {
        title: '🛍️ Cart & Checkout',
        description: 'View your cart and proceed to checkout when ready.',
        side: 'top' as const,
      },
    });
  }

  // Chat nav
  if (document.getElementById('tour-chat-btn')) {
    steps.push({
      element: '#tour-chat-btn',
      popover: {
        title: '💬 Chat with Farmers',
        description: 'Message farmers directly to ask about products before buying.',
        side: 'top' as const,
      },
    });
  }

  // AI Chatbot
  if (document.getElementById('tour-ai-chatbot')) {
    steps.push({
      element: '#tour-ai-chatbot',
      popover: {
        title: '🤖 AI Assistant',
        description: 'Get help with orders, product info, or any questions about FarmSe.',
        side: 'left' as const,
      },
    });
  }

  // If no specific elements found, show a generic welcome
  if (steps.length === 0) {
    steps.push({
      popover: {
        title: '👋 Welcome to FarmSe!',
        description: 'A farm-to-table marketplace connecting you with local farmers. Browse products, chat with farmers, and get fresh produce delivered!',
      },
    });
  }

  return steps;
}

function getFarmerSteps() {
  const steps: any[] = [];

  // Language switcher
  if (document.getElementById('tour-language-switcher')) {
    steps.push({
      element: '#tour-language-switcher',
      popover: {
        title: '🌐 Language',
        description: 'Switch between English, Hindi, Tamil, Telugu, and Kannada.',
        side: 'bottom' as const,
      },
    });
  }

  // Add product button
  if (document.getElementById('tour-add-product')) {
    steps.push({
      element: '#tour-add-product',
      popover: {
        title: '➕ Add Products',
        description: 'List your fresh produce here. AI will suggest fair prices for you!',
        side: 'bottom' as const,
      },
    });
  }

  // Stats cards
  if (document.getElementById('tour-farmer-stats')) {
    steps.push({
      element: '#tour-farmer-stats',
      popover: {
        title: '📊 Your Stats',
        description: 'Track your total products, active listings, and low stock alerts.',
        side: 'bottom' as const,
      },
    });
  }

  // Products list
  if (document.getElementById('tour-farmer-products')) {
    steps.push({
      element: '#tour-farmer-products',
      popover: {
        title: '📦 Your Products',
        description: 'Manage your listings — edit prices, update stock, or remove items.',
        side: 'top' as const,
      },
    });
  }

  // Orders nav
  if (document.getElementById('tour-orders-btn')) {
    steps.push({
      element: '#tour-orders-btn',
      popover: {
        title: '📋 Incoming Orders',
        description: 'Accept or reject orders from buyers in your area.',
        side: 'top' as const,
      },
    });
  }

  // Chat nav
  if (document.getElementById('tour-chat-btn')) {
    steps.push({
      element: '#tour-chat-btn',
      popover: {
        title: '💬 Chat with Buyers',
        description: 'Communicate directly with buyers about your products.',
        side: 'top' as const,
      },
    });
  }

  // AI Chatbot
  if (document.getElementById('tour-ai-chatbot')) {
    steps.push({
      element: '#tour-ai-chatbot',
      popover: {
        title: '🤖 AI Assistant',
        description: 'Get help managing your farm store and answering questions.',
        side: 'left' as const,
      },
    });
  }

  if (steps.length === 0) {
    steps.push({
      popover: {
        title: '👋 Welcome to FarmSe!',
        description: 'List your fresh produce, manage orders, and connect directly with local buyers. Your farm store is ready!',
      },
    });
  }

  return steps;
}
