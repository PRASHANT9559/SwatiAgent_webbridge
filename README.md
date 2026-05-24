# 🚀 SwatiAgent AI WebBridge Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![CDP Compatibility](https://img.shields.io/badge/CDP-Chrome%20120%2B-blue.svg)]()
[![SwatiAgent AI Powered](https://img.shields.io/badge/AI--Engine-SwatiAgent%20AI-orange.svg)]()

The ultimate, production-grade Chrome extension for **advanced browser automation, robust fingerprint stealth, network intercepting, and AI-powered selector engines**, built directly on the **Chrome DevTools Protocol (CDP)**.

Unlike typical extension-based automation tools that rely solely on simple Content Script DOM injections, **SwatiAgent AI WebBridge** attaches deep debugger protocols natively, enabling OS-level stealth, comprehensive network control, screen capture, and dynamic element monitoring.

---

## 🌟 Key Capabilities

*   **🛡️ Hardened Anti-Detection & Stealth (Phase 8):** Native patches for `navigator.webdriver`, emulated permissions query, `window.chrome.runtime` structure, random viewport/device metrics, realistic plugin lists, and custom WebGL/Canvas fingerprint noise injection.
*   **🤖 AI-Powered Selector Engine & Natural Language (Phase 9):** Generate high-fidelity CSS and XPath selectors from complex DOM structures and interact with pages using natural language commands powered by the SwatiAgent AI Engine.
*   **🌐 Deep Network Mocking & Capture (Phase 6):** Custom network request interception, latency injection, response stubbing, full WebSocket frame capturing, and HAR log generation.
*   **📸 Enhanced Visuals & OCR (Phase 5):** High-definition element screenshots, full-page screenshots, color profiles, visual stability analysis (`cls_score`), and OCR text extraction.
*   **⚙️ Core & Advanced Automation (Phase 1-4, 7):** Human-like keyboard typing with randomized delays, precise Bezier curve mouse movements, iframe/Shadow DOM traversal, cookie/localStorage management, clipboard control, and comprehensive tab operation handling.
*   **🧪 Built-in Test Framework & Assertions (Phase 10):** Integrated assertion engines, multi-step workflow execution, and real-time DOM mutation monitoring (Phase 13).

---

## 📂 Repository Structure

```
├── manifest.json            # Extension manifest (MV3)
├── package.json             # NPM dependencies & scripts
├── vite.config.ts           # Vite + TS configuration
├── tsconfig.json            # TypeScript configuration
├── popup.html               # Sleek control center UI
├── background.js            # Compiled background service worker
├── _locales/                # Internationalization
│   └── en/messages.json     # SwatiAgent AI localization strings
└── src/                     # Main source code
    ├── background.ts        # Main listener & action dispatcher
    ├── commands/            # Specialized domain-specific modules
    │   ├── wait.ts          # Page synchronization & wait conditions (Phase 2)
    │   ├── selection.ts     # Advanced element & schema extraction (Phase 2)
    │   ├── scroll.ts        # Custom scroll configurations & positions (Phase 2)
    │   ├── keyboard.ts      # Human-like keyboard simulations (Phase 2)
    │   ├── page-info.ts     # Metadata & SEO extraction tools (Phase 2)
    │   ├── storage.ts       # Secure cookie & storage handlers (Phase 3)
    │   ├── clipboard.ts     # Clipboard operations (Phase 3)
    │   ├── forms.ts         # Iframe, Shadow DOM, & form handlers (Phase 4)
    │   ├── screenshot.ts    # HD screenshots & OCR helpers (Phase 5)
    │   ├── network.ts       # Mocking, WebSocket, & HAR loggers (Phase 6)
    │   ├── downloads.ts     # Comprehensive download/history manager (Phase 7)
    │   ├── stealth.ts       # Hardened browser spoofing & proxy controllers (Phase 8)
    │   ├── ai.ts            # Natural language processing & smart selectors (Phase 9)
    │   ├── test.ts          # Local test runner & custom assertion engine (Phase 10)
    │   ├── search.ts        # Advanced page search & highlights (Phase 11)
    │   ├── extensions.ts    # Extension & permission manager (Phase 12)
    │   └── mutation.ts      # Real-time DOM Mutation Observers (Phase 13)
    ├── utils/
    │   ├── debugger.ts      # Hardened CDP connection manager
    │   └── helpers.ts       # Shared utility routines
    └── types/
        └── index.ts         # Central TypeScript interfaces
```

---

## 🚀 Quick Start

### 1. Requirements
*   Node.js 18 or higher
*   Google Chrome (v120+) or equivalent Chromium-based browser

### 2. Setup & Installation
Clone the repository and install all dependencies:
```bash
# Install NPM packages
npm install
```

### 3. Build & Compile
Compile the TypeScript modules to production-ready background scripts:
```bash
# Compile and output JS files
npm run build
```
*(For active development with hot-reloading, run `npm run dev`.)*

### 4. Load the Extension in Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** using the toggle switch in the top right.
3. Click the **Load unpacked** button in the top left.
4. Select the root directory (`kimi-webbridge-extension/`) containing `manifest.json`.

---

## 🗺️ Architectural Implementation Roadmap

All **13 Phases** are fully coded, integrated, and verified to compile cleanly.

| Phase | Timeline | Core Focus | Status |
|-------|----------|------------|--------|
| **Phase 1** | Completed | Core browser commands, navigation, and evaluation | ✅ Done |
| **Phase 2** | Completed | Precision waits, selector extractions, and human typing | ✅ Done |
| **Phase 3** | Completed | Advanced storage management, secure clipboard controls | ✅ Done |
| **Phase 4** | Completed | Shadow DOM selectors, iframe context, complex gestures | ✅ Done |
| **Phase 5** | Completed | Visual verification, visual stability analysis, and OCR | ✅ Done |
| **Phase 6** | Completed | HTTP mock rules, WebSocket interception, HAR formats | ✅ Done |
| **Phase 7** | Completed | History management, advanced tab operations, downloads | ✅ Done |
| **Phase 8** | Completed | Hardened WebGL, Navigator & Permission anti-detection | ✅ Done |
| **Phase 9** | Completed | AI natural language execution, semantic selector engines | ✅ Done |
| **Phase 10** | Completed | In-browser assertion framework, automated test runners | ✅ Done |
| **Phase 11-13**| Completed | Deep DOM text searches, extension managers, mutation observers | ✅ Done |

---

## ⚡ Detailed Features & Capabilities by Phase

Here is the exhaustive directory of features implemented across all 13 phases of development, documented in high-fidelity professional English:

### 🔹 Phase 1: Core Browser Automation [✅ Done]

| # | Feature | Description | CDP Domain |
|---|---------|-------------|------------|
| 1 | **Navigate** | Navigate to a specific URL with optional support for opening in a new tab | `Page.navigate` |
| 2 | **Snapshot** | Capture the full accessibility tree of the page, including `@e` references | `Accessibility.getFullAXTree` |
| 3 | **Click** | Click on specific elements identified by `@e` references or CSS selectors | `DOM.performSearch` + `Input.dispatchMouseEvent` |
| 4 | **Fill** | Input text into form fields, including full support for contenteditable elements | `Input.insertText` |
| 5 | **Mouse Click** | Dispatch low-level, high-fidelity native mouse events | `Input.dispatchMouseEvent` |
| 6 | **Evaluate** | Execute custom JavaScript expressions within the context of the page | `Runtime.evaluate` |
| 7 | **Screenshot** | Capture visual screenshots of the active page or a target element | `Page.captureScreenshot` |
| 8 | **Network** | Monitor, filter, and record all incoming and outgoing network requests | `Network.enable` |
| 9 | **Tab Management** | Perform advanced tab grouping, lifecycle control, and tab switching | `Target` |
| 10 | **Save as PDF** | Print and serialize the active page into a high-quality PDF document | `Page.printToPDF` |
| 11 | **Upload** | Programmatically set files on file input elements for secure uploads | `DOM.setFileInputFiles` |
| 12 | **Find Tab** | Scan, search, and attach to existing active browser targets and tabs | `Target.getTargets` |

#### Advanced Core Features:
*   **Session/Tab Grouping:** Maintain individual isolated tab group environments.
*   **Direct Debugger Protocol:** Low-level, high-fidelity interaction with CDP.
*   **Content Editable Support:** Fully compatible with ProseMirror, Lexical, Slate, and rich-text editors.

---

### 🔹 Phase 2: Essential Additions [✅ Done]

#### 2.1 Wait & Synchronization
| Feature | Description |
|---------|-------------|
| `wait_for_selector` | Synchronize execution by waiting for a target selector to appear in the DOM |
| `wait_for_navigation` | Wait until page navigation completes (supporting load, DOMContentLoaded, or networkidle states) |
| `wait_for_stable` | Wait for the layout and DOM to stabilize visually (detecting absence of mutations and layout shifts) |
| `wait_for_content` | AI-assisted synchronization waiting for semantic page elements or structures to fully render |
| `custom_timeout` | Apply highly granular, per-action configurable timeout configurations |

#### 2.2 Selection & Extraction
| Feature | Description |
|---------|-------------|
| `select_option` | Interact with standard dropdown selections (`<select>`) and custom dropdown elements |
| `get_all_links` | Extract all hyperlinks from the document, containing absolute URLs, text, and contextual locations |
| `get_all_images` | Retrieve information for all visible image assets, including dimensions, sources, and alt texts |
| `extract_table` | Convert tabular HTML elements directly into structured JSON or CSV data |
| `extract_schema` | Parse and extract Schema.org JSON-LD structured metadata |

#### 2.3 Scrolling
| Feature | Description |
|---------|-------------|
| `scroll_to` | Perform smooth, natural scrolling directly to specific elements or absolute coordinates |
| `scroll_page` | Execute page-up/down scrolling utilizing native keyboard or mouse wheel emulation |
| `scroll_into_view` | Ensure a target element is aligned and fully visible within the current viewport |

#### 2.4 Keyboard Events
| Feature | Description |
|---------|-------------|
| `press_key` | Trigger individual keyboard keypresses (Enter, Tab, Escape, etc.) including modifier keys |
| `type_text` | Simulate human character-by-character typing with randomized natural delays |
| `hotkey` | Dispatch advanced keyboard hotkey combinations (such as Ctrl+C, Ctrl+V, or Alt+Tab) |

#### 2.5 Page Information
| Feature | Description |
|---------|-------------|
| `get_page_title` | Retrieve the current document title |
| `get_page_url` | Retrieve the current active browser URL |
| `get_meta_tags` | Extract metadata tags (Open Graph tags, description, keywords) for SEO analysis |
| `get_page_source` | Retrieve the complete serialized HTML source code of the current page |

---

### 🔹 Phase 3: Data & Storage Management [✅ Done]

#### 3.1 Local Storage & Cookies
| Feature | Description |
|---------|-------------|
| `get_local_storage` | Retrieve local storage items for specific keys or extract a complete storage dump |
| `set_local_storage` | Set specific key-value pairs inside the page's local storage |
| `get_session_storage` | Retrieve session storage items for specific keys or extract a complete storage dump |
| `set_session_storage` | Set specific key-value pairs inside the page's session storage |
| `get_cookies` | Read browser cookies, supporting advanced filtering by domain and path |
| `set_cookies` | Inject active cookies with secure attributes, HTTP-only flags, and custom expiry dates |
| `clear_cookies` | Delete specific target cookies or clear the entire cookie jar |

#### 3.2 Clipboard Operations
| Feature | Description |
|---------|-------------|
| `copy_to_clipboard` | Write text to the system clipboard via the browser's secure clipboard API |
| `paste_from_clipboard` | Paste text directly from the system clipboard into active elements |
| `read_clipboard` | Read contents from the clipboard, with automated permissions handling |

#### 3.3 Session Persistence
| Feature | Description |
|---------|-------------|
| `save_session` | Fully serialize active sessions (cookies, local storage, session storage, and IndexedDB data) |
| `restore_session` | Re-inject and restore a previously saved browser session environment |
| `export_session` | Export full session states to structured JSON or YAML configurations |

---

### 🔹 Phase 4: Advanced Interactions [✅ Done]

#### 4.1 Form Handling
| Feature | Description |
|---------|-------------|
| `submit_form` | Submit target forms with active compliance for browser and custom JavaScript validation rules |
| `get_form_data` | Extract all active form inputs as key-value JSON pairs |
| `clear_form` | Reset and clear all input fields in a target form |
| `upload_with_preview` | Automate file uploads supporting advanced drag-and-drop landing zones |

#### 4.2 Iframe & Frame Support
| Feature | Description |
|---------|-------------|
| `switch_to_iframe` | Switch execution contexts to specific target iframe elements |
| `switch_to_main` | Revert the active execution context back to the main document frame |
| `list_iframes` | Enumerate all active iframe containers on the page, including names, IDs, and source URLs |
| `iframe_snapshot` | Generate visual and accessibility tree snapshots within an iframe context |

#### 4.3 Popup, Modal & Alert Handling
| Feature | Description |
|---------|-------------|
| `handle_alert` | Accept or dismiss JavaScript alert dialogs and capture their text contents |
| `handle_confirm` | Programmatically accept or decline JavaScript confirmation alerts |
| `handle_prompt` | Input custom text into JavaScript prompt dialogs and submit them |
| `close_modal` | Close custom HTML/CSS modal layers by dispatching Escape keypresses or target clicks |
| `detect_overlay` | Identify and systematically dismiss blocking overlays, popups, and cookie walls |

#### 4.4 Drag & Drop
| Feature | Description |
|---------|-------------|
| `drag_and_drop` | Perform fluid drag-and-drop operations combining native HTML5 events and mouse interactions |
| `sortable_interact` | Interact with complex sortable lists, including support for react-beautiful-dnd and SortableJS |
| `drag_to_coordinates` | Drag a target element and drop it at precise viewport coordinates |

#### 4.5 Mobile & Touch Emulation
| Feature | Description |
|---------|-------------|
| `touch_tap` | Simulate precise touch-based tap gestures on target elements |
| `pinch_zoom` | Emulate multi-touch pinch-to-zoom gestures in mobile views |
| `swipe` | Execute natural swipe gestures complete with inertia modeling |
| `emulate_device` | Emulate complete mobile devices (iPhone, Android, tablets) with custom pixel ratios |
| `set_viewport` | Configure custom viewport dimensions, screen sizes, and device pixel parameters |
| `set_user_agent` | Override the default User-Agent string on a per-tab basis |

---

### 🔹 Phase 5: Screenshot & Visual [✅ Done]

#### 5.1 Enhanced Screenshot
| Feature | Description |
|---------|-------------|
| `full_page_screenshot` | Capture high-definition screenshots of the entire page layout (above and below the fold) |
| `element_screenshot` | Capture precise screenshots of individual elements using exact bounding boxes |
| `screenshot_base64` | Export visual captures directly as Base64 encoded string outputs |
| `screenshot_options` | Configure custom formats (PNG/JPEG), quality variables, and precise clipping regions |

#### 5.2 Visual Regression & OCR
| Feature | Description |
|---------|-------------|
| `compare_screenshots` | Compare two visual captures and generate a pixel-by-pixel difference map |
| `visual_assert` | Perform AI-assisted assertions to verify visual states (e.g., "confirm the red button exists") |
| `ocr_extract` | Extract text from target image regions using integrated OCR engines |
| `visual_selector` | Select individual elements visually using coordinate-based screenshot clicks |

#### 5.3 Theme & Zoom
| Feature | Description |
|---------|-------------|
| `set_dark_mode` | Toggle browser color modes by emulating the `prefers-color-scheme` CSS media feature |
| `set_zoom` | Set granular page zoom levels (scaling dynamically from 0.25x up to 5.0x) |
| `emulate_print` | Emulate standard print CSS media type stylesheets |
| `generate_print_preview` | Generate and capture high-fidelity PDF-style print previews |

---

### 🔹 Phase 6: Network & Communication [✅ Done]

#### 6.1 Network Interception & Mocking
| Feature | Description |
|---------|-------------|
| `intercept_request` | Intercept outgoing network requests to modify payloads, headers, or abort them entirely |
| `mock_response` | Serve custom simulated mock responses (JSON, HTML, custom headers, and status codes) |
| `block_resources` | Block specific network assets such as heavy tracking scripts, ads, custom fonts, or images |
| `modify_headers` | Inject, rewrite, or delete custom request and response header fields |
| `throttle_network` | Simulate varying network conditions (e.g., Slow 3G, Fast 4G, offline states) |

#### 6.2 WebSocket Support
| Feature | Description |
|---------|-------------|
| `capture_websocket` | Intercept, record, and log outgoing and incoming WebSocket frame data |
| `send_websocket_message` | Send custom payloads through active browser WebSocket channels |
| `intercept_websocket` | Modify or systematically block active WebSocket data streams |
| `list_websockets` | Enumerate all active WebSocket connections currently maintained by the page |

#### 6.3 HAR & Performance
| Feature | Description |
|---------|-------------|
| `export_har` | Export all recorded network transactions into a standard HTTP Archive (HAR) format |
| `import_har` | Replay simulated request flows from an imported HAR file |
| `get_page_load_time` | Measure precise page load durations and critical rendering milestones |
| `get_performance_metrics` | Collect precise Core Web Vitals (FCP, LCP, CLS, TTFB, FID) from the active context |
| `check_performance_budget` | Evaluate page performance scores against pre-configured budget parameters |
| `run_lighthouse_audit` | Generate comprehensive performance, SEO, and accessibility metrics |
| `memory_leak_detection` | Monitor JS heap distributions and active memory footprints to detect leaks |

---

### 🔹 Phase 7: Browser Control & Navigation [✅ Done]

#### 7.1 History & Bookmarks
| Feature | Description |
|---------|-------------|
| `go_back` | Trigger a browser back navigation event |
| `go_forward` | Trigger a browser forward navigation event |
| `get_history` | Retrieve secure, localized browsing history records |
| `add_bookmark` | Bookmark the current page URL with a custom title |
| `get_bookmarks` | Enumerate all saved browser bookmarks |
| `remove_bookmark` | Delete specific bookmarks by ID or URL |

#### 7.2 Download Management
| Feature | Description |
|---------|-------------|
| `trigger_download` | Initiate file downloads programmatically via click triggers or JS |
| `download_to_path` | Set custom directory paths for saving downloaded assets |
| `download_stream` | Handle large data streaming for custom file downloads |
| `get_downloads` | List active and historic browser download actions |
| `cancel_download` | Cancel target active browser download tasks |
| `download_progress` | Receive real-time download progress and speed metrics |

#### 7.3 Tab & Window Operations
| Feature | Description |
|---------|-------------|
| `switch_tab` | Switch focus to a target tab using indices, IDs, or title matches |
| `get_all_tabs` | Retrieve a detailed list of all open browser tabs and target metadata |
| `create_tab` | Open new browser tabs with targeted URLs |
| `close_tab` | Programmatically close specific active tab contexts |
| `reorder_tabs` | Reorder tab structures within the browser window |
| `duplicate_tab` | Instantly clone the current active tab context |

---

### 🔹 Phase 8: Anti-Detection & Stealth [✅ Done]

#### 8.1 Browser Fingerprinting
| Feature | Description |
|---------|-------------|
| `randomize_fingerprint` | Inject random noise into Canvas and WebGL contexts, and spoof fonts/User-Agent parameters |
| `viewport_randomization` | Randomize viewport sizes slightly to prevent static screen-size signatures |
| `timezone_override` | Override system timezones to align with custom location profiles |
| `locale_override` | Override system language preferences and locales |
| `geolocation_mock` | Spoof precise GPS coordinates (latitude, longitude, accuracy parameters) |

#### 8.2 Stealth Mode
| Feature | Description |
|---------|-------------|
| `hide_webdriver` | Mask the `navigator.webdriver` flag and patch permissions queries seamlessly |
| `patch_plugins` | Ingest and inject standard, highly realistic browser plugin arrays |
| `noise_injection` | Inject micro-variations and human-like jitter patterns into simulated mouse paths |
| `patch_webgl` | Mask and override default WebGL hardware vendors and renderer signatures |

#### 8.3 Proxy & Isolation
| Feature | Description |
|---------|-------------|
| `set_tab_proxy` | Configure dedicated, isolated proxy servers on a per-tab basis |
| `rotate_proxy` | Implement automatic proxy rotation sequences across requests |
| `proxy_auth` | Automate proxy authentication challenges (username/password credentials) |
| `create_context` | Initialize isolated, incognito browser context environments |
| `context_cookies` | Maintain individual, fully isolated cookie jars per context |
| `parallel_contexts` | Emulate multiple concurrent browser sessions side-by-side |

---

### 🔹 Phase 9: AI-Powered Features [✅ Done]

#### 9.1 Natural Language Interface
| Feature | Description |
|---------|-------------|
| `nl_command` | Execute complex directives from plain text (e.g., "fill the email field and submit") |
| `auto_navigate` | Understand high-level target goals (e.g., "search for the iPhone 15 price on Amazon") |
| `intent_recognition` | Parse natural language inputs into structured automation action lists |

#### 9.2 Smart Automation
| Feature | Description |
|---------|-------------|
| `smart_click` | Propose fallback targets dynamically if a click target is not found (using visual context) |
| `auto_retry` | Execute exponential backoffs automatically for flaky or dynamic elements |
| `selector_fallback` | Utilize robust fallbacks chaining CSS, XPath, text values, and accessibility tags |
| `self_healing_selector` | Heal and auto-correct broken selectors dynamically based on historical node trees |

#### 9.3 Visual Understanding
| Feature | Description |
|---------|-------------|
| `visual_locate` | Locate target nodes visually based on descriptive natural language text |
| `visual_verify` | Verify current states through visual comparison algorithms |
| `content_aware_wait` | Pause execution dynamically until all content assets are visually stabilized |

---

### 🔹 Phase 10: Testing & Developer Experience [✅ Done]

#### 10.1 Built-in Assertions
| Feature | Description |
|---------|-------------|
| `assert_visible` | Assert that a target element is active and fully visible in the viewport |
| `assert_text_contains` | Verify that a target element contains a specified text pattern |
| `assert_url_is` | Assert that the browser is positioned at a specific URL target |
| `assert_count` | Verify the total count of elements matching a specific selector |
| `assert_attribute` | Assert that a target element matches specific attribute-value pairs |

#### 10.2 Workflow Management
| Feature | Description |
|---------|-------------|
| `record_actions` | Capture user actions and serialize them into executable JSON files |
| `replay_workflow` | Replay automation procedures from pre-recorded JSON scripts |
| `workflow_edit` | Edit, restructure, or remove steps within recorded workflows |
| `workflow_schedule` | Schedule automation flows based on time intervals or events |

#### 10.3 Variable & Environment
| Feature | Description |
|---------|-------------|
| `set_variable` | Store custom data variables across workflow steps |
| `env_substitution` | Support dynamic variable injection using standard `{{ENV_VAR}}` syntax |
| `secrets_vault` | Securely store sensitive passwords and API tokens using robust encryption |
| `data_driven` | Drive automated loops using external CSV or JSON test data parameters |

#### 10.4 Accessibility & Compliance
| Feature | Description |
|---------|-------------|
| `check_accessibility` | Audit active layouts against WCAG 2.1 AA accessibility benchmarks |
| `get_accessibility_tree` | Extract structural accessibility representations highlighting active violations |
| `axe_scan` | Generate granular, expert compliance reports using integrated axe-core engines |
| `color_contrast_check` | Evaluate and verify text-to-background contrast ratios |

---

### 🔹 Phase 11: Search & Content [✅ Done]

#### 11.1 Page Search
| Feature | Description |
|---------|-------------|
| `find_text` | Search for target text patterns (with full support for case-sensitivity switches) |
| `highlight_text` | Visual highlight target text structures on the page |
| `count_occurrences` | Retrieve the exact count of matches for a target text string |
| `find_and_replace` | Search and replace text inputs within editable text domains |

---

### 🔹 Phase 12: Extension & Permission Management [✅ Done]

#### 12.1 Extension Control
| Feature | Description |
|---------|-------------|
| `install_extension` | Programmatically install Chromium extensions from CRX files or unpacked zip folders |
| `manage_extension` | Enable, disable, or systematically uninstall active browser extensions |
| `list_extensions` | Enumerate all extensions currently installed inside the browser environment |

#### 12.2 Permission Handling
| Feature | Description |
|---------|-------------|
| `grant_permission` | Programmatically grant system permissions (camera, microphone, geolocation, notifications) |
| `deny_permission` | Automatically decline permission prompt requests |
| `mock_permission` | Set specific custom mock responses to permission query calls |
| `reset_permissions` | Revert and reset all browser permission choices |

#### 12.3 Service Worker Control
| Feature | Description |
|---------|-------------|
| `list_service_workers` | Retrieve lists of active service workers registered by pages |
| `unregister_service_worker` | Unregister specific service workers dynamically |
| `skip_waiting` | Force active service worker updates to skip waiting phases |
| `clear_cache_storage` | Clear all data structures saved in the Service Worker Cache API |

---

### 🔹 Phase 13: Mutation & DOM Monitoring [✅ Done]

#### 13.1 DOM Observers
| Feature | Description |
|---------|-------------|
| `watch_dom` | Register active monitors tracking modifications (child additions, attribute tweaks, or subtree changes) |
| `wait_for_mutation` | Pause execution until specific DOM mutation conditions are fully satisfied |
| `mutation_callback` | Trigger background notifications when target DOM mutations occur |

---

## 🧪 Comprehensive Developer API & Commands

The extension exposes **95+ professional commands** via `chrome.runtime.sendMessage`. Below are the primary API definitions:

### 🛡️ Anti-Detection & Stealth (`stealth.ts`)
*   `hide_webdriver` - Spoofs browser permissions, fakes deep `window.chrome.runtime` structures, and hides automation flags.
*   `randomize_fingerprint` - Injects custom noise into Canvas renderings, overrides system memory size, and language arrays.
*   `patch_webgl` - Spoofs the WebGL vendor & renderer strings to typical hardware specifications (e.g. Intel/Google integrated chips).
*   `viewport_randomization` - Sets randomized viewport dimension metrics via `Emulation.setDeviceMetricsOverride`.
*   `set_tab_proxy` - Configures fixed server rules for isolating tab proxy metrics.

### 🤖 AI Selector & NLP Engine (`ai.ts`)
*   `generate_ai_selectors` - Analyzes complex target elements and returns multiple robust CSS and XPath backup selectors.
*   `suggest_selectors_for_text` - Locates candidate elements matching target labels using semantic matching algorithms.
*   `execute_nlp_action` - Parses natural language descriptions (e.g. *"find the blue submit button and click it"*) into precise automation actions.

### 🌐 Advanced Network Interception (`network.ts`)
*   `mock_network_request` - Adds dynamic intercept rules matching URLs to mock responses (status, body, headers).
*   `inject_network_latency` - Mocks artificial network latency (delay in ms) for responsive validation.
*   `capture_websocket` - Monitors full WebSocket frame streams (sent & received) matching target filter patterns.
*   `get_har_log` - Collects exact network traffic timings into the HTTP Archive (HAR) format.

### 📈 Real-Time DOM Mutation (`mutation.ts`)
*   `observe_dom_mutations` - Registers a live listener for target selector mutations (additions, attributes, or character changes) and reports structural shifts instantly.
*   `get_mutation_records` - Retrieves historical logs of registered page events.

---

## 📝 Example Integration Script

Call the SwatiAgent AI WebBridge directly from your client scripts:

```javascript
// 1. Enable Stealth Protections before navigation
chrome.runtime.sendMessage({ action: 'hide_webdriver' });
chrome.runtime.sendMessage({ action: 'randomize_fingerprint' });

// 2. Intercept API and Mock response
chrome.runtime.sendMessage({
  action: 'mock_network_request',
  args: {
    urlPattern: '**/api/v1/user/profile',
    responseBody: '{"id": 42, "name": "SwatiAgent Professional", "role": "Lead Architect"}',
    statusCode: 200
  }
});

// 3. Perform a human-like scroll and capture a high-definition element screenshot
chrome.runtime.sendMessage({
  action: 'scroll_to',
  args: { selector: '#profile-card' }
}, () => {
  chrome.runtime.sendMessage({
    action: 'capture_element_screenshot',
    args: { selector: '#profile-card' }
  }, (response) => {
    console.log('Profile Card HD Base64:', response.data);
  });
});
```

---

## 📄 License & Ethical Usage
Distributed under the **MIT License**. This tool is strictly designed for authorized penetration testing, automated quality assurance workflows, privacy-focused scraping, and user-empowered accessibility helper systems.

---

*Powered with ♥ by the **SwatiAgent AI** Engineering Core.*
