'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { updateVendorInformation } from '@/lib/actions/vendor.server'

const StoreInfoSchema = z.object({
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
})

export default function StoreInformationForm({ 
  vendor, 
  vendorId 
}: { 
  vendor: any;
  vendorId: string;
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(vendor.vendorDetails?.logo || null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(vendor.vendorDetails?.banner || null)

  const form = useForm<z.infer<typeof StoreInfoSchema>>({
    resolver: zodResolver(StoreInfoSchema),
    defaultValues: {
      brandName: vendor.vendorDetails?.brandName || '',
      description: vendor.vendorDetails?.description || '',
    },
  })

  // Simple image handling - just for preview in this demo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setLogoPreview(imageUrl);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setBannerPreview(imageUrl);
    }
  };

  async function onSubmit(values: z.infer<typeof StoreInfoSchema>) {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // For a real implementation, you would upload images to a storage service
      // and get back URLs. For this demo, we'll just use the existing URLs
      // or the placeholder URLs
      const updateData = {
        userId: vendorId,
        brandName: values.brandName,
        description: values.description,
        // In a real implementation, you would add:
        // logo: uploadedLogoUrl,
        // banner: uploadedBannerUrl
      };
      
      const response = await updateVendorInformation(updateData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update store information');
      }
      
      toast({
        description: 'Store information updated successfully!',
      });
      
      // Navigate back to vendor dashboard
      router.push('/account/vendor-dashboard');
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        variant: 'destructive',
        description: 'Failed to update store information. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardContent className='pt-6'>
            <FormField
              control={form.control}
              name='brandName'
              render={({ field }) => (
                <FormItem className='mb-6'>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter your brand name' {...field} />
                  </FormControl>
                  <FormDescription>
                    This is how your brand will appear to customers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Describe your store and what you sell'
                      className='min-h-[120px]'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear description helps customers understand what your store offers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <h3 className='text-lg font-medium mb-4'>Store Images</h3>
            
            <div className='space-y-6'>
              <div className='space-y-2'>
                <FormLabel>Brand Logo</FormLabel>
                <FormDescription>
                  This will be displayed on your store page and in search results.
                </FormDescription>
                
                <div className='flex items-start gap-6'>
                  <div className='h-32 w-32 overflow-hidden rounded-md border'>
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Brand Logo Preview" 
                        className='h-full w-full object-contain'
                      />
                    ) : (
                      <div className='h-full w-full flex items-center justify-center bg-muted'>
                        <p className='text-sm text-muted-foreground'>No logo</p>
                      </div>
                    )}
                  </div>
                  
                  <div className='space-y-2'>
                    <div className='relative'>
                      <Input
                        type='file'
                        accept='image/*'
                        onChange={handleLogoChange}
                        className='absolute inset-0 opacity-0 cursor-pointer'
                        id='logo-upload'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        className='relative z-10'
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className='mr-2 h-4 w-4' />
                        Upload Logo
                      </Button>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Recommended size: 200x200px. Max size: 2MB.
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Note: Image uploads are simulated in this demo.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className='space-y-2'>
                <FormLabel>Banner Image</FormLabel>
                <FormDescription>
                  This will be displayed at the top of your store page.
                </FormDescription>
                
                <div className='space-y-4'>
                  <div className='h-48 w-full overflow-hidden rounded-md border'>
                    {bannerPreview ? (
                      <img 
                        src={bannerPreview} 
                        alt="Banner Preview" 
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='h-full w-full flex items-center justify-center bg-muted'>
                        <p className='text-sm text-muted-foreground'>No banner</p>
                      </div>
                    )}
                  </div>
                  
                  <div className='flex items-center gap-4'>
                    <div className='relative'>
                      <Input
                        type='file'
                        accept='image/*'
                        onChange={handleBannerChange}
                        className='absolute inset-0 opacity-0 cursor-pointer'
                        id='banner-upload'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        className='relative z-10'
                        onClick={() => document.getElementById('banner-upload')?.click()}
                      >
                        <Upload className='mr-2 h-4 w-4' />
                        Upload Banner
                      </Button>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Recommended size: 1200x300px. Max size: 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/account/vendor-dashboard')}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 