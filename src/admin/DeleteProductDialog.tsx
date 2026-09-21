import { useState } from 'react'
import {
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react'
import type { AdminProduct } from './AdminProducts'
import { supabase } from '../lib/supabase'

type DeleteProductDialogProps = {
  product: AdminProduct
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: DeleteProductDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')

    const { error: deleteError } =
      await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    const storageMarker =
      '/storage/v1/object/public/product-images/'

    if (product.image_url.includes(storageMarker)) {
      const imagePath = decodeURIComponent(
        product.image_url.split(storageMarker)[1]
      )

      if (imagePath) {
        await supabase.storage
          .from('product-images')
          .remove([imagePath])
      }
    }

    onDeleted()
  }

  return (
    <div
      className="admin-form-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="admin-delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-product-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="admin-delete-close"
          type="button"
          onClick={onClose}
          aria-label="Close confirmation"
        >
          <X size={20} />
        </button>

        <div className="admin-delete-icon">
          <AlertTriangle size={27} />
        </div>

        <p className="admin-eyebrow">
          DELETE PRODUCT
        </p>

        <h2 id="delete-product-title">
          Remove this piece?
        </h2>

        <p>
          You are about to permanently delete
          <strong> {product.name}</strong>. This action
          cannot be undone.
        </p>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-delete-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
          >
            Keep product
          </button>

          <button
            type="button"
            className="admin-confirm-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={17} />

            {deleting
              ? 'Deleting...'
              : 'Delete permanently'}
          </button>
        </div>
      </section>
    </div>
  )
}