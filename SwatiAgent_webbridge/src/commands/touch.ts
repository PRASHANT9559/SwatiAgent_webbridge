/**
 * Phase 4: Mobile & Touch Emulation
 * 
 * Emulate touch devices and mobile interactions.
 */

import { Debugger } from '../utils/debugger.js';

export class TouchCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Emulate touch device
   */
  async emulateDevice(options: {
    deviceName?: string;
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
    userAgent?: string;
    hasTouch?: boolean;
  }) {
    const {
      deviceName = 'iPhone 13',
      width = 390,
      height = 844,
      deviceScaleFactor = 3,
      userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      hasTouch = true,
    } = options;

    // Set device metrics
    await this.debuggerInstance.sendCommand('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: true,
      fitWindow: false,
    });

    // Set user agent
    await this.debuggerInstance.sendCommand('Emulation.setUserAgentOverride', {
      userAgent,
    });

    // Set touch emulation
    await this.debuggerInstance.sendCommand('Emulation.setTouchEmulationEnabled', {
      enabled: hasTouch,
      configuration: 'mobile',
    });

    return {
      success: true,
      device: {
        name: deviceName,
        width,
        height,
        deviceScaleFactor,
        hasTouch,
        userAgent,
      },
    };
  }

  /**
   * Set custom viewport
   */
  async setViewport(options: { width: number; height: number; deviceScaleFactor?: number }) {
    const { width, height, deviceScaleFactor = 1 } = options;

    await this.debuggerInstance.sendCommand('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: false,
      fitWindow: false,
    });

    return {
      success: true,
      viewport: { width, height, deviceScaleFactor },
    };
  }

  /**
   * Simulate touch tap
   */
  async touchTap(options: { x: number; y: number }) {
    const { x, y } = options;

    // Touch start
    await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, radiusX: 10, radiusY: 10 }],
    });

    // BUG-22 FIX: touchEnd must have empty touchPoints array per CDP spec
    await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    return {
      success: true,
      x,
      y,
    };
  }

  /**
   * Simulate pinch zoom
   */
  async pinchZoom(options: {
    x: number;
    y: number;
    startRadius: number;
    endRadius: number;
    steps?: number;
  }) {
    const { x, y, startRadius, endRadius, steps = 10 } = options;

    // BUG-21 FIX: Must dispatch touchStart first
    await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x - startRadius, y, radiusX: 10, radiusY: 10 },
        { x: x + startRadius, y, radiusX: 10, radiusY: 10 },
      ],
    });

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentRadius = startRadius + (endRadius - startRadius) * progress;

      await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: x - currentRadius, y, radiusX: 10, radiusY: 10 },
          { x: x + currentRadius, y, radiusX: 10, radiusY: 10 },
        ],
      });

      await this.sleep(16); // ~60fps
    }

    // BUG-21 FIX: Must dispatch touchEnd with empty touchPoints
    await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    return {
      success: true,
      x,
      y,
      startRadius,
      endRadius,
    };
  }

  /**
   * Simulate swipe gesture
   */
  async swipe(options: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    steps?: number;
  }) {
    const { startX, startY, endX, endY, steps = 20 } = options;

    // Touch start
    await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: startY, radiusX: 10, radiusY: 10 }],
    });

    // Touch move
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;

      await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, radiusX: 10, radiusY: 10 }],
      });

      await this.sleep(16);
    }

    // Touch end
    await this.debuggerInstance.sendCommand('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [{ x: endX, y: endY, radiusX: 10, radiusY: 10 }],
    });

    return {
      success: true,
      from: { x: startX, y: startY },
      to: { x: endX, y: endY },
    };
  }

  /**
   * Simulate swipe up
   */
  async swipeUp(steps?: number) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          };
        })()
      `,
      returnByValue: true,
    });

    const { width, height } = result.result.value;
    const startX = width / 2;
    const startY = height * 0.8;
    const endY = height * 0.2;

    return this.swipe({
      startX,
      startY,
      endX: startX,
      endY,
      steps,
    });
  }

  /**
   * Simulate swipe down
   */
  async swipeDown(steps?: number) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            width: window.innerWidth,
            height: window.innerHeight
          };
        })()
      `,
      returnByValue: true,
    });

    const { width, height } = result.result.value;
    const startX = width / 2;
    const startY = height * 0.2;
    const endY = height * 0.8;

    return this.swipe({
      startX,
      startY,
      endX: startX,
      endY,
      steps,
    });
  }

  /**
   * Set user agent override
   */
  async setUserAgent(userAgent: string) {
    await this.debuggerInstance.sendCommand('Emulation.setUserAgentOverride', {
      userAgent,
    });

    return {
      success: true,
      userAgent,
    };
  }

  /**
   * Set geolocation override
   */
  async setGeolocation(options: { latitude: number; longitude: number; accuracy?: number }) {
    const { latitude, longitude, accuracy = 10 } = options;

    await this.debuggerInstance.sendCommand('Emulation.setGeolocationOverride', {
      latitude,
      longitude,
      accuracy,
    });

    return {
      success: true,
      latitude,
      longitude,
      accuracy,
    };
  }

  /**
   * Clear all emulation overrides
   */
  async clearEmulation() {
    await this.debuggerInstance.sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 0,
      height: 0,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // BUG-31 FIX: Use clearGeolocationOverride instead of passing null values
    await this.debuggerInstance.sendCommand('Emulation.clearGeolocationOverride', {});

    return {
      success: true,
      message: 'Emulation cleared',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
