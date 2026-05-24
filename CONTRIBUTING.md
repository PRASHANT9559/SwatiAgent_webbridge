# Contributing to SwatiAgent AI WebBridge

Thank you for your interest in contributing! 🎉

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kimi-webbridge-extension.git
   cd kimi-webbridge-extension
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build:**
   ```bash
   npm run build
   ```

## 📝 How to Contribute

### Reporting Bugs
- Use the [Issues](../../issues) tab
- Include browser version, steps to reproduce, and expected vs actual behavior
- Attach console logs if available

### Feature Requests
- Open an issue with the `enhancement` label
- Describe the use case and expected behavior
- Reference related CDP domains if applicable

### Pull Requests
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Write clean, typed TypeScript code
3. Follow the existing code patterns in `src/commands/`
4. Test your changes by loading the extension in Chrome Developer Mode
5. Submit a PR with a clear description

## 🏗️ Architecture Guidelines

- **One command class per file** in `src/commands/`
- **Always sanitize** user inputs with `JSON.stringify()` before `Runtime.evaluate` interpolation
- **Use CDP** via `this.debuggerInstance.sendCommand()` — never raw `chrome.debugger`
- **Handle errors gracefully** — return `{ success: false, error: message }` instead of throwing

## 📏 Code Style

- TypeScript strict mode
- `async/await` for all async operations
- Descriptive method names matching the command action
- JSDoc comments on public methods

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.
