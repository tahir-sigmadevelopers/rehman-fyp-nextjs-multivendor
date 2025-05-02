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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { createProduct, updateProduct } from '@/lib/actions/product.server'

const ProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Price must be a number',
  }),
  category: z.string().min(1, 'Category is required'),
  stock: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Stock must be a number',
  }),
})

export const ProductForm = ({ product }: { product?: any }) => {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price?.toString() || '',
      category: product?.category || '',
      stock: product?.stock?.toString() || '',
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages: string[] = []
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader()
        reader.onloadend = () => {
          newImages.push(reader.result as string)
          if (newImages.length === files.length) {
            setImages([...images, ...newImages])
          }
        }
        reader.readAsDataURL(files[i])
      }
    }
  }

  async function onSubmit(values: z.infer<typeof ProductSchema>) {
    try {
      setIsSubmitting(true)

      if (status === 'loading') {
        toast({
          variant: 'destructive',
          description: 'Please wait while we load your session',
        })
        return
      }

      if (!session?.user?.id) {
        toast({
          variant: 'destructive',
          description: 'You must be logged in to manage products',
        })
        return
      }

      const productData = {
        ...values,
        price: parseFloat(values.price),
        stock: parseInt(values.stock),
        images,
        vendorId: session.user.id,
      }

      if (product) {
        const response = await updateProduct(product._id, productData)
        if (!response.success) {
          throw new Error(response.message)
        }
        toast({
          description: 'Product updated successfully!',
        })
      } else {
        const response = await createProduct(productData)
        if (!response.success) {
          throw new Error(response.message)
        }
        toast({
          description: 'Product created successfully!',
        })
      }

      router.push('/vendor/products')
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Something went wrong',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
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

        <div className='grid grid-cols-2 gap-4'>
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
                    placeholder='Enter price'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

        <div className='space-y-4'>
          <FormLabel>Product Images</FormLabel>
          <div className='grid grid-cols-4 gap-4'>
            {images.map((image, index) => (
              <div key={index} className='relative aspect-square'>
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className='w-full h-full object-cover rounded-lg'
                />
                <button
                  type='button'
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className='absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full'
                >
                  ×
                </button>
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
        </div>

        <Button
          type='submit'
          className='w-full'
          disabled={isSubmitting || status === 'loading'}
        >
          {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </form>
    </Form>
  )
} 