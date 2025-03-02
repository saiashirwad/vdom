import { produce, type Draft } from 'immer';
import type { VNode } from './vdom';

export type Pattern<TMsg extends { type: string }, TModel, TResult> = {
  [K in TMsg['type']]: (params: {
    msg: Extract<TMsg, { type: K }>,
    state: Draft<TModel>
  }) => TResult;
};

export function match<TMsg extends { type: string }, TModel, TResult>(
  msg: TMsg,
  patterns: Pattern<TMsg, TModel, TResult>,
  state: TModel | Draft<TModel>
): TResult {
  const handler = patterns[msg.type as keyof typeof patterns];
  return handler({
    msg: msg as Extract<TMsg, { type: typeof msg.type }>,
    state: state as Draft<TModel>
  });
}

export type Component<TModel, TMsg extends { type: string }> = {
  init: () => TModel;
  update: Pattern<TMsg, TModel, void | TModel | null>;
  view: (model: TModel, dispatch: (msg: TMsg) => void) => VNode;
  updateState: (msg: TMsg, state: TModel) => TModel;
  render: (props: { key: string, dispatch?: (msg: TMsg) => void, model?: TModel }) => VNode;
};

export function createComponent<TModel, TMsg extends { type: string }>(
  init: () => TModel,
  update: Pattern<TMsg, TModel, void | TModel | null>,
  view: (model: TModel, dispatch: (msg: TMsg) => void) => VNode
): Component<TModel, TMsg> {
  return {
    init,
    update,
    view,
    updateState: (msg: TMsg, state: TModel): TModel => {
      return produce(state, (draft: Draft<TModel>) => {
        match(msg, update, draft);
      });
    },
    render: (props: { key: string, dispatch?: (msg: TMsg) => void, model?: TModel }) => {
      return view(props.model ?? init(), props.dispatch ?? (() => { }));
    }
  };
}
