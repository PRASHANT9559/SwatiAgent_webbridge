/**
 * Phase 7: Download Management
 * 
 * Handle file downloads with progress tracking.
 */

import { Debugger } from '../utils/debugger.js';

export class DownloadCommands {
  private debuggerInstance: Debugger;
  private downloadListeners: Map<number, (info: any) => void> = new Map();

  constructor(debuggerInstance: Debugger) {
    this.debuggerInstance = debuggerInstance;

    // Setup download event listeners
    chrome.downloads.onCreated.addListener(this.onDownloadCreated.bind(this));
    chrome.downloads.onChanged.addListener(this.onDownloadChanged.bind(this));
  }

  /**
   * Trigger download by clicking element
   */
  async triggerDownload(selector: string) {
    const result = await this.debuggerInstance.sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return { error: 'Element not found' };
          
          el.click();
          return { success: true, clicked: true };
        })()
      `,
      returnByValue: true,
    });

    return {
      success: true,
      clicked: true,
      selector,
    };
  }

  /**
   * Download file from URL
   */
  async downloadFile(url: string, options?: {
    filename?: string;
    saveAs?: boolean;
  }) {
    const downloadOptions: chrome.downloads.DownloadOptionsType = {
      url,
      saveAs: options?.saveAs || false,
    };

    if (options?.filename) {
      downloadOptions.filename = options.filename;
    }

    const downloadId = await chrome.downloads.download(downloadOptions);

    return {
      success: true,
      downloadId,
      url,
      filename: options?.filename || 'auto',
    };
  }

  /**
   * Get download info
   */
  async getDownload(downloadId: number) {
    const downloads = await chrome.downloads.search({ id: downloadId });
    const download = downloads[0];

    if (!download) {
      return {
        success: false,
        error: 'Download not found',
      };
    }

    return {
      success: true,
      download: {
        id: download.id,
        filename: download.filename,
        state: download.state,
        totalBytes: download.totalBytes,
        bytesReceived: download.bytesReceived,
        url: download.url,
        startTime: download.startTime,
        endTime: download.endTime,
        error: download.error,
      },
    };
  }

  /**
   * Get all downloads
   */
  async getDownloads(options?: {
    limit?: number;
    state?: 'complete' | 'interrupted' | 'in_progress';
  }) {
    const query: chrome.downloads.DownloadQueryType = {
      limit: options?.limit || 100,
    };

    if (options?.state) {
      query.state = options.state;
    }

    const downloads = await chrome.downloads.search(query);

    return {
      success: true,
      downloads: downloads.map((d) => ({
        id: d.id,
        filename: d.filename,
        state: d.state,
        totalBytes: d.totalBytes,
        bytesReceived: d.bytesReceived,
        url: d.url,
        startTime: d.startTime,
        endTime: d.endTime,
      })),
      count: downloads.length,
    };
  }

  /**
   * Pause download
   */
  async pauseDownload(downloadId: number) {
    await chrome.downloads.pause(downloadId);

    return {
      success: true,
      downloadId,
      action: 'pause',
    };
  }

  /**
   * Resume download
   */
  async resumeDownload(downloadId: number) {
    await chrome.downloads.resume(downloadId);

    return {
      success: true,
      downloadId,
      action: 'resume',
    };
  }

  /**
   * Cancel download
   */
  async cancelDownload(downloadId: number) {
    await chrome.downloads.cancel(downloadId);

    return {
      success: true,
      downloadId,
      action: 'cancel',
    };
  }

  /**
   * Erase download from history
   */
  async eraseDownload(downloadId: number) {
    await chrome.downloads.erase({ id: downloadId });

    return {
      success: true,
      downloadId,
      action: 'erase',
    };
  }

  /**
   * Remove download file
   */
  async removeDownloadFile(downloadId: number) {
    await chrome.downloads.removeFile(downloadId);

    return {
      success: true,
      downloadId,
      action: 'remove_file',
    };
  }

  /**
   * Show download in folder
   */
  async showInFolder(downloadId: number) {
    await chrome.downloads.show(downloadId);

    return {
      success: true,
      downloadId,
      action: 'show',
    };
  }

  /**
   * Show download folder
   */
  async showDownloadFolder() {
    await chrome.downloads.showDefaultFolder();

    return {
      success: true,
      action: 'show_folder',
    };
  }

  /**
   * Set download progress listener
   */
  onDownloadProgress(callback: (downloadId: number, progress: number) => void) {
    chrome.downloads.onChanged.addListener((info) => {
      chrome.downloads.search({ id: info.id }, (results) => {
        const item = results[0];
        if (item && item.totalBytes > 0) {
          const progress = (item.bytesReceived / item.totalBytes) * 100;
          callback(item.id, progress);
        }
      });
    });
  }

  private onDownloadCreated(downloadInfo: chrome.downloads.DownloadItem) {
    console.log('Download created:', downloadInfo);
  }

  private onDownloadChanged(downloadInfo: chrome.downloads.DownloadDelta) {
    console.log('Download changed:', downloadInfo);
  }

  /**
   * Get download settings
   */
  async getDownloadSettings() {
    return {
      success: true,
      settings: {
        // Chrome doesn't expose download path via extension API
        note: 'Download settings are controlled by Chrome browser settings',
      },
    };
  }

  /**
   * Set download path (if permitted)
   */
  async setDownloadPath(path: string) {
    // Note: Chrome extension API doesn't allow changing download path directly
    // This would require native messaging or user configuration
    return {
      success: false,
      message: 'Download path must be set in Chrome settings',
      alternative: 'Use saveAs option to prompt user for location',
    };
  }
}
