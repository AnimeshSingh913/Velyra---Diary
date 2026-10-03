// ============================================================
// CommandController — Text Command Parser & Dispatcher
//
// A standalone controller that parses text input into known
// diary commands and dispatches them via registered callbacks.
// Designed to be independent of React and Three.js internals.
// ============================================================

/** The set of commands the controller can dispatch. */
export type CommandType =
  | 'next_page'
  | 'previous_page'
  | 'open_page'
  | 'open_index'
  | 'new_entry'
  | 'search'

/** Parsed command result returned by the parser. */
export interface ParsedCommand {
  type: CommandType
  /** e.g. page number for "open page 5", or search text for "search [text]" */
  argument?: string
}

/** A human-readable suggestion shown in the command bar autocomplete. */
export interface CommandSuggestion {
  /** Display label, e.g. "Next Page" */
  label: string
  /** The raw text that would be executed */
  command: string
  /** Brief description */
  description: string
  /** The icon/emoji shown alongside */
  icon: string
}

/** Callbacks the host application registers to respond to commands. */
export interface CommandCallbacks {
  onNextPage: () => void
  onPreviousPage: () => void
  onOpenPage: (pageNumber: number) => void
  onOpenIndex: () => void
  onNewEntry: () => void
  onSearch: (query: string) => void
}

/** Result of executing a command. */
export interface CommandResult {
  success: boolean
  message: string
}

// ── Command definitions (patterns + metadata) ────────────────

interface CommandDef {
  type: CommandType
  /** Regex pattern to match the raw input */
  pattern: RegExp
  /** Which capture group (1-indexed) holds the argument, if any */
  argGroup?: number
  /** Human-readable label */
  label: string
  /** Description for suggestions */
  description: string
  /** Icon */
  icon: string
  /** Example command text */
  example: string
}

const COMMAND_DEFS: CommandDef[] = [
  {
    type: 'next_page',
    pattern: /^(?:next\s*(?:page)?|forward|np)$/i,
    label: 'Next Page',
    description: 'Turn to the next spread',
    icon: '▸',
    example: 'next page',
  },
  {
    type: 'previous_page',
    pattern: /^(?:prev(?:ious)?\s*(?:page)?|back(?:ward)?|pp)$/i,
    label: 'Previous Page',
    description: 'Turn to the previous spread',
    icon: '◂',
    example: 'previous page',
  },
  {
    type: 'open_page',
    pattern: /^(?:open|go(?:\s*to)?|page)\s+(?:page\s+)?(\d+)$/i,
    argGroup: 1,
    label: 'Open Page',
    description: 'Jump to a specific page number',
    icon: '⤳',
    example: 'open page 5',
  },
  {
    type: 'open_index',
    pattern: /^(?:open\s+)?index$/i,
    label: 'Open Index',
    description: 'Navigate to the index page',
    icon: '☰',
    example: 'open index',
  },
  {
    type: 'new_entry',
    pattern: /^(?:new\s*entry|create(?:\s*entry)?|add\s*entry)$/i,
    label: 'New Entry',
    description: 'Create a new diary entry',
    icon: '✦',
    example: 'new entry',
  },
  {
    type: 'search',
    pattern: /^search\s+(.+)$/i,
    argGroup: 1,
    label: 'Search',
    description: 'Search diary entries for text',
    icon: '⌕',
    example: 'search memories',
  },
]

// ── CommandController ────────────────────────────────────────

export class CommandController {
  private callbacks: CommandCallbacks | null = null

  /** Register the host application's action callbacks. */
  registerCallbacks(callbacks: CommandCallbacks): void {
    this.callbacks = callbacks
  }

  /** Unregister callbacks (cleanup). */
  unregisterCallbacks(): void {
    this.callbacks = null
  }

  /**
   * Parse raw user input into a structured command.
   * Returns null if the input doesn't match any known command.
   */
  parse(input: string): ParsedCommand | null {
    const trimmed = input.trim()
    if (!trimmed) return null

    for (const def of COMMAND_DEFS) {
      const match = trimmed.match(def.pattern)
      if (match) {
        const parsed: ParsedCommand = { type: def.type }
        if (def.argGroup && match[def.argGroup]) {
          parsed.argument = match[def.argGroup].trim()
        }
        return parsed
      }
    }
    return null
  }

  /**
   * Execute a parsed command by calling the registered callback.
   * Returns a result describing what happened.
   */
  execute(command: ParsedCommand): CommandResult {
    if (!this.callbacks) {
      return { success: false, message: 'Command system not connected' }
    }

    switch (command.type) {
      case 'next_page':
        this.callbacks.onNextPage()
        return { success: true, message: 'Turned to next page' }

      case 'previous_page':
        this.callbacks.onPreviousPage()
        return { success: true, message: 'Turned to previous page' }

      case 'open_page': {
        const pageNum = parseInt(command.argument || '', 10)
        if (isNaN(pageNum) || pageNum < 1) {
          return { success: false, message: 'Invalid page number' }
        }
        this.callbacks.onOpenPage(pageNum)
        return { success: true, message: `Navigated to page ${pageNum}` }
      }

      case 'open_index':
        this.callbacks.onOpenIndex()
        return { success: true, message: 'Navigated to index' }

      case 'new_entry':
        this.callbacks.onNewEntry()
        return { success: true, message: 'Opening new entry dialog' }

      case 'search': {
        const query = command.argument || ''
        if (!query) {
          return { success: false, message: 'Please provide a search term' }
        }
        this.callbacks.onSearch(query)
        return { success: true, message: `Searching for "${query}"` }
      }

      default:
        return { success: false, message: 'Unknown command' }
    }
  }

  /**
   * Parse and execute in one step. Returns the result.
   */
  run(input: string): CommandResult {
    const parsed = this.parse(input)
    if (!parsed) {
      return { success: false, message: 'Unknown command. Try "next page", "search [text]", or "new entry".' }
    }
    return this.execute(parsed)
  }

  /**
   * Get filtered suggestions based on partial input.
   */
  getSuggestions(partialInput: string): CommandSuggestion[] {
    const trimmed = partialInput.trim().toLowerCase()

    if (!trimmed) {
      // Show all suggestions
      return COMMAND_DEFS.map((def) => ({
        label: def.label,
        command: def.example,
        description: def.description,
        icon: def.icon,
      }))
    }

    return COMMAND_DEFS
      .filter((def) => {
        // Match against label, example command, or keywords
        const haystack = `${def.label} ${def.example} ${def.type}`.toLowerCase()
        return haystack.includes(trimmed) || trimmed.startsWith(def.example.split(' ')[0])
      })
      .map((def) => ({
        label: def.label,
        command: def.example,
        description: def.description,
        icon: def.icon,
      }))
  }
}

// Export a singleton for app-wide use
export const commandController = new CommandController()
