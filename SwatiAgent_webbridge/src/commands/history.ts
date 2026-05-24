/**
 * Phase 7: Browser Control - History & Navigation
 * 
 * Handle browser history, bookmarks, and navigation.
 */

import { Debugger } from '../utils/debugger.js';

export class HistoryCommands {
  private debuggerInstance: Debugger;

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;
  }

  /**
   * Go back in history
   */
  async goBack() {
    // BUG-18 FIX: Removed broken Page.navigate call (url:undefined is invalid)
    const tab = await this.getCurrentTab();
    if (tab?.id) {
      await chrome.tabs.goBack(tab.id);
    }

    return {
      success: true,
      action: 'back',
    };
  }

  /**
   * Go forward in history
   */
  async goForward() {
    const tab = await this.getCurrentTab();
    if (tab?.id) {
      await chrome.tabs.goForward(tab.id);
    }

    return {
      success: true,
      action: 'forward',
    };
  }

  /**
   * Get browsing history (limited by Chrome API)
   */
  async getHistory(options?: { days?: number; maxResults?: number; text?: string }) {
    const { days = 7, maxResults = 100, text } = options || {};

    return new Promise((resolve) => {
      const searchQuery: chrome.history.SearchQuery = {
        startTime: Date.now() - days * 24 * 60 * 60 * 1000,
        maxResults,
      };

      if (text) {
        searchQuery.text = text;
      }

      chrome.history.search(searchQuery, (results) => {
        resolve({
          success: true,
          history: results.map((item) => ({
            url: item.url,
            title: item.title,
            lastVisitTime: item.lastVisitTime,
            visitCount: item.visitCount,
          })),
          count: results.length,
          query: { days, maxResults, text },
        });
      });
    });
  }

  /**
   * Add bookmark
   */
  async addBookmark(options?: { url?: string; title?: string; parentId?: string }) {
    const currentTab = await this.getCurrentTab();
    const url = options?.url || currentTab?.url || '';
    const title = options?.title || currentTab?.title || '';

    const bookmarkInfo: chrome.bookmarks.BookmarkCreateInfo = {
      url,
      title: title || 'Untitled',
      parentId: options?.parentId,
    };

    const bookmark = await chrome.bookmarks.create(bookmarkInfo);

    return {
      success: true,
      bookmark: {
        id: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        parentId: bookmark.parentId,
        index: bookmark.index,
      },
    };
  }

  /**
   * Get bookmarks
   */
  async getBookmarks(options?: { parentId?: string; query?: string }) {
    let bookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

    if (options?.parentId) {
      const children = await chrome.bookmarks.getChildren(options.parentId);
      bookmarks = children;
    } else if (options?.query) {
      bookmarks = await chrome.bookmarks.search(options.query);
    } else {
      // Get root bookmarks
      const roots = await chrome.bookmarks.getTree();
      bookmarks = roots[0]?.children || [];
    }

    return {
      success: true,
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        parentId: b.parentId,
        index: b.index,
        dateAdded: b.dateAdded,
        children: b.children ? b.children.length : 0,
      })),
      count: bookmarks.length,
    };
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(bookmarkId: string) {
    await chrome.bookmarks.remove(bookmarkId);

    return {
      success: true,
      bookmarkId,
    };
  }

  /**
   * Update bookmark
   */
  async updateBookmark(
    bookmarkId: string,
    options: { title?: string; url?: string }
  ) {
    const updateInfo: chrome.bookmarks.BookmarkUpdateInfo = {};
    if (options.title) updateInfo.title = options.title;
    if (options.url) updateInfo.url = options.url;

    const bookmark = await chrome.bookmarks.update(bookmarkId, updateInfo);

    return {
      success: true,
      bookmark: {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
      },
    };
  }

  /**
   * Create bookmark folder
   */
  async createBookmarkFolder(title: string, parentId?: string) {
    const bookmarkInfo: chrome.bookmarks.BookmarkCreateInfo = {
      title,
      parentId,
    };

    const bookmark = await chrome.bookmarks.create(bookmarkInfo);

    return {
      success: true,
      folder: {
        id: bookmark.id,
        title: bookmark.title,
        parentId: bookmark.parentId,
      },
    };
  }

  /**
   * Get current tab info
   */
  private async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  }
}
