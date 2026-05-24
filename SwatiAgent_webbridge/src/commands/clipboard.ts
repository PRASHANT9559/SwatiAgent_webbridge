/**
 * Phase 3: Clipboard Operations
 * 
 * Cross-platform clipboard access with proper permissions handling.
 */

import { Debugger } from '../utils/debugger.js';

export class ClipboardCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Copy text to clipboard
   */
  async copy(text: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            await navigator.clipboard.writeText(${JSON.stringify(text)});
            return { success: true, text: ${JSON.stringify(text)} };
          } catch (e) {
            // Fallback: Use textarea + Selection API (works in more contexts than execCommand)
            try {
              const textarea = document.createElement('textarea');
              textarea.value = ${JSON.stringify(text)};
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              textarea.style.left = '-9999px';
              textarea.setAttribute('readonly', '');
              document.body.appendChild(textarea);
              textarea.select();
              textarea.setSelectionRange(0, textarea.value.length);
              // execCommand is deprecated but still the only fallback for non-HTTPS contexts
              const success = document.execCommand('copy');
              document.body.removeChild(textarea);
              if (success) {
                return { success: true, text: ${JSON.stringify(text)}, method: 'fallback' };
              }
              return { success: false, error: 'Clipboard API requires HTTPS or localhost' };
            } catch (e2) {
              return { success: false, error: 'Clipboard access denied: ' + (e.message || e2.message) };
            }
          }
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`clipboard.copy: ${result.result.value?.error}`);
    }

    return result.result.value;
  }

  /**
   * Paste from clipboard (requires permission)
   */
  async paste(): Promise<{ success: boolean; text: string }> {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const text = await navigator.clipboard.readText();
            return { success: true, text };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`clipboard.paste: ${result.result.value?.error}`);
    }

    return result.result.value;
  }

  /**
   * Read clipboard content
   */
  async read(): Promise<{ success: boolean; text: string }> {
    return this.paste();
  }

  /**
   * Copy HTML to clipboard
   */
  async copyHTML(html: string, text?: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const blob = new Blob([${JSON.stringify(text || html)}], { type: 'text/plain' });
            const htmlBlob = new Blob([${JSON.stringify(html)}], { type: 'text/html' });
            const item = new ClipboardItem({
              'text/plain': blob,
              'text/html': htmlBlob
            });
            await navigator.clipboard.write([item]);
            return { success: true, html: ${JSON.stringify(html)} };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`clipboard.copyHTML: ${result.result.value?.error}`);
    }

    return result.result.value;
  }

  /**
   * Copy image to clipboard
   */
  async copyImage(imageUrl: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const response = await fetch(${JSON.stringify(imageUrl)});
            const blob = await response.blob();
            const item = new ClipboardItem({
              [blob.type]: blob
            });
            await navigator.clipboard.write([item]);
            return { success: true, imageUrl: ${JSON.stringify(imageUrl)} };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`clipboard.copyImage: ${result.result.value?.error}`);
    }

    return result.result.value;
  }

  /**
   * Check clipboard permissions
   */
  async checkPermission(): Promise<{ success: boolean; state: string }> {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const result = await navigator.permissions.query({ name: 'clipboard-read' });
            return { success: true, state: result.state };
          } catch (e) {
            return { success: false, error: e.message, state: 'unknown' };
          }
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    return result.result.value || { success: false, state: 'unknown' };
  }

  /**
   * Get clipboard items (if available)
   */
  async getItems() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            const items = await navigator.clipboard.read();
            return {
              success: true,
              items: items.map(item => ({
                types: item.types,
                size: item.types.length
              }))
            };
          } catch (e) {
            return { success: false, error: e.message, items: [] };
          }
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    return result.result.value || { success: false, items: [] };
  }
}
