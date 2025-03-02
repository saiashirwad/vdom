/**
 * Enhanced dispatch type that allows both function calls and property access
 * for message dispatching
 */
export type EnhancedDispatch<TMsg extends { type: string }> = {
  [K in TMsg['type']]: <T extends Extract<TMsg, { type: K }>>
    (params?: Omit<T, 'type'>) => void;
} & ((msg: TMsg) => void);

/**
 * Creates an enhanced dispatch object that allows both traditional dispatch
 * and property-based dispatch:
 * 
 * - Traditional: dispatch({ type: 'INCREMENT' })
 * - Enhanced: dispatch.INCREMENT()
 * - With params: dispatch.SET({ value: 10 })
 */
export function createEnhancedDispatch<TMsg extends { type: string }>(
  dispatch: (msg: TMsg) => void
): EnhancedDispatch<TMsg> {
  return new Proxy(dispatch as any, {
    get(target, prop) {
      if (typeof prop === 'string') {
        return (params = {}) => {
          const msg = { type: prop, ...params } as TMsg;
          return dispatch(msg);
        };
      }
      return target[prop];
    },
    apply(target, _, args) {
      return dispatch(args[0]);
    }
  }) as EnhancedDispatch<TMsg>;
}

/**
 * Maps dispatches from child components to parent components
 */
export function mapDispatch(
  parentDispatcher: any
): any {
  return createEnhancedDispatch((childMsg: any) => {
    parentDispatcher({ msg: childMsg });
  });
}

// Export the old name for backward compatibility
export const createNestedDispatch = mapDispatch; 