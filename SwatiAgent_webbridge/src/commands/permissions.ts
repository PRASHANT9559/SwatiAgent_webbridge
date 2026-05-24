/**
 * Phase 12: Extension & Permission Management Commands
 */

import { Debugger } from '../utils/debugger.js';

export class PermissionsCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * 12.2 Permission Handling
   * BUG-29 FIX: chrome.permissions is for EXTENSION permissions, not page permissions.
   * For camera, mic, geolocation, notifications etc., use CDP Browser.grantPermissions.
   */
  async grantPermission(options: { origin: string; permission: string }) {
    try {
      await this.debuggerInstance.sendCommand('Browser.grantPermissions', {
        origin: options.origin,
        permissions: [options.permission],
      });
      return { success: true, permission: options.permission, origin: options.origin, granted: true };
    } catch (error: any) {
      return { success: false, error: `Failed to grant ${options.permission}: ${error.message}` };
    }
  }

  /**
   * 12.3 Service Worker Control
   * Clear cache storage API
   */
  async clearCacheStorage() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          if (typeof caches !== 'undefined') {
            return caches.keys().then(keys => {
              return Promise.all(keys.map(key => caches.delete(key))).then(() => ({ cleared: true, count: keys.length }));
            });
          }
          return { cleared: false, reason: 'Cache Storage API unavailable' };
        })()
      `,
      awaitPromise: true,
      returnByValue: true,
    });
    return { success: true, ...result.result.value };
  }
}
