import { Extension } from '@tiptap/core'

export interface IndentOptions {
  types: string[]
  minIndent: number
  maxIndent: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Increase the indent of the current block
       */
      indent: () => ReturnType
      /**
       * Decrease the indent of the current block
       */
      outdent: () => ReturnType
    }
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minIndent: 0,
      maxIndent: 8,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const paddingLeft = element.style.paddingLeft
              if (!paddingLeft) return 0
              const match = paddingLeft.match(/^(\d+)rem$/)
              if (match) return parseInt(match[1], 10)
              return 0
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) {
                return {}
              }
              return {
                style: `padding-left: ${attributes.indent * 2}rem`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        let success = false

        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0
            if (currentIndent < this.options.maxIndent) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent + 1,
              })
              success = true
            }
          }
        })

        if (dispatch && success) {
          dispatch(tr)
        }
        return success
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        let success = false

        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0
            if (currentIndent > this.options.minIndent) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent - 1,
              })
              success = true
            }
          }
        })

        if (dispatch && success) {
          dispatch(tr)
        }
        return success
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    }
  },
})
