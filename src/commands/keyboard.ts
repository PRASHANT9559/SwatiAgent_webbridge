/**
 * Phase 2: Keyboard Events Commands
 */

import { Debugger } from '../utils/debugger.js';

export class KeyboardCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Press a keyboard key
   */
  async pressKey(options: { key: string; count?: number; modifiers?: string[] }) {
    const { key, count = 1, modifiers = [] } = options;

    for (let i = 0; i < count; i++) {
      const modifierFlags = this.getModifierFlags(modifiers);
      const isPrintable = key.length === 1;

      // Key down
      await this.debuggerInstance.sendCommand('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code: this.getKeyCode(key),
        modifiers: modifierFlags,
        ...(isPrintable && { text: key }),
      });

      // Small delay
      await this.sleep(10);

      // Key up
      await this.debuggerInstance.sendCommand('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code: this.getKeyCode(key),
        modifiers: modifierFlags,
      });

      if (i < count - 1) {
        await this.sleep(50);
      }
    }

    return { success: true, key, count };
  }

  /**
   * Type text character by character
   */
  async typeText(options: { text: string; delay?: number; selector?: string }) {
    const { text, delay = 50, selector } = options;

    if (selector) {
      // Focus the element first
      await this.debuggerInstance.sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return { error: 'Element not found' };
            el.focus();
            return { success: true };
          })()
        `,
        returnByValue: true,
      });
    }

    // Type each character
    for (const char of text) {
      await this.debuggerInstance.sendCommand('Input.insertText', {
        text: char,
      });
      await this.sleep(delay);
    }

    return { success: true, text, length: text.length };
  }

  /**
   * Execute a hotkey combination
   */
  async hotkey(options: { keys: string[] }) {
    const { keys } = options;
    const modifiers = this.getModifierFlags(keys);

    // Press modifiers
    for (const key of keys) {
      if (this.isModifier(key)) {
        await this.debuggerInstance.sendCommand('Input.dispatchKeyEvent', {
          type: 'keyDown',
          key,
          code: this.getKeyCode(key),
          modifiers: this.getModifierFlags([key]),
        });
      }
    }

    // Press the main key
    const mainKey = keys.find(k => !this.isModifier(k));
    if (mainKey) {
      await this.debuggerInstance.sendCommand('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: mainKey,
        code: this.getKeyCode(mainKey),
        modifiers,
      });
      await this.sleep(10);
      await this.debuggerInstance.sendCommand('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: mainKey,
        code: this.getKeyCode(mainKey),
        modifiers,
      });
    }

    // Release modifiers
    for (const key of keys.filter(k => this.isModifier(k)).reverse()) {
      await this.debuggerInstance.sendCommand('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code: this.getKeyCode(key),
        modifiers: this.getModifierFlags([key]),
      });
    }

    return { success: true, keys };
  }

  private isModifier(key: string): boolean {
    return ['Control', 'Alt', 'Shift', 'Meta', 'Command'].includes(key);
  }

  private getKeyCode(key: string): string {
    const keyMap: { [key: string]: string } = {
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Escape': 'Escape',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Home': 'Home',
      'End': 'End',
      'PageUp': 'PageUp',
      'PageDown': 'PageDown',
      'Control': 'ControlLeft',
      'Alt': 'AltLeft',
      'Shift': 'ShiftLeft',
      'Meta': 'MetaLeft',
      'Command': 'MetaLeft',
      ' ': 'Space',
      'Space': 'Space',
      'Insert': 'Insert',
      'CapsLock': 'CapsLock',
      'NumLock': 'NumLock',
      'ScrollLock': 'ScrollLock',
      'ContextMenu': 'ContextMenu',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4',
      'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8',
      'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
    };

    if (keyMap[key]) return keyMap[key];

    // Single character keys
    if (key.length === 1) {
      const code = key.charCodeAt(0);
      // a-z
      if (code >= 97 && code <= 122) return `Key${key.toUpperCase()}`;
      // A-Z
      if (code >= 65 && code <= 90) return `Key${key}`;
      // 0-9
      if (code >= 48 && code <= 57) return `Digit${key}`;
      // Common punctuation
      const punctMap: { [k: string]: string } = {
        '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight',
        '\\': 'Backslash', ';': 'Semicolon', "'": 'Quote', '`': 'Backquote',
        ',': 'Comma', '.': 'Period', '/': 'Slash',
      };
      if (punctMap[key]) return punctMap[key];
    }

    return `Key${key.toUpperCase()}`;
  }

  private getModifierFlags(keys: string[]): number {
    const MODIFIERS = {
      'Control': 1,
      'Alt': 2,
      'Shift': 4,
      'Meta': 8,
      'Command': 8,
    };
    
    return keys.reduce((flags, key) => {
      return flags + (MODIFIERS[key as keyof typeof MODIFIERS] || 0);
    }, 0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
