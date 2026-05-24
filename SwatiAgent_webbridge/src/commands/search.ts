/**
 * Phase 11: Search & Content Commands
 */

import { Debugger } from '../utils/debugger.js';

export class SearchCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * 11.1 Page Search
   * Find text occurrences in page body
   */
  async findText(options: { text: string; caseSensitive?: boolean }) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const search = ${JSON.stringify(options.text)};
          const sensitive = ${options.caseSensitive === true};
          
          const index = sensitive 
            ? bodyText.indexOf(search)
            : bodyText.toLowerCase().indexOf(search.toLowerCase());
            
          return { found: index !== -1, index };
        })()
      `,
      returnByValue: true,
    });
    return { success: true, ...result.result.value };
  }

  /**
   * 11.1 Page Search
   * Highlight text occurrences
   */
  async highlightText(options: { text: string }) {
    await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // BUG-17 FIX: Use TreeWalker to find text nodes instead of innerHTML
          // innerHTML destroys event listeners and breaks SPAs
          const search = ${JSON.stringify(options.text)};
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.toLowerCase().includes(search.toLowerCase())) {
              textNodes.push(node);
            }
          }
          
          textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;
            
            const regex = new RegExp('(' + search.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi');
            const parts = textNode.nodeValue.split(regex);
            
            if (parts.length <= 1) return;
            
            const fragment = document.createDocumentFragment();
            parts.forEach(part => {
              if (regex.test(part)) {
                regex.lastIndex = 0;
                const mark = document.createElement('mark');
                mark.className = 'swatiagent-highlight';
                mark.textContent = part;
                fragment.appendChild(mark);
              } else {
                fragment.appendChild(document.createTextNode(part));
              }
            });
            
            parent.replaceChild(fragment, textNode);
          });
        })()
      `
    });
    return { success: true, highlighted: true };
  }
}
