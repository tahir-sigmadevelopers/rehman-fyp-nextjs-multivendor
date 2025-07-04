import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import ProductSlider from '@/components/shared/product/product-slider'
import { Card, CardContent } from '@/components/ui/card'

import {
  getProductsForCard,
  getProductsByTag,
  getAllCategories,
} from '@/lib/actions/product.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { toSlug } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()
  const todaysDeals = await getProductsByTag({ tag: 'todays-deal' })
  const bestSellingProducts = await getProductsByTag({ tag: 'best-seller' })

  const categories = (await getAllCategories()).slice(0, 4)
  const newArrivals = await getProductsForCard({
    tag: 'new-arrival',
  })
  const featureds = await getProductsForCard({
    tag: 'featured',
  })
  const bestSellers = await getProductsForCard({
    tag: 'best-seller',
  })
  
  // Map of category names to their image paths
  const categoryImages: Record<string, string> = {
    'T-Shirts': '/images/t-shirts.jpg',
    'Jeans': '/images/jeans.jpg',
    'Wrist Watches': '/images/wrist-watches.jpg',
    'Shoes': '/images/shoes.jpg',
    'Electronics': '/images/p31-1.jpg',
    'Clothing': '/images/p21-1.jpg',
    'Furniture': '/images/p16-1.jpg',
    'Kitchen': '/images/p42-1.jpg',
    'Accessories': '/images/accessories-watch.jpg',
    'Sports & Outdoors': '/images/p32-1.jpg',
    'Beauty': '/images/beauty-makeup.jpg',
    'Computers': '/images/computers-laptop.jpg',
    'Home': '/images/p15-1.jpg',
    'Luggage': '/images/p36-1.jpg',
  }
  
  const cards = [
    {
      title: t('Categories to explore'),
      link: {
        text: t('See More'),
        href: '/search',
      },
      items: categories.map((category) => ({
        name: category,
        image: categoryImages[category] || `/images/${toSlug(category)}.jpg`,
        href: `/search?category=${category}`,
      })),
    },
    {
      title: t('Explore New Arrivals'),
      items: newArrivals,
      link: {
        text: t('View All'),
        href: '/search?tag=new-arrival',
      },
    },
    {
      title: t('Discover Best Sellers'),
      items: bestSellers,
      link: {
        text: t('View All'),
        href: '/search?tag=new-arrival',
      },
    },
    {
      title: t('Featured Products'),
      items: featureds,
      link: {
        text: t('Shop Now'),
        href: '/search?tag=new-arrival',
      },
    },
  ]

  return (
    <>
      <HomeCarousel items={carousels} />
      <div className='md:p-4 md:space-y-4 bg-border'>
        <HomeCard cards={cards} />
        <Card className='w-full rounded-none'>
          <CardContent className='p-4 items-center gap-3'>
            <ProductSlider title={t("Today's Deals")} products={todaysDeals} />
          </CardContent>
        </Card>
        <Card className='w-full rounded-none'>
          <CardContent className='p-4 items-center gap-3'>
            <ProductSlider
              title={t('Best Selling Products')}
              products={bestSellingProducts}
              hideDetails
            />
          </CardContent>
        </Card>
      </div>

      <div className='p-4 bg-background'>
        <BrowsingHistoryList />
      </div>
    </>
  )
}
