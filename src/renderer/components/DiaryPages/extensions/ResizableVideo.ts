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
