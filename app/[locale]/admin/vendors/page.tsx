import { Metadata } from 'next'
import VendorsList from './vendors-list'

const PAGE_TITLE = 'Vendors Management'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function AdminVendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1-bold">{PAGE_TITLE}</h1>
      </div>
      <div className="container mx-auto py-4">
        <VendorsList />
      </div>
    </div>
  )
} 