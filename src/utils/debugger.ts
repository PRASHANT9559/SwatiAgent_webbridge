/**
 * Debugger utility for Chrome DevTools Protocol communication
 */

export class Debugger {
  private tabId: number | null = null;
  private attached: boolean = false;

  /**
   * Attach to a specific tab
   */
  async attachToTab(tabId: number): Promise<void> {
    if (this.tabId === tabId && this.attached) {
      return;
    }

    try {
      await chrome.debugger.attach({ tabId }, '1.3');
    } catch (error) {
      // Already attached — this is expected when background.ts attached first
    }
    this.tabId = tabId;
    this.attached = true;
  }

  /**
   * Detach from current tab
   */
  async detach(): Promise<void> {
    if (this.tabId && this.attached) {
      try {
        await chrome.debugger.detach({ tabId: this.tabId });
      } catch (error) {
        // Ignore detach errors
      }
      this.attached = false;
      this.tabId = null;
    }
  }

  /**
   * Send a CDP command
   */
  async sendCommand(method: string, params?: any): Promise<any> {
    if (!this.tabId) {
      throw new Error('Debugger not attached to any tab');
    }

    try {
      const result = await chrome.debugger.sendCommand(
        { tabId: this.tabId },
        method,
        params
      );
      return result;
    } catch (error: any) {
      throw new Error(`CDP Command failed: ${method} - ${error.message}`);
    }
  }

  /**
   * Get current tab ID
   */
  getCurrentTabId(): number | null {
    return this.tabId;
  }

  /**
   * Check if debugger is attached
   */
  isAttached(): boolean {
    return this.attached;
  }
}

// Singleton instance
export const debuggerInstance = new Debugger();
