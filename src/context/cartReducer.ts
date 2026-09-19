import type { Product } from '../types'

/** A line in the cart: a product plus how many of it. */
export interface CartLine {
  id: number
  title: string
  price: number
  quantity: number
}

export type CartState = CartLine[]

/**
 * The discriminated union. Every action is identified by its literal `type`,
 * and each member carries ONLY the payload that action needs:
 *
 *   ADD_ITEM        -> a Product. No quantity field exists on it at all.
 *   REMOVE_ITEM     -> an id. No quantity field exists on it at all.
 *   UPDATE_QUANTITY -> the one and only action that may mention a quantity.
 *
 * Because the payloads differ per member, TypeScript narrows `action` inside
 * each case of the switch, and dispatching a quantity alongside REMOVE_ITEM
 * is a compile error rather than a runtime surprise.
 */
export type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; id: number }
  | { type: 'UPDATE_QUANTITY'; id: number; quantity: number }

/**
 * Pure: same input, same output, every time.
 * No fetch, no localStorage, no console, no Date.now(), no mutation of `state`.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // action is narrowed to { type: 'ADD_ITEM'; product: Product } here.
      const existing = state.find((line) => line.id === action.product.id)

      if (existing) {
        return state.map((line) =>
          line.id === action.product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }

      return [
        ...state,
        {
          id: action.product.id,
          title: action.product.title,
          price: action.product.price,
          quantity: 1,
        },
      ]
    }

    case 'REMOVE_ITEM':
      // action.quantity does not exist on this member — reading it is a compile error.
      return state.filter((line) => line.id !== action.id)

    case 'UPDATE_QUANTITY': {
      // The single rule for quantity, in the single place quantity can change:
      // anything at or below zero is a removal, never a stored negative number.
      if (action.quantity <= 0) {
        return state.filter((line) => line.id !== action.id)
      }

      return state.map((line) =>
        line.id === action.id ? { ...line, quantity: action.quantity } : line,
      )
    }

    default: {
      // If a new member is added to CartAction and not handled above, `action`
      // is no longer `never` here and this line stops compiling.
      const exhaustive: never = action
      void exhaustive
      return state
    }
  }
}

/** Derived values are computed from state, never stored in it. */
export function cartCount(state: CartState): number {
  return state.reduce((total, line) => total + line.quantity, 0)
}

export function cartTotal(state: CartState): number {
  return state.reduce((total, line) => total + line.price * line.quantity, 0)
}
