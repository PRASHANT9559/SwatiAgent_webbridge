interface Chrome {
  downloads: any;
  tabs: any;
  history: any;
  bookmarks: any;
  debugger: any;
  downmarks: any;
  tabGroups: any;
  runtime: any;
  permissions: any;
  proxy: any;
  windows: any;
}

declare const chrome: Chrome;

declare namespace chrome {
  namespace downloads {
    type DownloadItem = any;
    type DownloadDelta = any;
    type DownloadOptionsType = any;
    type DownloadQueryType = any;
  }
  namespace tabs {
    type Tab = any;
    type QueryInfo = any;
    type CreatePropertiesType = any;
  }
  namespace history {
    type HistoryItem = any;
    type SearchQuery = any;
  }
  namespace bookmarks {
    type BookmarkTreeNode = any;
    type BookmarkUpdateInfo = any;
    type BookmarkCreateInfo = any;
  }
}
