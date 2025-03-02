/**
 * Property-based dispatch type that allows message dispatching via property access
 */
export type PropertyDispatch<TMsg extends { type: string }> = {
  [K in TMsg['type']]: <T extends Extract<TMsg, { type: K }>>
    (params?: Omit<T, 'type'>) => void;
};

/**
 * Creates a property-based dispatch object that allows dispatching messages via properties:
 * 
 * - dispatch.INCREMENT()
 * - With params: dispatch.SET({ value: 10 })
 */
export function createDispatch<TMsg extends { type: string }>(
  dispatch: (msg: TMsg) => void
): PropertyDispatch<TMsg> {
  return new Proxy({} as any, {
    get(_, prop) {
      if (typeof prop === 'string') {
        return (params = {}) => {
          const msg = { type: prop, ...params } as TMsg;
          return dispatch(msg);
        };
      }
      return undefined;
    }
  }) as PropertyDispatch<TMsg>;
}

/**
 * Infers the message type from a parent dispatch function property
 */
type InferMessageType<T> = T extends (params?: { msg: infer M }) => void ? M : never;

/**
 * Creates a child component dispatch function from a parent component dispatch property
 * Properly infers the message type from the parent dispatch function
 */
export function mapDispatch<ParentDispatchFn extends (params?: { msg: any }) => void>(
  parentDispatchFn: ParentDispatchFn
): PropertyDispatch<InferMessageType<ParentDispatchFn>> {
  return createDispatch((msg: InferMessageType<ParentDispatchFn>) => {
    parentDispatchFn({ msg });
  });
}
