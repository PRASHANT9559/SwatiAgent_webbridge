/**
 * Phase 4: Drag & Drop Commands
 * 
 * Handle drag-drop operations for sortable lists and file uploads.
 */

import { Debugger } from '../utils/debugger.js';

export class DragDropCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Drag element to target
   * BUG-08 FIX: Selectors sanitized with JSON.stringify
   * BUG-23 FIX: Use DragEvent with DataTransfer instead of MouseEvent
   */
  async dragAndDrop(options: { source: string; target: string; delay?: number }) {
    const { source, target, delay = 100 } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const sourceEl = document.querySelector(${JSON.stringify(source)});
          const targetEl = document.querySelector(${JSON.stringify(target)});
          
          if (!sourceEl) return { error: 'Source element not found' };
          if (!targetEl) return { error: 'Target element not found' };
          
          const sourceRect = sourceEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          
          const sourceX = sourceRect.left + sourceRect.width / 2;
          const sourceY = sourceRect.top + sourceRect.height / 2;
          const targetX = targetRect.left + targetRect.width / 2;
          const targetY = targetRect.top + targetRect.height / 2;
          
          // BUG-23 FIX: Use DragEvent with DataTransfer for proper library compatibility
          const dragData = new DataTransfer();
          
          function createDragEvent(type, x, y) {
            return new DragEvent(type, {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              dataTransfer: dragData
            });
          }
          
          sourceEl.dispatchEvent(createDragEvent('dragstart', sourceX, sourceY));
          sourceEl.dispatchEvent(createDragEvent('drag', sourceX, sourceY));
          targetEl.dispatchEvent(createDragEvent('dragenter', targetX, targetY));
          targetEl.dispatchEvent(createDragEvent('dragover', targetX, targetY));
          targetEl.dispatchEvent(createDragEvent('drop', targetX, targetY));
          sourceEl.dispatchEvent(createDragEvent('dragend', targetX, targetY));
          
          return {
            success: true,
            source: { x: sourceX, y: sourceY },
            target: { x: targetX, y: targetY }
          };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`dragAndDrop: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Drag to specific coordinates
   * BUG-08 FIX: Selector sanitized
   */
  async dragToCoordinates(options: { source: string; x: number; y: number }) {
    const { source, x, y } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const sourceEl = document.querySelector(${JSON.stringify(source)});
          if (!sourceEl) return { error: 'Source element not found' };
          
          const sourceRect = sourceEl.getBoundingClientRect();
          const sourceX = sourceRect.left + sourceRect.width / 2;
          const sourceY = sourceRect.top + sourceRect.height / 2;
          const targetX = ${JSON.stringify(x)};
          const targetY = ${JSON.stringify(y)};
          
          const dragData = new DataTransfer();
          function createDragEvent(type, cx, cy) {
            return new DragEvent(type, {
              view: window, bubbles: true, cancelable: true,
              clientX: cx, clientY: cy, dataTransfer: dragData
            });
          }
          
          sourceEl.dispatchEvent(createDragEvent('dragstart', sourceX, sourceY));
          sourceEl.dispatchEvent(createDragEvent('drag', sourceX, sourceY));
          sourceEl.dispatchEvent(createDragEvent('dragend', targetX, targetY));
          
          return {
            success: true,
            source: { x: sourceX, y: sourceY },
            target: { x: targetX, y: targetY }
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Interact with sortable list (React Beautiful DND, SortableJS)
   * BUG-08 FIX: Selector sanitized
   */
  async sortableInteract(options: {
    list: string;
    fromIndex: number;
    toIndex: number;
  }) {
    const { list, fromIndex, toIndex } = options;

    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const listEl = document.querySelector(${JSON.stringify(list)});
          if (!listEl) return { error: 'List not found' };
          
          const items = listEl.querySelectorAll(':scope > *:not([draggable="false"])');
          if (!items[${JSON.stringify(fromIndex)}]) return { error: 'From index out of bounds' };
          if (!items[${JSON.stringify(toIndex)}]) return { error: 'To index out of bounds' };
          
          const fromItem = items[${JSON.stringify(fromIndex)}];
          const toItem = items[${JSON.stringify(toIndex)}];
          
          const dragData = new DataTransfer();
          fromItem.setAttribute('draggable', 'true');
          
          fromItem.dispatchEvent(new DragEvent('dragstart', {
            bubbles: true, cancelable: true, dataTransfer: dragData
          }));
          
          toItem.dispatchEvent(new DragEvent('dragenter', {
            bubbles: true, cancelable: true, dataTransfer: dragData
          }));
          
          toItem.dispatchEvent(new DragEvent('dragover', {
            bubbles: true, cancelable: true, dataTransfer: dragData
          }));
          
          toItem.dispatchEvent(new DragEvent('drop', {
            bubbles: true, cancelable: true, dataTransfer: dragData
          }));
          
          fromItem.dispatchEvent(new DragEvent('dragend', {
            bubbles: true, cancelable: true, dataTransfer: dragData
          }));
          
          fromItem.removeAttribute('draggable');
          
          return {
            success: true,
            fromIndex: ${JSON.stringify(fromIndex)},
            toIndex: ${JSON.stringify(toIndex)},
            list: ${JSON.stringify(list)}
          };
        })()
      `,
      returnByValue: true,
    });

    if (result.result.value?.error) {
      throw new Error(`sortableInteract: ${result.result.value.error}`);
    }

    return result.result.value;
  }

  /**
   * Upload file using DOM.setFileInputFiles
   * BUG-25 FIX: Use backendNodeId instead of selector (which is not a valid parameter)
   */
  async uploadFile(options: { selector: string; filePath: string }) {
    const { selector, filePath } = options;

    // First, get the backendNodeId for the file input
    const evalResult = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };
          if (el.tagName !== 'INPUT' || el.type !== 'file') {
            return { error: 'Element is not a file input' };
          }
          return { found: true };
        })()
      `,
      returnByValue: true,
    });

    if (evalResult.result.value?.error) {
      throw new Error(`uploadFile: ${evalResult.result.value.error}`);
    }

    // Get DOM node
    await this.debuggerInstance.sendCommand('DOM.enable');
    const doc = await this.debuggerInstance.sendCommand('DOM.getDocument');
    const nodeResult = await this.debuggerInstance.sendCommand('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector: selector,
    });

    if (!nodeResult.nodeId) {
      throw new Error('uploadFile: Could not find node');
    }

    await this.debuggerInstance.sendCommand('DOM.setFileInputFiles', {
      nodeId: nodeResult.nodeId,
      files: [filePath],
    });

    return {
      success: true,
      selector,
      filePath,
    };
  }

  /**
   * Check if element is draggable
   * BUG-08 FIX: Selector sanitized
   */
  async isDraggable(selector: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };
          
          const isDraggable = el.draggable || 
                             el.getAttribute('draggable') === 'true' ||
                             el.hasAttribute('draggable');
          
          return {
            draggable: isDraggable,
            hasDragEvents: !!(el.ondragstart || el.ondragend || el.ondragover),
            isSortable: !!el.closest('[role="listbox"]') || !!el.closest('.sortable')
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  /**
   * Get drop zone information
   * BUG-08 FIX: Selector sanitized
   */
  async getDropZoneInfo(selector: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };
          
          const rect = el.getBoundingClientRect();
          
          return {
            isDropZone: el.getAttribute('dropzone') !== null,
            accepts: el.getAttribute('dropzone') || null,
            rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
            hasDragOver: !!el.ondragover,
            hasDrop: !!el.ondrop,
            hasDragEnter: !!el.ondragenter,
            hasDragLeave: !!el.ondragleave
          };
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }
}
