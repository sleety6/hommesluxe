import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product } from './data'

export default function ProductGallery({
  product,
}: {
  product: Product
}) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const images = Array.from(
    new Set(
      (product.images?.length
        ? product.images
        : [product.image]
      ).filter(Boolean)
    )
  )

  function goTo(index: number) {
    const element = track.current
    if (!element) return

    element.scrollTo({
      left: index * element.clientWidth,
      behavior: window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
        ? 'auto'
        : 'smooth',
    })
  }

  if (!images.length) return null

  return (
    <section
      className="product-gallery"
      aria-label={`${product.name} images`}
      aria-roledescription="carousel"
    >
      <div
        ref={track}
        className="product-gallery-track"
        tabIndex={images.length > 1 ? 0 : undefined}
        aria-label="Product images. Use left and right arrow keys to browse."
        onScroll={(event) => {
          const element = event.currentTarget

          if (element.clientWidth) {
            setActive(
              Math.min(
                images.length - 1,
                Math.max(
                  0,
                  Math.round(element.scrollLeft / element.clientWidth)
                )
              )
            )
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            goTo(Math.min(images.length - 1, active + 1))
          }

          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            goTo(Math.max(0, active - 1))
          }
        }}
      >
        {images.map((url, index) => (
          <img
            key={url}
            src={url}
            alt={`${product.name} — view ${index + 1}`}
            style={{ objectPosition: product.position }}
            loading={index === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="gallery-arrow gallery-previous"
            aria-label="Previous image"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            className="gallery-arrow gallery-next"
            aria-label="Next image"
            disabled={active === images.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ChevronRight size={21} />
          </button>

          <div className="gallery-navigation">
            {images.map((url, index) => (
              <button
                type="button"
                key={url}
                className={active === index ? 'is-active' : ''}
                aria-label={`Show image ${index + 1}`}
                aria-current={active === index ? 'true' : undefined}
                onClick={() => goTo(index)}
              />
            ))}

            <span aria-live="polite" aria-atomic="true">
              {active + 1} / {images.length}
            </span>
          </div>
        </>
      )}
    </section>
  )
}