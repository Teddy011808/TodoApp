import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { cartReducer, type CartAction, type CartState } from './cartReducer'

const STORAGE_KEY = 'cart.v1'
const EMPTY_CART: CartState = []

export interface CartContextValue {
  items: CartState
  dispatch: Dispatch<CartAction>
}

/** null default, same reasoning as AuthContext — see useCart below. */
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  // Persistence lives HERE, in the provider — never inside the reducer, which
  // must stay pure. The stored value seeds the reducer once, on mount.
  const [persisted, setPersisted] = useLocalStorage<CartState>(STORAGE_KEY, EMPTY_CART)
  const [items, dispatch] = useReducer(cartReducer, persisted)

  // Mirror every committed cart state back into storage.
  useEffect(() => {
    setPersisted(items)
  }, [items, setPersisted])

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
