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
      width: { 
        default: '50%',
        parseHTML: element => element.getAttribute('data-width') || element.getAttribute('width') || '50%',
        renderHTML: attributes => ({ 'data-width': attributes.width, width: attributes.width }),
      },
      align: { 
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center',
        renderHTML: attributes => ({ 'data-align': attributes.align }),
      },
      wrap: { 
        default: 'none',
        parseHTML: element => element.getAttribute('data-wrap') || 'none',
        renderHTML: attributes => ({ 'data-wrap': attributes.wrap }),
      },
      mediaId: { 
        default: null,
        parseHTML: element => element.getAttribute('data-media-id') || element.getAttribute('mediaId') || null,
        renderHTML: attributes => ({ 'data-media-id': attributes.mediaId, mediaId: attributes.mediaId }),
      },
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
