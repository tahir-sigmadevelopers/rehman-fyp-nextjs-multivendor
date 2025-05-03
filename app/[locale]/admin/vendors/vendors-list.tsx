'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Eye, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getAllVendors, updateVendorStatus, deleteVendor } from '@/lib/actions/vendor.server'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Vendor = {
  _id: string
  name: string
  email: string
  vendorDetails: {
    brandName: string
    description: string
    logo: string
    banner: string
    status: 'pending' | 'approved' | 'rejected'
  }
}

export default function VendorsList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await getAllVendors()
        if (response.success && response.data) {
          const vendorData = response.data.map(vendor => ({
            _id: vendor._id.toString(),
            name: vendor.name,
            email: vendor.email,
            vendorDetails: {
              brandName: vendor.vendorDetails?.brandName || '',
              description: vendor.vendorDetails?.description || '',
              logo: vendor.vendorDetails?.logo || '',
              banner: vendor.vendorDetails?.banner || '',
              status: (vendor.vendorDetails?.status as 'pending' | 'approved' | 'rejected') || 'pending',
            }
          }));
          setVendors(vendorData);
        } else {
          toast({
            variant: 'destructive',
            description: response.message || 'Failed to fetch vendors',
          })
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          description: 'An error occurred while fetching vendors',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [toast])

  const handleStatusUpdate = async (vendorId: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(vendorId)
      const response = await updateVendorStatus(vendorId, status)
      if (response.success) {
        setVendors(vendors.map(vendor => 
          vendor._id === vendorId 
            ? { ...vendor, vendorDetails: { ...vendor.vendorDetails, status } } 
            : vendor
        ))
        toast({
          description: `Vendor ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        })
      } else {
        toast({
          variant: 'destructive',
          description: response.message || `Failed to ${status} vendor`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while updating vendor status',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      setActionLoading(vendorId)
      const response = await deleteVendor(vendorId)
      if (response.success) {
        setVendors(vendors.filter(vendor => vendor._id !== vendorId))
        toast({
          description: `Vendor deleted successfully. ${response.deletedProducts ? `${response.deletedProducts} product(s) were also removed.` : ''}`,
        })
      } else {
        toast({
          variant: 'destructive',
          description: response.message || "Failed to delete vendor",
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while deleting vendor',
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-6">Loading vendors...</div>
  }

  if (vendors.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No vendors found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Applications</CardTitle>
        <CardDescription>Manage vendor applications and approve or reject vendors</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor._id}>
                <TableCell className="font-medium">
                  {vendor.vendorDetails.brandName}
                </TableCell>
                <TableCell>{vendor.name}</TableCell>
                <TableCell>{vendor.email}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      vendor.vendorDetails.status === 'approved' 
                        ? 'default' 
                        : vendor.vendorDetails.status === 'rejected' 
                          ? 'destructive' 
                          : 'outline'
                    }
                  >
                    {vendor.vendorDetails.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setSelectedVendor(vendor)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Vendor Details</DialogTitle>
                        </DialogHeader>
                        {selectedVendor && (
                          <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold mb-2">Brand Information</h3>
                                <p><span className="font-medium">Brand Name:</span> {selectedVendor.vendorDetails.brandName}</p>
                                <p><span className="font-medium">Owner:</span> {selectedVendor.name}</p>
                                <p><span className="font-medium">Email:</span> {selectedVendor.email}</p>
                                <p><span className="font-medium">Status:</span> {selectedVendor.vendorDetails.status}</p>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2">Logo</h3>
                                {selectedVendor.vendorDetails.logo ? (
                                  <img 
                                    src={selectedVendor.vendorDetails.logo} 
                                    alt="Brand Logo" 
                                    className="max-h-32 object-contain border rounded"
                                  />
                                ) : (
                                  <p className="text-muted-foreground">No logo uploaded</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Banner</h3>
                              {selectedVendor.vendorDetails.banner ? (
                                <img 
                                  src={selectedVendor.vendorDetails.banner} 
                                  alt="Brand Banner" 
                                  className="w-full h-40 object-cover border rounded"
                                />
                              ) : (
                                <p className="text-muted-foreground">No banner uploaded</p>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Description</h3>
                              <div 
                                className="prose max-w-none" 
                                dangerouslySetInnerHTML={{ __html: selectedVendor.vendorDetails.description }}
                              />
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {vendor.vendorDetails.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleStatusUpdate(vendor._id, 'approved')}
                          disabled={actionLoading === vendor._id}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleStatusUpdate(vendor._id, 'rejected')}
                          disabled={actionLoading === vendor._id}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          disabled={actionLoading === vendor._id}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this vendor? This will remove all vendor privileges from the user
                            and permanently delete all products created by this vendor.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteVendor(vendor._id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 