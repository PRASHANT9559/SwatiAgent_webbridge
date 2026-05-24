/**
 * SwatiAgent AI Extension - Background Service Worker
 * Phase 2 Implementation: Essential Additions
 */

import { Debugger, debuggerInstance } from './utils/debugger.js';
import { WaitCommands } from './commands/wait.js';
import { SelectionCommands } from './commands/selection.js';
import { ScrollCommands } from './commands/scroll.js';
import { KeyboardCommands } from './commands/keyboard.js';
import { PageInfoCommands } from './commands/page-info.js';
import { StorageCommands } from './commands/storage.js';
import { ClipboardCommands } from './commands/clipboard.js';
import { ScreenshotCommands } from './commands/screenshot.js';
import { StealthCommands } from './commands/stealth.js';
import { AICommands } from './commands/ai.js';
import { TestingCommands } from './commands/testing.js';
import { SearchCommands } from './commands/search.js';
import { PermissionsCommands } from './commands/permissions.js';
import { MutationCommands } from './commands/mutation.js';
import { NetworkCommands } from './commands/network.js';
import { DownloadCommands } from './commands/downloads.js';
import { HistoryCommands } from './commands/history.js';
import { TabCommands } from './commands/tabs.js';

// Initialize command handlers
const debugger_service = new Debugger();
const waitCommands = new WaitCommands(debugger_service);
const selectionCommands = new SelectionCommands(debugger_service);
const scrollCommands = new ScrollCommands(debugger_service);
const keyboardCommands = new KeyboardCommands(debugger_service);
const pageInfoCommands = new PageInfoCommands(debugger_service);
const storageCommands = new StorageCommands(debugger_service);
const clipboardCommands = new ClipboardCommands(debugger_service);
const screenshotCommands = new ScreenshotCommands(debugger_service);
const stealthCommands = new StealthCommands(debugger_service);
const aiCommands = new AICommands(debugger_service);
const testingCommands = new TestingCommands(debugger_service);
const searchCommands = new SearchCommands(debugger_service);
const permissionsCommands = new PermissionsCommands(debugger_service);
const mutationCommands = new MutationCommands(debugger_service);
const networkCommands = new NetworkCommands(debugger_service);
const downloadCommands = new DownloadCommands(debugger_service);
const historyCommands = new HistoryCommands(debugger_service);
const tabsCommands = new TabCommands(debugger_service);

// Tab management state
const attachedTabs = new Set<number>();
let currentTabId: number | null = null;
let activeTabId: number | null = null;

// Tab group management
const domainColors: { [key: string]: string } = {
  'twitter': 'blue',
  'xhs': 'red',
  'zhihu': 'blue',
  'worldquant': 'purple',
};
const colorCycle = ['green', 'yellow', 'cyan', 'orange', 'pink', 'grey'];
const tabGroups = new Map<string, number>();
const sessionDomains = new Map<string, string>();
let colorIndex = 0;

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  attachedTabs.delete(tabId);
  if (currentTabId === tabId) currentTabId = null;
  if (activeTabId === tabId) activeTabId = null;
});

// Handle debugger detach
chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId) {
    attachedTabs.delete(source.tabId);
    if (currentTabId === source.tabId) currentTabId = null;
  }
});

/**
 * Attach debugger to a tab
 */
async function attachDebugger(tabId: number): Promise<void> {
  if (attachedTabs.has(tabId)) {
    currentTabId = tabId;
    // BUG-02 FIX: Always sync the shared Debugger instance
    await debugger_service.attachToTab(tabId);
    return;
  }

  try {
    await chrome.debugger.detach({ tabId });
  } catch {
    // Ignore if not attached
  }

  await chrome.debugger.attach({ tabId }, '1.3');
  attachedTabs.add(tabId);
  currentTabId = tabId;

  // BUG-02 FIX: Sync the shared Debugger instance so all command classes work
  await debugger_service.attachToTab(tabId);
}

/**
 * Get current or active tab
 */
async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  if (currentTabId !== null) {
    try {
      const tab = await chrome.tabs.get(currentTabId);
      if (tab) return tab;
    } catch {
      attachedTabs.delete(currentTabId);
      currentTabId = null;
    }
  }

  if (activeTabId !== null) {
    try {
      const tab = await chrome.tabs.get(activeTabId);
      if (tab) return tab;
    } catch {
      activeTabId = null;
    }
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab found');
  }

  activeTabId = tab.id;
  return tab;
}

/**
 * Create or get tab group
 */
async function getOrCreateGroup(session: string, tabId: number, title?: string): Promise<void> {
  try {
    // Check if group exists
    const existingGroupId = tabGroups.get(session);
    if (existingGroupId) {
      await chrome.tabs.group({ tabIds: tabId, groupId: existingGroupId });
      return;
    }

    // Try to find group by title
    const groupName = `agent:${session}`;
    const groups = await chrome.tabGroups.query({ title: groupName });
    
    if (groups.length > 0) {
      await chrome.tabs.group({ tabIds: tabId, groupId: groups[0].id });
      tabGroups.set(session, groups[0].id);
      return;
    }

    // Create new group
    if (title) {
      sessionDomains.set(session, title);
    }

    const groupId = await chrome.tabs.group({ tabIds: tabId });
    const color = domainColors[session] || colorCycle[colorIndex++ % colorCycle.length];
    
    await chrome.tabGroups.update(groupId, {
      title: title || groupName,
      color,
      collapsed: false,
    });

    tabGroups.set(session, groupId);
  } catch (error) {
    console.error('Error creating group:', error);
  }
}

// Command implementations
const commands = {
  // Phase 2: Wait Commands
  'wait_for_selector': async (args: any) => {
    return await waitCommands.waitForSelector(args);
  },

  'wait_for_navigation': async (args: any) => {
    return await waitCommands.waitForNavigation(args);
  },

  'wait_for_stable': async (args: any) => {
    return await waitCommands.waitForStable(args);
  },

  'wait_for_content': async (args: any) => {
    return await waitCommands.waitForContent(args);
  },

  // Phase 2: Selection Commands
  'select_option': async (args: any) => {
    return await selectionCommands.selectOption(args);
  },

  'get_all_links': async (args: any) => {
    return await selectionCommands.getAllLinks();
  },

  'get_all_images': async (args: any) => {
    return await selectionCommands.getAllImages();
  },

  'extract_table': async (args: any) => {
    return await selectionCommands.extractTable(args);
  },

  'extract_schema': async (args: any) => {
    return await selectionCommands.extractSchema();
  },

  // Phase 2: Scroll Commands
  'scroll_to': async (args: any) => {
    return await scrollCommands.scrollTo(args);
  },

  'scroll_page': async (args: any) => {
    return await scrollCommands.scrollPage(args);
  },

  'scroll_into_view': async (args: any) => {
    return await scrollCommands.scrollIntoView(args.selector);
  },

  'get_scroll_info': async (args: any) => {
    return await scrollCommands.getScrollInfo();
  },

  // Phase 2: Keyboard Commands
  'press_key': async (args: any) => {
    return await keyboardCommands.pressKey(args);
  },

  'type_text': async (args: any) => {
    return await keyboardCommands.typeText(args);
  },

  'hotkey': async (args: any) => {
    return await keyboardCommands.hotkey(args);
  },

   // Phase 2: Page Info Commands
   'get_page_title': async (args: any) => {
     return await pageInfoCommands.getPageTitle();
   },
   
   'get_page_url': async (args: any) => {
     return await pageInfoCommands.getPageUrl();
   },
   
   'get_meta_tags': async (args: any) => {
     return await pageInfoCommands.getMetaTags();
   },
   
   'get_page_source': async (args: any) => {
     return await pageInfoCommands.getPageSource();
   },
   
   'get_page_info': async (args: any) => {
     return await pageInfoCommands.getPageInfo();
   },
   
   'get_text_content': async (args: any) => {
     return await pageInfoCommands.getTextContent(args);
   },
   
   'get_loading_state': async (args: any) => {
     return await pageInfoCommands.getLoadingState();
   },
   
   // Phase 5: Screenshot Commands
   'full_page_screenshot': async (args: any) => {
     return await screenshotCommands.fullPageScreenshot(args);
   },
   
   'element_screenshot': async (args: any) => {
     return await screenshotCommands.elementScreenshot(args.selector, args);
   },
   
   'screenshot_base64': async (args: any) => {
     return await screenshotCommands.screenshotBase64(args);
   },
   
   'compare_screenshots': async (args: any) => {
     return await screenshotCommands.compareScreenshots(args.screenshot1, args.screenshot2);
   },
   
   'visual_assert': async (args: any) => {
     return await screenshotCommands.visualAssert(args.imageBase64, args.prompt, args.options);
   },
   
   'ocr_extract': async (args: any) => {
     return await screenshotCommands.ocrExtract(args.imageBase64, args.options);
   },
   
   'visual_selector': async (args: any) => {
     return await screenshotCommands.visualSelector(args.screenshotBase64, args.x, args.y, args.options);
   },
   
   'set_dark_mode': async (args: any) => {
     return await screenshotCommands.setDarkMode(args.enabled);
   },
   
   'set_zoom': async (args: any) => {
     return await screenshotCommands.setZoom(args.factor);
   },
   
   'emulate_print': async (args: any) => {
     return await screenshotCommands.emulatePrint(args.enabled);
   },
   
   'generate_print_preview': async (args: any) => {
     return await screenshotCommands.generatePrintPreview(args.options);
   },

  // Phase 3: Storage Commands
  'get_local_storage': async (args: any) => {
    return await storageCommands.getLocalStorage(args);
  },

  'set_local_storage': async (args: any) => {
    return await storageCommands.setLocalStorage(args);
  },

  'remove_local_storage': async (args: any) => {
    return await storageCommands.removeLocalStorage(args.key);
  },

  'clear_local_storage': async (args: any) => {
    return await storageCommands.clearLocalStorage();
  },

  'get_session_storage': async (args: any) => {
    return await storageCommands.getSessionStorage(args);
  },

  'set_session_storage': async (args: any) => {
    return await storageCommands.setSessionStorage(args);
  },

  'get_cookies': async (args: any) => {
    return await storageCommands.getCookies(args);
  },

  'set_cookie': async (args: any) => {
    return await storageCommands.setCookie(args);
  },

  'delete_cookie': async (args: any) => {
    return await storageCommands.deleteCookie(args);
  },

  'clear_cookies': async (args: any) => {
    return await storageCommands.clearCookies();
  },

  'save_session': async (args: any) => {
    return await storageCommands.saveSession(args);
  },

  'restore_session': async (args: any) => {
    return await storageCommands.restoreSession(args);
  },

  'export_session': async (args: any) => {
    return await storageCommands.exportSession(args);
  },

  // Phase 3: Clipboard Commands
  'copy_to_clipboard': async (args: any) => {
    return await clipboardCommands.copy(args.text);
  },

  'paste_from_clipboard': async (args: any) => {
    return await clipboardCommands.paste();
  },

  'read_clipboard': async (args: any) => {
    return await clipboardCommands.read();
  },

  'copy_html': async (args: any) => {
    return await clipboardCommands.copyHTML(args.html, args.text);
  },

  'check_clipboard_permission': async (args: any) => {
    return await clipboardCommands.checkPermission();
  },

  // Phase 8: Stealth Commands
  'randomize_fingerprint': async (args: any) => {
    return await stealthCommands.randomizeFingerprint();
  },

  'viewport_randomization': async (args: any) => {
    return await stealthCommands.viewportRandomization();
  },

  'timezone_override': async (args: any) => {
    return await stealthCommands.timezoneOverride(args);
  },

  'locale_override': async (args: any) => {
    return await stealthCommands.localeOverride(args);
  },

  'geolocation_mock': async (args: any) => {
    return await stealthCommands.geolocationMock(args);
  },

  'hide_webdriver': async (args: any) => {
    return await stealthCommands.hideWebdriver();
  },

  'patch_plugins': async (args: any) => {
    return await stealthCommands.patchPlugins();
  },

  'noise_injection': async (args: any) => {
    return await stealthCommands.noiseInjection(args);
  },

  'patch_webgl': async (args: any) => {
    return await stealthCommands.patchWebGL();
  },

  'set_tab_proxy': async (args: any) => {
    return await stealthCommands.setTabProxy(args);
  },

  'create_context': async (args: any) => {
    return await stealthCommands.createContext();
  },

  // Phase 9: AI Commands
  'nl_command': async (args: any) => {
    return await aiCommands.nlCommand(args);
  },

  'smart_click': async (args: any) => {
    return await aiCommands.smartClick(args);
  },

  'auto_retry': async (args: any) => {
    return await aiCommands.autoRetry(args);
  },

  // Phase 10: Testing Commands
  'assert_visible': async (args: any) => {
    return await testingCommands.assertVisible(args);
  },

  'assert_text_contains': async (args: any) => {
    return await testingCommands.assertTextContains(args);
  },

  'assert_count': async (args: any) => {
    return await testingCommands.assertCount(args);
  },

  'record_actions': async (args: any) => {
    return await testingCommands.recordActions();
  },

  'replay_workflow': async (args: any) => {
    return await testingCommands.replayWorkflow(args);
  },

  'set_variable': async (args: any) => {
    return await testingCommands.setVariable(args);
  },

  'env_substitution': async (args: any) => {
    return await testingCommands.envSubstitution(args);
  },

  'check_accessibility': async (args: any) => {
    return await testingCommands.checkAccessibility();
  },

  // Phase 11: Search Commands
  'find_text': async (args: any) => {
    return await searchCommands.findText(args);
  },

  'highlight_text': async (args: any) => {
    return await searchCommands.highlightText(args);
  },

  // Phase 12: Permissions Commands
  'grant_permission': async (args: any) => {
    return await permissionsCommands.grantPermission(args);
  },

  'clear_cache_storage': async (args: any) => {
    return await permissionsCommands.clearCacheStorage();
  },

  // Phase 13: Mutation Commands
  'watch_dom': async (args: any) => {
    return await mutationCommands.watchDOM(args);
  },

  // Phase 6: Network & Communication
  'enable_network_interception': async (args: any) => {
    return await networkCommands.enableNetworkInterception();
  },

  'disable_network_interception': async (args: any) => {
    return await networkCommands.disableNetworkInterception();
  },

  'intercept_request': async (args: any) => {
    return await networkCommands.interceptRequest(args);
  },

  'mock_response': async (args: any) => {
    return await networkCommands.mockResponse(args);
  },

  'block_resources': async (args: any) => {
    return await networkCommands.blockResources(args);
  },

  'modify_headers': async (args: any) => {
    return await networkCommands.modifyHeaders(args);
  },

  'throttle_network': async (args: any) => {
    return await networkCommands.throttleNetwork(args);
  },

  'get_network_requests': async (args: any) => {
    return await networkCommands.getNetworkRequests(args);
  },

  'export_har': async (args: any) => {
    return await networkCommands.exportHAR();
  },

  'get_response_body': async (args: any) => {
    return await networkCommands.getResponseBody(args.requestId);
  },

  'clear_cache': async (args: any) => {
    return await networkCommands.clearCache();
  },

  'set_cache_disabled': async (args: any) => {
    return await networkCommands.setCacheDisabled(args.disabled);
  },

  'get_request_timings': async (args: any) => {
    return await networkCommands.getRequestTimings();
  },

  'capture_websocket': async (args: any) => {
    return await networkCommands.captureWebSocket(args);
  },

  'send_websocket_message': async (args: any) => {
    return await networkCommands.sendWebSocketMessage(args);
  },

  'list_websocket_connections': async (args: any) => {
    return await networkCommands.listWebSocketConnections();
  },

  'get_performance_metrics': async (args: any) => {
    return await networkCommands.getPerformanceMetrics();
  },

  'get_page_load_time': async (args: any) => {
    return await networkCommands.getPageLoadTime();
  },

  'get_core_web_vitals': async (args: any) => {
    return await networkCommands.getCoreWebVitals();
  },

  'run_lighthouse_audit': async (args: any) => {
    return await networkCommands.runLighthouseAudit(args);
  },

  'get_memory_usage': async (args: any) => {
    return await networkCommands.getMemoryUsage();
  },

  'detect_memory_leaks': async (args: any) => {
    return await networkCommands.detectMemoryLeaks(args);
  },

  // Phase 7: History & Downloads
  'go_back': async (args: any) => {
    return await historyCommands.goBack();
  },

  'go_forward': async (args: any) => {
    return await historyCommands.goForward();
  },

  'get_history': async (args: any) => {
    return await historyCommands.getHistory(args);
  },

  'add_bookmark': async (args: any) => {
    return await historyCommands.addBookmark(args);
  },

  'get_bookmarks': async (args: any) => {
    return await historyCommands.getBookmarks(args);
  },

  'remove_bookmark': async (args: any) => {
    return await historyCommands.removeBookmark(args.bookmarkId);
  },

  'update_bookmark': async (args: any) => {
    return await historyCommands.updateBookmark(args.bookmarkId, args);
  },

  'create_bookmark_folder': async (args: any) => {
    return await historyCommands.createBookmarkFolder(args.title, args.parentId);
  },

  'trigger_download': async (args: any) => {
    return await downloadCommands.triggerDownload(args.selector);
  },

  'download_to_path': async (args: any) => {
    return await downloadCommands.setDownloadPath(args.path);
  },

  'download_stream': async (args: any) => {
    return await downloadCommands.downloadFile(args.url, args);
  },

  'get_downloads': async (args: any) => {
    return await downloadCommands.getDownloads(args);
  },

  'cancel_download': async (args: any) => {
    return await downloadCommands.cancelDownload(args.downloadId);
  },

  'download_progress': async (args: any) => {
    return await downloadCommands.getDownload(args.downloadId);
  },

  'switch_tab': async (args: any) => {
    return await tabsCommands.switchTab(args);
  },

  'get_all_tabs': async (args: any) => {
    return await tabsCommands.getAllTabs(args.windowId);
  },

  'create_tab': async (args: any) => {
    return await tabsCommands.createTab(args);
  },

  'close_tab': async (args: any) => {
    return await tabsCommands.closeTab(args.tabId);
  },

  'duplicate_tab': async (args: any) => {
    return await tabsCommands.duplicateTab(args.tabId);
  },
};

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const { action, args } = message;
      
      // Attach to tab if needed
      const tab = await getCurrentTab();
      if (tab.id) {
        await attachDebugger(tab.id);
      }

      // Execute command
      const command = commands[action as keyof typeof commands];
      if (!command) {
        throw new Error(`Unknown command: ${action}`);
      }

      const result = await command(args);
      sendResponse({ success: true, ...result });
    } catch (error: any) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});

// Handle tab group removal
chrome.tabGroups.onRemoved.addListener((groupId) => {
  for (const [session, id] of tabGroups.entries()) {
    if (id === groupId) {
      tabGroups.delete(session);
      break;
    }
  }
});

console.log('SwatiAgent AI Phase 2 loaded successfully');
