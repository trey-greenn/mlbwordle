// Google Analytics measurement ID
export const GA_MEASUREMENT_ID = 'G-YJ66TY6FR2';

// Check if we're in a browser environment
const isClientSide = typeof window !== 'undefined';

// Initialize the data layer
export const initializeGtag = () => {
  if (isClientSide) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    
    // Initialize gtag with default config
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }
};

// Helper to send page views
export const pageview = (url: string) => {
  if (isClientSide && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Helper to track events
export const event = ({ action, category, label, value }: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  if (isClientSide && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Add TypeScript interfaces for window
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
} 