import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product } from './data'
import './shop.css'
import Measurements, {
  describeMeasurements,
  type MeasurementsByProduct,
  type OutfitMeasurements,
} from './Measurements'
import PaystackPayment from './PaystackPayment'

type BagLine = {
  id: string
  quantity: number
}

const STORAGE_KEY = 'hommesluxe-bag-v1'

function money(amount: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount)
}

export function useBag() {
  const [measurements, setMeasurements] =
    useState<MeasurementsByProduct>({})

  function saveMeasurements(
    id: string,
    records: OutfitMeasurements[]
  ) {
    setMeasurements((current) => ({
      ...current,
      [id]: records,
    }))
  }

  const [lines, setLines] = useState<BagLine[]>(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      )

      if (!Array.isArray(saved)) return []

      return saved
        .filter(
          (item): item is BagLine =>
            item &&
            typeof item.id === 'string' &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 20
        )
        .slice(0, 100)
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lines)
      )
    } catch {
      // The bag still works if browser storage is unavailable.
    }
  }, [lines])

  function add(id: string) {
    setLines((current) => {
      const existing = current.find(
        (item) => item.id === id
      )

      if (existing) {
        return current.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(
                  20,
                  item.quantity + 1
                ),
              }
            : item
        )
      }

      return [...current, { id, quantity: 1 }]
    })
  }

  function update(id: string, quantity: number) {
    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 20
    ) {
      return
    }

    setMeasurements((current) => {
      const next = { ...current }

      if (quantity === 0) {
        delete next[id]
      } else if (next[id]) {
        next[id] = next[id].slice(0, quantity)
      }

      return next
    })

    setLines((current) =>
      quantity === 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) =>
            item.id === id
              ? { ...item, quantity }
              : item
          )
    )
  }

  const clearedPayments = useRef(new Set<string>())

  const clearAfterPayment = useCallback((reference: string) => {
    if (clearedPayments.current.has(reference)) return

    const storageKey = 'hommesluxe-cleared-payments'
    let savedReferences: string[] = []

    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem(storageKey) || '[]'
      )

      if (Array.isArray(saved)) {
        savedReferences = saved.filter(
          (value): value is string => typeof value === 'string'
        )
      }
    } catch {
      // Continue using the in-memory record.
    }

    clearedPayments.current.add(reference)

    // Revisiting an already confirmed payment must not
    // clear a new shopping bag.
    if (savedReferences.includes(reference)) return

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify([...savedReferences, reference])
      )
      localStorage.setItem(STORAGE_KEY, '[]')
    } catch {
      // React state still updates if storage is unavailable.
    }

    setLines([])
    setMeasurements({})
  }, [])

  const count = lines.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return {
    lines,
    add,
    update,
    count,
    measurements,
    saveMeasurements,
    clearAfterPayment,
  }
}

type ShopProps = {
  bag: ReturnType<typeof useBag>
  products: Product[]
  loading: boolean
  catalogueReady: boolean
}


export default function Shop({
  bag,
  products,
  loading,
  catalogueReady,
}: ShopProps) {
  const [checkout, setCheckout] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [delivery, setDelivery] = useState(
    'Collection in Accra'
  )
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const checkoutDialogRef =
    useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!checkout) return

    const dialog = checkoutDialogRef.current

    if (!dialog) return

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const previousOverflow =
      document.body.style.overflow

    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [checkout])


  useEffect(() => {
    setMessage('')
  }, [bag.lines, bag.measurements, products])

  const items = bag.lines.map((line) => ({
    ...line,
    product: products.find(
      (product) => product.id === line.id
    ),
  }))

  const unavailable = items.some(
    (item) =>
      !item.product ||
      !Number.isFinite(item.product.startingPrice) ||
      item.product.startingPrice! <= 0
  )

  const total = items.reduce(
    (sum, item) =>
      sum +
      (item.product?.startingPrice || 0) *
        item.quantity,
    0
  )

  const canRequest =
    catalogueReady &&
    !loading &&
    !unavailable &&
    items.length > 0

  return (
    <section className="shop-page section-pad">
      <p className="eyebrow">
        YOUR OCCASION, YOUR WAY
      </p>

      <h1>
        Shopping bag<span>.</span>
      </h1>

      {!items.length ? (
        <div className="shop-empty">
          <h2>
            Your next remarkable look awaits.
          </h2>

          <p>
            Explore the collection and add your
            favourite pieces.
          </p>

          <a
            className="shop-primary"
            href="#collections"
          >
            Shop the collection →
          </a>
        </div>
      ) : (
        <>
          <p>
            Made-to-measure pieces. Prices shown are
            starting estimates; measurements, final
            pricing and delivery are confirmed with
            the studio.
          </p>

          <div className="shop-layout">
            <div>
              {items.map(
                ({ id, quantity, product }) => (
                  <article
                    className="bag-line"
                    key={id}
                  >
                    {product?.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                      />
                    )}

                    <div>
                      <h2>
                        {product?.name ||
                          'Unavailable piece'}
                      </h2>

                      <p>{product?.fit}</p>
                      <p>{product?.leadTime}</p>

                      <strong>
                        {product?.price ||
                          'Remove this piece to continue'}
                      </strong>

                      {product && (
                        <Measurements
                          productName={product.name}
                          quantity={quantity}
                          value={bag.measurements[id]}
                          onSave={(records) =>
                            bag.saveMeasurements(id, records)
                          }
                        />
                      )}

                      <div className="bag-controls">
                        <button
                          type="button"
                          onClick={() =>
                            bag.update(
                              id,
                              quantity - 1
                            )
                          }
                          aria-label={`Decrease quantity of ${
                            product?.name || id
                          }`}
                        >
                          −
                        </button>

                        <span aria-live="polite">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={quantity >= 20}
                          onClick={() =>
                            bag.update(
                              id,
                              quantity + 1
                            )
                          }
                          aria-label={`Increase quantity of ${
                            product?.name || id
                          }`}
                        >
                          +
                        </button>

                        <button
                          type="button"
                          className="bag-remove"
                          onClick={() =>
                            bag.update(id, 0)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>

            <aside className="shop-summary">
              <p className="eyebrow">
                ORDER SUMMARY
              </p>

              <div className="shop-total">
                <span>Estimated subtotal</span>
                <strong>{money(total)}</strong>
              </div>

              <p>
                Delivery and any applicable charges
                will be confirmed before payment.
              </p>

              {loading ? (
                <p role="status">
                  Checking the latest collection…
                </p>
              ) : !catalogueReady ? (
                <p role="alert">
                  The live catalogue is unavailable.
                  You can browse these sample pieces,
                  but order requests are paused.
                  Please contact the studio.
                </p>
              ) : unavailable ? (
                <p role="alert">
                  Remove unavailable pieces before
                  continuing.
                </p>
              ) : (
                <button
                  type="button"
                  className="shop-primary"
                  onClick={() => setCheckout(true)}
                >
                  Continue to checkout →
                </button>
              )}

              <a
                className="shop-continue"
                href="#collections"
              >
                Continue shopping
              </a>
            </aside>
          </div>

          {checkout && (
            <dialog
              ref={checkoutDialogRef}
              className="checkout-dialog"
              aria-labelledby="checkout-title"
              onCancel={() => setCheckout(false)}
              onClick={(event) => {
                if (event.target !== event.currentTarget) {
                  return
                }

                const bounds =
                  event.currentTarget.getBoundingClientRect()

                const clickedOutside =
                  event.clientX < bounds.left ||
                  event.clientX > bounds.right ||
                  event.clientY < bounds.top ||
                  event.clientY > bounds.bottom

                if (clickedOutside) {
                  setCheckout(false)
                }
              }}
            >
              <button
                type="button"
                className="checkout-close"
                aria-label="Close checkout"
                onClick={() => setCheckout(false)}
              >
                ×
              </button>

              <form
                id="order-checkout"
                className="shop-checkout"
                onChange={() => setMessage('')}
                onSubmit={(event) => {
                  event.preventDefault()

                  if (
                    !canRequest ||
                    !name.trim() ||
                    !phone.trim() ||
                    (delivery === 'Delivery' &&
                      !address.trim())
                  ) {
                    return
                  }

                const orderMessage = [
                  'HOMMESLUXE — Order summary',
                  '',
                  ...items.map((item) =>
                    [
                      `${item.quantity} × ${item.product!.name} (${item.id}) — ${item.product!.price} each`,
                      describeMeasurements(
                        bag.measurements[item.id],
                        item.quantity
                      ),
                    ].join('\n')
                  ),

                  '',
                  `Estimated subtotal: ${money(total)}`,
                  `Name: ${name.trim()}`,
                  `Phone: ${phone.trim()}`,
                  `Fulfilment: ${delivery}`,
                  delivery === 'Delivery'
                    ? `Address: ${address.trim()}`
                    : '',
                  `Tailoring / occasion notes: ${
                    notes.trim() || 'To discuss'
                  }`,
                  '',
                  'Delivery charges are excluded from this total.',
                ]
                  .filter(Boolean)
                  .join('\n')

                setMessage(orderMessage)
              }}
            >
              <p className="eyebrow">CHECKOUT</p>

              <h2 id="checkout-title">Make it yours.</h2>

              <p>
                Enter your contact and delivery details,
                then review your order and continue to payment.
              </p>

              <div className="checkout-fields">
                <label>
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                  />
                </label>
                <label>
                  Full name
                  <input
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                  />
                </label>

                <label>
                  Phone number
                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={30}
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                  />
                </label>

                <label>
                  Collection or delivery
                  <select
                    value={delivery}
                    onChange={(event) =>
                      setDelivery(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Collection in Accra
                    </option>
                    <option>Delivery</option>
                  </select>
                </label>

                {delivery === 'Delivery' && (
                  <label>
                    Delivery address
                    <textarea
                      autoComplete="street-address"
                      required
                      maxLength={500}
                      value={address}
                      onChange={(event) =>
                        setAddress(
                          event.target.value
                        )
                      }
                    />
                  </label>
                )}

                <label className="checkout-wide">
                  Colour, measurements or occasion
                  notes
                  <textarea
                    maxLength={1000}
                    placeholder="Tell us your preferred colour and occasion date. Measurements can be arranged with the studio."
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                  />
                </label>
              </div>

              <p>
                When you continue to payment, your order,
                contact details and outfit measurements will
                be saved with your order.
              </p>

              <button
                type="submit"
                className="shop-primary"
                disabled={!canRequest}
              >
                Review order
              </button>

              {message && canRequest && (
                <div className="request-preview">
                  <h3>Review your order</h3>

                  <pre>{message}</pre>

                  <PaystackPayment
                    customer={{
                      name: name.trim(),
                      email: email.trim(),
                      phone: phone.trim(),
                    }}
                    fulfilment={
                      delivery === 'Delivery'
                        ? 'delivery'
                        : 'collection'
                    }
                    address={address.trim()}
                    notes={notes.trim()}
                    items={items.map((item) => ({
                      id: item.id,
                      quantity: item.quantity,
                      measurements:
                        bag.measurements[item.id] || [],
                    }))}
                    amountPesewas={items.reduce(
                      (sum, item) =>
                        sum +
                        Math.round(
                          (item.product?.startingPrice || 0) * 100
                        ) *
                          item.quantity,
                      0
                    )}
                  />
                </div>
              )}
            </form>
          </dialog>
          )}
        </>
      )}
    </section>
  )
}