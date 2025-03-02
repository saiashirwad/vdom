import { h, type VNode } from './vdom';

export const $ = {} as Record<string, (...args: any[]) => VNode>;

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
  $[element] = (props?: { [key: string]: any }, children?: VNode | string | (VNode | string)[]) => {
    return h(element, props, children);
  };
});

$.h = h; 