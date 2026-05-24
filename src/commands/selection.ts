/**
 * Phase 2: Selection & Extraction Commands
 */

import { Debugger } from '../utils/debugger.js';

export class SelectionCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Select an option from a dropdown (native <select> and custom)
   */
  async selectOption(options: { selector: string; value?: string; text?: string; index?: number }) {
    const { selector, value, text, index } = options;

    // BUG-12 FIX: Properly serialize all user inputs
    const valueJson = JSON.stringify(value !== undefined ? value : null);
    const textJson = JSON.stringify(text !== undefined ? text : null);
    const indexJson = JSON.stringify(index !== undefined ? index : null);

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };
          
          const _value = ${valueJson};
          const _text = ${textJson};
          const _index = ${indexJson};
          
          // Native select element
          if (el.tagName === 'SELECT') {
            const select = el;
            if (_value !== null) {
              select.value = _value;
            } else if (_text !== null) {
              const option = Array.from(select.options).find(opt => opt.text === _text);
              if (option) select.value = option.value;
            } else if (_index !== null) {
              select.selectedIndex = _index;
            }
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, mode: 'native' };
          }
          
          // Custom dropdown (role="listbox" or [data-role="dropdown"])
          const isCustomDropdown = (el.hasAttribute('role') && el.getAttribute('role') === 'listbox') ||
                                   el.hasAttribute('data-dropdown') ||
                                   el.classList.contains('dropdown');
          
          if (isCustomDropdown) {
            el.click();
            
            // Use MutationObserver instead of fragile setTimeout
            // Wait for dropdown options to appear in the DOM
            return new Promise((resolve) => {
              const maxWait = 2000;
              const startTime = Date.now();
              
              const trySelect = () => {
                const options = el.querySelectorAll('[role="option"], .dropdown-option, [data-option], li');
                let targetOption;
                if (_value !== null) targetOption = Array.from(options).find(opt => opt.dataset?.value === _value);
                if (_text !== null) targetOption = Array.from(options).find(opt => opt.textContent?.trim() === _text);
                if (_index !== null && _index < options.length) targetOption = options[_index];
                
                if (targetOption) {
                  targetOption.click();
                  return { success: true, mode: 'custom', found: true };
                }
                return null;
              };
              
              // Try immediately first
              const immediate = trySelect();
              if (immediate) { resolve(immediate); return; }
              
              // Watch for new children
              const observer = new MutationObserver(() => {
                const result = trySelect();
                if (result) {
                  observer.disconnect();
                  resolve(result);
                }
              });
              
              observer.observe(el.parentElement || document.body, { childList: true, subtree: true });
              
              // Timeout fallback
              setTimeout(() => {
                observer.disconnect();
                const lastTry = trySelect();
                resolve(lastTry || { success: false, mode: 'custom', error: 'Dropdown options did not appear within 2s' });
              }, maxWait);
            });
          }
          
          return { error: 'Not a selectable element' };
        })()
      `,
      returnByValue: true,
      awaitPromise: true,
    });

    if (result.result.value?.error) {
      throw new Error(`selectOption: ${result.result.value.error}`);
    }

    return { success: true, ...result.result.value };
  }

  /**
   * Get all links from the page
   */
  async getAllLinks() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          return links.map(link => ({
            href: link.href,
            text: link.textContent?.trim() || '',
            title: link.title || '',
            target: link.target || '',
            rel: link.rel || '',
            isExternal: link.hostname !== window.location.hostname
          }));
        })()
      `,
      returnByValue: true,
    });

    return { success: true, links: result.result.value || [] };
  }

  /**
   * Get all images from the page
   */
  async getAllImages() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const images = Array.from(document.querySelectorAll('img'));
          return images.map(img => ({
            src: img.src,
            alt: img.alt || '',
            title: img.title || '',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            loading: img.loading || 'auto',
            isInViewport: (() => {
              const rect = img.getBoundingClientRect();
              return (
                rect.top >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.left >= 0 &&
                rect.right <= window.innerWidth
              );
            })()
          }));
        })()
      `,
      returnByValue: true,
    });

    return { success: true, images: result.result.value || [] };
  }

  /**
   * Extract table data as JSON/CSV
   */
  async extractTable(options: { selector: string; format?: 'json' | 'csv' }) {
    const { selector, format = 'json' } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const table = document.querySelector(${JSON.stringify(selector)});
          if (!table) return { error: 'Table not found' };
          
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length === 0) return { error: 'No rows found' };
          
          // Extract headers
          const headers = Array.from(rows[0]?.querySelectorAll('th') || [])
            .map(th => th.textContent?.trim() || '');
          
          // Extract data
          const data = rows.map((row, i) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            const rowData = cells.map(cell => cell.textContent?.trim() || '');
            
            // Use headers if available, otherwise use indices
            if (headers.length > 0 && i > 0) {
              return Object.fromEntries(
                headers.map((h, j) => [h || 'col_' + j, rowData[j] || ''])
              );
            }
            return rowData;
          });
          
          return {
            headers: headers.length > 0 ? headers : null,
            data: data.slice(1), // Skip header row in data
            rowCount: data.length - 1,
            columnCount: data[0]?.length || headers.length || 0
          };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`extractTable: ${result.result.value.error}`);
    }

    // Convert to CSV if requested
    if (format === 'csv') {
      const { headers, data } = result.result.value;
      const csvRows: string[] = [];
      
      // Helper to escape CSV fields containing commas, quotes, or newlines
      const escapeField = (val: any): string => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };
      
      if (headers) {
        csvRows.push(headers.map(escapeField).join(','));
      }
      
      data.forEach((row: any) => {
        if (Array.isArray(row)) {
          csvRows.push(row.map(escapeField).join(','));
        } else {
          csvRows.push(Object.values(row).map(escapeField).join(','));
        }
      });
      
      return { 
        success: true, 
        format: 'csv',
        csv: csvRows.join('\n')
      };
    }

    return { success: true, format: 'json', ...result.result.value };
  }

  /**
   * Extract schema.org structured data
   */
  async extractSchema() {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const schemas = [];
          
          // JSON-LD
          document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
              schemas.push({
                type: 'json-ld',
                data: JSON.parse(script.textContent || '{}')
              });
            } catch (e) {}
          });
          
          // Microdata
          document.querySelectorAll('[itemscope]').forEach(item => {
            const schema = {
              type: item.getAttribute('itemtype') || 'unknown',
              properties: {}
            };
            
            item.querySelectorAll('[itemprop]').forEach(prop => {
              const name = prop.getAttribute('itemprop');
              const value = prop.getAttribute('content') || 
                           prop.textContent?.trim() || 
                           prop.getAttribute('href') ||
                           prop.getAttribute('src');
              if (name && value) {
                schema.properties[name] = value;
              }
            });
            
            schemas.push(schema);
          });
          
          return schemas;
        })()
      `,
      returnByValue: true,
    });

    return { success: true, schemas: result.result.value || [] };
  }
}
