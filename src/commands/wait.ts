/**
 * Phase 2: Essential Additions - Wait & Synchronization Commands
 */

import { Debugger } from '../utils/debugger.js';

export class WaitCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Wait for an element to appear in the DOM
   */
  async waitForSelector(options: { selector: string; timeout?: number; visible?: boolean; hidden?: boolean }) {
    const { selector, timeout = 30000, visible = false, hidden = false } = options;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (${hidden}) {
              if (!el) return { found: true };
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;
              const style = window.getComputedStyle(el);
              const isDisplayed = style.display !== 'none';
              const isHidden = style.visibility !== 'hidden';
              return { found: !(isVisible && isDisplayed && isHidden) };
            }
            if (!el) return { found: false };
            if (${visible}) {
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;
              const style = window.getComputedStyle(el);
              const isDisplayed = style.display !== 'none';
              const isHidden = style.visibility !== 'hidden';
              return { found: isVisible && isDisplayed && isHidden };
            }
            return { found: true };
          })()
        `,
        returnByValue: true,
      });

      if (result.result.value?.found) {
        return { success: true, selector };
      }

      await this.sleep(100);
    }

    throw new Error(`waitForSelector: Timeout after ${timeout}ms for selector "${selector}"`);
  }

  /**
   * Wait for page navigation to complete
   */
  async waitForNavigation(options: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' } = {}) {
    const { timeout = 30000, waitUntil = 'load' } = options;
    const targetTabId = this.debuggerInstance.getCurrentTabId();
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`waitForNavigation: Timeout after ${timeout}ms`));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(onUpdatedHandler);
        chrome.tabs.onRemoved.removeListener(onRemovedHandler);
      };

      const onUpdatedHandler = (tabId: number, changeInfo: any) => {
        if (tabId !== targetTabId) return;
        if (waitUntil === 'load' && changeInfo.status === 'complete') {
          cleanup();
          resolve({ success: true, status: 'complete', waitedFor: 'load' });
        } else if (waitUntil === 'domcontentloaded' && changeInfo.status && changeInfo.status !== 'loading') {
          // BUG-10 FIX: DOMContentLoaded fires when DOM is parsed (interactive),
          // not when all resources are loaded (complete). Resolve on any non-loading status.
          cleanup();
          resolve({ success: true, status: changeInfo.status, waitedFor: 'domcontentloaded' });
        }
      };

      const onRemovedHandler = (tabId: number) => {
        if (tabId === targetTabId) {
          cleanup();
          resolve({ success: true, status: 'tab_removed' });
        }
      };

      chrome.tabs.onUpdated.addListener(onUpdatedHandler);
      chrome.tabs.onRemoved.addListener(onRemovedHandler);

      // Check current state
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs.find(t => t.id === targetTabId);
        if (activeTab?.status === 'complete') {
          cleanup();
          resolve({ success: true, status: 'already_complete' });
        }
      });
    });
  }

  /**
   * Wait for page to be visually stable (no layout shifts)
   */
  async waitForStable(options: { timeout?: number; threshold?: number } = {}) {
    const { timeout = 10000, threshold = 50 } = options;
    
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return new Promise((resolve) => {
            const startTime = Date.now();
            let lastChange = startTime;
            let lastContent = document.body?.innerHTML?.length || 0;
            
            const observer = new MutationObserver(() => {
              const now = Date.now();
              const currentContent = document.body?.innerHTML?.length || 0;
              if (currentContent !== lastContent) {
                lastChange = now;
                lastContent = currentContent;
              }
            });
            
            observer.observe(document.body, { 
              childList: true, 
              subtree: true, 
              characterData: true 
            });

            // Poller to verify stability (resolves instantly if already stable)
            const poller = setInterval(() => {
              const now = Date.now();
              if (now - startTime > ${timeout}) {
                clearInterval(poller);
                observer.disconnect();
                resolve({ stable: false, reason: 'timeout' });
                return;
              }

              if (now - lastChange >= ${threshold}) {
                clearInterval(poller);
                observer.disconnect();
                resolve({ stable: true, time: now - startTime });
              }
            }, 20);
          });
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    return { success: true, ...result.result.value };
  }

  /**
   * Wait for specific content to appear
   */
  async waitForContent(options: { text: string; timeout?: number; contains?: boolean }) {
    const { text, timeout = 30000, contains = true } = options;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const bodyText = document.body?.textContent || '';
            const found = ${contains} 
              ? bodyText.includes(${JSON.stringify(text)})
              : bodyText === ${JSON.stringify(text)};
            return { found };
          })()
        `,
        returnByValue: true,
      });

      if (result.result.value?.found) {
        return { success: true, text };
      }

      await this.sleep(100);
    }

    throw new Error(`waitForContent: Timeout after ${timeout}ms for text "${text}"`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
