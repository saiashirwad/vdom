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
 * Creates a child component dispatch from a parent component dispatch property
 */
export function createChildDispatch<TChildMsg extends { type: string }>(
  parentDispatchFn: (msg: any) => void
): PropertyDispatch<TChildMsg> {
  return createDispatch((childMsg: TChildMsg) => {
    parentDispatchFn({ msg: childMsg });
  });
}


