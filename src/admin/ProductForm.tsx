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

  const [image, setImage] = useState<File | null>(null)

  const [available, setAvailable] = useState(
    product?.is_available ?? true
  )
  const [featured, setFeatured] = useState(
    product?.is_featured ?? false
    )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const imagePreview = useMemo(() => {
    if (image) {
        return URL.createObjectURL(image)
    }

    return product?.image_url ?? ''
    }, [image, product?.image_url])

    useEffect(() => {
    return () => {
        if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
        }
    }
    }, [imagePreview])
  async function uploadImage() {
    if (!image) {
      return {
        publicUrl: product?.image_url ?? '',
        uploadedPath: '',
      }
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error(
        'The image must be smaller than 5 MB.'
      )
    }

    const safeName = image.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')

    const uploadedPath =
      `products/${Date.now()}-${safeName}`

    const { error: uploadError } =
      await supabase.storage
        .from('product-images')
        .upload(uploadedPath, image, {
          cacheControl: '3600',
          upsert: false,
        })

    if (uploadError) {
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadedPath)

    return {
      publicUrl,
      uploadedPath,
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    if (!editing && !image) {
      setError('Please select a product image.')
      return
    }

    setSaving(true)

    let uploadedPath = ''

    try {
      const uploadedImage = await uploadImage()

      uploadedPath = uploadedImage.uploadedPath

      const productDetails = {
        name: name.trim(),
        category,
        note: note.trim(),
        description: description.trim(),
        price: Number(price),
        fit: fit.trim(),
        colours: colours.trim(),
        lead_time: leadTime.trim(),
        image_url: uploadedImage.publicUrl,
        image_position: imagePosition.trim(),
        is_available: available,
        is_featured: featured,
        updated_at: new Date().toISOString(),
      }

      if (product) {
        const { error: updateError } =
          await supabase
            .from('products')
            .update(productDetails)
            .eq('id', product.id)

        if (updateError) {
          throw updateError
        }
      } else {
        const { data: finalProduct } =
          await supabase
            .from('products')
            .select('sort_order')
            .order('sort_order', {
              ascending: false,
            })
            .limit(1)
            .maybeSingle()

        const nextOrder =
          (finalProduct?.sort_order ?? 0) + 1

        const { error: insertError } =
          await supabase
            .from('products')
            .insert({
              ...productDetails,
              sort_order: nextOrder,
            })

        if (insertError) {
          throw insertError
        }
      }

      onSaved()
    } catch (saveError) {
      if (uploadedPath) {
        await supabase.storage
          .from('product-images')
          .remove([uploadedPath])
      }

      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The product could not be saved.'
      )

      setSaving(false)
    }
  }

  return (
    <div
      className="admin-form-backdrop"
      onMouseDown={onClose}
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
            onClick={onClose}
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

          <div className="admin-custom-field">
            <span className="admin-field-label">
              Product image
            </span>

            <label
              className={
                image
                  ? 'admin-image-upload has-file'
                  : 'admin-image-upload'
              }
              htmlFor="product-image"
            >
              {imagePreview ? (
                <img
                    className="admin-image-preview"
                    src={imagePreview}
                    alt="Product preview"
                    style={{
                    objectPosition: imagePosition,
                    }}
                />
                ) : (
                <Upload size={20} />
                )}

              <span>
                <strong>
                  {image
                    ? image.name
                    : editing
                      ? 'Current product image'
                      : 'Upload image'}
                </strong>

                <small>
                  {image
                    ? 'Click to choose a different image'
                    : editing
                      ? 'Upload only if you want to replace it'
                      : 'JPG, PNG or WebP · Maximum 5 MB'}
                </small>
              </span>
            </label>

            <input
              className="admin-hidden-file-input"
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setImage(
                  event.target.files?.[0] ?? null
                )
              }
              required={!editing}
            />
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
              onClick={onClose}
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