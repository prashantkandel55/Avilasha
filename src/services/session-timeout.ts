/**
 * Session timeout service for handling wallet auto-lock functionality
 */

import { toast } from '@/hooks/use-toast';

export interface SessionTimeoutConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  onTimeout: () => void;
  onWarning?: () => void;
}

class SessionTimeoutService {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private config: SessionTimeoutConfig | null = null;
  private isActive: boolean = false;

  /**
   * Initialize the session timeout service
   * @param config Session timeout configuration
   */
  initialize(config: SessionTimeoutConfig): void {
    this.config = config;
    this.lastActivity = Date.now();
    this.isActive = true;
    this.resetTimers();
    this.registerActivityListeners();
  }

  /**
   * Reset the session timeout timers
   */
  private resetTimers(): void {
    if (!this.config || !this.isActive) return;

    // Clear existing timers
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);

    // Set warning timer
    const warningMs = (this.config.timeoutMinutes - this.config.warningMinutes) * 60 * 1000;
    this.warningId = setTimeout(() => {
      if (this.config?.onWarning) {
        this.config.onWarning();
      } else {
        toast({
          title: 'Session Timeout Warning',
          description: `Your wallet will be locked in ${this.config?.warningMinutes} minutes due to inactivity.`,
          variant: 'warning'
        });
      }
    }, warningMs);

    // Set timeout timer
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    this.timeoutId = setTimeout(() => {
      if (this.config?.onTimeout) {
        this.config.onTimeout();
      }
    }, timeoutMs);
  }

  /**
   * Register event listeners for user activity
   */
  private registerActivityListeners(): void {
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
      'click', 'keydown', 'keyup', 'touchmove', 'touchend'
    ];

    const handleUserActivity = this.handleUserActivity.bind(this);

    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });
  }

  /**
   * Handle user activity events
   */
  private handleUserActivity(): void {
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  /**
   * Update the session timeout configuration
   * @param config New session timeout configuration
   */
  updateConfig(config: Partial<SessionTimeoutConfig>): void {
    if (!this.config) return;
    
    this.config = { ...this.config, ...config };
    this.resetTimers();
  }

  /**
   * Get the current session timeout configuration
   */
  getConfig(): SessionTimeoutConfig | null {
    return this.config;
  }

  /**
   * Get the time remaining until session timeout in milliseconds
   */
  getTimeRemaining(): number {
    if (!this.config || !this.isActive) return 0;
    
    const elapsedTime = Date.now() - this.lastActivity;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - elapsedTime);
  }

  /**
   * Pause the session timeout
   */
  pause(): void {
    this.isActive = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
  }

  /**
   * Resume the session timeout
   */
  resume(): void {
    this.isActive = true;
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  /**
   * Stop and cleanup the session timeout service
   */
  cleanup(): void {
    this.isActive = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
    
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
      'click', 'keydown', 'keyup', 'touchmove', 'touchend'
    ];

    const handleUserActivity = this.handleUserActivity.bind(this);

    activityEvents.forEach(eventName => {
      window.removeEventListener(eventName, handleUserActivity);
    });
  }
}

export const sessionTimeoutService = new SessionTimeoutService();