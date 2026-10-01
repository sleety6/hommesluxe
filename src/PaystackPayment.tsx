import { useEffect, useRef, useState } from 'react'
import type { OutfitMeasurements } from './Measurements'

const pendingKey = 'hommesluxe-paystack-pending'

type PendingPayment = {
  reference: string
  url?: string
}

type PaymentResponse = {
  error?: string
  status?: 'paid' | 'pending' | 'failed'
  authorization_url?: string
  reference?: string
  test_mode?: boolean
  amount_pesewas?: number
  currency?: string
}

function validCheckoutUrl(value: string) {
  try {
    const url = new URL(value)

    return (
      url.protocol === 'https:' &&
      url.hostname === 'checkout.paystack.com'
    )
  } catch {
    return false
  }
}

async function paymentRequest(
  body: unknown
): Promise<PaymentResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey:
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    }
  )

  const data: PaymentResponse = await response.json()

  if (!response.ok || data.error) {
    throw new Error(
      data.error ||
        'The payment server could not process this request.'
    )
  }

  return data
}

type Props = {
  customer: {
    name: string
    email: string
    phone: string
  }
  fulfilment: 'collection' | 'delivery'
  address: string
  notes: string
  items: {
    id: string
    quantity: number
    measurements: OutfitMeasurements[]
  }[]
  amountPesewas: number
}

export default function PaystackPayment(props: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] =
    useState<PendingPayment | null>(null)

  const working = useRef(false)

  async function startPayment() {
    if (working.current) return

    if (
      props.items.some(
        (item) =>
          item.measurements.length !== item.quantity
      )
    ) {
      setError(
        'Close checkout and save measurements or choose studio help for every outfit in your bag.'
      )
      return
    }

    working.current = true
    setBusy(true)
    setError('')

    try {
      const result = await paymentRequest({
        action: 'initialize',
        customer: props.customer,
        fulfilment: props.fulfilment,
        delivery_address: props.address,
        notes: props.notes,
        items: props.items,
        expected_amount_pesewas: props.amountPesewas,
      })

      if (
        !result.test_mode ||
        !result.reference ||
        !result.authorization_url ||
        !validCheckoutUrl(result.authorization_url)
      ) {
        throw new Error(
          'An invalid checkout response was received.'
        )
      }

      const payment = {
        reference: result.reference,
        url: result.authorization_url,
      }

      setPending(payment)

      try {
        sessionStorage.setItem(
          pendingKey,
          JSON.stringify(payment)
        )
      } catch {
        // The return URL also carries the reference.
      }

      window.location.assign(payment.url)
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to start checkout. Please try again.'
      )
    } finally {
      working.current = false
      setBusy(false)
    }
  }

  return (
    <div className="paystack-actions">
      <p className="payment-demo">
        CHECKOUT
      </p>

      <p>
        Delivery charges are excluded. Your order and
        measurements are saved before the payment page opens.
      </p>

      {error && <p role="alert">{error}</p>}

      {pending?.url ? (
        <a className="shop-primary" href={pending.url}>
          Continue to payment →
        </a>
      ) : (
        <button
          type="button"
          className="shop-primary"
          disabled={busy}
          onClick={startPayment}
        >
          {busy
            ? 'Opening secure checkout…'
            : 'Continue to payment'}
        </button>
      )}
    </div>
  )
}

function readPending(): PendingPayment | null {
  const params = new URLSearchParams(
    window.location.search
  )

  const returned =
    params.get('reference') || params.get('trxref')

  let saved: PendingPayment | null = null

  try {
    const value = JSON.parse(
      sessionStorage.getItem(pendingKey) || 'null'
    )

    if (
      value &&
      typeof value.reference === 'string'
    ) {
      saved = value
    }
  } catch {
    // Storage is optional.
  }

  const reference = returned || saved?.reference

  if (
    !reference ||
    !/^hl-demo-[0-9a-f-]{36}$/.test(reference)
  ) {
    return null
  }

  const url =
    saved?.reference === reference &&
    typeof saved.url === 'string' &&
    validCheckoutUrl(saved.url)
      ? saved.url
      : undefined

  return { reference, url }
}

export function PaymentStatus({
  onPaid,
}: {
  onPaid: (reference: string) => void
}) {
  const [payment, setPayment] = useState(readPending)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('checking')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (!payment) return

    let active = true

    setStatus('checking')
    setDetail('')

    paymentRequest({
      action: 'verify',
      reference: payment.reference,
    })
      .then((result) => {
        if (!active) return

        if (
          !result.test_mode ||
          result.reference !== payment.reference ||
          !result.status
        ) {
          throw new Error(
            'The payment response could not be verified.'
          )
        }

        if (result.status === 'paid') {
          onPaid(payment.reference)
        }

        setStatus(result.status)
      })
      .catch((failure) => {
        if (!active) return

        setStatus('error')
        setDetail(
          failure instanceof Error
            ? failure.message
            : 'Could not check payment status.'
        )
      })

    return () => {
      active = false
    }
  }, [payment, attempt, onPaid])

  if (!payment) return null

  function dismiss() {
    try {
      sessionStorage.removeItem(pendingKey)
    } catch {
      // Storage is optional.
    }

    const url = new URL(window.location.href)

    for (const key of [
      'payment',
      'reference',
      'trxref',
    ]) {
      url.searchParams.delete(key)
    }

    window.history.replaceState(
      null,
      '',
      url.toString()
    )

    setPayment(null)
  }

  return (
    <section
      className="payment-status"
      aria-live="polite"
    >
      <p className="eyebrow">
        CHECKOUT
      </p>

      <h2>
        {status === 'checking'
          ? 'Checking your payment…'
          : status === 'paid'
            ? 'Payment confirmed.'
            : status === 'failed'
              ? 'Payment was not completed.'
              : status === 'pending'
                ? 'Payment has not been confirmed yet.'
                : 'Unable to confirm payment yet.'}
      </h2>

      <p>
        Reference: <code>{payment.reference}</code>
      </p>

      {status === 'paid' && (
        <p>
            Your payment has been confirmed.
            Your order details and measurements have been saved.
        </p>
      )}

      {status === 'error' && (
        <p>
          {detail} This does not mean the payment
          failed. Check again before starting another
          payment.
        </p>
      )}

      {status !== 'paid' &&
        status !== 'checking' && (
          <div className="payment-status-actions">
            <button
              type="button"
              className="shop-primary"
              onClick={() =>
                setAttempt((value) => value + 1)
              }
            >
              Check payment again
            </button>

            {status === 'pending' && payment.url && (
              <a
                className="shop-primary"
                href={payment.url}
              >
                Resume payment
              </a>
            )}
          </div>
        )}

      {(status === 'paid' || status === 'failed') && (
        <button
          type="button"
          className="shop-continue"
          onClick={dismiss}
        >
          Dismiss payment status
        </button>
      )}
    </section>
  )
}