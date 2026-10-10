import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import './orders.css'

type Measurement = {
  wearer?: string
  mode: 'enter' | 'help'
  unit: 'in' | 'cm'
  values?: Record<string, number | string>
  notes?: string
}

type Order = {
  id: string
  payment_reference: string
  customer_name: string
  customer_email: string
  customer_phone: string
  fulfilment: string
  delivery_address: string | null
  notes: string | null
  amount_pesewas: number
  currency: string
  payment_status: string
  created_at: string
  paid_at: string | null
  sewing_completed_at: string | null
  items: {
    product_id: number
    name: string
    quantity: number
    unit_price_pesewas: number
    measurements: Measurement[]
  }[]
}

const labels: Record<string, string> = {
  chest: 'Chest',
  waist: 'Waist',
  hips: 'Hips',
  shoulder: 'Shoulder width',
  sleeve: 'Sleeve length',
  top: 'Top length',
  trousers: 'Trouser length',
}

const pageSize = 20

function money(value: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(value / 100)
}

export default function AdminOrders({
  userId,
}: {
  userId: string
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState('')
  const [notice, setNotice] = useState('')
  const [noticeOrderId, setNoticeOrderId] = useState('')

  const requestId = useRef(0)
  const sewingLock = useRef(false)
  const [savingSewing, setSavingSewing] = useState('')
  const [sewingFeedback, setSewingFeedback] = useState<{
    orderId: string
    message: string
    error: boolean
  } | null>(null)

  const load = useCallback(async () => {
    const current = ++requestId.current
    setLoading(true)

    try {
      const {
        data: access,
        error: accessError,
      } = await supabase
        .from('order_admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (accessError) throw accessError

      if (!access) {
        throw new Error(
          'This account has not been granted order access. Add its user ID to order_admins in Supabase.'
        )
      }

      let query = supabase
        .from('demo_orders')
        .select('*', { count: 'exact' })

      if (filter !== 'all') {
        query = query.eq('payment_status', filter)
      }

      const {
        data,
        count: total,
        error: queryError,
      } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(
          page * pageSize,
          (page + 1) * pageSize - 1
        )

      if (queryError) throw queryError
      if (current !== requestId.current) return

      const lastPage = Math.max(
        0,
        Math.ceil((total || 0) / pageSize) - 1
      )

      if (page > lastPage) {
        setPage(lastPage)
        return
      }

      setOrders((data || []) as Order[])
      setCount(total || 0)
      setError('')
    } catch (failure) {
      if (current !== requestId.current) return

      setOrders([])
      setError(
        failure instanceof Error
          ? failure.message
          : 'Orders could not be loaded. Check your database setup and try again.'
      )
    } finally {
      if (current === requestId.current) {
        setLoading(false)
      }
    }
  }, [userId, page, filter])

  useEffect(() => {
    void load()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load()
      }
    }, 30000)

    return () => {
      window.clearInterval(timer)
      requestId.current++
    }
  }, [load])

    async function updateSewing(order: Order) {
    if (sewingLock.current) return

    sewingLock.current = true
    setSavingSewing(order.id)
    setSewingFeedback(null)

    const markDone = !order.sewing_completed_at

    try {
      const { error: saveError } = await supabase.rpc(
        'set_order_sewing_done',
        {
          p_order_id: order.id,
          p_done: markDone,
        }
      )

      if (saveError) throw saveError

      // Refresh from the database after saving.
      await load()

      setSewingFeedback({
        orderId: order.id,
        message: markDone
          ? 'Saved. Sewing is marked as completed.'
          : 'Saved. The order is awaiting completion again.',
        error: false,
      })
    } catch (failure) {
      setSewingFeedback({
        orderId: order.id,
        message:
          failure instanceof Error
            ? failure.message
            : 'Could not save sewing status. Please try again.',
        error: true,
      })
    } finally {
      sewingLock.current = false
      setSavingSewing('')
    }
  }
    async function checkPayment(order: Order) {
        if (checking) return

        setChecking(order.id)
        setNoticeOrderId(order.id)
        setNotice('Checking payment…')

    try {
      const {
        data,
        error: paymentError,
      } = await supabase.functions.invoke(
        'paystack-checkout',
        {
          body: {
            action: 'verify',
            reference: order.payment_reference,
          },
        }
      )

      if (
        paymentError ||
        data?.error ||
        !data?.test_mode ||
        data?.reference !== order.payment_reference
      ) {
        throw new Error(
          'Could not verify payment. Try again; this does not mean the payment failed.'
        )
      }

      setNotice(
        data.status === 'paid'
          ? 'Payment verified and order updated.'
          : 'Payment is not confirmed as paid. The order remains unconfirmed.'
      )

      await load()
    } catch (failure) {
      setNotice(
        failure instanceof Error
          ? failure.message
          : 'Verification is unavailable.'
      )
    } finally {
      setChecking('')
    }
  }

  return (
    <div className="orders-panel">
      <p className="orders-info">
        Orders appear when customers continue to payment.
        Pending means payment has not been verified.
      </p>

      <div className="orders-toolbar">
        <label>
          Payment status
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value)
              setPage(0)
              setOrders([])
            }}
          >
            <option value="all">All orders</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? 'Refreshing…' : 'Refresh orders'}
        </button>

        <span>
          {count} matching orders · refreshes every
          30 seconds while visible
        </span>
      </div>

      {error && (
        <p className="orders-error" role="alert">
          {error}
        </p>
      )}


      {!error && !loading && !orders.length && (
        <p>No orders match this filter yet.</p>
      )}

      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <header>
            <div>
              <h2>{order.customer_name}</h2>
              <p>
                {new Date(
                  order.created_at
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <span
                className={`order-status ${order.payment_status}`}
              >
                {order.payment_status}
              </span>

              <strong>
                {money(order.amount_pesewas)}
              </strong>
            </div>
          </header>

          <p className="order-reference">
            {order.payment_reference}
          </p>

            {order.payment_status === 'paid' && (
            <section
              className={`sewing-panel${
                order.sewing_completed_at ? ' is-complete' : ''
              }`}
              aria-label="Sewing status"
            >
              <div className="sewing-panel-row">
                <div className="sewing-summary">
                  <span className="sewing-icon" aria-hidden="true">
                    {order.sewing_completed_at ? '✓' : '◷'}
                  </span>

                  <div>
                    <span className="sewing-label">
                      SEWING STATUS
                    </span>

                    <strong>
                      {order.sewing_completed_at
                        ? 'Sewing completed'
                        : 'Awaiting completion'}
                    </strong>

                    <p>
                      {order.sewing_completed_at
                        ? `Completed ${new Date(
                            order.sewing_completed_at
                          ).toLocaleString()}`
                        : 'Mark as done when all outfits in this order are finished.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="sewing-action"
                  disabled={Boolean(savingSewing)}
                  onClick={() => void updateSewing(order)}
                  aria-label={
                    order.sewing_completed_at
                      ? `Undo sewing completion for ${order.customer_name}`
                      : `Mark sewing as done for ${order.customer_name}`
                  }
                >
                  {savingSewing === order.id
                    ? 'Saving…'
                    : order.sewing_completed_at
                      ? 'Undo'
                      : 'Mark as done'}
                </button>
              </div>

              {sewingFeedback?.orderId === order.id && (
                <p
                  className={`sewing-feedback${
                    sewingFeedback.error ? ' is-error' : ''
                  }`}
                  role={sewingFeedback.error ? 'alert' : 'status'}
                >
                  {sewingFeedback.message}
                </p>
              )}
            </section>
          )}

          <details>
            <summary>
              View customer, items and measurements
            </summary>

            <div className="order-customer">
              <p>
                <b>Email:</b> {order.customer_email}
              </p>

              <p>
                <b>Phone:</b> {order.customer_phone}
              </p>

              <p>
                <b>Fulfilment:</b> {order.fulfilment}
              </p>

              {order.delivery_address && (
                <p>
                  <b>Address:</b>{' '}
                  {order.delivery_address}
                </p>
              )}

              {order.notes && (
                <p>
                  <b>Order notes:</b> {order.notes}
                </p>
              )}

              {order.paid_at && (
                <p>
                  <b>Payment verified:</b>{' '}
                  {new Date(
                    order.paid_at
                  ).toLocaleString()}
                </p>
              )}
            </div>

            {order.items.map((item, index) => (
              <section
                className="order-item"
                key={`${item.product_id}-${index}`}
              >
                <h3>
                  {item.quantity} × {item.name}
                </h3>

                <p>
                  {money(item.unit_price_pesewas)} each
                </p>

                {(item.measurements || []).map(
                  (measurement, outfit) => (
                    <div
                      className="order-measurement"
                      key={outfit}
                    >
                      <h4>
                        Outfit {outfit + 1}
                        {measurement.wearer
                          ? ` — ${measurement.wearer}`
                          : ''}
                      </h4>

                      {measurement.mode === 'help' ? (
                        <p>
                          Customer requested help
                          with measurements.
                        </p>
                      ) : (
                        <dl>
                          {Object.entries(
                            measurement.values || {}
                          ).map(([field, value]) => (
                            <div key={field}>
                              <dt>
                                {labels[field] || field}
                              </dt>
                              <dd>
                                {value}{' '}
                                {measurement.unit}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {measurement.notes && (
                        <p>
                          <b>Outfit notes:</b>{' '}
                          {measurement.notes}
                        </p>
                      )}
                    </div>
                  )
                )}
              </section>
            ))}

            {order.payment_status !== 'paid' && (
              <button
                type="button"
                disabled={Boolean(checking)}
                onClick={() =>
                  void checkPayment(order)
                }
              >
                {checking === order.id
                  ? 'Checking payment…'
                  : 'Check payment status'}
              </button>
            )}

            {noticeOrderId === order.id && notice && (
              <p
                role="status"
                aria-live="polite"
                style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  background: '#f2efe6',
                  borderRadius: '8px',
                }}
              >
                {notice}
              </p>
            )}
          </details>
        </article>
      ))}

      {!error && (
        <div className="orders-pagination">
          <button
            disabled={loading || page === 0}
            onClick={() =>
              setPage((value) => value - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {page + 1} of{' '}
            {Math.max(
              1,
              Math.ceil(count / pageSize)
            )}
          </span>

          <button
            disabled={
              loading ||
              (page + 1) * pageSize >= count
            }
            onClick={() =>
              setPage((value) => value + 1)
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}