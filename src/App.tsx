import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react'
import { type Product } from './data'
import { useProducts } from './hooks/useProducts'
import AdminPage from './admin/AdminPage'
import Shop, { useBag } from './Shop'
import { PaymentStatus } from './PaystackPayment'

type Page =
  | 'home'
  | 'collections'
  | 'about'
  | 'contact'
  | 'admin'
  | 'bag'

const pages: Page[] = [
  'home',
  'collections',
  'about',
  'contact',
  'admin',
  'bag',
]
const nav: { label: string; page: Page }[] = [
  { label: 'Home', page: 'home' }, { label: 'Collections', page: 'collections' },
  { label: 'Our story', page: 'about' }, { label: 'Contact', page: 'contact' },
]

function ImageSlot({ palette, label, className = '' }: { palette: string; label: string; className?: string }) {
  return <div className={`image-slot ${palette} ${className}`} role="img" aria-label={`${label} image placeholder`}>
    <span className="slot-orbit" aria-hidden="true" /><span className="slot-number" aria-hidden="true">HL / 26</span>
    <span className="slot-caption">YOUR IMAGE HERE<br /><small>{label}</small></span>
  </div>
}

function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  return product.image
    ? <img className={`product-image ${className}`} src={product.image} alt={product.name} loading="lazy" style={{ objectPosition: product.position }} />
    : <ImageSlot palette={product.palette} label={product.name} className={className} />
}

export default function App() {
  const {
    products,
    loading,
    catalogueReady,
  } = useProducts()

  const bag = useBag()

  const [page, setPage] = useState<Page>(() => {
    const hash = location.hash.slice(1) as Page
    return pages.includes(hash) ? hash : 'home'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)

  useEffect(() => {
    const updateHeader = () => {
      setHeaderScrolled(window.scrollY > 28)
    }

    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateHeader)
    }
  }, [])
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<Product | null>(null)

  useEffect(() => {
    const onHash = () => { const hash = location.hash.slice(1) as Page; setPage(pages.includes(hash) ? hash : 'home') }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); setSelected(null) }, [page])
  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])
  const go = (target: Page) => { location.hash = target; setPage(target) }
  const featuredProducts = products
    .filter((item) => item.featured)
    .slice(0, 3)

  const homepageProducts =
    featuredProducts.length > 0
      ? featuredProducts
      : products.slice(0, 3)

  const shown = filter === 'All' ? products : products.filter(item => item.category === filter)
  if (page === 'admin') {
    return <AdminPage />
  }
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="announcement">A NEW EXPRESSION OF OCCASIONWEAR <span>✦</span> ACCRA, GHANA</div>
    <div
      className={`navigation-shell${headerScrolled ? ' is-scrolled' : ''}`}
    >
    <header className="site-header">
      <a
        className="wordmark"
        href="#home"
        aria-label="HOMMESLUXE home"
        onClick={() => {
          setMenuOpen(false)

          if (page === 'home') {
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia(
                '(prefers-reduced-motion: reduce)'
              ).matches
                ? 'auto'
                : 'smooth',
            })
          }
        }}
      >HOMMES<span>LUXE</span><small>ACCRA · GHANA</small></a>
      <nav className="desktop-nav" aria-label="Main navigation">{nav.map(item => <a key={item.page} className={page === item.page ? 'active' : ''} href={`#${item.page}`}>{item.label}</a>)}</nav>
      <button
        className="header-cta bag-header"
        onClick={() => go('bag')}
      >
        Bag ({bag.count})
        <ArrowUpRight size={15} />
      </button>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
    </header>
    {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(item => <a key={item.page} href={`#${item.page}`} onClick={() => setMenuOpen(false)}>{item.label}<ArrowUpRight size={18} /></a>)}</nav>}
    </div>

    <main id="main">
      <PaymentStatus onPaid={bag.clearAfterPayment} />
      {page === 'bag' && (
        <Shop
          bag={bag}
          products={products}
          loading={loading}
          catalogueReady={catalogueReady}
        />
      )}

      {page === 'home' && <>
        <section className="hero">
          <div className="hero-copy reveal"><p className="eyebrow"><span className="line" /> THE ART OF ARRIVING</p><h1>For every<br /><em>remarkable</em><br />moment.</h1><p className="hero-text">Considered fashion for celebrations, ceremonies and every entrance worth remembering.</p><button className="text-link" onClick={() => go('collections')}>Explore the collection <ArrowUpRight size={19} /></button><div className="hero-index">01 <span>/</span> 03 &nbsp;—&nbsp; AN INTRODUCTION</div></div>
          <div className="hero-visual"><img className="editorial-image hero-image" src="/images/look-12.jpg" alt="Couple dressed in coordinated black occasionwear" /><div className="hero-stamp">HOMMESLUXE <span>✦</span> ACCRA</div></div>
          <a className="scroll-cue" href="#featured">SCROLL TO EXPLORE <ArrowDown size={15} /></a>
        </section>
        <div className="marquee" aria-hidden="true"><div>CRAFTED FOR PRESENCE ✦ DRESSED FOR THE MOMENT ✦ CRAFTED FOR PRESENCE ✦ DRESSED FOR THE MOMENT ✦&nbsp;</div></div>
        <section className="intro section-pad reveal"><p className="eyebrow">THE HOMMESLUXE WORLD</p><h2>Style that stays<br /><em>with you.</em></h2><p>A contemporary expression of occasionwear, shaped by the energy of Ghana and the beauty of showing up as yourself.</p><button className="text-link dark" onClick={() => go('about')}>Discover our story <ArrowUpRight size={19} /></button></section>
        <section id="featured" className="featured section-pad"><div className="section-heading"><div><p className="eyebrow">AN EDIT OF POSSIBILITIES</p><h2>Featured pieces<span>.</span></h2></div><button className="text-link dark" onClick={() => go('collections')}>View all pieces <ArrowUpRight size={19} /></button></div><div className="product-grid home-grid">{homepageProducts.map(item => <button className="product-card" key={item.id} onClick={() => setSelected(item)}><div className="product-frame"><ProductImage product={item} /><span className="card-arrow"><ArrowUpRight size={20} /></span></div><div className="product-meta"><span>{item.id} / {item.category}</span><h3>{item.name}</h3><p>{item.note}</p>
        <strong className="card-price">{item.price}</strong></div></button>)}</div></section>
        <section className="statement"><div className="statement-visual"><img className="editorial-image" src="/images/look-03.jpg" alt="Couple in coordinated green ceremonial clothing" /></div><div className="statement-copy"><p className="eyebrow">THE FEELING</p><h2>Made to be<br /><em>remembered.</em></h2><p>Some occasions ask for more than an outfit. They ask for a feeling. Explore a wardrobe designed around the moments that matter.</p><button className="outline-button" onClick={() => go('collections')}>Explore collections <ArrowRight size={18} /></button></div></section>
        <section className="closing section-pad"><p className="eyebrow">YOUR MOMENT STARTS HERE</p><h2>Let’s make an<br /><em>entrance.</em></h2><button className="text-link" onClick={() => go('contact')}>Get in touch <ArrowUpRight size={21} /></button></section>
      </>}

      {page === 'collections' && <section className="page-section section-pad"><div className="page-heading"><p className="eyebrow">THE EDIT</p><h1>Collections<span>.</span></h1><p>A curated gallery of modern tailoring and ceremonial dressing. Product names and details remain editable starter copy.</p></div><div className="filters" aria-label="Filter products">{['All', 'Ceremony', 'Evening', 'Tailoring', 'Heritage'].map(option => <button key={option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)} aria-pressed={filter === option}>{option}</button>)}</div><div className="product-grid catalog-grid">{shown.map(item => <button className="product-card" key={item.id} onClick={() => setSelected(item)}><div className="product-frame"><ProductImage product={item} /><span className="card-arrow"><ArrowUpRight size={20} /></span></div><div className="product-meta"><span>{item.id} / {item.category}</span><h3>{item.name}</h3><p>{item.note}</p>
        <strong className="card-price">{item.price}</strong></div></button>)}</div></section>
      }

      {page === 'about' && <><section className="about-hero section-pad"><div><p className="eyebrow">OUR STORY</p><h1>Dress like<br /><em>you mean it.</em></h1><p>
        Some moments stay with you long after the day is over.
        At HOMMESLUXE, we believe what you wear should be part
        of that memory. Rooted in Accra, our vision brings
        Ghanaian occasionwear into a modern wardrobe—expressive,
        considered and personal. From a wedding celebration
        to an evening you have been looking forward to, we
        want you to arrive feeling entirely yourself.
      </p></div><img className="editorial-image about-image" src="/images/look-01.jpg" alt="Man wearing an embroidered navy ceremonial outfit" /></section><section className="about-detail section-pad"><p className="eyebrow">A POINT OF VIEW</p><h2>Rooted in Accra.<br />Made for wherever<br /><em>life takes you.</em></h2><div><p>
        Our inspiration lives in the way we celebrate:
        the colour, the gathering of family, the pride in
        showing up for one another. We carry that spirit
        into our approach to dressing, where traditional
        influences meet clean silhouettes and a personal
        sense of style.
      </p>

      <p>
        For us, a memorable outfit begins with the person
        wearing it. Your occasion, your preferred colours
        and the way you want to feel all belong in the
        conversation. Whether your style is quiet and
        understated or bold and ceremonial, our ambition
        is the same: a look you feel proud to wear,
        and a memory you will be glad to revisit.
      </p><button className="text-link dark" onClick={() => go('contact')}>Start a conversation <ArrowUpRight size={19} /></button></div></section></>}

      {page === 'contact' && <section className="contact-page section-pad"><div><p className="eyebrow">CONNECT WITH US</p><h1>Tell us about<br /><em>your moment.</em></h1><p>Questions about a piece, bespoke tailoring or styling for a special occasion? We’d love to hear from you.</p><div className="contact-details"><a href="mailto:hommesluxe@gmail.com"><Mail size={18} /> hommesluxe@gmail.com</a><a href="tel:+233597431095"><Phone size={18} /> 059 743 1095</a><a href="tel:+233541894105"><Phone size={18} /> 054 189 4105</a><a href="https://maps.google.com/?q=Orgle+Road+Accra+Ghana" target="_blank" rel="noreferrer"><MapPin size={18} /> Orgle Road, Accra, Ghana</a><a href="https://www.instagram.com/hommesluxe/" target="_blank" rel="noreferrer"><Instagram size={18} /> @hommesluxe</a></div></div><div className="contact-panel"><span className="panel-num">01 / WHATSAPP</span><h2>Start with<br />a hello.</h2><p>Share the occasion, date, piece you like and any questions. We’ll take it from there.</p><a className="outline-button" href="https://wa.me/message/M3DWAXRFX2Q6K1" target="_blank" rel="noreferrer">Chat on WhatsApp <MessageCircle size={18} /></a><span className="contact-deco" aria-hidden="true">✦</span></div></section>}
    </main>
    <a
      className="floating-whatsapp"
      href="https://wa.me/message/M3DWAXRFX2Q6K1"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with HOMMESLUXE on WhatsApp"
    >
      <MessageCircle size={21} />
      <span>WhatsApp</span>
    </a>
    <footer className="footer"><div className="footer-top"><div><a className="wordmark footer-logo" href="#home">HOMMES<span>LUXE</span><small>ACCRA · GHANA</small></a><p>For every remarkable moment.</p></div><nav aria-label="Footer navigation">{nav.map(item => <a href={`#${item.page}`} key={item.page}>{item.label}</a>)}</nav><div><p>Stay connected</p><a href="mailto:hommesluxe@gmail.com" aria-label="Email HOMMESLUXE"><Mail size={20} /></a><a href="https://www.instagram.com/hommesluxe/" target="_blank" rel="noreferrer" aria-label="HOMMESLUXE on Instagram"><Instagram size={20} /></a><a href="https://wa.me/message/M3DWAXRFX2Q6K1" target="_blank" rel="noreferrer" aria-label="Chat with HOMMESLUXE on WhatsApp"><MessageCircle size={20} /></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} HOMMESLUXE. All rights reserved.</span><span>ORGLE ROAD · ACCRA</span><a href="#main">BACK TO TOP ↑</a></div></footer>

    {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}><div className="product-modal" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={event => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close product details"><X /></button><ProductImage product={selected} /><div className="modal-copy"><p className="eyebrow">{selected.category} / {selected.id}</p><h2>{selected.name}</h2><p className="modal-note">{selected.note}</p><p>{selected.description}</p><div className="product-details">
  <div>
    <span>Price</span>
    <strong>{selected.price}</strong>
  </div>

  <div>
    <span>Fit</span>
    <strong>{selected.fit}</strong>
  </div>

  <div>
    <span>Colours</span>
    <strong>{selected.colours}</strong>
  </div>

  <div>
    <span>Lead time</span>
    <strong>{selected.leadTime}</strong>
  </div>
</div><button
        className="shop-primary shop-add"
        onClick={() => {
        bag.add(selected.id)
        setSelected(null)
      }}
      >
        Add to bag →
      </button>

      <p className="shop-add-note">
        Starting price. Final quote and measurements
        confirmed by the studio.
      </p>

      <a
        className="outline-button"
        href="https://wa.me/message/M3DWAXRFX2Q6K1"
        target="_blank"
        rel="noreferrer"
      >
        Enquire on WhatsApp
        <MessageCircle size={18} />
      </a><button className="modal-back" onClick={() => setSelected(null)}><ArrowLeft size={17} /> Back to collection</button></div></div></div>}
  </>
}
