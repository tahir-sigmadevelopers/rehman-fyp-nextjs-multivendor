import { getAllVendors } from '@/lib/actions/vendor.server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shops',
  description: 'Browse all shops and vendors',
}

export default async function ShopsPage() {
  const response = await getAllVendors()
  const vendors = response.success ? response.data : []
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">All Shops</h1>
      
      {vendors && vendors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No shops available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors && vendors.map((vendor) => (
            <Link href={`/shop/${vendor._id}`} key={vendor._id} className="block">
              <Card className="h-full hover:shadow-lg transition-shadow">
                <div className="h-40 relative w-full overflow-hidden bg-muted rounded-t-lg">
                  {vendor.vendorDetails?.banner ? (
                    <Image
                      src={vendor.vendorDetails.banner}
                      alt={vendor.vendorDetails.brandName || 'Shop banner'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <p className="text-muted-foreground">No banner image</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 relative overflow-hidden rounded-full border-4 border-background -mt-10 bg-white">
                      {vendor.vendorDetails?.logo ? (
                        <Image
                          src={vendor.vendorDetails.logo}
                          alt={vendor.vendorDetails.brandName || 'Shop logo'}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <p className="text-sm text-muted-foreground">No logo</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-2">
                      <h2 className="text-xl font-bold">
                        {vendor.vendorDetails?.brandName || 'Shop Name'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {vendor.name || 'Vendor'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm line-clamp-3">
                    {vendor.vendorDetails?.description || 'No description available'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 