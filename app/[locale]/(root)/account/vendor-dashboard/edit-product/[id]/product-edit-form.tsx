'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import { Upload, ArrowLeft, Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { updateProduct } from '@/lib/actions/product.server'

const CATEGORY_OPTIONS = [
  'Electronics',
  'Computers',
  'Smart Home',
  'Home & Kitchen',
  'Fashion',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Books',
  'Office Supplies',
  'Other'
];

const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  listPrice: z.string().min(1, 'List price is required'),
  stock: z.string().min(1, 'Stock is required'),
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
  const [previewImage, setPreviewImage] = useState<string | null>(
    product.images && product.images.length > 0 ? product.images[0] : null
  )

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      listPrice: product.listPrice?.toString() || '',
      stock: product.stock?.toString() || '',
      category: product.category || '',
      brand: product.brand || '',
      isPublished: product.isPublished ?? true,
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setPreviewImage(event.target.result);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof ProductSchema>) {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      if (!vendorId) {
        toast({
          variant: 'destructive',
          description: 'You must be logged in to manage products',
        });
        return;
      }
      
      // Use preview image if available, otherwise keep existing or use placeholder
      const productImages = previewImage 
        ? [previewImage] 
        : (product.images?.length ? product.images : ['https://placehold.co/400x400/png']);
      
      // Prepare data for update
      const data = {
        name: values.name,
        description: values.description,
        price: Number(values.price) || 0,
        listPrice: Number(values.listPrice) || 0,
        stock: Number(values.stock) || 0,
        category: values.category,
        brand: values.brand,
        images: productImages,
        isPublished: values.isPublished,
        status: values.isPublished ? 'published' as const : 'draft' as const,
      };
      
      // Submit the data
      const response = await updateProduct(product._id, data);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update product');
      }
      
      toast({
        description: 'Product updated successfully!',
      });
      
      // Add a slight delay before navigation to ensure state updates
      setTimeout(() => {
        router.push('/account/vendor-dashboard/manage-products');
      }, 500);
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to update product. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        className="px-0 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main product info (left side) */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <Separator />
                  
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
                            className='min-h-[150px]'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-medium">Pricing & Inventory</h3>
                  <Separator />
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='price'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              placeholder='0.00'
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
                          <FormLabel>List Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              placeholder='0.00'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Original price before discount</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='stock'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar (right side) */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-medium">Status</h3>
                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Publish Product
                          </FormLabel>
                          <FormDescription>
                            Make this product visible to customers
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-medium">Classification</h3>
                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name='category'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Input placeholder='Enter brand name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-medium">Product Image</h3>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-full h-[200px] flex items-center justify-center relative overflow-hidden">
                        {previewImage ? (
                          <div className="relative w-full h-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={previewImage} 
                              alt="Product preview" 
                              className="object-contain w-full h-full"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewImage(null)}
                              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                            >
                              <Upload className="h-4 w-4" />
                              <span className="sr-only">Change image</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              Upload a product image
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <label className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {previewImage ? 'Change image' : 'Upload image'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 