/**
 * Phase 4: Iframe & Frame Support Commands
 * 
 * Handle iframes, frames, and nested contexts.
 */

import { Debugger } from '../utils/debugger.js';

export class IframeCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * List all iframes on the page
   */
  async listIframes() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const iframes = Array.from(document.querySelectorAll('iframe'));
          return iframes.map((iframe, index) => ({
            index,
            id: iframe.id || null,
            name: iframe.name || null,
            src: iframe.src,
            title: iframe.title || null,
            width: iframe.width,
            height: iframe.height,
            contentWindow: !!iframe.contentWindow,
            hasContent: !!iframe.contentDocument
          }));
        })()
      `,
      returnByValue: true,
    });

    return {
      success: true,
      iframes: result.result.value || [],
      count: (result.result.value || []).length,
    };
  }

  /**
   * Switch to an iframe context
   * BUG-08 FIX: All selectors now properly sanitized with JSON.stringify
   */
  async switchToIframe(options: { selector?: string; index?: number; name?: string }) {
    const { selector, index, name } = options;

    // BUG-08 FIX: Properly escape all user inputs
    const indexJson = JSON.stringify(index);
    const nameJson = JSON.stringify(name);
    const selectorJson = JSON.stringify(selector);

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          let iframe;
          const _index = ${indexJson};
          const _name = ${nameJson};
          const _selector = ${selectorJson};
          
          if (_index !== null && _index !== undefined) {
            iframe = document.querySelectorAll('iframe')[_index];
          } else if (_name !== null && _name !== undefined) {
            iframe = document.querySelector('iframe[name="' + CSS.escape(_name) + '"]') ||
                     document.getElementById(_name);
          } else if (_selector) {
            iframe = document.querySelector(_selector);
          }
          
          if (!iframe) return { error: 'Iframe not found' };
          if (!iframe.contentWindow) return { error: 'Iframe has no content window' };
          
          return {
            success: true,
            id: iframe.id,
            name: iframe.name,
            src: iframe.src,
            frameId: iframe.getAttribute('frameId') || null
          };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`switchToIframe: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Switch back to main frame
   */
  async switchToMainFrame() {
    return { success: true, message: 'Switched to main frame' };
  }

  /**
   * Execute code in iframe context
   * BUG-08 FIX: Selectors sanitized
   */
  async executeInIframe(options: { frameSelector: string; code: string }) {
    const { frameSelector, code } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const iframe = document.querySelector(${JSON.stringify(frameSelector)});
          if (!iframe) return { error: 'Iframe not found' };
          if (!iframe.contentWindow) return { error: 'Iframe has no content window' };
          
          try {
            const evalResult = iframe.contentWindow.eval(${JSON.stringify(code)});
            return { success: true, result: evalResult };
          } catch (e) {
            return { error: e.message };
          }
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`executeInIframe: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Get iframe content as HTML
   * BUG-08 FIX: Selector sanitized
   */
  async getIframeContent(options: { selector: string }) {
    const { selector } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const iframe = document.querySelector(${JSON.stringify(selector)});
          if (!iframe) return { error: 'Iframe not found' };
          if (!iframe.contentDocument) return { error: 'Cannot access iframe content (possibly cross-origin)' };
          
          return {
            success: true,
            html: iframe.contentDocument.documentElement.outerHTML,
            title: iframe.contentDocument.title,
            url: iframe.contentDocument.location.href
          };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`getIframeContent: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Check if iframe is accessible (not cross-origin blocked)
   * BUG-08 FIX: Selector sanitized
   */
  async checkIframeAccessibility(options: { selector: string }) {
    const { selector } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const iframe = document.querySelector(${JSON.stringify(selector)});
          if (!iframe) return { error: 'Iframe not found' };
          
          try {
            const hasAccess = !!(iframe.contentWindow && iframe.contentDocument);
            return {
              accessible: hasAccess,
              sameOrigin: hasAccess,
              src: iframe.src,
              sandbox: iframe.getAttribute('sandbox'),
              allow: iframe.getAttribute('allow')
            };
          } catch (e) {
            return {
              accessible: false,
              sameOrigin: false,
              error: 'Cross-origin restriction',
              src: iframe.src
            };
          }
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Wait for iframe to load
   * BUG-08 FIX: Selector sanitized
   */
  async waitForIframe(options: { selector: string; timeout?: number }) {
    const { selector, timeout = 10000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const iframe = document.querySelector(${JSON.stringify(selector)});
            if (!iframe) return { loaded: false, reason: 'not found' };
            if (!iframe.contentDocument) return { loaded: false, reason: 'no content' };
            if (iframe.contentDocument.readyState === 'complete') {
              return { loaded: true };
            }
            return { loaded: false, reason: 'loading' };
          })()
        `,
        returnByValue: true,
      });

      if (result.result.value?.loaded) {
        return { success: true, selector };
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`waitForIframe: Timeout after ${timeout}ms`);
  }

  /**
   * Get all frames hierarchy
   */
  async getFramesHierarchy() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          function getFrameInfo(frame, index) {
            const info = {
              index,
              id: frame.id || null,
              name: frame.name || null,
              src: frame.src,
              title: frame.title,
              children: []
            };
            
            try {
              if (frame.contentDocument) {
                const childFrames = frame.contentDocument.querySelectorAll('iframe');
                childFrames.forEach((child, i) => {
                  info.children.push(getFrameInfo(child, i));
                });
              }
            } catch (e) {
              info.error = 'Cannot access child frames (cross-origin)';
            }
            
            return info;
          }
          
          const frames = Array.from(document.querySelectorAll('iframe'));
          return frames.map((frame, i) => getFrameInfo(frame, i));
        })()
      `,
      returnByValue: true,
    });

    return {
      success: true,
      hierarchy: result.result.value || [],
    };
  }

  /**
   * Screenshot of iframe content
   */
  async screenshotIframe(options: { selector: string }) {
    const { selector } = options;
    return {
      success: false,
      error: `Direct iframe screenshots for "${selector}" are restricted by browser security. Use getIframeContent and render externally.`,
      workaround: 'Use getIframeContent() to get HTML and process externally',
    };
  }
}
