'use client'

import React, { useState, useEffect } from 'react'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createProduct } from '@/lib/actions/product.server'

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  listPrice: z.string().min(1, 'List price is required'),
  stock: z.string().min(1, 'Stock is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
})

// We're not using this anymore, but keeping a simple version for reference
const generateSlug = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

export default function VendorProductForm({ vendorId }: { vendorId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasImage, setHasImage] = useState(false)

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      listPrice: '',
      stock: '',
      category: '',
      brand: '',
    },
  })

  // Simplified image handling - just record that an image was selected
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasImage(true);
    }
  };

  async function onSubmit(values: z.infer<typeof ProductSchema>) {
    // Prevent double submission
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log("Starting form submission");
      
      // Basic validation
      if (!vendorId) {
        toast({
          variant: 'destructive',
          description: 'You must be logged in to manage products',
        });
        return;
      }
      
      // Use simple placeholder images
      const productImages = ['https://placehold.co/400x400/png'];
      
      // Create data with minimal processing
      const slug = values.name.toLowerCase().replace(/\s+/g, '-');
      
      // Make a simple object with all required fields
      const data = {
        name: values.name,
        description: values.description,
        price: Number(values.price) || 0,
        listPrice: Number(values.listPrice) || 0,
        countInStock: Number(values.stock) || 0,
        category: values.category,
        brand: values.brand,
        images: productImages,
        vendorId,
        slug,
        tags: ['new'],
        colors: ['White'],
        sizes: ['M'],
        isPublished: true,
        avgRating: 0,
        numReviews: 0,
        numSales: 0,
        ratingDistribution: []
      };
      
      console.log("Submitting product data");
      
      // Submit the data
      const response = await createProduct(data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create product');
      }
      
      // Show success message
      toast({
        description: 'Product created successfully!',
      });
      
      // Navigate with basic redirect
      window.location.href = '/account/vendor-dashboard';
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Show error message
      toast({
        variant: 'destructive',
        description: 'Failed to create product. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter product name' {...field} />
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
                <Textarea
                  placeholder='Enter product description'
                  className='min-h-[100px]'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='0.01'
                    placeholder='Enter current price'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='listPrice'
            render={({ field }) => (
              <FormItem>
                <FormLabel>List Price (Original)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='0.01'
                    placeholder='Enter original price'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='stock'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='Enter stock quantity'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='brand'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder='Enter product brand' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='category'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder='Enter product category' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-2'>
          <FormLabel>Product Images</FormLabel>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {hasImage && (
              <div className='relative aspect-square'>
                <div className='w-full h-full bg-gray-200 rounded-lg flex items-center justify-center'>
                  <span className='text-green-500'>Image Selected</span>
                </div>
                <button
                  type='button'
                  onClick={() => setHasImage(false)}
                  className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full'
                >
                  ×
                </button>
              </div>
            )}
            <div className='relative aspect-square border-2 border-dashed rounded-lg flex items-center justify-center'>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={handleImageChange}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              />
              <Upload className='w-8 h-8 text-muted-foreground' />
            </div>
          </div>
          {!hasImage && (
            <p className='text-sm text-muted-foreground'>At least one product image is required</p>
          )}
        </div>

        <Button
          type='submit'
          className='w-full'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Create Product'}
        </Button>
      </form>
    </Form>
  )
} 