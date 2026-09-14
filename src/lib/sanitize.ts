import sanitizeHtml from 'sanitize-html'

const postContentOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'div',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'sub',
    'sup',
    'mark',
    'small',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'img',
    'figure',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    div: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto', 'tel'],
    img: ['http', 'https'],
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    div: (tagName, attribs): sanitizeHtml.Tag => ({
      tagName: 'div',
      attribs:
        attribs.class === 'related-inline'
          ? { class: 'related-inline' }
          : ({} as Record<string, string>),
    }),
  },
  exclusiveFilter: (frame) => {
    if (frame.tag === 'img' && !frame.attribs.src) return true
    return false
  },
  allowVulnerableTags: false,
}

export function sanitizePostContent(html: string): string {
  return sanitizeHtml(html, postContentOptions)
}