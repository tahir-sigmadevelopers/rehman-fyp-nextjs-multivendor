'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Upload } from 'lucide-react'
import TextEditor from '@/components/shared/text-editor'
import { useSession } from 'next-auth/react'

const VendorRegistrationSchema = z.object({
  brandName: z.string().min(3, 'Brand name must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  logo: z.any().optional(),
  banner: z.any().optional(),
})

export const VendorRegistrationForm = () => {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof VendorRegistrationSchema>>({
    resolver: zodResolver(VendorRegistrationSchema),
    defaultValues: {
      brandName: '',
      description: '',
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      form.setValue('logo', file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      form.setValue('banner', file)
    }
  }

  async function onSubmit(values: z.infer<typeof VendorRegistrationSchema>) {
    try {
      setIsSubmitting(true)

      if (!session?.user?.id) {
        toast({
          variant: 'destructive',
          description: 'You must be logged in to register as a vendor',
        })
        return
      }

      const vendorData = {
        brandName: values.brandName,
        description: values.description,
        logo: logoPreview || '',
        banner: bannerPreview || '',
      }

      const response = await fetch('/api/vendors/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to register as a vendor')
      }

      toast({
        description: 'Your application has been submitted successfully!',
      })
      router.push('/account')
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='brandName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter your brand name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <TextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder='Describe your brand and what you offer...'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Logo</FormLabel>
          <div className='flex items-center gap-4'>
            <div className='relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center'>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt='Logo preview'
                  className='w-full h-full object-contain'
                />
              ) : (
                <Upload className='w-8 h-8 text-muted-foreground' />
              )}
              <input
                type='file'
                accept='image/*'
                onChange={handleLogoChange}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              />
            </div>
            <p className='text-sm text-muted-foreground'>
              Upload your brand logo (recommended size: 200x200px)
            </p>
          </div>
        </div>

        <div>
          <FormLabel>Banner Image</FormLabel>
          <div className='flex items-center gap-4'>
            <div className='relative w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center'>
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt='Banner preview'
                  className='w-full h-full object-cover'
                />
              ) : (
                <Upload className='w-8 h-8 text-muted-foreground' />
              )}
              <input
                type='file'
                accept='image/*'
                onChange={handleBannerChange}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              />
            </div>
            <p className='text-sm text-muted-foreground'>
              Upload your banner image (recommended size: 1200x300px)
            </p>
          </div>
        </div>

        <Button 
          type='submit' 
          className='w-full'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </Form>
  )
} 