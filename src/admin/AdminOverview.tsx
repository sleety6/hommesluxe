import {
  useEffect,
  useId,
  useState,
} from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './overview.css'

type Point = {
  at: string
  from_at: string
  to_at: string
  previous_from_at: string
  previous_to_at: string
  sales_pesewas: number
  previous_sales_pesewas: number
}

type Dashboard = {
  start_at: string
  end_at: string
  previous_start_at: string
  previous_end_at: string
  sales_pesewas: number
  previous_sales_pesewas: number
  orders: number
  previous_orders: number
  paid_orders: number
  pending_orders: number
  points: Point[]
}

function money(pesewas: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2,
  }).format(pesewas / 100)
}

function Change({
  current,
  previous,
}: {
  current: number
  previous: number
}) {
  if (previous === 0) {
    return (
      <small className="overview-change neutral">
        {current === 0
          ? 'No activity in either period'
          : 'No activity in the previous period'}
      </small>
    )
  }

  const percent =
    ((current - previous) / previous) * 100

  return (
    <small
      className={`overview-change ${
        percent > 0
          ? 'positive'
          : percent < 0
            ? 'negative'
            : 'neutral'
      }`}
    >
      {percent > 0 ? '↗' : percent < 0 ? '↘' : '—'}{' '}
      {Math.abs(percent).toFixed(1)}%
      <span> vs previous period</span>
    </small>
  )
}

export default function AdminOverview({
  onOrders,
}: {
  onOrders: () => void
}) {
  const [days, setDays] = useState(7)
  const [grouping, setGrouping] = useState('day')
  const [activePoint, setActivePoint] =
    useState<number | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] =
    useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const gradientId = useId().replace(/:/g, '')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setData(null)
      setActivePoint(null)

      try {
        const {
          data: result,
          error: queryError,
        } = await supabase.rpc('demo_dashboard_grouped', {
            p_days: days,
            p_group: grouping,
        })

        if (queryError) {
          throw new Error(queryError.message)
        }

        if (!result) {
          throw new Error('No dashboard data was returned.')
        }

        if (active) {
          setData(result as Dashboard)
        }
      } catch (failure) {
        if (active) {
          setError(
            failure instanceof Error
              ? failure.message
              : 'The dashboard could not be loaded.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [days, grouping, refresh])

  function pointLabel(value: string) {
    const date = new Date(value)

    if (grouping === 'hour') {
        return new Intl.DateTimeFormat('en-GB', {
        ...(days > 1
            ? {
                day: 'numeric' as const,
                month: 'short' as const,
            }
            : {}),
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        }).format(date)
    }

    if (grouping === 'month') {
        return new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
        }).format(date)
    }

    const label = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    }).format(date)

    return grouping === 'week'
        ? `Week of ${label}`
        : label
    }

  function downloadReport() {
    if (!data) return

    const rows = [
        [
            'Grouping',
            'Period start UTC',
            'Period end UTC (exclusive)',
            'Sales GHS',
            'Comparison start UTC',
            'Comparison end UTC (exclusive)',
            'Previous period sales GHS',
        ],
        ...data.points.map((point) => [
            grouping,
            point.from_at,
            point.to_at,
            (point.sales_pesewas / 100).toFixed(2),
            point.previous_from_at,
            point.previous_to_at,
            (point.previous_sales_pesewas / 100).toFixed(2),
        ]),
    ]

    const csv = rows
      .map((row) => row.join(','))
      .join('\r\n')

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      })
    )

    const link = document.createElement('a')
    link.href = url
    link.download =`hommesluxe-sales-${days}-days-by-${grouping}.csv`
      

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    )
  }

  const points = data?.points || []
  const selectedPoint =
    activePoint !== null
        ? points[activePoint]
        : undefined

  const selectedDifference = selectedPoint
    ? selectedPoint.sales_pesewas -
        selectedPoint.previous_sales_pesewas
    : 0

  function tooltipDate(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(value))
  }

  const maximum = Math.max(
    100,
    ...points.flatMap((point) => [
      Number(point.sales_pesewas),
      Number(point.previous_sales_pesewas),
    ])
  )

  const left = 90
  const right = 770
  const top = 25
  const bottom = 250

  function x(index: number) {
    return points.length <= 1
      ? (left + right) / 2
      : left +
          (index / (points.length - 1)) *
            (right - left)
  }

  function y(value: number) {
    return bottom -
      (value / maximum) * (bottom - top)
  }

  const currentLine = points
    .map((point, index) =>
      `${x(index)},${y(point.sales_pesewas)}`
    )
    .join(' ')

  const previousLine = points
    .map((point, index) =>
      `${x(index)},${y(point.previous_sales_pesewas)}`
    )
    .join(' ')

  const axisIndexes = Array.from(
    new Set([
      0,
      Math.floor((points.length - 1) / 2),
      points.length - 1,
    ])
  ).filter((index) => index >= 0)

  return (
    <div className="overview">
      <div className="overview-heading">
        <div>
          <p className="overview-eyebrow">
            HOMMESLUXE / BUSINESS OVERVIEW
          </p>
          <h1>Your store at a glance.</h1>
          <p>Orders, payments and the bigger picture.</p>
        </div>

        <button
          type="button"
          onClick={onOrders}
          className="overview-orders-link"
        >
          View orders <ArrowRight size={17} />
        </button>
      </div>

      <div className="overview-toolbar">
        <label>
          <span className="overview-sr-only">
            Reporting period
          </span>

          <select
            value={days}
            onChange={(event) =>
              setDays(Number(event.target.value))
            }
          >
            <option value={1}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </label>
        
        <label className="overview-group-filter">
            <span>Group by</span>

            <select
                value={grouping}
                onChange={(event) =>
                setGrouping(event.target.value)
                }
            >
                <option value="hour">Hours</option>
                <option value="day">Days</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
            </select>
        </label>

        <span className="overview">
          <span aria-hidden="true" />
          Demo data
        </span>

        <div className="overview-toolbar-actions">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setRefresh((value) => value + 1)
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            disabled={!data || loading}
            onClick={downloadReport}
          >
            <ArrowDownToLine size={16} />
            Report
          </button>
        </div>
      </div>

      {loading && (
        <p role="status">Loading your dashboard…</p>
      )}

      {error && (
        <p className="overview-error" role="alert">
          {error}
        </p>
      )}

      {data && !loading && (
        <>
          <div className="overview-main">
            <div className="overview-metrics">
              <article>
                <p>Total sales</p>
                <strong>
                  {money(data.sales_pesewas)}
                </strong>
                <Change
                  current={data.sales_pesewas}
                  previous={data.previous_sales_pesewas}
                />
              </article>

              <article>
                <p>Total orders</p>
                <strong>{data.orders}</strong>
                <Change
                  current={data.orders}
                  previous={data.previous_orders}
                />
              </article>

              <article>
                <p>Average paid order</p>
                <strong>
                  {money(
                    data.paid_orders
                      ? data.sales_pesewas /
                          data.paid_orders
                      : 0
                  )}
                </strong>
                <small className="overview-change neutral">
                  From {data.paid_orders} verified
                  test payments
                </small>
              </article>
            </div>

            <div className="overview-chart-heading">
              <h2>Sales over time</h2>
              <div className="overview-legend">
                <span>
                  <i /> Selected period
                </span>
                <span>
                  <i className="previous" />
                  Previous period
                </span>
              </div>
            </div>
            <div
                className="overview-chart interactive-sales-chart"
                onMouseLeave={() => setActivePoint(null)}
            >
                <svg
                    viewBox="0 0 800 290"
                    role="group"
                    tabIndex={0}
                    onBlur={() => setActivePoint(null)}
                    onPointerMove={(event) => {
                    if (
                        event.pointerType !== 'mouse' ||
                        !points.length
                    ) {
                        return
                    }

                    const bounds =
                        event.currentTarget.getBoundingClientRect()

                    const chartX =
                        ((event.clientX - bounds.left) /
                        bounds.width) *
                        800

                    const chartY =
                        ((event.clientY - bounds.top) /
                        bounds.height) *
                        290

                    if (
                        chartX < left ||
                        chartX > right ||
                        chartY < top ||
                        chartY > bottom + 10
                    ) {
                        setActivePoint(null)
                        return
                    }

                    const index =
                        points.length === 1
                        ? 0
                        : Math.round(
                            ((chartX - left) / (right - left)) *
                                (points.length - 1)
                            )

                    setActivePoint(
                        Math.max(
                        0,
                        Math.min(points.length - 1, index)
                        )
                    )
                    }}
                    onClick={(event) => {
                    if (!points.length) return

                    const bounds =
                        event.currentTarget.getBoundingClientRect()

                    const chartX =
                        ((event.clientX - bounds.left) /
                        bounds.width) *
                        800

                    if (chartX < left || chartX > right) {
                        setActivePoint(null)
                        return
                    }

                    const index =
                        points.length === 1
                        ? 0
                        : Math.round(
                            ((chartX - left) / (right - left)) *
                                (points.length - 1)
                            )

                    setActivePoint(
                        Math.max(
                        0,
                        Math.min(points.length - 1, index)
                        )
                    )
                    }}
                    onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setActivePoint(null)
                        return
                    }

                    if (!points.length) return

                    if (
                        event.key === 'ArrowRight' ||
                        event.key === 'ArrowLeft' ||
                        event.key === 'Home' ||
                        event.key === 'End'
                    ) {
                        event.preventDefault()

                        setActivePoint((current) => {
                        if (event.key === 'Home') return 0
                        if (event.key === 'End') {
                            return points.length - 1
                        }

                        if (current === null) return 0

                        return Math.max(
                            0,
                            Math.min(
                            points.length - 1,
                            current +
                                (event.key === 'ArrowRight' ? 1 : -1)
                            )
                        )
                        })
                    }
                    }}
                aria-label={`Sales chart for ${
                  days === 1 ? 'today' : `the last ${days} days`
                }. Current total ${money(
                  data.sales_pesewas
                )}, previous total ${money(
                  data.previous_sales_pesewas
                )}. Exact values are listed below.`}
            >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                      offset="0%"
                      stopColor="#299dc1"
                      stopOpacity="0.18"
                    />
                    <stop
                      offset="100%"
                      stopColor="#299dc1"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {[0, 0.5, 1].map((fraction) => (
                  <g key={fraction}>
                    <line
                      x1={left}
                      x2={right}
                      y1={y(maximum * fraction)}
                      y2={y(maximum * fraction)}
                      stroke="#e8e8e3"
                    />
                    <text
                      x={left - 12}
                      y={y(maximum * fraction) + 4}
                      textAnchor="end"
                      fill="#8a8b83"
                      fontSize="12"
                    >
                      {new Intl.NumberFormat('en', {
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(
                        maximum * fraction / 100
                      )}
                    </text>
                  </g>
                ))}

                <text
                  x="16"
                  y="16"
                  fill="#8a8b83"
                  fontSize="11"
                >
                  GHS
                </text>

                {points.length > 1 && (
                  <polygon
                    points={`${x(0)},${bottom} ${currentLine} ${x(points.length - 1)},${bottom}`}
                    fill={`url(#${gradientId})`}
                  />
                )}

                <polyline
                  points={previousLine}
                  fill="none"
                  stroke="#a6ced9"
                  strokeWidth="3"
                  strokeDasharray="3 8"
                  strokeLinecap="round"
                />

                <polyline
                  points={currentLine}
                  fill="none"
                  stroke="#299dc1"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {points.map((point, index) => (
                    <g key={point.at}>
                        <circle
                        cx={x(index)}
                        cy={y(point.previous_sales_pesewas)}
                        r="5"
                        fill="#fff"
                        stroke="#a6ced9"
                        strokeWidth="2"
                        >
                        <title>
                            {pointLabel(point.at)} — comparison:{' '}
                            {money(point.previous_sales_pesewas)}
                        </title>
                        </circle>

                        <circle
                        cx={x(index)}
                        cy={y(point.sales_pesewas)}
                        r="3"
                        fill="#299dc1"
                        >
                        <title>
                            {pointLabel(point.at)} — selected period:{' '}
                            {money(point.sales_pesewas)}
                        </title>
                        </circle>
                    </g>
                ))}

                {axisIndexes.map((index) => (
                  <text
                    key={index}
                    x={x(index)}
                    y="280"
                    textAnchor="middle"
                    fill="#8a8b83"
                    fontSize="12"
                  >
                    {pointLabel(points[index].at)}
                  </text>
                ))}

                {selectedPoint && activePoint !== null && (
                    <g pointerEvents="none">
                        <line
                            x1={x(activePoint)}
                            x2={x(activePoint)}
                            y1={top}
                            y2={bottom}
                            stroke="#8aaab4"
                            strokeWidth="1"
                            strokeDasharray="4 5"
                        />

                        <circle
                            cx={x(activePoint)}
                            cy={y(selectedPoint.previous_sales_pesewas)}
                            r="7"
                            fill="#fff"
                            stroke="#a6ced9"
                            strokeWidth="3"
                        />

                        <circle
                            cx={x(activePoint)}
                            cy={y(selectedPoint.sales_pesewas)}
                            r="7"
                            fill="#299dc1"
                            stroke="#fff"
                            strokeWidth="3"
                        />
                    </g>
                    )}
              </svg>

              {selectedPoint && (
                <div
                    className="sales-point-tooltip"
                    role="status"
                    aria-live="polite"
                >
                    <strong className="sales-point-title">
                        {pointLabel(selectedPoint.at)}
                    </strong>

                    <span className="sales-point-period">
                        {tooltipDate(selectedPoint.from_at)}
                        {' → '}
                        {tooltipDate(selectedPoint.to_at)}
                        {' UTC'}
                    </span>

                    <div className="sales-point-row">
                        <span>
                            <i className="sales-point-dot current" />
                            Sales
                        </span>

                        <strong>
                            {money(selectedPoint.sales_pesewas)}
                        </strong>
                    </div>

                    <div className="sales-point-row">
                        <span>
                            <i className="sales-point-dot previous" />
                            Previous period
                        </span>

                        <strong>
                            {money(
                                selectedPoint.previous_sales_pesewas
                            )}
                        </strong>
                    </div>

                    <span className="sales-point-period">
                        Comparison: {' '}
                        {tooltipDate(selectedPoint.previous_from_at)}
                        {' → '}
                        {tooltipDate(selectedPoint.previous_to_at)}
                        {' UTC'}
                    </span>

                    <div
                        className={`sales-point-difference ${
                            selectedDifference > 0
                            ? 'up'
                            : selectedDifference < 0
                                ? 'down'
                                : ''
                        }`}
                    >
                        {selectedDifference > 0
                            ? '↑ '
                            : selectedDifference < 0
                            ? '↓ '
                            : ''}
                        {money(Math.abs(selectedDifference))}
                        {' '}
                        {selectedDifference > 0
                            ? 'more than the previous period'
                            : selectedDifference < 0
                                ? 'less than the previous period'
                                : 'difference'}
                    </div>
                </div>
                )}
            </div>

            <p className="overview-chart-note">
                Accra time (UTC). Weeks start on Monday.
                The first and last groups may cover only part
                of a week or month. The dotted line compares
                the corresponding time intervals in the
                previous period. Sales use payment timestamps;
                order counts use order creation timestamps.
            </p>

            <details className="overview-data">
              <summary>View exact chart values</summary>
              <div>
                <table>
                  <thead>
                    <tr>
                      <th>Time / date</th>
                      <th>Selected period</th>
                      <th>Previous period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point.at}>
                        <td>{pointLabel(point.at)}</td>
                        <td>
                          {money(point.sales_pesewas)}
                        </td>
                        <td>
                          {money(
                            point.previous_sales_pesewas
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>

          <div className="overview-bottom">
            <button
              type="button"
              onClick={onOrders}
            >
              <span>Verified payments</span>
              <strong>{data.paid_orders}</strong>
              <small>View orders →</small>
            </button>

            <button
              type="button"
              onClick={onOrders}
            >
              <span>Pending orders from this period</span>
              <strong>{data.pending_orders}</strong>
              <small>Review payment status →</small>
            </button>
          </div>

          <p className="overview-footnote">
            Test transactions only—not real revenue.
            Visitor analytics, fulfilment tracking
            and chargebacks are not connected.
          </p>
        </>
      )}
    </div>
  )
}