/**
 * Phase 8: Anti-Detection & Stealth Commands
 */

import { Debugger } from '../utils/debugger.js';

export class StealthCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * 8.1 Browser Fingerprinting
   * Canvas, WebGL, Fonts, User-Agent spoof karna
   */
  async randomizeFingerprint() {
    await this.debuggerInstance.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (() => {
          // Canvas Spoofing
          const originalGetContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(type, contextAttributes) {
            const context = originalGetContext.call(this, type, contextAttributes);
            if (type === '2d' && context) {
              const originalGetImageData = context.getImageData;
              context.getImageData = function(sx, sy, sw, sh) {
                const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
                if (imageData.data.length > 0) {
                  imageData.data[0] = (imageData.data[0] + 1) % 256;
                }
                return imageData;
              };
            }
            return context;
          };

          // Navigator Overrides
          Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
          Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
          Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        })()
      `
    });

    return { success: true, fingerprintRandomized: true };
  }

  /**
   * 8.1 Browser Fingerprinting
   * Random viewport sizes
   */
  async viewportRandomization() {
    const randomWidth = Math.floor(1000 + Math.random() * 400);
    const randomHeight = Math.floor(700 + Math.random() * 200);

    await this.debuggerInstance.sendCommand('Emulation.setDeviceMetricsOverride', {
      width: randomWidth,
      height: randomHeight,
      deviceScaleFactor: 1,
      mobile: false,
    });

    return { success: true, width: randomWidth, height: randomHeight };
  }

  /**
   * 8.1 Browser Fingerprinting
   * Timezone spoof karna
   */
  async timezoneOverride(options: { timezoneId: string }) {
    await this.debuggerInstance.sendCommand('Emulation.setTimezoneOverride', {
      timezoneId: options.timezoneId,
    });
    return { success: true, timezone: options.timezoneId };
  }

  /**
   * 8.1 Browser Fingerprinting
   * Language/locale spoof karna
   */
  async localeOverride(options: { locale: string }) {
    await this.debuggerInstance.sendCommand('Emulation.setLocaleOverride', {
      locale: options.locale,
    });
    return { success: true, locale: options.locale };
  }

  /**
   * 8.1 Browser Fingerprinting
   * GPS coordinates fake karna
   */
  async geolocationMock(options: { latitude: number; longitude: number; accuracy?: number }) {
    await this.debuggerInstance.sendCommand('Emulation.setGeolocationOverride', {
      latitude: options.latitude,
      longitude: options.longitude,
      accuracy: options.accuracy || 100,
    });
    return { success: true, ...options };
  }

  /**
   * 8.2 Stealth Mode
   * navigator.webdriver, permissions, and chrome runtime faking
   */
  async hideWebdriver() {
    // BUG-14 FIX: Also patch the CURRENT page immediately, not just future navigations
    const stealthScript = `
      (() => {
        const prototype = Object.getPrototypeOf(navigator);
        delete prototype.webdriver;`;

    // Patch current page immediately
    await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: stealthScript + `
      })()
      `
    });

    // Also register for future navigations
    await this.debuggerInstance.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (() => {
          // Native WebDriver Hide (Prototype deletion to pass hasOwnProperty check)
          const prototype = Object.getPrototypeOf(navigator);
          delete prototype.webdriver;

          // Chrome Runtime patch (Emulating natural chrome structures)
          window.chrome = {
            runtime: {
              OnInstalledReason: {
                CHROME_UPDATE: 'chrome_update',
                INSTALL: 'install',
                SHARED_MODULE_UPDATE: 'shared_module_update',
                UPDATE: 'update'
              },
              OnRestartRequiredReason: {
                APP_UPDATE: 'app_update',
                OS_UPDATE: 'os_update',
                PERIODIC: 'periodic'
              },
              PlatformArch: {
                ARM: 'arm',
                ARM64: 'arm64',
                MIPS: 'mips',
                MIPS64: 'mips64',
                X86_32: 'x86-32',
                X86_64: 'x86-64'
              },
              PlatformNaclArch: {
                ARM: 'arm',
                MIPS: 'mips',
                X86_32: 'x86-32',
                X86_64: 'x86-64'
              },
              PlatformOs: {
                ANDROID: 'android',
                CROS: 'cros',
                LINUX: 'linux',
                MAC: 'mac',
                OPENBSD: 'openbsd',
                WIN: 'win'
              },
              RequestUpdateCheckStatus: {
                NO_UPDATE: 'no_update',
                THROTTLED: 'throttled',
                UPDATE_AVAILABLE: 'update_available'
              }
            }
          };

          // Permissions patch (Conforms to native PermissionStatus and passes instanceof checks)
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters) =>
            originalQuery(parameters).then((status) => {
              if (parameters && parameters.name === 'notifications') {
                const patchedStatus = Object.create(status);
                Object.defineProperty(patchedStatus, 'state', {
                  get: () => Notification.permission
                });
                return patchedStatus;
              }
              return status;
            });
        })()
      `
    });
    return { success: true, webdriverHidden: true };
  }

  /**
   * 8.2 Stealth Mode
   * Fake plugins list inject karna
   */
  async patchPlugins() {
    await this.debuggerInstance.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (() => {
          const rawPlugins = [
            { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
          ];

          const mockPlugins = rawPlugins.map(p => {
            const plugin = Object.create(Plugin.prototype);
            Object.defineProperties(plugin, {
              name: { get: () => p.name },
              filename: { get: () => p.filename },
              description: { get: () => p.description },
              length: { get: () => 0 }
            });
            return plugin;
          });

          const pluginArray = Object.create(PluginArray.prototype);
          Object.defineProperties(pluginArray, {
            length: { get: () => mockPlugins.length },
            item: { value: (index) => mockPlugins[index] || null },
            namedItem: { value: (name) => mockPlugins.find(p => p.name === name) || null }
          });

          mockPlugins.forEach((p, i) => {
            Object.defineProperty(pluginArray, i, { get: () => p });
            Object.defineProperty(pluginArray, p.name, { get: () => p });
          });

          Object.defineProperty(navigator, 'plugins', {
            get: () => pluginArray
          });
        })()
      `
    });
    return { success: true, pluginsPatched: true };
  }

  /**
   * 8.2 Stealth Mode
   * BUG-15 FIX: Actually dispatch mousemove events with jitter via CDP
   */
  async noiseInjection(options: { x: number; y: number }) {
    const jitterX = options.x + (Math.random() - 0.5) * 4;
    const jitterY = options.y + (Math.random() - 0.5) * 4;

    // Actually dispatch the jittered mouse event
    await this.debuggerInstance.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: Math.round(jitterX),
      y: Math.round(jitterY),
    });

    return { success: true, x: jitterX, y: jitterY, dispatched: true };
  }

  /**
   * 8.2 Stealth Mode
   * WebGL vendor/renderer spoof karna
   */
  async patchWebGL() {
    await this.debuggerInstance.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        (() => {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return 'Google Inc. (Intel)'; // UNMASKED_VENDOR_WEBGL
            if (parameter === 37446) return 'ANGLE (Intel, Intel(R) UHD Graphics 620, OpenGL 4.1)'; // UNMASKED_RENDERER_WEBGL
            return getParameter.apply(this, arguments);
          };
        })()
      `
    });
    return { success: true, webGLPatched: true };
  }

  /**
   * 8.3 Proxy & Isolation
   * BUG-13 NOTE: Chrome proxy API is browser-wide, NOT per-tab.
   * Per-tab proxy requires Native Messaging Host + local proxy (mitmproxy).
   */
  async setTabProxy(options: { proxyServer: string }) {
    if (typeof chrome !== 'undefined' && chrome.proxy) {
      await chrome.proxy.settings.set({
        value: {
          mode: 'fixed_servers',
          rules: {
            singleProxy: {
              host: options.proxyServer.split(':')[0],
              port: parseInt(options.proxyServer.split(':')[1] || '80', 10)
            }
          }
        },
        scope: 'regular'
      });
      return {
        success: true,
        proxy: options.proxyServer,
        warning: 'This sets proxy for ALL tabs (browser-wide). Per-tab proxy is not supported by Chrome Extension APIs.'
      };
    }
    return { success: false, error: 'Proxy settings require standard extension APIs' };
  }

  /**
   * 8.3 Proxy & Isolation
   * Incognito-like isolated browser contexts
   */
  async createContext() {
    if (typeof chrome !== 'undefined' && chrome.windows) {
      const win = await chrome.windows.create({ incognito: true });
      return { success: true, contextId: win.id };
    }
    return { success: false, error: 'Incognito context requires browser environment' };
  }
}
