import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableMediaNodeView } from './ResizableMediaNodeView'

export interface ResizableVideoOptions {
  inline: boolean
  HTMLAttributes: Record<string, any>
}

export const ResizableVideo = Node.create<ResizableVideoOptions>({
  name: 'resizableVideo',
  group: 'block',
  inline: false,
  draggable: true,

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      align: { default: 'center' }, // 'left', 'center', 'right'
      wrap: { default: 'none' }, // 'none', 'wrap'
      mediaId: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { controls: true })]
  },

  addCommands() {
    return {
      setResizableVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableMediaNodeView)
  },
})
