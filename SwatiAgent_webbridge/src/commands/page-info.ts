/**
 * Phase 2: Page Information Commands
 */

import { Debugger } from '../utils/debugger.js';

export class PageInfoCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Get the current page title
   */
  async getPageTitle() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true,
    });

    return { success: true, title: result.result.value || '' };
  }

  /**
   * Get the current page URL
   */
  async getPageUrl() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true,
    });

    return { success: true, url: result.result.value || '' };
  }

  /**
   * Get meta tags from the page
   */
  async getMetaTags() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const metaTags = {};
          
          // Standard meta tags
          document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
            const name = meta.getAttribute('name') || meta.getAttribute('property');
            const content = meta.getAttribute('content');
            if (name && content) {
              metaTags[name] = content;
            }
          });
          
          // Open Graph tags
          document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
            const property = meta.getAttribute('property');
            const content = meta.getAttribute('content');
            if (property && content) {
              metaTags[property] = content;
            }
          });
          
          // Twitter Card tags
          document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
            const name = meta.getAttribute('name');
            const content = meta.getAttribute('content');
            if (name && content) {
              metaTags[name] = content;
            }
          });
          
          return metaTags;
        })()
      `,
      returnByValue: true,
    });

    return { success: true, metaTags: result.result.value || {} };
  }

  /**
   * Get the full page HTML source
   */
  async getPageSource() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    });

    return { success: true, source: result.result.value || '' };
  }

  /**
   * Get page dimensions and viewport info
   */
  async getPageInfo() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
            title: document.title,
            url: window.location.href,
            pathname: window.location.pathname,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            referrer: document.referrer,
            cookieEnabled: navigator.cookieEnabled,
            language: navigator.language,
            userAgent: navigator.userAgent
          };
        })()
      `,
      returnByValue: true,
    });

    return { success: true, ...result.result.value };
  }

  /**
   * Get all text content from the page
   */
  async getTextContent(options: { includeHidden?: boolean } = {}) {
    const { includeHidden = false } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const body = document.body;
          if (!body) return '';
          
          if (${JSON.stringify(includeHidden)}) {
            // Include everything
            return (body.innerText || body.textContent || '').trim();
          }
          
          // Collect only visible text using TreeWalker
          const walker = document.createTreeWalker(
            body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                let el = node.parentElement;
                while (el) {
                  const style = window.getComputedStyle(el);
                  if (style.display === 'none' || 
                      style.visibility === 'hidden' || 
                      el.hasAttribute('hidden') ||
                      parseFloat(style.opacity) === 0) {
                    return NodeFilter.FILTER_REJECT;
                  }
                  el = el.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );
          
          const parts = [];
          let node;
          while (node = walker.nextNode()) {
            const text = node.nodeValue?.trim();
            if (text) parts.push(text);
          }
          
          return parts.join(' ');
        })()
      `,
      returnByValue: true,
    });

    return { success: true, text: result.result.value || '' };
  }

  /**
   * Get page loading state
   */
  async getLoadingState() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            readyState: document.readyState,
            complete: document.readyState === 'complete',
            loading: document.readyState === 'loading',
            interactive: document.readyState === 'interactive'
          };
        })()
      `,
      returnByValue: true,
    });

    return { success: true, ...result.result.value };
  }
}
