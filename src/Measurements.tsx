import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

const measurementFields = [
  ['chest', 'Chest'],
  ['waist', 'Waist'],
  ['hips', 'Hips'],
  ['shoulder', 'Shoulder width'],
  ['sleeve', 'Sleeve length'],
  ['top', 'Top length'],
  ['trousers', 'Trouser length'],
] as const

type MeasurementKey =
  (typeof measurementFields)[number][0]

export type OutfitMeasurements = {
  wearer: string
  mode: 'enter' | 'help'
  unit: 'in' | 'cm'
  values: Partial<Record<MeasurementKey, string>>
  notes: string
}

export type MeasurementsByProduct = Record<
  string,
  OutfitMeasurements[]
>

function emptyMeasurements(): OutfitMeasurements {
  return {
    wearer: '',
    mode: 'help',
    unit: 'in',
    values: {},
    notes: '',
  }
}

export function describeMeasurements(
  records: OutfitMeasurements[] | undefined,
  quantity: number
) {
  return Array.from({ length: quantity }, (_, index) => {
    const record = records?.[index]

    const heading = `Outfit ${index + 1}${
      record?.wearer ? ` — ${record.wearer}` : ''
    }`

    if (!record) {
      return `${heading}: measurements to discuss with the studio`
    }

    const details =
      record.mode === 'help'
        ? 'Please help me with measurements.'
        : measurementFields
            .filter(([key]) => record.values[key])
            .map(
              ([key, label]) =>
                `${label}: ${record.values[key]} ${record.unit}`
            )
            .join(', ')

    return [
      heading,
      details || 'Measurements to discuss with the studio',
      record.notes ? `Notes: ${record.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }).join('\n\n')
}

type Props = {
  productName: string
  quantity: number
  value?: OutfitMeasurements[]
  onSave: (records: OutfitMeasurements[]) => void
}

export default function Measurements({
  productName,
  quantity,
  value,
  onSave,
}: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<
    OutfitMeasurements[]
  >([])
  const [error, setError] = useState('')

  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
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
  }, [open])

  function edit() {
    setDraft(
      Array.from({ length: quantity }, (_, index) => {
        const existing = value?.[index]

        return existing
          ? {
              ...existing,
              values: { ...existing.values },
            }
          : emptyMeasurements()
      })
    )

    setError('')
    setOpen(true)
  }

  function update(
    index: number,
    changes: Partial<OutfitMeasurements>
  ) {
    setDraft((current) =>
      current.map((record, position) =>
        position === index
          ? { ...record, ...changes }
          : record
      )
    )

    setError('')
  }

  function changeUnit(
    index: number,
    nextUnit: 'in' | 'cm'
  ) {
    const record = draft[index]

    if (record.unit === nextUnit) return

    const converted: OutfitMeasurements['values'] = {}

    for (const [key] of measurementFields) {
      const original = record.values[key]

      if (!original) continue

      const amount = Number(original)
      const result =
        nextUnit === 'cm'
          ? amount * 2.54
          : amount / 2.54

      converted[key] = String(
        Math.round(result * 100) / 100
      )
    }

    update(index, {
      unit: nextUnit,
      values: converted,
    })
  }

  const savedCount = Math.min(
    value?.length || 0,
    quantity
  )

  return (
    <div className="measurements-control">
      <button
        type="button"
        className="measurements-button"
        onClick={edit}
      >
        {savedCount
          ? 'Edit measurements'
          : 'Add measurements'}
      </button>

      <small aria-live="polite">
        {savedCount
          ? `${savedCount} of ${quantity} outfit details saved`
          : 'Enter your measurements or request help'}
      </small>

      {open && (
        <dialog
          ref={dialogRef}
          className="checkout-dialog measurements-dialog"
          aria-labelledby={titleId}
          onCancel={() => setOpen(false)}
        >
          <button
            type="button"
            className="checkout-close"
            aria-label="Close measurements"
            onClick={() => setOpen(false)}
          >
            ×
          </button>

          <form
            className="shop-checkout"
            onSubmit={(event) => {
              event.preventDefault()

              const incomplete = draft.findIndex(
                (record) =>
                  record.mode === 'enter' &&
                  !measurementFields.some(
                    ([key]) => record.values[key]
                  )
              )

              if (incomplete !== -1) {
                setError(
                  `For outfit ${incomplete + 1}, enter at least one measurement or choose help from the studio.`
                )
                return
              }

              onSave(
                draft.map((record) => ({
                  ...record,
                  wearer: record.wearer.trim(),
                  notes: record.notes.trim(),
                  values:
                    record.mode === 'help'
                      ? {}
                      : { ...record.values },
                }))
              )

              setOpen(false)
            }}
          >
            <p className="eyebrow">MADE FOR YOU</p>

            <h2 id={titleId}>Your measurements.</h2>

            <p>
              {productName}. Add separate details for
              each outfit if you are ordering for
              different people.
            </p>

            <p>
              Enter measurements you already know.
              Leave anything uncertain blank; the
              studio will confirm the details before
              tailoring.
            </p>

            {draft.map((record, index) => (
              <fieldset
                className="measurement-outfit"
                key={index}
              >
                <legend>Outfit {index + 1}</legend>

                <div className="checkout-fields">
                  <label className="checkout-wide">
                    Who is this outfit for? (optional)
                    <input
                      maxLength={80}
                      placeholder="For example: myself or Kofi"
                      value={record.wearer}
                      onChange={(event) =>
                        update(index, {
                          wearer: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="checkout-wide">
                    Measurements
                    <select
                      value={record.mode}
                      onChange={(event) =>
                        update(index, {
                          mode: event.target.value as
                            | 'enter'
                            | 'help',
                        })
                      }
                    >
                      <option value="help">
                        I need help from the studio
                      </option>

                      <option value="enter">
                        I will enter my measurements
                      </option>
                    </select>
                  </label>

                  {record.mode === 'enter' && (
                    <>
                      <label className="checkout-wide">
                        Measurement unit
                        <select
                          value={record.unit}
                          onChange={(event) =>
                            changeUnit(
                              index,
                              event.target.value as
                                | 'in'
                                | 'cm'
                            )
                          }
                        >
                          <option value="in">
                            Inches
                          </option>

                          <option value="cm">
                            Centimetres
                          </option>
                        </select>
                      </label>

                      {measurementFields.map(
                        ([key, label]) => (
                          <label key={key}>
                            {label} ({record.unit})
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0.01"
                              step="any"
                              value={
                                record.values[key] || ''
                              }
                              onChange={(event) =>
                                update(index, {
                                  values: {
                                    ...record.values,
                                    [key]:
                                      event.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        )
                      )}
                    </>
                  )}

                  <label className="checkout-wide">
                    Fit, colour or special instructions
                    <textarea
                      maxLength={500}
                      placeholder="For example: relaxed fit, navy blue, needed for a wedding."
                      value={record.notes}
                      onChange={(event) =>
                        update(index, {
                          notes: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
            ))}

            <p>
              These details stay in this open website
              session. Refreshing the page clears
              measurements.
            </p>

            {error && (
              <p
                role="alert"
                className="measurement-error"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="shop-primary"
            >
              Save outfit details
            </button>
          </form>
        </dialog>
      )}
    </div>
  )
}