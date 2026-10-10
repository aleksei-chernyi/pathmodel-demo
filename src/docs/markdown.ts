import { Marked, Renderer } from "marked"
import { markedHighlight } from "marked-highlight"
import hljs from "highlight.js/lib/core"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import json from "highlight.js/lib/languages/json"
import bash from "highlight.js/lib/languages/bash"

hljs.registerLanguage("ts", typescript)
hljs.registerLanguage("vue", xml)
hljs.registerLanguage("json", json)
hljs.registerLanguage("bash", bash)

export interface Heading {
  id: string
  text: string
  depth: number
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>|`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export function highlight(code: string, lang: string): string {
  return hljs.getLanguage(lang)
    ? hljs.highlight(code, { language: lang }).value
    : hljs.highlightAuto(code).value
}

/** Renders the Markdown, and returns the h2/h3 headings for the table of contents. */
export function render(source: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  const marked = new Marked(
    markedHighlight({ emptyLangClass: "hljs", langPrefix: "hljs language-", highlight }),
    {
      renderer: {
        heading({ tokens, depth, text }) {
          const id = slug(text)
          if (depth <= 3) headings.push({ id, text: text.replace(/`/g, ""), depth })
          return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`
        },
        link({ href, tokens }) {
          const label = this.parser.parseInline(tokens)
          const external = /^https?:/.test(href)
          return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ""}${
            href.startsWith("#/playground") ? ' class="doc-try"' : ""
          }>${label}</a>`
        },
        table(token) {
          // Wide tables scroll inside their own box on small screens.
          const html = Renderer.prototype.table.call(this, token)
          return `<div class="doc-table">${html}</div>`
        },
      },
    }
  )
  return { html: marked.parse(source, { async: false }) as string, headings }
}
