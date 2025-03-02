import { produce, type Draft } from 'immer';
import { type PropertyDispatch } from './dispatch';
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
  view: (model: TModel, dispatch: PropertyDispatch<TMsg>) => VNode;
  updateState: ((msg: TMsg, state: TModel) => TModel) &
  ((params: { msg: { msg: TMsg }, state: any }) => void);
};

export function component<TModel, TMsg extends { type: string }>(
  init: () => TModel,
  update: Pattern<TMsg, TModel, void | TModel | null>,
  view: (model: TModel, dispatch: PropertyDispatch<TMsg>) => VNode
): Component<TModel, TMsg> & ((props: { model: TModel, dispatch: PropertyDispatch<TMsg> }) => VNode) {
  // The enhanced updateState function that handles both patterns
  const updateStateImpl = (msgOrParams: TMsg | { msg: { msg: TMsg }, state: any }, stateArg?: TModel): TModel | void => {
    // Check if we're being called with the nested update pattern
    if (msgOrParams && typeof msgOrParams === 'object' && 'msg' in msgOrParams && 'state' in msgOrParams) {
      const { msg: { msg }, state } = msgOrParams as { msg: { msg: TMsg }, state: any };
      // Check if we can identify the child state property
      for (const key in state) {
        if (typeof state[key] === 'object') {
          // Try updating this property
          const newChildState = produce(state[key], (draft: Draft<TModel>) => {
            match(msg, update, draft);
          });
          state[key] = newChildState;
          return;
        }
      }
    } else {
      // Traditional usage: (msg, state) => newState
      const msg = msgOrParams as TMsg;
      const state = stateArg as TModel;
      return produce(state, (draft: Draft<TModel>) => {
        match(msg, update, draft);
      });
    }
  };

  // Create the function that will be both the component object and the JSX component
  const componentFunc = function (props: { model: TModel, dispatch: PropertyDispatch<TMsg> }): VNode {
    return view(props.model, props.dispatch);
  };

  // Add properties to the function
  componentFunc.init = init;
  componentFunc.update = update;
  componentFunc.updateState = updateStateImpl as any;
  componentFunc.view = function (modelOrProps: TModel | { model: TModel, dispatch: PropertyDispatch<TMsg> },
    dispatchArg?: PropertyDispatch<TMsg>): VNode {
    // Check if called with JSX props pattern
    if (modelOrProps && typeof modelOrProps === 'object' && 'model' in modelOrProps && 'dispatch' in modelOrProps) {
      return view(modelOrProps.model, modelOrProps.dispatch);
    }
    // Called with traditional (model, dispatch) pattern
    return view(modelOrProps as TModel, dispatchArg!);
  };

  return componentFunc as any;
}
