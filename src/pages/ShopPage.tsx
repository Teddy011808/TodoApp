import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { cartCount } from '../context/cartReducer'
import { PRODUCTS } from '../data/products'

export default function ShopPage() {
  // Cart data is never handed down as a prop — this page reaches into context itself.
  const { items, dispatch } = useCart()
  const count = cartCount(items)

  return (
    <section className="page">
      <header className="page-head">
        <h1>Shop</h1>
        <p className="page-sub">
          {count === 0 ? 'Your cart is empty.' : `${count} item${count === 1 ? '' : 's'} in the cart.`}{' '}
          <Link to="/checkout">Go to checkout →</Link>
        </p>
      </header>

      <div className="product-grid">
        {PRODUCTS.map((product) => {
          const line = items.find((item) => item.id === product.id)

          return (
            <article className="card product" key={product.id}>
              <h2 className="product-title">{product.title}</h2>
              <p className="product-blurb">{product.blurb}</p>
              <div className="product-foot">
                <span className="price">${product.price}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => dispatch({ type: 'ADD_ITEM', product })}
                >
                  Add to cart
                </button>
              </div>
              {line && <p className="in-cart">In cart: {line.quantity}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
