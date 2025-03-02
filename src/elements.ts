import { h, type VNode } from './vdom';

// Export $ for backward compatibility
export const $ = {} as Record<string, (...args: any[]) => VNode>;

type ElementProps = { [key: string]: any };
type ElementChildren = VNode | string | (VNode | string)[];

// Improved ElementFunction type with overloads
interface ElementFunction {
  // Just children, no props
  (children: ElementChildren): VNode;
  // Props and optional children
  (props: ElementProps, children?: ElementChildren): VNode;
}

// Helper function to implement the overloaded behavior
function createElementFunction(tag: string): ElementFunction {
  return function (propsOrChildren?: ElementProps | ElementChildren, maybeChildren?: ElementChildren) {
    // If first argument is an object that's not an array and not null, treat as props
    if (propsOrChildren && typeof propsOrChildren === 'object' && !Array.isArray(propsOrChildren)) {
      return h(tag, propsOrChildren, maybeChildren);
    }
    // Otherwise, first argument is children, no props
    return h(tag, {}, propsOrChildren as ElementChildren);
  } as ElementFunction;
}

// Export individual element functions
export const a = createElementFunction('a');
export const abbr = createElementFunction('abbr');
export const article = createElementFunction('article');
export const aside = createElementFunction('aside');
export const audio = createElementFunction('audio');
export const b = createElementFunction('b');
export const blockquote = createElementFunction('blockquote');
export const body = createElementFunction('body');
export const br = createElementFunction('br');
export const button = createElementFunction('button');
export const canvas = createElementFunction('canvas');
export const caption = createElementFunction('caption');
export const code = createElementFunction('code');
export const col = createElementFunction('col');
export const colgroup = createElementFunction('colgroup');
export const data = createElementFunction('data');
export const datalist = createElementFunction('datalist');
export const dd = createElementFunction('dd');
export const del = createElementFunction('del');
export const details = createElementFunction('details');
export const dfn = createElementFunction('dfn');
export const dialog = createElementFunction('dialog');
export const div = createElementFunction('div');
export const dl = createElementFunction('dl');
export const dt = createElementFunction('dt');
export const em = createElementFunction('em');
export const fieldset = createElementFunction('fieldset');
export const figcaption = createElementFunction('figcaption');
export const figure = createElementFunction('figure');
export const footer = createElementFunction('footer');
export const form = createElementFunction('form');
export const h1 = createElementFunction('h1');
export const h2 = createElementFunction('h2');
export const h3 = createElementFunction('h3');
export const h4 = createElementFunction('h4');
export const h5 = createElementFunction('h5');
export const h6 = createElementFunction('h6');
export const header = createElementFunction('header');
export const hr = createElementFunction('hr');
export const i = createElementFunction('i');
export const iframe = createElementFunction('iframe');
export const img = createElementFunction('img');
export const input = createElementFunction('input');
export const label = createElementFunction('label');
export const legend = createElementFunction('legend');
export const li = createElementFunction('li');
export const main = createElementFunction('main');
export const map = createElementFunction('map');
export const mark = createElementFunction('mark');
export const menu = createElementFunction('menu');
export const meter = createElementFunction('meter');
export const nav = createElementFunction('nav');
export const ol = createElementFunction('ol');
export const optgroup = createElementFunction('optgroup');
export const option = createElementFunction('option');
export const output = createElementFunction('output');
export const p = createElementFunction('p');
export const pre = createElementFunction('pre');
export const progress = createElementFunction('progress');
export const section = createElementFunction('section');
export const select = createElementFunction('select');
export const small = createElementFunction('small');
export const span = createElementFunction('span');
export const strong = createElementFunction('strong');
export const sub = createElementFunction('sub');
export const summary = createElementFunction('summary');
export const sup = createElementFunction('sup');
export const table = createElementFunction('table');
export const tbody = createElementFunction('tbody');
export const td = createElementFunction('td');
export const textarea = createElementFunction('textarea');
export const tfoot = createElementFunction('tfoot');
export const th = createElementFunction('th');
export const thead = createElementFunction('thead');
export const time = createElementFunction('time');
export const tr = createElementFunction('tr');
export const track = createElementFunction('track');
export const ul = createElementFunction('ul');
export const video = createElementFunction('video');

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
  $[element] = createElementFunction(element);
});

export { h };
$.h = h;