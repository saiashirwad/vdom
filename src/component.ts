import { produce, type Draft } from 'immer';
import type { VNode } from './vdom';
import { createEnhancedDispatch, type EnhancedDispatch } from './dispatch';

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
  view: (model: TModel, dispatch: EnhancedDispatch<TMsg>) => VNode;
  updateState: (msg: TMsg, state: TModel) => TModel;
  render: (props: { key: string, dispatch?: (msg: TMsg) => void, model?: TModel }) => VNode;
};

export function component<TModel, TMsg extends { type: string }>(
  init: () => TModel,
  update: Pattern<TMsg, TModel, void | TModel | null>,
  view: (model: TModel, dispatch: EnhancedDispatch<TMsg>) => VNode
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
      const baseDispatch = props.dispatch ?? (() => { });
      const enhancedDispatch = createEnhancedDispatch<TMsg>(baseDispatch);
      return view(props.model ?? init(), enhancedDispatch);
    }
  };
}
