/** Shape returned by jsonplaceholder's /users endpoints. */
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  company: { name: string; catchPhrase: string }
  address: { suite: string; street: string; city: string; zipcode: string }
}

export interface Todo {
  id: number
  text: string
  done: boolean
}

export type TodoFilter = 'all' | 'active' | 'completed'

/** A product in the shop catalogue — no quantity, that only exists inside the cart. */
export interface Product {
  id: number
  title: string
  price: number
  blurb: string
}
