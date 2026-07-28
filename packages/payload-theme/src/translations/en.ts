/**
 * English — the source of truth for the theme's own strings.
 *
 * Every other locale is a `ThemeTranslations` object typed against this one, so
 * a new key is a compile error in every language file until it is translated.
 * Keys Payload already ships (`general:close`, `authentication:logOut`,
 * `general:createNewLabel`, …) are reused directly in the components and
 * deliberately absent here — this namespace only holds strings the theme adds.
 */

export const en = {
  // ---- sidebar + command palette -------------------------------------------
  search: 'Search',
  searchPlaceholder: 'Search or jump to…',
  commandPalette: 'Command palette',
  searchingDocuments: 'Searching documents…',
  noResultsFor: 'No results for “{{query}}”',
  groupRecent: 'Recent',
  groupDocuments: 'Documents',
  groupNavigate: 'Navigate',
  groupCreate: 'Create',
  groupActions: 'Actions',
  hintCollection: 'Collection',
  hintGlobal: 'Global',
  hintNew: 'New',
  hintAppearance: 'Appearance',
  hintHelp: 'Help',
  hintSession: 'Session',
  switchToLightMode: 'Switch to light mode',
  switchToDarkMode: 'Switch to dark mode',
  keyboardShortcuts: 'Keyboard shortcuts',
  paletteNavigate: 'navigate',
  paletteOpen: 'open',
  paletteToggle: 'toggle',

  // ---- dashboard ------------------------------------------------------------
  global: 'Global',
  manageConfiguration: 'Manage configuration',
  documentCount_one: 'document',
  documentCount_other: 'documents',
  lastThirtyDays: 'last 30 days',
  trendTitle: 'New documents, last 30 days vs the 30 before',
  trendAllNewTitle: 'All documents were created in the last 30 days',
  trendNew: 'New',

  // ---- document outline -----------------------------------------------------
  documentOutline: 'Document outline',
  onThisPage: 'On this page',

  // ---- keyboard shortcuts modal ---------------------------------------------
  shortcutsGlobal: 'Global',
  shortcutsPalette: 'Command palette',
  shortcutsEditView: 'Edit view',
  shortcutOpenPalette: 'Open the command palette',
  shortcutCloseDialogs: 'Close dialogs and popovers',
  shortcutMoveResults: 'Move through results',
  shortcutOpenResult: 'Open the selected result',
  shortcutClosePalette: 'Close the palette',
  shortcutSaveDocument: 'Save the document (Payload built-in)',

  // ---- header + theme customizer --------------------------------------------
  themeSettings: 'Theme settings',
  presets: 'Presets',
  accent: 'Accent',
  accentSwatch: 'Accent {{hex}}',
  customAccentHex: 'Custom accent hex',
  radius: 'Radius',
  font: 'Font',
  fontDefault: 'Default',
  colorMode: 'Color mode',
  contentLayout: 'Content layout',
  layoutCentered: 'Centered',
  layoutFull: 'Full',
  copyConfig: 'Copy config',
  copyConfigTitle: 'Copy the current look as a payloadTheme({ ... }) snippet',
  copied: 'Copied!',
  collapseSidebar: 'Collapse sidebar',
  expandSidebar: 'Expand sidebar',
  lightMode: 'Light mode',
  darkMode: 'Dark mode',

  // ---- media list view ------------------------------------------------------
  gridView: 'Grid view',
  listView: 'List view',

  // ---- login ----------------------------------------------------------------
  loginHeading: 'Welcome back',
  loginTagline: 'Sign in to manage your content.',
}

/** The shape every locale file must satisfy. */
export type ThemeTranslations = typeof en

/** `payloadTheme:<key>` — the fully-qualified keys the components pass to `t`. */
export type ThemeTranslationKey = `payloadTheme:${keyof ThemeTranslations extends infer K
  ? K extends `${infer Base}_one` | `${infer Base}_other`
    ? Base
    : K
  : never}`
