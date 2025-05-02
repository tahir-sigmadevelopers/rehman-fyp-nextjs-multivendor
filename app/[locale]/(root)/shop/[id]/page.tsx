import { getVendorByUserId } from '@/lib/actions/vendor.server'
import { getVendorProducts } from '@/lib/actions/product.server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ProductCard from '@/components/shared/product/product-card'
import Image from 'next/image'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const vendorResponse = await getVendorByUserId(params.id)
  
  if (!vendorResponse.success) {
    return {
      title: 'Shop Not Found',
      description: 'The shop you are looking for does not exist.'
    }
  }
  
  const vendor = vendorResponse.data
  const brandName = vendor.vendorDetails?.brandName || 'Shop'
  
  return {
    title: brandName,
    description: vendor.vendorDetails?.description || `Products from ${brandName}`
  }
}

export default async function ShopPage({ params }: { params: { id: string } }) {
  // Get vendor information
  const vendorResponse = await getVendorByUserId(params.id)
  
  if (!vendorResponse.success) {
    notFound()
  }
  
  const vendor = vendorResponse.data
  
  // Get vendor products
  const productsResponse = await getVendorProducts(params.id)
  const products = productsResponse.success ? productsResponse.data : []
  
  return (
    <div className="container mx-auto py-8">
      {/* Vendor Banner and Info */}
      <div className="mb-8">
        <div className="h-56 relative w-full overflow-hidden rounded-t-lg mb-4">
          {vendor.vendorDetails?.banner ? (
            <Image
              src={vendor.vendorDetails.banner}
              alt={vendor.vendorDetails.brandName || 'Shop banner'}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-muted-foreground">No banner available</p>
            </div>
          )}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 relative overflow-hidden rounded-full border-4 border-background bg-white flex-shrink-0">
                {vendor.vendorDetails?.logo ? (
                  <Image
                    src={vendor.vendorDetails.logo}
                    alt={vendor.vendorDetails.brandName || 'Shop logo'}
                    fill
                    className="object-contain"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-sm text-muted-foreground">No logo</p>
                  </div>
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {vendor.vendorDetails?.brandName || 'Shop'}
                </h1>
                <p className="text-muted-foreground mb-4">
                  Vendor: {vendor.name}
                </p>
                <div className="prose max-w-none">
                  <p>{vendor.vendorDetails?.description || 'No description available'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Vendor Products */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        <Separator className="mb-6" />
        
        {products && products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">This shop has no products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products && products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 