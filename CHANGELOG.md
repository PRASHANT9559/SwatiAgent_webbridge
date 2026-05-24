# Changelog

All notable changes to **SwatiAgent AI WebBridge** will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-05-24

### 🔒 Security Hardening (47 bugs remediated)
- **CRITICAL:** Fixed debugger desync between `background.ts` and `Debugger` singleton
- **CRITICAL:** Eliminated 15+ XSS injection vectors via `JSON.stringify()` sanitization
- **CRITICAL:** Added 6 missing permissions to manifest (`history`, `bookmarks`, `downloads`, `cookies`, `clipboardRead`, `clipboardWrite`)
- **HIGH:** Fixed CDP parameter mapping (`source` → `expression` in `Runtime.evaluate`)
- **HIGH:** Corrected screenshot result paths and removed invalid CDP commands
- **HIGH:** Replaced `innerHTML` text highlighting with `TreeWalker` (preserves event listeners)
- **HIGH:** Fixed touch event lifecycle sequences (`touchStart` → `touchMove` → `touchEnd`)
- **HIGH:** Corrected permissions API usage (`Browser.grantPermissions` instead of `chrome.permissions`)
- **MEDIUM:** Fixed CSV export double-escaping and added RFC 4180 field escaping
- **MEDIUM:** Implemented real HAR 1.2 export from intercepted requests
- **MEDIUM:** Expanded keyboard keyCode mapping (F1-F12, punctuation, modifiers)
- **MEDIUM:** Replaced fragile `setTimeout(100)` dropdown with `MutationObserver`
- **LOW:** Added OOM protection for large localStorage dumps (500 entry cap)
- **LOW:** Expanded cookie banner selectors to 25+ platforms

### ✨ Added
- Phase 1-13: Full 95+ command implementation
- Anti-detection & stealth system (WebGL, Canvas, Navigator patching)
- AI-powered selector engine with natural language support
- Network interception, mocking, and HAR export
- Touch/mobile emulation with proper gesture sequences
- DOM mutation monitoring with real-time callbacks
- Comprehensive test assertion framework

### 🏗️ Architecture
- Manifest V3 service worker architecture
- TypeScript + Vite build system
- Modular command classes (23 files)
- CDP-first design — all automation via Chrome DevTools Protocol

---

## [1.9.13] - 2026-05-23

### Initial Release
- Core browser automation commands
- Basic CDP integration
- Extension popup UI

