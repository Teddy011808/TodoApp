import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { cartReducer, type CartAction, type CartState } from './cartReducer'

export interface CartContextValue {
  items: CartState
  dispatch: Dispatch<CartAction>
}

/** null default, same reasoning as AuthContext — see useCart below. */
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  // `dispatch` is referentially stable, so this value only changes when items do.
  const value = useMemo<CartContextValue>(() => ({ items, dispatch }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (context === null) {
    throw new Error('useCart must be called inside a <CartProvider>')
  }
  return context
}
