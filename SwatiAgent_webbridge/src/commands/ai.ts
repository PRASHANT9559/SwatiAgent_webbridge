/**
 * Phase 9: AI & Smart Features Commands
 * 
 * Smart element detection and natural language processing.
 */

import { Debugger } from '../utils/debugger.js';

export class AICommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Natural language command parser
   * BUG-27 FIX: Removed fake confidence score. Properly maps keywords to actions
   * with honest confidence levels based on match quality.
   */
  async nlCommand(command: string) {
    const lower = command.toLowerCase().trim();

    // Extract quoted selectors if present (e.g., 'click on "#submit-btn"')
    const quotedMatch = lower.match(/["']([^"']+)["']/);
    const extractedSelector = quotedMatch ? quotedMatch[1] : null;

    // Pattern matching with actual confidence scores
    const patterns: Array<{ test: RegExp; action: string; buildParams: () => any; confidence: number }> = [
      {
        test: /^(click|tap|press)\s+(on\s+)?/i,
        action: 'click',
        buildParams: () => ({ selector: extractedSelector || this.inferSelector(lower.replace(/^(click|tap|press)\s+(on\s+)?/i, '')) }),
        confidence: extractedSelector ? 0.9 : 0.4,
      },
      {
        test: /^(type|enter|input|fill)\s+/i,
        action: 'fill',
        buildParams: () => {
          const textMatch = lower.match(/["']([^"']+)["']/);
          const intoMatch = lower.match(/(?:in|into)\s+["']([^"']+)["']/);
          return {
            text: textMatch ? textMatch[1] : lower.replace(/^(type|enter|input|fill)\s+/i, ''),
            selector: intoMatch ? intoMatch[1] : 'input:focus',
          };
        },
        confidence: 0.5,
      },
      {
        test: /^(go|navigate|open|visit)\s+(to\s+)?/i,
        action: 'navigate',
        buildParams: () => {
          const url = lower.replace(/^(go|navigate|open|visit)\s+(to\s+)?/i, '').trim();
          return { url: url.startsWith('http') ? url : 'https://' + url };
        },
        confidence: 0.7,
      },
      {
        test: /^(scroll)\s+(down|up|to)/i,
        action: 'scroll',
        buildParams: () => {
          const dir = lower.includes('up') ? 'up' : 'down';
          return { direction: dir };
        },
        confidence: 0.8,
      },
      {
        test: /^(screenshot|capture|snap)/i,
        action: 'screenshot',
        buildParams: () => ({}),
        confidence: 0.9,
      },
    ];

    for (const pattern of patterns) {
      if (pattern.test.test(lower)) {
        return {
          success: true,
          parsed: {
            action: pattern.action,
            params: pattern.buildParams(),
            confidence: pattern.confidence,
            raw: command,
          },
        };
      }
    }

    return {
      success: false,
      error: 'Could not parse command. Use explicit selectors for reliable automation.',
      raw: command,
      confidence: 0,
    };
  }

  /**
   * Infer a CSS selector from natural language description
   */
  private inferSelector(description: string): string {
    const lower = description.trim().toLowerCase();

    // Try to match common element descriptions
    if (lower.includes('submit')) return 'button[type="submit"], input[type="submit"]';
    if (lower.includes('login')) return 'button:has-text("login"), a:has-text("login"), [data-testid*="login"]';
    if (lower.includes('search')) return 'input[type="search"], input[name="q"], [role="searchbox"]';
    if (lower.includes('button')) return 'button';
    if (lower.includes('link')) return 'a';
    if (lower.includes('input') || lower.includes('field')) return 'input:not([type="hidden"])';

    // Fallback: use the description as a text content search
    return `[data-testid="${lower}"], #${lower.replace(/\s+/g, '-')}`;
  }

  /**
   * Smart click - attempts to find and click element by description
   * BUG-28 FIX: Uses the user's description text for matching, not hardcoded strings.
   */
  async smartClick(description: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const desc = ${JSON.stringify(description)}.toLowerCase();
          
          // Strategy 1: Try exact text match on buttons and links
          const clickables = Array.from(document.querySelectorAll('button, a, [role="button"], [onclick], input[type="submit"]'));
          
          // Score each element by relevance to the description
          let bestMatch = null;
          let bestScore = 0;
          
          for (const el of clickables) {
            const text = (el.textContent || '').trim().toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            const title = (el.getAttribute('title') || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            const testId = (el.getAttribute('data-testid') || '').toLowerCase();
            
            let score = 0;
            // Exact match
            if (text === desc) score = 1.0;
            else if (ariaLabel === desc) score = 0.95;
            else if (title === desc) score = 0.9;
            // Contains match
            else if (text.includes(desc)) score = 0.7;
            else if (ariaLabel.includes(desc)) score = 0.65;
            else if (id.includes(desc.replace(/\\s+/g, '-'))) score = 0.6;
            else if (testId.includes(desc.replace(/\\s+/g, '-'))) score = 0.55;
            // Partial word match
            else {
              const words = desc.split(/\\s+/);
              const matchedWords = words.filter(w => text.includes(w) || ariaLabel.includes(w));
              if (matchedWords.length > 0) {
                score = 0.3 * (matchedWords.length / words.length);
              }
            }
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = el;
            }
          }
          
          if (bestMatch && bestScore > 0.2) {
            bestMatch.click();
            return {
              success: true,
              clicked: true,
              confidence: bestScore,
              element: {
                tag: bestMatch.tagName,
                text: (bestMatch.textContent || '').trim().substring(0, 50),
                id: bestMatch.id || null,
              }
            };
          }
          
          return {
            success: false,
            error: 'No matching clickable element found for: ' + desc,
            confidence: bestScore,
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Auto retry with actual action execution
   * BUG-26 FIX: Now accepts and executes an action callback expression.
   */
  async autoRetry(options: {
    actionExpression: string;
    maxRetries?: number;
    retryDelay?: number;
  }) {
    const { actionExpression, maxRetries = 3, retryDelay = 1000 } = options;
    let lastError = '';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
          expression: actionExpression,
          returnByValue: true,
          awaitPromise: true,
        });

        if (result.result.value?.error) {
          lastError = result.result.value.error;
          throw new Error(lastError);
        }

        return {
          success: true,
          attempts: attempt + 1,
          result: result.result.value,
        };
      } catch (e: any) {
        lastError = e.message || String(e);
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    return {
      success: false,
      attempts: maxRetries,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    };
  }
}
