/**
 * Phase 6: Network & Communication
 * 
 * Network interception, mocking, monitoring, and performance analysis.
 */

import { Debugger } from '../utils/debugger.js';

export class NetworkCommands {
  private debuggerInstance: Debugger;
  private requestInterceptionEnabled = false;
  private interceptedRequests: Map<string, any> = new Map();
  private mockRules: Map<string, { responseBody: string; statusCode: number; headers: Record<string, string> }> = new Map();
  private blockedPatterns: string[] = [];

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Enable network interception
   */
  async enableNetworkInterception() {
    await this.debuggerInstance.sendCommand('Network.enable');
    await this.debuggerInstance.sendCommand('Fetch.enable', {
      patterns: [{ requestStage: 'Request' }],
    });

    this.requestInterceptionEnabled = true;

    return {
      success: true,
      message: 'Network interception enabled',
    };
  }

  /**
   * Disable network interception
   */
  async disableNetworkInterception() {
    await this.debuggerInstance.sendCommand('Fetch.disable');
    this.requestInterceptionEnabled = false;

    return {
      success: true,
      message: 'Network interception disabled',
    };
  }

  /**
   * Intercept and modify request
   */
  async interceptRequest(options: {
    urlPattern: string;
    action: 'modify' | 'abort' | 'mock';
    modifications?: {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      postData?: string;
    };
  }) {
    const { urlPattern, action } = options;

    await this.debuggerInstance.sendCommand('Network.setBlockedURLs', {
      urls: action === 'abort' ? [urlPattern] : [],
    });

    return {
      success: true,
      urlPattern,
      action,
    };
  }

  /**
   * Mock API response
   */
  /**
   * Mock API response
   * BUG-07 FIX: Actually store mock rules. Note: Full implementation requires
   * chrome.debugger.onEvent listener for 'Fetch.requestPaused' in background.ts
   * to match URLs and call Fetch.fulfillRequest.
   */
  async mockResponse(options: {
    urlPattern: string;
    responseBody: any;
    statusCode?: number;
    headers?: Record<string, string>;
  }) {
    const { urlPattern, responseBody, statusCode = 200, headers = {} } = options;

    // Enable interception if not already
    if (!this.requestInterceptionEnabled) {
      await this.enableNetworkInterception();
    }

    const body = typeof responseBody === 'object' ? JSON.stringify(responseBody) : String(responseBody);
    
    // Store the mock rule for matching against intercepted requests
    this.mockRules.set(urlPattern, { responseBody: body, statusCode, headers });

    return {
      success: true,
      urlPattern,
      statusCode,
      headers,
      responseBody: body,
      note: 'Mock rule registered. Requires Fetch.requestPaused event handler to apply.',
      activeMockRules: this.mockRules.size,
    };
  }

  /**
   * Get currently active mock rules (for event handler to use)
   */
  getMockRules(): Map<string, { responseBody: string; statusCode: number; headers: Record<string, string> }> {
    return this.mockRules;
  }

  /**
   * Block resources (ads, trackers, etc.)
   */
  async blockResources(options: {
    resourceTypes?: string[];
    patterns?: string[];
  }) {
    const { resourceTypes = ['image', 'font'], patterns = [] } = options;

    const blockedUrls = [...patterns];

    await this.debuggerInstance.sendCommand('Network.setBlockedURLs', {
      urls: blockedUrls,
    });

    if (resourceTypes.length > 0) {
      await this.debuggerInstance.sendCommand('Network.setBlockedURLs', {
        urls: blockedUrls,
      });
    }

    return {
      success: true,
      blockedResourceTypes: resourceTypes,
      blockedPatterns: patterns,
    };
  }

  /**
   * Modify request/response headers
   */
  async modifyHeaders(options: {
    type: 'request' | 'response';
    headers: Record<string, string>;
  }) {
    const { type, headers } = options;

    if (type === 'request') {
      await this.debuggerInstance.sendCommand('Network.setExtraHTTPHeaders', {
        headers,
      });
    }

    return {
      success: true,
      type,
      headers,
    };
  }

  /**
   * Throttle network speed
   */
  async throttleNetwork(options: {
    latency?: number;
    downloadThroughput?: number;
    uploadThroughput?: number;
    offline?: boolean;
  }) {
    const {
      latency = 0,
      downloadThroughput = -1,
      uploadThroughput = -1,
      offline = false,
    } = options;

    await this.debuggerInstance.sendCommand('Network.emulateNetworkConditions', {
      offline,
      latency,
      downloadThroughput,
      uploadThroughput,
    });

    return {
      success: true,
      networkConditions: { offline, latency, downloadThroughput, uploadThroughput },
    };
  }

  /**
   * Get all network requests
   */
  async getNetworkRequests(options?: { filter?: string }) {
    const filter = options?.filter;

    // This would require event listening setup
    // For now, return current intercepted requests
    return {
      success: true,
      requests: Array.from(this.interceptedRequests.values()).filter((req: any) => {
        if (!filter) return true;
        return req.url?.includes(filter);
      }),
      count: this.interceptedRequests.size,
    };
  }

  /**
   * Export HAR (HTTP Archive)
   */
  async exportHAR() {
    // Build HAR entries from intercepted requests
    const entries: any[] = [];

    this.interceptedRequests.forEach((req, id) => {
      entries.push({
        startedDateTime: new Date(req.timestamp * 1000).toISOString(),
        time: req.timing?.receiveHeadersEnd || 0,
        request: {
          method: req.request?.method || 'GET',
          url: req.request?.url || '',
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: Object.entries(req.request?.headers || {}).map(([n, v]) => ({ name: n, value: v })),
          queryString: [],
          headersSize: -1,
          bodySize: req.request?.postDataEntries?.[0]?.bytes?.length || 0,
        },
        response: {
          status: req.response?.status || 0,
          statusText: req.response?.statusText || '',
          httpVersion: 'HTTP/1.1',
          cookies: [],
          headers: Object.entries(req.response?.headers || {}).map(([n, v]) => ({ name: n, value: String(v) })),
          content: {
            size: req.response?.encodedDataLength || 0,
            mimeType: req.response?.mimeType || 'application/octet-stream',
          },
          redirectURL: '',
          headersSize: -1,
          bodySize: req.response?.encodedDataLength || 0,
        },
        cache: {},
        timings: {
          send: 0,
          wait: req.timing?.receiveHeadersEnd || 0,
          receive: 0,
        },
      });
    });

    // Supplement with Resource Timing API data if no intercepted requests
    if (entries.length === 0) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            return performance.getEntriesByType('resource').slice(0, 200).map(e => ({
              name: e.name,
              type: e.initiatorType,
              duration: e.duration,
              startTime: e.startTime,
              transferSize: e.transferSize || 0,
              encodedBodySize: e.encodedBodySize || 0,
            }));
          })()
        `,
        returnByValue: true,
      });

      const resources = result.result.value || [];
      resources.forEach((r: any) => {
        entries.push({
          startedDateTime: new Date().toISOString(),
          time: r.duration,
          request: { method: 'GET', url: r.name, httpVersion: 'HTTP/1.1', cookies: [], headers: [], queryString: [], headersSize: -1, bodySize: 0 },
          response: { status: 200, statusText: 'OK', httpVersion: 'HTTP/1.1', cookies: [], headers: [], content: { size: r.encodedBodySize, mimeType: '' }, redirectURL: '', headersSize: -1, bodySize: r.transferSize },
          cache: {},
          timings: { send: 0, wait: r.duration, receive: 0 },
        });
      });
    }

    return {
      success: true,
      entryCount: entries.length,
      har: {
        log: {
          version: '1.2',
          creator: { name: 'SwatiAgent AI', version: '2.0' },
          entries,
        },
      },
    };
  }

  /**
   * Get response body
   */
  async getResponseBody(requestId: string) {
    try {
      const result = await this.debuggerInstance.sendCommand('Network.getResponseBody', {
        requestId,
      });

      return {
        success: true,
        body: result.body,
        base64Encoded: result.base64Encoded,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear browser cache
   */
  async clearCache() {
    await this.debuggerInstance.sendCommand('Network.clearBrowserCache');
    return {
      success: true,
      message: 'Browser cache cleared',
    };
  }

  /**
   * Clear browser cookies
   */
  async clearCookies() {
    await this.debuggerInstance.sendCommand('Network.clearBrowserCookies');
    return {
      success: true,
      message: 'All cookies cleared',
    };
  }

  /**
   * Set cache disabled
   */
  async setCacheDisabled(disabled: boolean) {
    await this.debuggerInstance.sendCommand('Network.setCacheDisabled', {
      cacheDisabled: disabled,
    });

    return {
      success: true,
      cacheDisabled: disabled,
    };
  }

  /**
   * Get request response times (performance)
   */
  async getRequestTimings() {
    const result = await this.debuggerInstance.sendCommand('Performance.getMetrics');

    return {
      success: true,
      metrics: result.metrics || [],
    };
  }

  /**
   * Capture WebSocket messages
   */
  async captureWebSocket(options?: { urlPattern?: string }) {
    // Enable network if not already
    await this.debuggerInstance.sendCommand('Network.enable');

    return {
      success: true,
      message: 'WebSocket capture enabled. Use event listeners for real-time data.',
      pattern: options?.urlPattern,
    };
  }

  /**
   * Send WebSocket message
   */
  async sendWebSocketMessage(options: { url: string; message: string }) {
    const { url, message } = options;

    // This requires active WebSocket connection tracking
    return {
      success: false,
      error: `Direct WebSocket message sending to "${url}" with "${message}" requires active connection tracking implementation`,
    };
  }

  /**
   * List active WebSocket connections
   */
  async listWebSocketConnections() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const webSockets = [];
          // Note: Cannot directly access WebSocket instances from page context
          // This would require debugging protocol support
          return { count: 0, connections: [] };
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
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    const result = await this.debuggerInstance.sendCommand('Performance.getMetrics');

    const metrics: any = {};
    result.metrics?.forEach((metric: any) => {
      metrics[metric.name] = metric.value;
    });

    return {
      success: true,
      metrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Get page load time
   */
  async getPageLoadTime() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const timing = performance.timing;
          const navigationStart = timing.navigationStart;
          
          return {
            loadTime: timing.loadEventEnd - navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
            firstPaint: performance.getEntriesByType('paint')
              .find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByType('paint')
              .find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
            tcpConnection: timing.connectEnd - timing.connectStart,
            ttfb: timing.responseStart - timing.requestStart,
            downloadTime: timing.responseEnd - timing.responseStart
          };
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
   * Get Core Web Vitals
   */
  /**
   * Get Core Web Vitals
   * BUG-32 FIX: Use PerformanceObserver entries and getEntriesByType (not getEntriesByName)
   */
  async getCoreWebVitals() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // FCP - First Contentful Paint (from paint entries)
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
          
          // LCP - requires PerformanceObserver, check if already buffered
          let lcp = 0;
          const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
          if (lcpEntries && lcpEntries.length > 0) {
            lcp = lcpEntries[lcpEntries.length - 1].startTime;
          }
          
          // CLS - sum of layout shift entries without recent input
          let cls = 0;
          const layoutShiftEntries = performance.getEntriesByType('layout-shift');
          if (layoutShiftEntries) {
            layoutShiftEntries.forEach(entry => {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            });
          }
          
          // TTFB
          const navEntries = performance.getEntriesByType('navigation');
          const ttfb = navEntries.length > 0 ? navEntries[0].responseStart : 0;

          return {
            LCP: lcp,
            FID: null,
            CLS: cls,
            FCP: fcp ? fcp.startTime : 0,
            TTFB: ttfb
          };
        })()
      `,
      returnByValue: true,
    });

    return {
      success: true,
      webVitals: result.result.value,
    };
  }

  /**
   * Run Lighthouse audit (basic)
   */
  async runLighthouseAudit(options?: { categories?: string[] }) {
    const categories = options?.categories || ['performance'];
    // Full Lighthouse requires separate implementation
    return {
      success: false,
      message: `Full Lighthouse audit for categories [${categories.join(', ')}] requires separate lighthouse-node integration`,
      alternative: 'Use getPerformanceMetrics() and getCoreWebVitals() for basic metrics',
    };
  }

  /**
   * Monitor memory usage
   */
  async getMemoryUsage() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const memory = (performance as any).memory || {};
          return {
            usedJSHeapSize: memory.usedJSHeapSize || 0,
            totalJSHeapSize: memory.totalJSHeapSize || 0,
            jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
          };
        })()
      `,
      returnByValue: true,
    });

    return {
      success: true,
      memory: result.result.value,
    };
  }

  /**
   * Detect memory leaks (basic)
   */
  async detectMemoryLeaks(options?: { threshold?: number }) {
    const { threshold = 50 * 1024 * 1024 } = options || {}; // 50MB threshold

    const currentUsage = await this.getMemoryUsage();
    const usedHeap = currentUsage.memory.usedJSHeapSize || 0;

    return {
      success: true,
      potentialLeak: usedHeap > threshold,
      currentUsage: usedHeap,
      threshold,
      recommendation: usedHeap > threshold ? 'High memory usage detected' : 'Memory usage normal',
    };
  }
}
