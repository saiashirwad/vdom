import { h, type VNode } from './vdom';

// Export $ for backward compatibility
export const $ = {} as Record<string, (...args: any[]) => VNode>;

type ElementProps = { [key: string]: any };
type ElementChildren = VNode | string | (VNode | string)[];
type ElementFunction = (props?: ElementProps, children?: ElementChildren) => VNode;

// Export individual element functions
export const a: ElementFunction = (props?, children?) => h('a', props, children);
export const abbr: ElementFunction = (props?, children?) => h('abbr', props, children);
export const article: ElementFunction = (props?, children?) => h('article', props, children);
export const aside: ElementFunction = (props?, children?) => h('aside', props, children);
export const audio: ElementFunction = (props?, children?) => h('audio', props, children);
export const b: ElementFunction = (props?, children?) => h('b', props, children);
export const blockquote: ElementFunction = (props?, children?) => h('blockquote', props, children);
export const body: ElementFunction = (props?, children?) => h('body', props, children);
export const br: ElementFunction = (props?, children?) => h('br', props, children);
export const button: ElementFunction = (props?, children?) => h('button', props, children);
export const canvas: ElementFunction = (props?, children?) => h('canvas', props, children);
export const caption: ElementFunction = (props?, children?) => h('caption', props, children);
export const code: ElementFunction = (props?, children?) => h('code', props, children);
export const col: ElementFunction = (props?, children?) => h('col', props, children);
export const colgroup: ElementFunction = (props?, children?) => h('colgroup', props, children);
export const data: ElementFunction = (props?, children?) => h('data', props, children);
export const datalist: ElementFunction = (props?, children?) => h('datalist', props, children);
export const dd: ElementFunction = (props?, children?) => h('dd', props, children);
export const del: ElementFunction = (props?, children?) => h('del', props, children);
export const details: ElementFunction = (props?, children?) => h('details', props, children);
export const dfn: ElementFunction = (props?, children?) => h('dfn', props, children);
export const dialog: ElementFunction = (props?, children?) => h('dialog', props, children);
export const div: ElementFunction = (props?, children?) => h('div', props, children);
export const dl: ElementFunction = (props?, children?) => h('dl', props, children);
export const dt: ElementFunction = (props?, children?) => h('dt', props, children);
export const em: ElementFunction = (props?, children?) => h('em', props, children);
export const fieldset: ElementFunction = (props?, children?) => h('fieldset', props, children);
export const figcaption: ElementFunction = (props?, children?) => h('figcaption', props, children);
export const figure: ElementFunction = (props?, children?) => h('figure', props, children);
export const footer: ElementFunction = (props?, children?) => h('footer', props, children);
export const form: ElementFunction = (props?, children?) => h('form', props, children);
export const h1: ElementFunction = (props?, children?) => h('h1', props, children);
export const h2: ElementFunction = (props?, children?) => h('h2', props, children);
export const h3: ElementFunction = (props?, children?) => h('h3', props, children);
export const h4: ElementFunction = (props?, children?) => h('h4', props, children);
export const h5: ElementFunction = (props?, children?) => h('h5', props, children);
export const h6: ElementFunction = (props?, children?) => h('h6', props, children);
export const header: ElementFunction = (props?, children?) => h('header', props, children);
export const hr: ElementFunction = (props?, children?) => h('hr', props, children);
export const i: ElementFunction = (props?, children?) => h('i', props, children);
export const iframe: ElementFunction = (props?, children?) => h('iframe', props, children);
export const img: ElementFunction = (props?, children?) => h('img', props, children);
export const input: ElementFunction = (props?, children?) => h('input', props, children);
export const label: ElementFunction = (props?, children?) => h('label', props, children);
export const legend: ElementFunction = (props?, children?) => h('legend', props, children);
export const li: ElementFunction = (props?, children?) => h('li', props, children);
export const main: ElementFunction = (props?, children?) => h('main', props, children);
export const map: ElementFunction = (props?, children?) => h('map', props, children);
export const mark: ElementFunction = (props?, children?) => h('mark', props, children);
export const menu: ElementFunction = (props?, children?) => h('menu', props, children);
export const meter: ElementFunction = (props?, children?) => h('meter', props, children);
export const nav: ElementFunction = (props?, children?) => h('nav', props, children);
export const ol: ElementFunction = (props?, children?) => h('ol', props, children);
export const optgroup: ElementFunction = (props?, children?) => h('optgroup', props, children);
export const option: ElementFunction = (props?, children?) => h('option', props, children);
export const output: ElementFunction = (props?, children?) => h('output', props, children);
export const p: ElementFunction = (props?, children?) => h('p', props, children);
export const pre: ElementFunction = (props?, children?) => h('pre', props, children);
export const progress: ElementFunction = (props?, children?) => h('progress', props, children);
export const section: ElementFunction = (props?, children?) => h('section', props, children);
export const select: ElementFunction = (props?, children?) => h('select', props, children);
export const small: ElementFunction = (props?, children?) => h('small', props, children);
export const span: ElementFunction = (props?, children?) => h('span', props, children);
export const strong: ElementFunction = (props?, children?) => h('strong', props, children);
export const sub: ElementFunction = (props?, children?) => h('sub', props, children);
export const summary: ElementFunction = (props?, children?) => h('summary', props, children);
export const sup: ElementFunction = (props?, children?) => h('sup', props, children);
export const table: ElementFunction = (props?, children?) => h('table', props, children);
export const tbody: ElementFunction = (props?, children?) => h('tbody', props, children);
export const td: ElementFunction = (props?, children?) => h('td', props, children);
export const textarea: ElementFunction = (props?, children?) => h('textarea', props, children);
export const tfoot: ElementFunction = (props?, children?) => h('tfoot', props, children);
export const th: ElementFunction = (props?, children?) => h('th', props, children);
export const thead: ElementFunction = (props?, children?) => h('thead', props, children);
export const time: ElementFunction = (props?, children?) => h('time', props, children);
export const tr: ElementFunction = (props?, children?) => h('tr', props, children);
export const track: ElementFunction = (props?, children?) => h('track', props, children);
export const ul: ElementFunction = (props?, children?) => h('ul', props, children);
export const video: ElementFunction = (props?, children?) => h('video', props, children);

// Add all functions to $ for backward compatibility
const elements = [
  'a', 'abbr', 'article', 'aside', 'audio', 'b', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details',
  'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure', 'footer',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input',
  'label', 'legend', 'li', 'main', 'map', 'mark', 'menu', 'meter', 'nav', 'ol', 'optgroup',
  'option', 'output', 'p', 'pre', 'progress', 'section', 'select', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time',
  'tr', 'track', 'ul', 'video'
];

elements.forEach(element => {
  $[element] = (props?: ElementProps, children?: ElementChildren) => h(element, props, children);
});

export { h };
$.h = h;