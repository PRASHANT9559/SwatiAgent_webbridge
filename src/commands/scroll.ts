/**
 * Phase 2: Scrolling Commands
 */

import { Debugger } from '../utils/debugger.js';

export class ScrollCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Scroll to a specific element or position
   */
  async scrollTo(options: { selector?: string; x?: number; y?: number; behavior?: 'auto' | 'smooth' }) {
    const { selector, x, y, behavior = 'smooth' } = options;

    if (selector) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return { error: 'Element not found' };

            el.scrollIntoView({
              behavior: ${JSON.stringify(behavior)},
              block: 'center',
              inline: 'center'
            });

            return {
              success: true,
              x: window.scrollX,
              y: window.scrollY
            };
          })()
        `,
        returnByValue: true,
      });

      if (result.result.value?.error) {
        throw new Error(`scrollTo: ${result.result.value.error}`);
      }

      return result.result.value;
    } else if (x !== undefined || y !== undefined) {
      const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            window.scrollTo({
              left: ${JSON.stringify(x || 0)},
              top: ${JSON.stringify(y || 0)},
              behavior: ${JSON.stringify(behavior)}
            });
            return {
              success: true,
              x: window.scrollX,
              y: window.scrollY
            };
          })()
        `,
        returnByValue: true,
      });

      return result.result.value;
    }

    throw new Error('scrollTo: Either selector or coordinates required');
  }

  /**
   * Scroll the page up or down
   */
  async scrollPage(options: { direction: 'up' | 'down' | 'left' | 'right'; amount?: number }) {
    const { direction, amount = 500 } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const scrollAmount = ${amount};
          let x = window.scrollX;
          let y = window.scrollY;

          switch(${JSON.stringify(direction)}) {
            case 'up':
              y -= scrollAmount;
              break;
            case 'down':
              y += scrollAmount;
              break;
            case 'left':
              x -= scrollAmount;
              break;
            case 'right':
              x += scrollAmount;
              break;
          }

          window.scrollTo(x, y);

          return {
            success: true,
            x: window.scrollX,
            y: window.scrollY,
            direction: ${JSON.stringify(direction)},
            amount: scrollAmount
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };

          el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });

          return { success: true };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`scrollIntoView: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Get scroll position and dimensions
   */
  async getScrollInfo() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            scrollHeight: document.documentElement.scrollHeight,
            scrollWidth: document.documentElement.scrollWidth,
            maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
            maxScrollX: document.documentElement.scrollWidth - window.innerWidth
          };
        })()
      `,
      returnByValue: true,
    });

    return { success: true, ...result.result.value };
  }

  /**
   * Scroll to percentage of page
   */
  async scrollToPercentage(options: { x?: number; y?: number }) {
    const { x = 0, y = 0 } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const maxX = document.documentElement.scrollWidth - window.innerWidth;
          const maxY = document.documentElement.scrollHeight - window.innerHeight;

          window.scrollTo(
            (maxX * ${x / 100}) || 0,
            (maxY * ${y / 100}) || 0
          );

          return {
            success: true,
            x: window.scrollX,
            y: window.scrollY,
            percentage: { x: ${x}, y: ${y} }
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }
}
