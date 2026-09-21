import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Edit3,
  Package,
  Search,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import DeleteProductDialog from './DeleteProductDialog'

export type AdminProduct = {
  id: number
  name: string
  category: string
  note: string
  description: string
  price: number
  fit: string
  colours: string
  lead_time: string
  image_url: string
  image_position: string
  is_available: boolean
  is_featured: boolean
  sort_order: number
}

type AdminProductsProps = {
  onEdit: (product: AdminProduct) => void
}

export default function AdminProducts({
  onEdit,
}: AdminProductsProps) {
  const [products, setProducts] =
    useState<AdminProduct[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [productToDelete, setProductToDelete] =
    useState<AdminProduct | null>(null)

  const [search, setSearch] = useState('')

  const [categoryFilter, setCategoryFilter] =
    useState('All')

  const [visibilityFilter, setVisibilityFilter] =
    useState('All')

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name
          .toLowerCase()
          .includes(searchTerm) ||
        product.note
          .toLowerCase()
          .includes(searchTerm)

      const matchesCategory =
        categoryFilter === 'All' ||
        product.category === categoryFilter

      const matchesVisibility =
        visibilityFilter === 'All' ||
        (visibilityFilter === 'Available' &&
          product.is_available) ||
        (visibilityFilter === 'Hidden' &&
          !product.is_available) ||
        (visibilityFilter === 'Featured' &&
          product.is_featured)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVisibility
      )
    })
  }, [
    products,
    search,
    categoryFilter,
    visibilityFilter,
  ])

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError('')

    const { data, error: productsError } =
      await supabase
        .from('products')
        .select('*')
        .order('sort_order', {
          ascending: true,
        })

    if (productsError) {
      setError(productsError.message)
      setProducts([])
    } else {
      setProducts(data ?? [])
    }

    setLoading(false)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="admin-products-message">
        Loading products...
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-products-message admin-products-error">
        <strong>Products could not be loaded.</strong>
        <span>{error}</span>

        <button onClick={loadProducts}>
          Try again
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="admin-empty-state">
        <Package size={34} />

        <h2>No products yet.</h2>

        <p>
          Use the Add Product button to create the first
          catalogue item.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-product-list">
      <div className="admin-products-toolbar">
        <div className="admin-product-count">
          <strong>{products.length}</strong>

          <span>
            {products.length === 1
              ? 'Product'
              : 'Products'}
          </span>
        </div>

        <label className="admin-product-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products"
            aria-label="Search products"
          />
        </label>

        <label className="admin-filter-control">
          <span>Category</span>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option>All</option>
            <option>Ceremony</option>
            <option>Evening</option>
            <option>Tailoring</option>
            <option>Heritage</option>
          </select>
        </label>

        <label className="admin-filter-control">
          <span>Status</span>

          <select
            value={visibilityFilter}
            onChange={(event) =>
              setVisibilityFilter(event.target.value)
            }
          >
            <option>All</option>
            <option>Available</option>
            <option>Hidden</option>
            <option>Featured</option>
          </select>
        </label>

        <div className="admin-results-count">
          Showing {filteredProducts.length}
        </div>
      </div>

      {filteredProducts.map((product) => (
        <article
          className="admin-product-row"
          key={product.id}
        >
          <img
            src={product.image_url}
            alt=""
            style={{
              objectPosition: product.image_position,
            }}
          />

          <div className="admin-product-main">
            <span>{product.category}</span>
            <h2>{product.name}</h2>
            <p>{product.note}</p>
          </div>

          <div className="admin-product-price">
            <span>Price</span>

            <strong>
              {formatPrice(product.price)}
            </strong>
          </div>

          <div className="admin-product-status">
            <div>
              <span
                className={
                  product.is_available
                    ? 'available'
                    : 'unavailable'
                }
              />

              {product.is_available
                ? 'Available'
                : 'Hidden'}
            </div>

            {product.is_featured && (
              <strong>Featured</strong>
            )}
          </div>

          <div className="admin-product-actions">
            <button
              type="button"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${product.name}`}
              title="Edit product"
            >
              <Edit3 size={17} />
            </button>

            <button
              type="button"
              onClick={() =>
                setProductToDelete(product)
              }
              aria-label={`Delete ${product.name}`}
              title="Delete product"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </article>
      ))}

      {filteredProducts.length === 0 && (
        <div className="admin-no-results">
          <Search size={25} />

          <strong>No matching products</strong>

          <span>
            Try changing the search or filters.
          </span>
        </div>
      )}

      {productToDelete && (
        <DeleteProductDialog
          product={productToDelete}
          onClose={() =>
            setProductToDelete(null)
          }
          onDeleted={() => {
            setProductToDelete(null)
            loadProducts()
          }}
        />
      )}
    </div>
  )
}