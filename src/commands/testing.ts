/**
 * Phase 10: Testing & Developer Experience Commands
 */

import { Debugger } from '../utils/debugger.js';

export class TestingCommands {
  private debuggerInstance: Debugger;
  private variables: Map<string, any> = new Map();
  private recordedActions: any[] = [];
  private isRecording: boolean = false;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * 10.1 Built-in Assertions
   * Element visible check
   */
  async assertVisible(options: { selector: string }) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(options.selector)});
          if (!el) return { visible: false, reason: 'not_found' };
          
          // BUG-30 FIX: Check parent visibility chain
          let current = el;
          while (current) {
            const style = window.getComputedStyle(current);
            if (style.display === 'none') return { visible: false, reason: 'display_none' };
            if (style.visibility === 'hidden') return { visible: false, reason: 'visibility_hidden' };
            if (parseFloat(style.opacity) === 0) return { visible: false, reason: 'opacity_0' };
            current = current.parentElement;
          }
          
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return { visible: false, reason: 'zero_size' };
          return { visible: true };
        })()
      `,
      returnByValue: true,
    });
    return { success: true, visible: !!result.result.value?.visible, details: result.result.value };
  }

  /**
   * 10.1 Built-in Assertions
   * Text contains verification
   */
  async assertTextContains(options: { selector: string; text: string }) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(options.selector)});
          return el ? el.textContent?.includes(${JSON.stringify(options.text)}) : false;
        })()
      `,
      returnByValue: true,
    });
    return { success: true, match: !!result.result.value };
  }

  /**
   * 10.1 Built-in Assertions
   * Elements count verification
   */
  async assertCount(options: { selector: string; count: number }) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        document.querySelectorAll(${JSON.stringify(options.selector)}).length
      `,
      returnByValue: true,
    });
    return { success: true, count: result.result.value, matched: result.result.value === options.count };
  }

  /**
   * 10.2 Workflow Management
   * Record actions and generate JSON script
   */
  async recordActions() {
    // BUG-16 FIX: Prevent duplicate listeners
    if (this.isRecording) {
      return { success: false, error: 'Already recording. Stop recording first.' };
    }
    this.isRecording = true;
    this.recordedActions = [];

    await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // Remove previous recording listener if any
          if (window.__swatiRecordAbort) {
            window.__swatiRecordAbort.abort();
          }
          window.__swatiRecordAbort = new AbortController();
          window._recordedSteps = [];
          document.addEventListener('click', (e) => {
            const target = e.target;
            window._recordedSteps.push({
              action: 'click',
              selector: target.id ? '#' + target.id : target.tagName.toLowerCase(),
              timestamp: Date.now()
            });
          }, { capture: true, signal: window.__swatiRecordAbort.signal });
        })()
      `
    });

    return { success: true, recording: true };
  }

  /**
   * 10.2 Workflow Management
   * Replay recorded workflow steps
   */
  async replayWorkflow(options: { steps: any[] }) {
    const replayed: any[] = [];
    for (const step of options.steps) {
      if (step.action === 'click') {
        const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
          expression: `
            (() => {
              const el = document.querySelector(${JSON.stringify(step.selector)});
              if (el) {
                (el as any).click();
                return { clicked: true };
              }
              return { clicked: false };
            })()
          `,
          returnByValue: true
        });
        replayed.push({ step, result: result.result.value });
      }
    }
    return { success: true, replayedCount: replayed.length, replayed };
  }

  /**
   * 10.3 Variable & Environment
   * Set cross-step variable
   */
  async setVariable(options: { key: string; value: any }) {
    this.variables.set(options.key, options.value);
    return { success: true, key: options.key, saved: true };
  }

  /**
   * 10.3 Variable & Environment
   * Environment variable substitution
   */
  async envSubstitution(options: { text: string }) {
    let resultText = options.text;
    this.variables.forEach((val, key) => {
      resultText = resultText.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val.toString());
    });
    return { success: true, substitutedText: resultText };
  }

  /**
   * 10.4 Accessibility & Compliance
   * AXTree compliance scan (WCAG violations)
   */
  async checkAccessibility() {
    const result = await this.debuggerInstance.sendCommand('Accessibility.getFullAXTree', {});
    // BUG-20 FIX: Result path is result.nodes, not result.result.nodes
    const nodes = result.nodes || [];
    
    const violations: any[] = [];
    nodes.forEach((node: any) => {
      if (node.role?.value === 'img' && !node.name) {
        violations.push({ type: 'missing-alt', node });
      }
      if (node.role?.value === 'button' && !node.name) {
        violations.push({ type: 'empty-button', node });
      }
    });

    return {
      success: true,
      axNodesCount: nodes.length,
      violationsCount: violations.length,
      violations
    };
  }
}
