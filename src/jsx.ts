import type { VNode } from './vdom';
import { createElement } from './vdom';

// Create a Fragment component
export function Fragment(props: { children?: any }): VNode {
  return {
    type: 'Fragment',
    props: {},
    children: Array.isArray(props.children) ? props.children : [props.children].filter(Boolean)
  };
}

// This function will be used by TypeScript to compile JSX
export function h(
  tag: string | Function,
  props: Record<string, any> | null,
  ...children: any[]
): VNode {
  return createElement(tag, props || {}, children.flat());
}

// Declare JSX namespace for TypeScript
declare global {
  namespace JSX {
    interface Element extends VNode { }

    interface IntrinsicElements {
      // HTML elements with specific types
      div: HTMLAttributes;
      span: HTMLAttributes;
      p: HTMLAttributes;
      h1: HTMLAttributes;
      h2: HTMLAttributes;
      h3: HTMLAttributes;
      h4: HTMLAttributes;
      h5: HTMLAttributes;
      h6: HTMLAttributes;
      button: ButtonHTMLAttributes;
      input: InputHTMLAttributes;
      select: SelectHTMLAttributes;
      // Keep going for other elements you commonly use

      // For elements you use less often, you can keep using any
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
      dl: any;
      dt: any;
      em: any;
      embed: any;
      fieldset: any;
      figcaption: any;
      figure: any;
      footer: any;
      form: any;
      head: any;
      header: any;
      hr: any;
      html: any;
      i: any;
      iframe: any;
      img: any;
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
      small: any;
      source: any;
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
      children?: ChildrenType;
      // Common attributes
      className?: string;
      id?: string;
      style?: string | object;
      key?: string;
      title?: string;
      tabIndex?: number;
      role?: string;
      ariaLabel?: string;
      ariaDescribedBy?: string;
      ariaHidden?: boolean | 'true' | 'false';

      // Event handlers
      onClick?: (event: MouseEvent) => void;
      onChange?: (event: Event) => void;
      onInput?: (event: InputEvent) => void;
      onKeyDown?: (event: KeyboardEvent) => void;
      onKeyUp?: (event: KeyboardEvent) => void;
      onFocus?: (event: FocusEvent) => void;
      onBlur?: (event: FocusEvent) => void;
      onSubmit?: (event: Event) => void;
      onMouseOver?: (event: MouseEvent) => void;
      onMouseOut?: (event: MouseEvent) => void;
    }

    // Input element attributes
    interface InputHTMLAttributes extends HTMLAttributes {
      type?: 'text' | 'password' | 'checkbox' | 'radio' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'time' | 'file';
      value?: string | number | readonly string[];
      checked?: boolean;
      placeholder?: string;
      disabled?: boolean;
      required?: boolean;
      name?: string;
      autoComplete?: string;
      min?: number | string;
      max?: number | string;
      pattern?: string;
    }

    // Button element attributes
    interface ButtonHTMLAttributes extends HTMLAttributes {
      type?: 'button' | 'submit' | 'reset';
      disabled?: boolean;
      name?: string;
      value?: string | number | readonly string[];
    }

    // Select element attributes
    interface SelectHTMLAttributes extends HTMLAttributes {
      value?: string | number | readonly string[];
      multiple?: boolean;
      disabled?: boolean;
      name?: string;
      required?: boolean;
      size?: number;
    }
  }
}

type ChildrenType = VNode | string | number | boolean | null | undefined | ChildrenType[];

// And update the HTMLAttributes interface to include children
interface HTMLAttributes {
  children?: ChildrenType;
  // ... other attributes
} 