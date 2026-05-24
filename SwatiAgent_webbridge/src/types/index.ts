// Core types for SwatiAgent AI Extension

export interface CommandArgs {
  [key: string]: any;
}

export interface CommandResult {
  success?: boolean;
  [key: string]: any;
}

export interface TabInfo {
  tabId: number;
  url: string;
  title: string;
  active: boolean;
  groupTitle?: string;
}

export interface SessionInfo {
  name: string;
  tabId: number;
  groupId?: string;
}

export interface CDPCommand {
  action: string;
  args: CommandArgs;
  session?: string;
}

// Phase 2 specific types
export interface WaitForSelectorOptions {
  selector: string;
  timeout?: number;
  visible?: boolean;
  hidden?: boolean;
}

export interface WaitForNavigationOptions {
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface ScrollOptions {
  selector?: string;
  x?: number;
  y?: number;
  behavior?: 'auto' | 'smooth';
}

export interface KeyboardOptions {
  key: string;
  count?: number;
  delay?: number;
}

export interface TypeTextOptions {
  selector: string;
  value: string;
  delay?: number;
  clear?: boolean;
}

export interface SelectOptionOptions {
  selector: string;
  value?: string;
  text?: string;
  index?: number;
}

export interface ExtractDataOptions {
  selector: string;
  attribute?: string;
  all?: boolean;
}

export interface PageSearchOptions {
  query: string;
  caseSensitive?: boolean;
  includeHidden?: boolean;
}

// Phase 5: Screenshot & Visual types
export interface ScreenshotOptions {
  format?: 'png' | 'jpeg';
  quality?: number; // 0-100 for jpeg
  clip?: { x: number; y: number; width: number; height: number };
}

export interface FullPageScreenshotOptions extends ScreenshotOptions {
  captureBeyondViewport?: boolean;
}

export interface ElementScreenshotOptions extends ScreenshotOptions {
  selector: string;
}

export interface ScreenshotBase64Options extends ScreenshotOptions {
  fullPage?: boolean;
  selector?: string;
}

export interface CompareScreenshotsOptions {
  screenshot1: string; // base64 encoded
  screenshot2: string; // base64 encoded
}

export interface VisualAssertOptions {
  imageBase64: string;
  prompt: string;
  model?: string;
  temperature?: number;
}

export interface OCRExtractOptions {
  language?: string; // e.g., 'eng', 'hin'
  psm?: number; // Page segmentation mode
}

export interface VisualSelectorOptions {
  screenshotBase64: string;
  x: number;
  y: number;
  scaleFactor?: number;
}

export interface SetDarkModeOptions {
  enabled?: boolean;
}

export interface SetZoomOptions {
  factor: number; // 0.25 to 5.0
}

export interface EmulatePrintOptions {
  enabled?: boolean;
}

export interface GeneratePrintPreviewOptions {
  landscape?: boolean;
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
  scale?: number; // 0.1 to 2.0
  paperWidth?: number; // inches
  paperHeight?: number; // inches
  marginTop?: number; // inches
  marginBottom?: number; // inches
  marginLeft?: number; // inches
  marginRight?: number; // inches
  pageRanges?: string; // e.g., '1-5, 8, 11-13'
  ignoreInvalidPageRanges?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  preferCSSPageSize?: boolean;
}
