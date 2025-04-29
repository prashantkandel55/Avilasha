/**
 * Service Initialization
 * Initializes all application services on startup
 */

import { initializeCryptoServices } from '@/config/crypto-api-config';

/**
 * Initialize all application services
 */
export function initializeAllServices() {
  // Initialize cryptocurrency services
  initializeCryptoServices();
  
  console.log('All services initialized successfully');
}

/**
 * Call this function early in the application lifecycle
 * For example, in main.tsx or App.tsx
 */
export function setupServices() {
  try {
    initializeAllServices();
    return true;
  } catch (error) {
    console.error('Failed to initialize services:', error);
    return false;
  }
}