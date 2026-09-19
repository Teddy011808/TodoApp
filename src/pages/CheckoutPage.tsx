import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { cartCount, cartTotal } from '../context/cartReducer'

/**
 * The checkout summary. It sits several levels below the providers and receives
 * NO props at all — every value on this page comes out of context.
 */
export default function CheckoutPage() {
  const { items, dispatch } = useCart()
  const { user } = useAuth()

  const count = cartCount(items)
  const total = cartTotal(items)

  return (
    <section className="page">
      <header className="page-head">
        <h1>Checkout</h1>
        <p className="page-sub">
          {user === null ? 'Not signed in — sign in from the nav bar.' : `Ordering as ${user.email}`}
        </p>
      </header>

      <div className="card">
        {items.length === 0 ? (
          <div className="state state-empty">
            <strong>Your cart is empty.</strong>
            <p>
              Add something from the <Link to="/shop">shop</Link>.
            </p>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((line) => (
                <li className="cart-line" key={line.id}>
                  <span className="cart-title">{line.title}</span>

                  <div className="qty">
                    <button
                      type="button"
                      className="btn btn-icon qty-btn"
                      aria-label={`Decrease ${line.title}`}
                      onClick={() =>
                        dispatch({
                          type: 'UPDATE_QUANTITY',
                          id: line.id,
                          quantity: line.quantity - 1,
                        })
                      }
                    >
                      −
                    </button>

                    <span className="qty-value" aria-label={`${line.title} quantity`}>
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      className="btn btn-icon qty-btn"
                      aria-label={`Increase ${line.title}`}
                      onClick={() =>
                        dispatch({
                          type: 'UPDATE_QUANTITY',
                          id: line.id,
                          quantity: line.quantity + 1,
                        })
                      }
                    >
                      +
                    </button>
                  </div>

                  <span className="cart-price">${line.price * line.quantity}</span>

                  <button
                    type="button"
                    className="btn btn-icon"
                    aria-label={`Remove ${line.title}`}
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', id: line.id })}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>

            <div className="cart-total">
              <span>
                {count} item{count === 1 ? '' : 's'}
              </span>
              <strong>${total}</strong>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
