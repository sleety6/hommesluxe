import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import './notifications.css'

type Order = {
  id: string
  customer_name: string
  amount_pesewas: number
  payment_status: string
}

type Alert = {
  key: string
  title: string
  order: Order
}

type Props = {
  userId: string
  onCount: (count: number) => void
  onOpenOrders: () => void
}

export default function OrderNotifications({
  userId,
  onCount,
  onOpenOrders,
}: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [count, setCount] = useState(0)
  const [connectionError, setConnectionError] =
    useState(false)

  const unread = useRef(new Set<string>())
  const countCallback = useRef(onCount)
  const openCallback = useRef(onOpenOrders)

  countCallback.current = onCount
  openCallback.current = onOpenOrders

  useEffect(() => {
    let stopped = false
    let busy = false

    let previous: Map<string, string> | null = null

    const controller = new AbortController()

    unread.current.clear()
    setAlerts([])
    setCount(0)
    countCallback.current(0)

    async function check() {
      if (
        stopped ||
        busy ||
        document.visibilityState !== 'visible'
      ) {
        return
      }

      busy = true

      try {
        const {
          data: access,
          error: accessError,
        } = await supabase
          .from('order_admins')
          .select('user_id')
          .eq('user_id', userId)
          .abortSignal(controller.signal)
          .maybeSingle()

        if (accessError || !access) {
          throw new Error('Order access unavailable')
        }

        const rows: Order[] = []
        const pageSize = 500

        // Read every page so a row limit cannot hide orders.
        for (
          let offset = 0;
          ;
          offset += pageSize
        ) {
          const { data, error } = await supabase
            .from('demo_orders')
            .select(
              'id, customer_name, amount_pesewas, payment_status'
            )
            .order('created_at', {
              ascending: true,
            })
            .order('id', {
              ascending: true,
            })
            .range(
              offset,
              offset + pageSize - 1
            )
            .abortSignal(controller.signal)

          if (error) throw error
          if (stopped) return

          rows.push(...((data || []) as Order[]))

          if (!data || data.length < pageSize) {
            break
          }
        }

        if (stopped) return

        const incoming: Alert[] = []

        // The first successful check establishes a baseline.
        if (previous) {
          for (const order of rows) {
            const oldStatus = previous.get(order.id)

            if (!previous.has(order.id)) {
              incoming.push({
                key: `${order.id}:new`,
                order,
                title:
                  order.payment_status === 'paid'
                    ? 'New order — payment confirmed'
                    : 'New order received',
              })

              unread.current.add(order.id)
            } else if (
              oldStatus !== 'paid' &&
              order.payment_status === 'paid'
            ) {
              incoming.push({
                key: `${order.id}:paid`,
                title: 'Payment confirmed',
                order,
              })

              unread.current.add(order.id)
            }
          }
        }

        previous = new Map(
          rows.map((order) => [
            order.id,
            order.payment_status,
          ])
        )

        setConnectionError(false)

        if (incoming.length) {
          setAlerts((current) => {
            const updatedIds = new Set(
              incoming.map((alert) => alert.order.id)
            )

            return [
              ...current.filter(
                (alert) =>
                  !updatedIds.has(alert.order.id)
              ),
              ...incoming,
            ].slice(-3)
          })

          setCount(unread.current.size)
          countCallback.current(unread.current.size)
        }
      } catch {
        if (!stopped) {
          setConnectionError(true)
        }
      } finally {
        busy = false
      }
    }

    void check()

    const timer = window.setInterval(
      () => void check(),
      15000
    )

    const wake = () => {
      void check()
    }

    document.addEventListener(
      'visibilitychange',
      wake
    )

    window.addEventListener('online', wake)

    return () => {
      stopped = true
      controller.abort()

      window.clearInterval(timer)

      document.removeEventListener(
        'visibilitychange',
        wake
      )

      window.removeEventListener('online', wake)
    }
  }, [userId])

  function viewOrders() {
    unread.current.clear()
    setCount(0)
    countCallback.current(0)
    setAlerts([])
    openCallback.current()
  }

  return (
    <>
      {connectionError && (
        <p
          className="order-alert-connection"
          role="status"
        >
          Order alerts are temporarily unavailable.
          Retrying automatically.
        </p>
      )}

      {count > 0 && (
        <div className="order-alert-banner">
          <span>
            {count}{' '}
            {count === 1
              ? 'order has'
              : 'orders have'}{' '}
            new activity.
          </span>

          <button
            type="button"
            onClick={viewOrders}
          >
            View orders and clear alerts
          </button>
        </div>
      )}

      <div
        className="order-alert-stack"
        role="region"
        aria-label="Order notifications"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {alerts.map((alert) => (
          <article
            className="order-alert"
            key={alert.key}
          >
            <button
              type="button"
              className="order-alert-close"
              aria-label={`Dismiss notification for ${alert.order.customer_name}`}
              onClick={() =>
                setAlerts((current) =>
                  current.filter(
                    (item) => item.key !== alert.key
                  )
                )
              }
            >
              ×
            </button>

            <span className="order-alert-label">
              ORDER UPDATE
            </span>

            <h3>{alert.title}</h3>

            <p>
              {alert.order.customer_name}
              <br />
              <strong>
                {new Intl.NumberFormat('en-GH', {
                  style: 'currency',
                  currency: 'GHS',
                }).format(
                  alert.order.amount_pesewas / 100
                )}
              </strong>
            </p>

            <p className="order-alert-payment">
              {alert.order.payment_status === 'paid'
                ? 'Payment verified'
                : `Payment status: ${alert.order.payment_status}`}
            </p>

            <button
              type="button"
              className="order-alert-view"
              onClick={viewOrders}
            >
              View orders →
            </button>
          </article>
        ))}
      </div>
    </>
  )
}