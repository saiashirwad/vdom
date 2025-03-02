
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
 * Creates a dispatch function for a nested component that maps component-specific
 * messages to parent component messages
 */
export function createNestedDispatch<TMsg extends { type: string }>(
  mapper: (msg: TMsg) => void
): EnhancedDispatch<TMsg> {
  return createEnhancedDispatch(mapper);
}

// Alternative name if you prefer:
export const mapDispatch = createNestedDispatch; 