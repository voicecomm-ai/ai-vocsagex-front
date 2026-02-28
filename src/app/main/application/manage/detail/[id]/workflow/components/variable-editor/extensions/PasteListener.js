// ./extensions/PasteListener.js
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const PasteListener = (options = {}) =>
  Extension.create({
    name: 'pasteListener',

    addProseMirrorPlugins() {
      const self = this
      return [
        new Plugin({
          props: {
            handlePaste(view, event, slice) {
              const text = event.clipboardData?.getData('text/plain') || ''
              if (typeof options.onPaste === 'function') {
                let editor = self.editor;
                options.onPaste(text, event, editor)
              }

              return false
            },
          },
        }),
      ]
    },
  })

export default PasteListener
