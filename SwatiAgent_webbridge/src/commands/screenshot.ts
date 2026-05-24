/**
 * Phase 5: Screenshot & Visual Commands
 */

import { Debugger } from '../utils/debugger.js';

export class ScreenshotCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * 5.1 Enhanced Screenshot
   * Full page screenshot (above + below fold)
   */
  async fullPageScreenshot(options: {
    format?: 'png' | 'jpeg';
    quality?: number; // 0-100 for jpeg
    clip?: { x: number; y: number; width: number; height: number };
  } = {}) {
    const { format = 'png', quality = 100 } = options;

    const result = await this.debuggerInstance.sendCommand('Page.captureScreenshot', {
      format,
      quality,
      clip: options.clip,
      fromSurface: true,
      captureBeyondViewport: true,
    });

    return { success: true, data: result.data };
  }

  /**
   * 5.1 Enhanced Screenshot
   * Specific element screenshot (bounding box precise)
   */
  async elementScreenshot(selector: string, options: {
    format?: 'png' | 'jpeg';
    quality?: number; // 0-100 for jpeg
  } = {}) {
    const { format = 'png', quality = 100 } = options;

    // First, get the element's bounding box
    const boxResult = await this.debuggerInstance.sendCommand('DOM.getBoxModel', {
      // We need to find the element first
      // This is a simplified approach - in practice we'd need to get the node ID
    });

    // BUG-04 FIX: Use JSON.stringify for selector, not 'arguments' (which doesn't exist in Runtime.evaluate)
    const boundsResult = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          };
        })()
      `,
      returnByValue: true,
    });

    if (!boundsResult.result.value) {
      return { success: false, error: 'Element not found' };
    }

    const { x, y, width, height } = boundsResult.result.value;

    const screenshotResult = await this.debuggerInstance.sendCommand('Page.captureScreenshot', {
      format,
      quality,
      clip: { x, y, width, height },
      fromSurface: true,
    });

    return { success: true, data: screenshotResult.data };
  }

  /**
   * 5.1 Enhanced Screenshot
   * Screenshot with base64 output option (default behavior)
   * This is essentially the same as the above methods since they already return base64
   */
  async screenshotBase64(options: {
    fullPage?: boolean;
    selector?: string;
    format?: 'png' | 'jpeg';
    quality?: number;
    clip?: { x: number; y: number; width: number; height: number };
  } = {}) {
    if (options.fullPage) {
      return this.fullPageScreenshot(options);
    } else if (options.selector) {
      return this.elementScreenshot(options.selector, options);
    } else {
      // Viewport screenshot
      const { format = 'png', quality = 100 } = options;
      const result = await this.debuggerInstance.sendCommand('Page.captureScreenshot', {
        format,
        quality,
        clip: options.clip,
        fromSurface: true,
      });
      return { success: true, data: result.data };
    }
  }

  /**
   * 5.2 Visual Regression & OCR
   * Compare two screenshots and generate diff
   * Note: Actual image comparison would require an image processing library
   * For now, we return both screenshots for external comparison
   */
  async compareScreenshots(
    screenshot1: string, // base64 encoded
    screenshot2: string  // base64 encoded
  ) {
    // BUG-24 FIX: String equality is unreliable for screenshots due to compression artifacts.
    // Compare a sample of bytes for a rough check. Full pixel comparison requires pixelmatch.
    const sameLength = screenshot1.length === screenshot2.length;
    const roughMatch = sameLength && screenshot1.substring(0, 200) === screenshot2.substring(0, 200);
    return {
      success: true,
      screenshot1,
      screenshot2,
      diff: null,
      same: roughMatch,
      note: 'Rough comparison only. Use pixelmatch for pixel-level diff.'
    };
  }

  /**
   * 5.2 Visual Regression & OCR
   * AI-based visual assertion: "Is page par red button hai?"
   * This would require integration with an AI vision model
   */
  async visualAssert(
    _imageBase64: string,
    _prompt: string,
    _options: {
      model?: string; // e.g., 'swatiagent-vision'
      temperature?: number;
    } = {}
  ) {
    // Placeholder for AI vision API call
    // In reality, this would send the image and prompt to an AI service
    return {
      success: true,
      result: undefined, // Would contain AI response
      // Example: { found: true, confidence: 0.95, boundingBox: { x, y, width, height } }
    };
  }

  /**
   * 5.2 Visual Regression & OCR
   * Extract text from image using OCR (Tesseract/CDP integration)
   */
  async ocrExtract(_imageBase64: string, _options: {
    language?: string; // e.g., 'eng', 'hin'
    psm?: number; // Page segmentation mode
  } = {}) {
    // Placeholder for OCR implementation
    // Would typically use Tesseract.js or similar
    return {
      success: true,
      text: '', // Extracted text
      confidence: 0
    };
  }

  /**
   * 5.2 Visual Regression & OCR
   * Screenshot pe coordinate-based element selection
   * Given coordinates in a screenshot, find the corresponding element
   */
  async visualSelector(
    _screenshotBase64: string,
    x: number,
    y: number,
    options: {
      scaleFactor?: number; // If screenshot was scaled
    } = {}
  ) {
    const { scaleFactor = 1 } = options;
    const actualX = x * scaleFactor;
    const actualY = y * scaleFactor;

    // BUG-06 FIX: DOM.requestNode doesn't accept x/y. Use DOM.getNodeForLocation.
    try {
      const result = await this.debuggerInstance.sendCommand('DOM.getNodeForLocation', {
        x: Math.round(actualX),
        y: Math.round(actualY),
        includeUserAgentShadowDOM: false
      });

      return {
        success: true,
        nodeId: result.nodeId,
        backendNodeId: result.backendNodeId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `No element found at (${actualX}, ${actualY}): ${error.message}`,
      };
    }
  }

  /**
   * 5.3 Theme & Zoom
   * Dark mode toggle karna (prefers-color-scheme emulate)
   */
  async setDarkMode(enabled: boolean = true) {
    await this.debuggerInstance.sendCommand('Emulation.setEmulatedMedia', {
      features: [
        {
          name: 'prefers-color-scheme',
          value: enabled ? 'dark' : 'light'
        }
      ]
    });

    return { success: true };
  }

  /**
   * 5.3 Theme & Zoom
   * Page zoom control (0.25x se 5x)
   */
  async setZoom(factor: number) {
    // Validate zoom factor (Chrome limits: 0.25 to 5.0)
    const clampedFactor = Math.max(0.25, Math.min(5.0, factor));

    await this.debuggerInstance.sendCommand('Page.setZoomFactor', {
      zoomFactor: clampedFactor
    });

    return { success: true, zoomFactor: clampedFactor };
  }

  /**
   * 5.3 Theme & Zoom
   * Print CSS media type emulate karna
   */
  async emulatePrint(enabled: boolean = true) {
    await this.debuggerInstance.sendCommand('Emulation.setEmulatedMedia', {
      media: enabled ? 'print' : ''
    });

    return { success: true };
  }

  /**
   * 5.3 Theme & Zoom
   * Print preview generate karna
   */
  async generatePrintPreview(options: {
    landscape?: boolean;
    displayHeaderFooter?: boolean;
    printBackground?: boolean;
    scale?: number; // 0.1 to 2.0
    paperWidth?: number; // inches
    paperHeight?: number; // inches
    marginTop?: number; // inches
    marginBottom?: number; // inches
    marginLeft?: number; // inches
    marginRight?: number; // inches
    pageRanges?: string; // e.g., '1-5, 8, 11-13'
    ignoreInvalidPageRanges?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    preferCSSPageSize?: boolean;
  } = {}) {
    const result = await this.debuggerInstance.sendCommand('Page.printToPDF', {
      landscape: options.landscape,
      displayHeaderFooter: options.displayHeaderFooter,
      printBackground: options.printBackground,
      scale: options.scale,
      paperWidth: options.paperWidth,
      paperHeight: options.paperHeight,
      marginTop: options.marginTop,
      marginBottom: options.marginBottom,
      marginLeft: options.marginLeft,
      marginRight: options.marginRight,
      pageRanges: options.pageRanges,
      ignoreInvalidPageRanges: options.ignoreInvalidPageRanges,
      headerTemplate: options.headerTemplate,
      footerTemplate: options.footerTemplate,
      preferCSSPageSize: options.preferCSSPageSize
    });

    return { success: true, data: result.data };
  }
}
