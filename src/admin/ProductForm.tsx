import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ChevronDown,
  Upload,
  X,
} from 'lucide-react'
import type { AdminProduct } from './AdminProducts'
import { supabase } from '../lib/supabase'

type ProductFormProps = {
  product?: AdminProduct | null
  onClose: () => void
  onSaved: () => void
}

const categories = [
  'Ceremony',
  'Evening',
  'Tailoring',
  'Heritage',
]

export default function ProductForm({
  product,
  onClose,
  onSaved,
}: ProductFormProps) {
  const editing = Boolean(product)

  const [name, setName] = useState(
    product?.name ?? ''
  )

  const [category, setCategory] = useState(
    product?.category ?? 'Tailoring'
  )

  const [categoryOpen, setCategoryOpen] =
    useState(false)

  const [note, setNote] = useState(
    product?.note ?? ''
  )

  const [description, setDescription] = useState(
    product?.description ?? ''
  )

  const [price, setPrice] = useState(
    String(product?.price ?? 1500)
  )

  const [fit, setFit] = useState(
    product?.fit ?? 'Made to measure'
  )

  const [colours, setColours] = useState(
    product?.colours ?? 'Custom colours available'
  )

  const [leadTime, setLeadTime] = useState(
    product?.lead_time ?? '2–3 weeks'
  )

  const [imagePosition, setImagePosition] = useState(
    product?.image_position ?? '50% 50%'
  )

  const [savedImages, setSavedImages] = useState<string[]>(
    () =>
      product?.image_urls?.length
        ? [...product.image_urls]
        : product?.image_url
          ? [product.image_url]
          : []
  )

  const [imageFiles, setImageFiles] = useState<File[]>([])

  const [available, setAvailable] = useState(
    product?.is_available ?? true
  )
  const [featured, setFeatured] = useState(
    product?.is_featured ?? false
    )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
    const imagePreviews = useMemo(
    () => imageFiles.map((file) => URL.createObjectURL(file)),
    [imageFiles]
  )

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

  function addImages(files: File[]) {
    if (!files.length) return

    if (savedImages.length + imageFiles.length + files.length > 8) {
      setError('You can add up to 8 images per product.')
      return
    }

    const invalid = files.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
    )

    if (invalid) {
      setError('Use JPG, PNG or WebP images, each no larger than 5 MB.')
      return
    }

    setError('')
    setImageFiles((current) => [...current, ...files])
  }

  async function uploadImages(uploadedPaths: string[]) {
    const urls = [...savedImages]

    for (const file of imageFiles) {
      const extension =
        file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : 'jpg'

      const path = `products/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      uploadedPaths.push(path)

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)

      urls.push(data.publicUrl)
    }

    return urls
  }

    async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    if (saving) return

    setError('')

    const imageCount = savedImages.length + imageFiles.length

    if (imageCount < 1 || imageCount > 8) {
      setError('Please add between 1 and 8 product images.')
      return
    }

    const numericPrice = Number(price)

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Enter a price greater than zero.')
      return
    }

    setSaving(true)

    const uploadedPaths: string[] = []
    let saved = false

    try {
      const urls = await uploadImages(uploadedPaths)

      const productDetails = {
        name: name.trim(),
        category,
        note: note.trim(),
        description: description.trim(),
        price: numericPrice,
        fit: fit.trim(),
        colours: colours.trim(),
        lead_time: leadTime.trim(),
        image_url: urls[0],
        image_urls: urls,
        image_position: imagePosition.trim(),
        is_available: available,
        is_featured: featured,
        updated_at: new Date().toISOString(),
      }

      if (product) {
        const { data, error: updateError } = await supabase
          .from('products')
          .update(productDetails)
          .eq('id', product.id)
          .select('id')
          .single()

        if (updateError) throw updateError
        if (!data) throw new Error('The product could not be updated.')
      } else {
        const { data: finalProduct, error: sortError } = await supabase
          .from('products')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (sortError) throw sortError

        const { error: insertError } = await supabase
          .from('products')
          .insert({
            ...productDetails,
            sort_order: (finalProduct?.sort_order ?? 0) + 1,
          })

        if (insertError) throw insertError
      }

      saved = true
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The product could not be saved. Please try again.'
      )
    } finally {
      setSaving(false)
    }

    if (saved) onSaved()
  }

  return (
    <div
      className="admin-form-backdrop"
      onMouseDown={() => {
        if (!saving) onClose()
      }}
    >
      <section
        className="admin-product-form-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="admin-eyebrow">
              CATALOGUE MANAGEMENT
            </p>

            <h2 id="product-form-title">
              {editing ? 'Edit product' : 'Add product'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!saving) onClose()
            }}
            aria-label="Close product form"
          >
            <X />
          </button>
        </header>

        <form
          className="admin-product-form"
          onSubmit={handleSubmit}
        >
          <label className="admin-field-wide">
            Product name

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
            />
          </label>

          <div className="admin-custom-field">
            <span className="admin-field-label">
              Category
            </span>

            <div className="admin-custom-select">
              <button
                type="button"
                className="admin-select-trigger"
                onClick={() =>
                  setCategoryOpen(
                    (current) => !current
                  )
                }
                aria-expanded={categoryOpen}
              >
                <span>{category}</span>

                <ChevronDown
                  size={17}
                  className={
                    categoryOpen ? 'open' : ''
                  }
                />
              </button>

              {categoryOpen && (
                <div
                  className="admin-select-options"
                  role="listbox"
                >
                  {categories.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        category === item
                          ? 'selected'
                          : ''
                      }
                      onClick={() => {
                        setCategory(item)
                        setCategoryOpen(false)
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <label>
            Price in GHS

            <input
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              required
            />
          </label>

          <label className="admin-field-wide">
            Short description

            <input
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              required
            />
          </label>

          <label className="admin-field-wide">
            Full description

            <textarea
              rows={4}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              required
            />
          </label>

          <label>
            Fit

            <input
              value={fit}
              onChange={(event) =>
                setFit(event.target.value)
              }
              required
            />
          </label>

          <label>
            Lead time

            <input
              value={leadTime}
              onChange={(event) =>
                setLeadTime(event.target.value)
              }
              required
            />
          </label>

          <label className="admin-field-wide">
            Colours

            <input
              value={colours}
              onChange={(event) =>
                setColours(event.target.value)
              }
              required
            />
          </label>

          <label>
            Image position

            <input
              value={imagePosition}
              onChange={(event) =>
                setImagePosition(event.target.value)
              }
              placeholder="50% 50%"
              required
            />
          </label>

          <div className="admin-custom-field admin-field-wide">
            <span className="admin-field-label">
              Product images
            </span>

            <p className="product-images-help">
              Add up to 8 images. The first image is the cover.
              JPG, PNG or WebP · Maximum 5 MB each.
            </p>

            <div className="product-image-grid">
              {savedImages.map((url, index) => (
                <div className="product-image-tile" key={`${url}-${index}`}>
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    style={{ objectPosition: imagePosition }}
                  />

                  {index === 0 && (
                    <span className="product-cover-badge">Cover</span>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    aria-label={`Remove image ${index + 1}`}
                    onClick={() =>
                      setSavedImages((current) =>
                        current.filter((_, position) => position !== index)
                      )
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}

              {imagePreviews.map((url, index) => (
                <div className="product-image-tile" key={url}>
                  <img
                    src={url}
                    alt={`New image ${index + 1}`}
                    style={{ objectPosition: imagePosition }}
                  />

                  {savedImages.length === 0 && index === 0 && (
                    <span className="product-cover-badge">Cover</span>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    aria-label={`Remove new image ${index + 1}`}
                    onClick={() =>
                      setImageFiles((current) =>
                        current.filter((_, position) => position !== index)
                      )
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>

            <label className="product-images-picker">
              <Upload size={18} />
              <span>Add images</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  saving || savedImages.length + imageFiles.length >= 8
                }
                onChange={(event) => {
                  addImages(Array.from(event.target.files || []))
                  event.target.value = ''
                }}
              />
            </label>
          </div>

          <label className="admin-checkbox admin-field-wide">
            <input
              type="checkbox"
              checked={available}
              onChange={(event) =>
                setAvailable(event.target.checked)
              }
            />

            Show this product in the collection
          </label>

          <label className="admin-checkbox admin-field-wide">
            <input
                type="checkbox"
                checked={featured}
                onChange={(event) =>
                setFeatured(event.target.checked)
                }
            />

            Feature this product on the homepage
          </label>

          {error && (
            <p
              className="admin-error admin-field-wide"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="admin-form-actions admin-field-wide">
            <button
              type="button"
              className="admin-cancel-button"
              onClick={() => {
              if (!saving) onClose()
            }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving product...'
                : editing
                  ? 'Save changes'
                  : 'Save product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}