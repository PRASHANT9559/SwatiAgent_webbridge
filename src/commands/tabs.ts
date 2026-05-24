/**
 * Phase 7: Tab & Window Operations
 * 
 * Advanced tab and window management.
 */

import { Debugger } from '../utils/debugger.js';

export class TabCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Switch to specific tab
   */
  async switchTab(options: { tabId?: number; index?: number; title?: string }) {
    const { tabId, index, title } = options;

    if (tabId) {
      await chrome.tabs.update(tabId, { active: true });
      return { success: true, tabId };
    }

    if (index !== undefined) {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const tab = tabs[index];
      if (tab?.id) {
        await chrome.tabs.update(tab.id, { active: true });
        return { success: true, tabId: tab.id, index };
      }
    }

    if (title) {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find((t) => t.title?.includes(title));
      if (tab?.id) {
        await chrome.tabs.update(tab.id, { active: true });
        return { success: true, tabId: tab.id, title };
      }
    }

    return {
      success: false,
      error: 'No matching tab found',
    };
  }

  /**
   * Get all tabs
   */
  async getAllTabs(windowId?: number) {
    const query: chrome.tabs.QueryInfo = windowId !== undefined ? { windowId } : {};
    const tabs = await chrome.tabs.query(query);

    return {
      success: true,
      tabs: tabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        index: tab.index,
        active: tab.active,
        highlighted: tab.highlighted,
        pinned: tab.pinned,
        audible: tab.audible,
        muted: tab.mutedInfo?.muted,
        width: tab.width,
        height: tab.height,
        sessionId: tab.sessionId,
      })),
      count: tabs.length,
      windowId: windowId,
    };
  }

  /**
   * Create new tab
   */
  async createTab(options?: {
    url?: string;
    index?: number;
    active?: boolean;
    pinned?: boolean;
  }) {
    const createProperties: chrome.tabs.CreatePropertiesType = {
      url: options?.url || 'about:blank',
      index: options?.index,
      active: options?.active !== false,
      pinned: options?.pinned,
    };

    const tab = await chrome.tabs.create(createProperties);

    return {
      success: true,
      tab: {
        id: tab.id,
        url: tab.url,
        index: tab.index,
        pinned: tab.pinned,
      },
    };
  }

  /**
   * Close tab
   */
  async closeTab(tabId?: number) {
    const id = tabId || (await this.getCurrentTabId());

    if (!id) {
      return {
        success: false,
        error: 'No tab specified',
      };
    }

    await chrome.tabs.remove(id);

    return {
      success: true,
      tabId: id,
    };
  }

  /**
   * Duplicate tab
   */
  async duplicateTab(tabId?: number) {
    const id = tabId || (await this.getCurrentTabId());

    if (!id) {
      return {
        success: false,
        error: 'No tab specified',
      };
    }

    const tab = await chrome.tabs.duplicate(id);

    return {
      success: true,
      tab: {
        id: tab.id,
        url: tab.url,
        index: tab.index,
      },
    };
  }

  /**
   * Reload tab
   */
  async reloadTab(tabId?: number, options?: { bypassCache?: boolean }) {
    const id = tabId || (await this.getCurrentTabId());

    if (!id) {
      return {
        success: false,
        error: 'No tab specified',
      };
    }

    await chrome.tabs.reload(id, {
      bypassCache: options?.bypassCache,
    });

    return {
      success: true,
      tabId: id,
      reloaded: true,
    };
  }

  /**
   * Toggle mute tab
   */
  async toggleMuteTab(tabId?: number) {
    const id = tabId || (await this.getCurrentTabId());

    if (!id) {
      return {
        success: false,
        error: 'No tab specified',
      };
    }

    const tab = await chrome.tabs.get(id);
    const muted = tab.mutedInfo?.muted || false;

    await chrome.tabs.update(id, { muted: !muted });

    return {
      success: true,
      tabId: id,
      muted: !muted,
    };
  }

  /**
   * Pin/unpin tab
   */
  async togglePinTab(tabId?: number) {
    const id = tabId || (await this.getCurrentTabId());

    if (!id) {
      return {
        success: false,
        error: 'No tab specified',
      };
    }

    const tab = await chrome.tabs.get(id);
    const pinned = tab.pinned || false;

    await chrome.tabs.update(id, { pinned: !pinned });

    return {
      success: true,
      tabId: id,
      pinned: !pinned,
    };
  }

  /**
   * Get current tab ID
   */
  private async getCurrentTabId(): Promise<number | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id || null;
  }

  /**
   * Group tabs
   */
  async groupTabs(tabIds?: number[], groupTitle?: string) {
    const ids = tabIds || [(await this.getCurrentTabId())];

    if (!ids[0]) {
      return {
        success: false,
        error: 'No tab specified',
      };
    }

    const groupId = await chrome.tabs.group({ tabIds: ids });

    if (groupTitle) {
      await chrome.tabGroups.update(groupId, { title: groupTitle });
    }

    return {
      success: true,
      groupId,
      tabIds: ids,
      title: groupTitle,
    };
  }

  /**
   * Ungroup tabs
   */
  async ungroupTabs(tabIds?: number[]) {
    const ids = tabIds || [(await this.getCurrentTabId()) || 0];

    for (const id of ids) {
      try {
        const tab = await chrome.tabs.get(id);
        if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
          await chrome.tabs.ungroup(id);
        }
      } catch (e) {
        // Tab may not exist
      }
    }

    return {
      success: true,
      ungrouped: ids.length,
    };
  }

  /**
   * Move tab to window
   */
  async moveToWindow(tabId: number, windowId: number) {
    await chrome.tabs.move(tabId, { windowId, index: -1 });

    return {
      success: true,
      tabId,
      windowId,
    };
  }

  /**
   * Get active tab info
   */
  async getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      return {
        success: false,
        error: 'No active tab',
      };
    }

    return {
      success: true,
      tab: {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        index: tab.index,
        pinned: tab.pinned,
        active: tab.active,
        width: tab.width,
        height: tab.height,
      },
    };
  }
}
