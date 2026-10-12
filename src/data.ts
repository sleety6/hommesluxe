export type Product = {
  id: string
  name: string
  category: 'Ceremony' | 'Evening' | 'Tailoring' | 'Heritage'
  note: string
  description: string
  palette: string
  image: string
  images?: string[]
  position?: string
  startingPrice?: number
  price: string
  fit: string
  colours: string
  leadTime: string
  featured?: boolean
}

// Temporary catalogue details.
// Confirm names, prices, colours, and production times before publishing.
export const products: Product[] = [
  {
    id: '01',
    name: 'The Adinkra Agbada',
    category: 'Heritage',
    note: 'Embroidered midnight blue',
    description:
      'A richly embroidered ceremonial look with a flowing silhouette and bold geometric detail.',
    palette: 'sand',
    image: '/images/look-01.jpg',
    position: '50% 20%',
    price: 'From GHS 2,500',
    fit: 'Made to measure',
    colours: 'Custom colours available',
    leadTime: '2–4 weeks',
  },
  {
    id: '02',
    name: 'The Noir Set',
    category: 'Evening',
    note: 'Modern monochrome tailoring',
    description:
      'A clean black occasionwear set finished with understated pocket detailing.',
    palette: 'slate',
    image: '/images/look-02.jpg',
    position: '50% 28%',
    price: 'From GHS 1,800',
    fit: 'Made to measure',
    colours: 'Black and custom colours',
    leadTime: '2–3 weeks',
  },
  {
    id: '03',
    name: 'The Emerald Ceremony',
    category: 'Ceremony',
    note: 'A celebration in deep green',
    description:
      'Coordinated ceremonial dressing with strong shapes, layered texture and a rich emerald palette.',
    palette: 'olive',
    image: '/images/look-03.jpg',
    position: '50% 42%',
    price: 'From GHS 2,800',
    fit: 'Bespoke',
    colours: 'Custom colours available',
    leadTime: '3–5 weeks',
  },
  {
    id: '04',
    name: 'The Blush Set',
    category: 'Tailoring',
    note: 'Relaxed polish in soft pink',
    description:
      'A light short sleeve set with an elegant neckline and an easy tailored finish.',
    palette: 'clay',
    image: '/images/look-04.jpg',
    position: '50% 32%',
    price: 'From GHS 1,500',
    fit: 'Made to measure',
    colours: 'Custom colours available',
    leadTime: '2–3 weeks',
  },
  {
    id: '05',
    name: 'The Silver Kaftan',
    category: 'Tailoring',
    note: 'Quiet detail, assured presence',
    description:
      'A refined long sleeve set in a cool silver tone with subtle vertical embellishment.',
    palette: 'slate',
    image: '/images/look-05.jpg',
    position: '50% 20%',
    price: 'From GHS 1,700',
    fit: 'Made to measure',
    colours: 'Silver and custom colours',
    leadTime: '2–3 weeks',
  },
  {
    id: '06',
    name: 'The Obsidian Cape',
    category: 'Evening',
    note: 'Texture after dark',
    description:
      'A layered black formal look with a textured cape and traditional cap.',
    palette: 'cocoa',
    image: '/images/look-06.jpg',
    position: '50% 20%',
    price: 'From GHS 2,500',
    fit: 'Bespoke',
    colours: 'Black and custom colours',
    leadTime: '3–4 weeks',
  },
  {
    id: '07',
    name: 'The Oxblood Set',
    category: 'Evening',
    note: 'A rich occasion statement',
    description:
      'A burgundy tailored set with delicate neckline accents, created for a coordinated evening entrance.',
    palette: 'plum',
    image: '/images/look-07.jpg',
    position: '50% 22%',
    price: 'From GHS 1,800',
    fit: 'Made to measure',
    colours: 'Custom colours available',
    leadTime: '2–3 weeks',
  },
  {
    id: '08',
    name: 'The Ivory Junior',
    category: 'Ceremony',
    note: 'Celebration dressing for boys',
    description:
      'A bright ivory ceremonial set with graceful proportions and tonal embroidery.',
    palette: 'sand',
    image: '/images/look-08.jpg',
    position: '50% 30%',
    price: 'From GHS 1,500',
    fit: 'Made to measure',
    colours: 'Ivory and custom colours',
    leadTime: '2–3 weeks',
  },
  {
    id: '09',
    name: 'The White Agbada',
    category: 'Heritage',
    note: 'Tonal embroidery in crisp white',
    description:
      'A sweeping white agbada with tonal front embroidery, paired with a deep blue cap.',
    palette: 'sand',
    image: '/images/look-09.jpg',
    position: '50% 25%',
    price: 'From GHS 2,500',
    fit: 'Bespoke',
    colours: 'Custom colours available',
    leadTime: '3–4 weeks',
  },
  {
    id: '10',
    name: 'The Midnight Set',
    category: 'Tailoring',
    note: 'A clean everyday statement',
    description:
      'A fitted black set with considered stitching and restrained geometric detail.',
    palette: 'slate',
    image: '/images/look-10.jpg',
    position: '50% 28%',
    price: 'From GHS 1,500',
    fit: 'Made to measure',
    colours: 'Black and custom colours',
    leadTime: '2–3 weeks',
  },
  {
    id: '11',
    name: 'The Sand Ceremony',
    category: 'Ceremony',
    note: 'Warm neutrals for the occasion',
    description:
      'A flowing sand-toned ceremonial look featuring a patterned panel and sculptural drape.',
    palette: 'sand',
    image: '/images/look-11.jpg',
    position: '56% 28%',
    price: 'From GHS 2,200',
    fit: 'Bespoke',
    colours: 'Custom colours available',
    leadTime: '3–4 weeks',
  },
  {
    id: '12',
    name: 'The Onyx Agbada',
    category: 'Evening',
    note: 'Graphic detail in black',
    description:
      'A polished black agbada with dimensional geometric embroidery for formal celebrations.',
    palette: 'cocoa',
    image: '/images/look-12.jpg',
    position: '62% 25%',
    price: 'From GHS 2,800',
    fit: 'Bespoke',
    colours: 'Black and custom colours',
    leadTime: '3–5 weeks',
  },
  {
    id: '13',
    name: 'The Cocoa Kaftan',
    category: 'Heritage',
    note: 'Rich brown, effortless form',
    description:
      'A streamlined cocoa kaftan paired with a patterned cap for a composed finish.',
    palette: 'plum',
    image: '/images/look-13.jpg',
    position: '50% 18%',
    price: 'From GHS 1,600',
    fit: 'Made to measure',
    colours: 'Custom colours available',
    leadTime: '2–3 weeks',
  },
]
