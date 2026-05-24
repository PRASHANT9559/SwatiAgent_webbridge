/**
 * Phase 3: Storage & Data Management Commands
 * 
 * Note: Implementation focuses on legitimate browser automation use cases
 * like testing, data extraction with permission, and session management.
 */

import { Debugger } from '../utils/debugger.js';

export class StorageCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Get LocalStorage items
   */
  async getLocalStorage(options?: { key?: string; limit?: number }) {
    if (options?.key) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `localStorage.getItem(${JSON.stringify(options.key)})`,
        returnByValue: true,
      });
      return {
        success: true,
        data: result.result.value,
        key: options.key,
      };
    }

    // Full dump with size protection to prevent OOM in service worker
    const maxEntries = options?.limit || 500;
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const total = localStorage.length;
          const limit = ${JSON.stringify(maxEntries)};
          const count = Math.min(total, limit);
          const data = {};
          
          for (let i = 0; i < count; i++) {
            const key = localStorage.key(i);
            if (key) {
              const val = localStorage.getItem(key);
              // Skip very large values (>100KB) to prevent OOM
              if (val && val.length < 102400) {
                data[key] = val;
              } else if (val) {
                data[key] = '[TRUNCATED: ' + val.length + ' bytes]';
              }
            }
          }
          
          return { data, total, returned: count, truncated: total > limit };
        })()
      `,
      returnByValue: true,
    });

    return {
      success: true,
      ...result.result.value,
    };
  }

  /**
   * Set LocalStorage item
   */
  async setLocalStorage(options: { key: string; value: string }) {
    const { key, value } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return { success: true, key: ${JSON.stringify(key)}, value: ${JSON.stringify(value)} };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `,
      returnByValue: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`setLocalStorage: ${result.result.value?.error}`);
    }

    return result.result.value;
  }

  /**
   * Remove LocalStorage item
   */
  async removeLocalStorage(key: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.removeItem(${JSON.stringify(key)});
          return { success: true, key: ${JSON.stringify(key)} };
        })()
      `,
      returnByValue: true,
    });

    return { success: true, ...result.result.value };
  }

  /**
   * Clear all LocalStorage
   */
  async clearLocalStorage() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.clear();
          return { success: true };
        })()
      `,
      returnByValue: true,
    });

    return { success: true };
  }

  /**
   * Get SessionStorage items
   */
  async getSessionStorage(options?: { key?: string }) {
    const expression = options?.key
      ? `sessionStorage.getItem(${JSON.stringify(options.key)})`
      : 'Object.fromEntries(sessionStorage)';

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });

    return {
      success: true,
      data: result.result.value,
      ...(options?.key && { key: options.key }),
    };
  }

  /**
   * Set SessionStorage item
   */
  async setSessionStorage(options: { key: string; value: string }) {
    const { key, value } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            sessionStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});
            return { success: true, key: ${JSON.stringify(key)}, value: ${JSON.stringify(value)} };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `,
      returnByValue: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`setSessionStorage: ${result.result.value?.error}`);
    }

    return result.result.value;
  }

  /**
   * Get cookies with optional filtering
   */
  async getCookies(options?: { url?: string; name?: string }) {
    const params: any = {};
    if (options?.url) {
      params.urls = [options.url];
    }

    const result = await this.debuggerInstance.sendCommand('Network.getAllCookies', params);

    let cookies = result.cookies || [];

    if (options?.name) {
      cookies = cookies.filter((c: any) => c.name === options.name);
    }

    return {
      success: true,
      cookies,
      count: cookies.length,
    };
  }

  /**
   * Set a cookie
   */
  async setCookie(options: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    expirationDate?: number;
  }) {
    const { name, value, domain, path, secure, httpOnly, sameSite, expirationDate } = options;

    const params: any = { name, value };
    if (domain) params.domain = domain;
    if (path) params.path = path;
    if (secure) params.secure = secure;
    if (httpOnly) params.httpOnly = httpOnly;
    if (sameSite) params.sameSite = sameSite;
    if (expirationDate) params.expirationDate = expirationDate;

    const result = await this.debuggerInstance.sendCommand('Network.setCookie', params);

    return {
      success: true,
      cookie: result.cookie,
    };
  }

  /**
   * Delete a cookie
   */
  async deleteCookie(options: { name: string; url?: string; domain?: string; path?: string }) {
    const { name, url, domain, path } = options;

    const params: any = { name };
    if (url) params.url = url;
    if (domain) params.domain = domain;
    if (path) params.path = path;

    await this.debuggerInstance.sendCommand('Network.deleteCookie', params);

    return {
      success: true,
      name,
    };
  }

  /**
   * Clear all cookies
   */
  async clearCookies() {
    await this.debuggerInstance.sendCommand('Network.clearBrowserCookies');
    return { success: true };
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return navigator.clipboard.writeText(${JSON.stringify(text)})
            .then(() => ({ success: true }))
            .catch(e => ({ success: false, error: e.message }));
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`copyToClipboard: ${result.result.value?.error}`);
    }

    return { success: true, text };
  }

  /**
   * Read from clipboard
   */
  async readClipboard() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return navigator.clipboard.readText()
            .then(text => ({ success: true, text }))
            .catch(e => ({ success: false, error: e.message }));
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (!result.result.value?.success) {
      throw new Error(`readClipboard: ${result.result.value?.error}`);
    }

    return { success: true, text: result.result.value.text };
  }

  /**
   * Save session (cookies + storage)
   */
  async saveSession(options?: { name?: string }) {
    // Get cookies
    const cookiesResult = await this.getCookies();
    
    // Get localStorage
    const localStorageResult = await this.getLocalStorage();
    
    // Get sessionStorage
    const sessionStorageResult = await this.getSessionStorage();

    const session = {
      url: await this.getCurrentUrl(),
      timestamp: new Date().toISOString(),
      name: options?.name || `session_${Date.now()}`,
      cookies: cookiesResult.cookies,
      localStorage: localStorageResult.data,
      sessionStorage: sessionStorageResult.data,
    };

    return {
      success: true,
      session,
    };
  }

  /**
   * Restore session
   */
  async restoreSession(session: {
    cookies?: any[];
    localStorage?: any;
    sessionStorage?: any;
    url?: string;
  }) {
    const restored = {
      cookies: 0,
      localStorage: 0,
      sessionStorage: 0,
    };

    // Restore cookies
    if (session.cookies) {
      for (const cookie of session.cookies) {
        try {
          await this.setCookie(cookie);
          restored.cookies++;
        } catch (e) {
          console.error('Failed to restore cookie:', cookie.name, e);
        }
      }
    }

    // Restore localStorage
    if (session.localStorage) {
      await this.clearLocalStorage();
      for (const [key, value] of Object.entries(session.localStorage)) {
        try {
          await this.setLocalStorage({ key, value: String(value) });
          restored.localStorage++;
        } catch (e) {
          console.error('Failed to restore localStorage:', key, e);
        }
      }
    }

    // Restore sessionStorage
    if (session.sessionStorage) {
      for (const [key, value] of Object.entries(session.sessionStorage)) {
        try {
          await this.setSessionStorage({ key, value: String(value) });
          restored.sessionStorage++;
        } catch (e) {
          console.error('Failed to restore sessionStorage:', key, e);
        }
      }
    }

    return {
      success: true,
      restored,
    };
  }

  /**
   * Export session to JSON
   */
  async exportSession(options?: { name?: string }) {
    const session = await this.saveSession(options);
    return {
      success: true,
      json: JSON.stringify(session.session, null, 2),
    };
  }

  private async getCurrentUrl(): Promise<string> {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true,
    });
    return result.result.value || '';
  }
}
