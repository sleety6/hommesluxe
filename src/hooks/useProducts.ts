import {
  useEffect,
  useState,
} from 'react'
import {
  products as starterProducts,
  type Product,
} from '../data'
import { supabase } from '../lib/supabase'

type DatabaseProduct = {
  id: number
  name: string
  category: Product['category']
  note: string
  description: string
  price: number
  fit: string
  colours: string
  lead_time: string
  image_url: string
  image_position: string
  sort_order: number
  is_featured: boolean
}

function formatPrice(price: number) {
  return `From ${new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(price)}`
}

export function useProducts() {
  const [products, setProducts] =
    useState<Product[]>(starterProducts)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data, error } =
      await supabase
        .from('products')
        .select(
          `
            id,
            name,
            category,
            note,
            description,
            price,
            fit,
            colours,
            lead_time,
            image_url,
            image_position,
            is_featured,
            sort_order
          `
        )
        .eq('is_available', true)
        .order('sort_order', {
          ascending: true,
        })

    if (!error && data) {
      const databaseProducts =
        (data as DatabaseProduct[]).map(
          (product) => ({
            id: String(product.id).padStart(2, '0'),
            name: product.name,
            category: product.category,
            note: product.note,
            description: product.description,
            palette: 'sand',
            image: product.image_url,
            position: product.image_position,
            price: formatPrice(product.price),
            fit: product.fit,
            colours: product.colours,
            leadTime: product.lead_time,
            featured: product.is_featured,
          })
        )

      setProducts(databaseProducts)
    }

    setLoading(false)
  }

  return {
    products,
    loading,
    refreshProducts: loadProducts,
  }
}