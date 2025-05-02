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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { updateProduct } from '@/lib/actions/product.server'

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  listPrice: z.string().min(1, 'List price is required'),
  countInStock: z.string().min(1, 'Stock is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  isPublished: z.boolean().default(true),
})

export default function ProductEditForm({ 
  product, 
  vendorId 
}: { 
  product: any;
  vendorId: string;
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasImage, setHasImage] = useState(!!product.images?.length)

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      listPrice: product.listPrice?.toString() || '',
      countInStock: product.countInStock?.toString() || '',
      category: product.category || '',
      brand: product.brand || '',
      isPublished: product.isPublished ?? true,
    },
  })

  // Simple image handling - just record that an image was selected
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
      
      // Keep existing images or use placeholders if needed
      const productImages = product.images?.length 
        ? product.images 
        : ['https://placehold.co/400x400/png'];
      
      // Prepare data for update
      const data = {
        name: values.name,
        description: values.description,
        price: Number(values.price) || 0,
        listPrice: Number(values.listPrice) || 0,
        countInStock: Number(values.countInStock) || 0,
        category: values.category,
        brand: values.brand,
        images: productImages,
        isPublished: values.isPublished,
      };
      
      console.log("Updating product data");
      
      // Submit the data
      const response = await updateProduct(product._id, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update product');
      }
      
      // Show success message
      toast({
        description: 'Product updated successfully!',
      });
      
      // Navigate back to products list
      window.location.href = '/account/vendor-dashboard/manage-products';
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Show error message
      toast({
        variant: 'destructive',
        description: 'Failed to update product. Please try again.'
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
            name='countInStock'
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

        <FormField
          control={form.control}
          name='isPublished'
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Publish this product
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  When checked, this product will be visible to customers.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className='space-y-2'>
          <FormLabel>Product Images</FormLabel>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {product.images && product.images.map((image: string, index: number) => (
              <div key={index} className='relative aspect-square'>
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className='w-full h-full object-cover rounded-lg'
                />
              </div>
            ))}
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
          <p className='text-sm text-muted-foreground'>
            Image uploads will be enabled in the full version.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/account/vendor-dashboard/manage-products')}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 