import type { VNode } from './vdom';

// Create a Fragment component
export function Fragment(props: { children?: any }): VNode {
  return {
    type: 'Fragment',
    props: {},
    children: Array.isArray(props.children) ? props.children : [props.children].filter(Boolean)
  };
}

// Declare JSX namespace for TypeScript
declare global {
  namespace JSX {
    interface Element extends VNode { }

    interface IntrinsicElements {
      // HTML elements
      a: any;
      abbr: any;
      address: any;
      area: any;
      article: any;
      aside: any;
      audio: any;
      b: any;
      base: any;
      bdi: any;
      bdo: any;
      blockquote: any;
      body: any;
      br: any;
      button: any;
      canvas: any;
      caption: any;
      cite: any;
      code: any;
      col: any;
      colgroup: any;
      data: any;
      datalist: any;
      dd: any;
      del: any;
      details: any;
      dfn: any;
      dialog: any;
      div: any;
      dl: any;
      dt: any;
      em: any;
      embed: any;
      fieldset: any;
      figcaption: any;
      figure: any;
      footer: any;
      form: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      head: any;
      header: any;
      hr: any;
      html: any;
      i: any;
      iframe: any;
      img: any;
      input: any;
      ins: any;
      kbd: any;
      label: any;
      legend: any;
      li: any;
      link: any;
      main: any;
      map: any;
      mark: any;
      meta: any;
      meter: any;
      nav: any;
      noscript: any;
      object: any;
      ol: any;
      optgroup: any;
      option: any;
      output: any;
      p: any;
      param: any;
      picture: any;
      pre: any;
      progress: any;
      q: any;
      rp: any;
      rt: any;
      ruby: any;
      s: any;
      samp: any;
      script: any;
      section: any;
      select: any;
      small: any;
      source: any;
      span: any;
      strong: any;
      style: any;
      sub: any;
      summary: any;
      sup: any;
      table: any;
      tbody: any;
      td: any;
      template: any;
      textarea: any;
      tfoot: any;
      th: any;
      thead: any;
      time: any;
      title: any;
      tr: any;
      track: any;
      u: any;
      ul: any;
      var: any;
      video: any;
      wbr: any;
    }

    // Add more specific props with better typing later:
    interface HTMLAttributes {
      // Common attributes
      className?: string;
      id?: string;
      style?: string | object;
      key?: string;

      // Event handlers
      onClick?: (event: MouseEvent) => void;
      onChange?: (event: Event) => void;
      onInput?: (event: InputEvent) => void;
      // Add more as needed
    }
  }
} 