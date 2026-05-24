/**
 * Phase 4: Form Handling Commands
 * 
 * Legitimate form automation for testing and data extraction.
 */

import { Debugger } from '../utils/debugger.js';

export class FormCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Submit a form
   */
  async submitForm(options?: { selector?: string }) {
    const selector = options?.selector;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const form = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'document.querySelector("form")'};
          if (!form) return { error: 'Form not found' };
          
          // Check for form validation
          if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
            return { error: 'Form validation failed' };
          }
          
          // Submit the form
          form.submit();
          return { success: true, action: form.action || window.location.href };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`submitForm: ${result.result.value.error}`);
    }

    return { success: true, ...result.result.value };
  }

  /**
   * Get form data as key-value pairs
   */
  async getFormData(options?: { selector?: string }) {
    const selector = options?.selector;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const form = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'document.querySelector("form")'};
          if (!form) return { error: 'Form not found' };
          
          const formData = new FormData(form);
          const data = {};
          
          for (const [key, value] of formData.entries()) {
            data[key] = value;
          }
          
          return { success: true, data, fieldCount: Object.keys(data).length };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`getFormData: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Clear all form fields
   */
  async clearForm(options?: { selector?: string }) {
    const selector = options?.selector;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const form = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'document.querySelector("form")'};
          if (!form) return { error: 'Form not found' };
          
          // Reset form
          form.reset();
          
          // Clear all input fields
          const inputs = form.querySelectorAll('input, textarea, select');
          inputs.forEach(input => {
            if (input.tagName === 'SELECT') {
              input.selectedIndex = -1;
            } else if (input.type !== 'hidden') {
              // Use native setter to work with React's synthetic events
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
              )?.set || Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, 'value'
              )?.set;
              
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(input, '');
              } else {
                input.value = '';
              }
            }
            // Dispatch events for framework compatibility (React, Vue, Angular)
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
          
          // Clear contenteditable elements
          const contentEditables = form.querySelectorAll('[contenteditable]');
          contentEditables.forEach(el => {
            el.textContent = '';
          });
          
          return { success: true };
        })()
      `,
      returnByValue: true,
    });

    return { success: true, ...result.result.value };
  }

  /**
   * Get form validation state
   */
  async getFormValidation(options?: { selector?: string }) {
    const selector = options?.selector;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const form = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : 'document.querySelector("form")'};
          if (!form) return { error: 'Form not found' };
          
          const inputs = form.querySelectorAll('input, textarea, select');
          const validation = {
            isValid: form.checkValidity(),
            fields: []
          };
          
          inputs.forEach(input => {
            if (input.checkValidity) {
              validation.fields.push({
                name: input.name || 'unnamed',
                type: input.type || input.tagName,
                isValid: input.checkValidity(),
                validity: input.validity ? {
                  valid: input.validity.valid,
                  valueMissing: input.validity.valueMissing,
                  typeMismatch: input.validity.typeMismatch,
                  patternMismatch: input.validity.patternMismatch,
                  tooLong: input.validity.tooLong,
                  tooShort: input.validity.tooShort,
                  rangeUnderflow: input.validity.rangeUnderflow,
                  rangeOverflow: input.validity.rangeOverflow,
                  stepMismatch: input.validity.stepMismatch,
                  badInput: input.validity.badInput,
                  customError: input.validity.customError
                } : {}
              });
            }
          });
          
          return { success: true, ...validation };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Set multiple form fields at once
   */
  async setFormFields(fields: { selector: string; value: string }[]) {
    const results: any[] = [];
    
    for (const field of fields) {
      try {
        const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
          expression: `
            (() => {
              const el = document.querySelector(${JSON.stringify(field.selector)});
              if (!el) return { error: 'Element not found' };
              
              if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = ${JSON.stringify(field.value)};
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return { success: true, selector: ${JSON.stringify(field.selector)} };
              }
              
              return { error: 'Not an input element' };
            })()
          `,
          returnByValue: true,
        });

        results.push(result.result.value);
      } catch (error: any) {
        results.push({ error: error.message });
      }
    }

    return {
      success: true,
      results,
      successCount: results.filter(r => r.success).length,
    };
  }

  /**
   * Get form field by label text
   */
  async getFieldByLabel(labelText: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // Find label with matching text
          const labels = Array.from(document.querySelectorAll('label'));
          const matchingLabel = labels.find(label => 
            label.textContent?.trim().toLowerCase().includes(${JSON.stringify(labelText.toLowerCase())})
          );
          
          if (!matchingLabel) {
            // Try to find by input's placeholder or aria-label
            const inputs = Array.from(document.querySelectorAll('input, textarea'));
            const matchingInput = inputs.find(input => 
              input.placeholder?.toLowerCase().includes(${JSON.stringify(labelText.toLowerCase())}) ||
              input.getAttribute('aria-label')?.toLowerCase().includes(${JSON.stringify(labelText.toLowerCase())})
            );
            
            if (matchingInput) {
              return {
                success: true,
                selector: matchingInput.id ? '#' + matchingInput.id : null,
                type: 'input',
                value: matchingInput.value
              };
            }
            
            return { error: 'Field not found' };
          }
          
          // Get associated input
          const forId = matchingLabel.getAttribute('for');
          if (forId) {
            const input = document.getElementById(forId);
            if (input) {
              return {
                success: true,
                selector: '#' + forId,
                type: input.tagName.toLowerCase(),
                value: input.value || input.textContent
              };
            }
          }
          
          // Label contains the input
          const input = matchingLabel.querySelector('input, textarea, select');
          if (input) {
            return {
              success: true,
              selector: input.id ? '#' + input.id : null,
              type: input.tagName.toLowerCase(),
              value: input.value || input.textContent
            };
          }
          
          return { error: 'No input associated with label' };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }
}
