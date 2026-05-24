/**
 * Phase 4: Popup, Modal & Alert Handling
 * 
 * Handle browser alerts, dialogs, and modals.
 */

import { Debugger } from '../utils/debugger.js';

export class PopupCommands {
  private debuggerInstance: Debugger;
  private dialogHandler: any = null;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Handle alert dialog (accept or dismiss)
   */
  async handleAlert(options: { accept?: boolean; promptText?: string }) {
    const { accept = true, promptText } = options;

    const result = await this.debuggerInstance.sendCommand('Page.handleJavaScriptDialog', {
      accept,
      promptText,
    });

    return {
      success: true,
      handled: true,
      accepted: accept,
      ...(promptText && { promptText }),
    };
  }

  /**
   * Wait for and handle confirm dialog
   */
  async handleConfirm(options: { accept: boolean }) {
    return this.handleAlert({ accept: options.accept });
  }

  /**
   * Handle prompt dialog with text input
   */
  async handlePrompt(text: string) {
    return this.handleAlert({ accept: true, promptText: text });
  }

  /**
   * Detect and close modal/overlay
   */
  async closeModal(options?: { selector?: string }) {
    const selector = options?.selector;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const closeSelectors = [
            ${selector ? JSON.stringify(selector) : ''},
            '.modal-close',
            '.close-modal',
            '[aria-label="Close"]',
            '[data-close]',
            '.modal .close',
            '.modal-footer button:last-child',
            'button[aria-label*="close" i]'
          ].filter(Boolean);
          
          for (const sel of closeSelectors) {
            const btn = document.querySelector(sel);
            if (btn) {
              btn.click();
              return { success: true, selector: sel, method: 'button_click' };
            }
          }
          
          // Try ESC key
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true
          }));
          
          return { success: true, method: 'escape_key' };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Detect blocking overlays
   */
  async detectOverlay() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const overlaySelectors = [
            '.modal',
            '.modal-dialog',
            '.modal-backdrop',
            '[role="dialog"]',
            '.popup',
            '.overlay',
            '.lightbox',
            '[class*="modal"]',
            '[class*="overlay"]'
          ];
          
          const overlays = [];
          
          overlaySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;
              const style = window.getComputedStyle(el);
              const isDisplayed = style.display !== 'none';
              
              if (isVisible && isDisplayed) {
                overlays.push({
                  selector: el.id ? '#' + el.id : el.className?.split(' ').map(c => '.' + c).join(''),
                  tagName: el.tagName,
                  width: rect.width,
                  height: rect.height,
                  role: el.getAttribute('role'),
                  ariaLabel: el.getAttribute('aria-label')
                });
              }
            });
          });
          
          return {
            hasOverlay: overlays.length > 0,
            overlays: overlays.slice(0, 10), // Limit to first 10
            count: overlays.length
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Auto-dismiss cookie consent banners
   */
  async dismissCookieBanner() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // Comprehensive list of known cookie consent platforms and common patterns
          const acceptSelectors = [
            // OneTrust
            '#onetrust-accept-btn-handler',
            '#onetrust-accept-btn',
            // CookieBot
            '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
            '#CybotCookiebotDialogBodyButtonAccept',
            // Generic cookie consent
            '#CookieConsent button[data-action="accept"]',
            '#CookieConsent button:first-child',
            '.cookie-accept',
            '.cookie-consent-accept',
            '[data-cookie-accept]',
            '[data-testid="cookie-accept"]',
            // GDPR tools
            '.cc-accept', '.cc-allow', '.cc-compliance a',
            // Quantcast
            '.qc-cmp2-summary-buttons button:first-child',
            // Complianz
            '.cmplz-accept',
            // Klaro
            '.klaro .cm-btn-accept',
            // Aria-based
            'button[aria-label*="accept" i]',
            'button[aria-label*="agree" i]',
            'button[aria-label*="allow" i]',
            'button[aria-label*="consent" i]',
            // ID-based patterns
            '#accept-cookies', '#acceptCookies', '#cookie-accept',
            '#gdpr-accept', '#consent-accept',
          ];
          
          for (const selector of acceptSelectors) {
            try {
              const btn = document.querySelector(selector);
              if (btn && btn.offsetParent !== null) {
                btn.click();
                return { success: true, action: 'accept', selector, method: 'selector' };
              }
            } catch (e) { /* skip invalid selectors */ }
          }
          
          // Fallback: find buttons by text content
          const acceptTexts = ['accept', 'agree', 'allow', 'got it', 'ok', 'i understand', 'consent'];
          const allButtons = document.querySelectorAll('button, a.btn, a.button, [role="button"]');
          for (const btn of allButtons) {
            const text = (btn.textContent || '').trim().toLowerCase();
            if (acceptTexts.some(t => text.includes(t)) && btn.closest('[class*="cookie"], [class*="consent"], [class*="gdpr"], [id*="cookie"], [id*="consent"]')) {
              btn.click();
              return { success: true, action: 'accept', text: text.substring(0, 50), method: 'text-match' };
            }
          }
          
          return { success: false, action: 'none', reason: 'No cookie banner found' };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Wait for modal to appear
   */
  async waitForModal(options: { selector?: string; timeout?: number }) {
    const { selector, timeout = 10000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const modalSelectors = [
              ${selector ? JSON.stringify(selector) : ''},
              '.modal.show',
              '.modal[style*="display: block"]',
              '.modal.in',
              '.modal.in'
            ].filter(Boolean);
            
            for (const selector of modalSelectors) {
              const modal = document.querySelector(selector);
              if (modal) {
                return { found: true, selector };
              }
            }
            
            return { found: false };
          })()
        `,
        returnByValue: true,
      });

      if (result.result.value?.found) {
        return { success: true, ...result.result.value };
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`waitForModal: Timeout after ${timeout}ms`);
  }

  /**
   * Get active dialog/alert state
   */
  async getDialogState() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            hasModal: !!document.querySelector('[role="dialog"]'),
            hasAlert: false, // Native alerts block JS, can't detect
            modalCount: document.querySelectorAll('[role="dialog"]').length,
            activeModal: (() => { const m = document.querySelector('[role="dialog"]'); return m ? (m.id || 'unnamed') : null; })()
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }
}
