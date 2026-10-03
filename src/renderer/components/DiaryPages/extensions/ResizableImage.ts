import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableMediaNodeView } from './ResizableMediaNodeView'

export interface ResizableImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, any>
}

export const ResizableImage = Node.create<ResizableImageOptions>({
  name: 'resizableImage',
  group: 'block',
  inline: false,
  draggable: true,

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: '100%' },
      align: { default: 'center' }, // 'left', 'center', 'right'
      wrap: { default: 'none' }, // 'none', 'wrap'
      mediaId: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setResizableImage: (options) => ({ commands }) => {
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
