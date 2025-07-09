'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createOrder } from '@/lib/actions/order.actions'
import { createDirectOrder } from '@/lib/actions/direct-order'
import {
  calculateFutureDate,
  formatDateTime,
  timeUntilMidnight,
} from '@/lib/utils'
import { ShippingAddressSchema } from '@/lib/validator'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import CheckoutFooter from './checkout-footer'
import { OrderItem, ShippingAddress } from '@/types'
import useIsMounted from '@/hooks/use-is-mounted'
import Link from 'next/link'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import ProductPrice from '@/components/shared/product/product-price'
import { CheckCircle, CircleUser, MapPin, CreditCard, Package } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const shippingAddressDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
        fullName: 'Rehman Ahmed',
        street: '1911, 65 Sherbrooke Est',
        city: 'Montreal',
        province: 'Ontario',
        phone: '4181234567',
        postalCode: 'H2X 1C4',
        country: 'Canada',
      }
    : {
        fullName: '',
        street: '',
        city: '',
        province: '',
        phone: '',
        postalCode: '',
        country: '',
      }

const CheckoutForm = () => {
  const { toast } = useToast()
  const router = useRouter()
  const {
    setting: {
      site,
      availablePaymentMethods,
      defaultPaymentMethod,
      availableDeliveryDates,
    },
  } = useSettingStore()

  const {
    cart: {
      items,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      shippingAddress,
      deliveryDateIndex,
      paymentMethod = defaultPaymentMethod,
    },
    setShippingAddress,
    setPaymentMethod,
    updateItem,
    removeItem,
    clearCart,
    setDeliveryDateIndex,
  } = useCartStore()
  const isMounted = useIsMounted()

  const [userInfo, setUserInfo] = useState({
    email: '',
    name: '',
  })

  const userInfoForm = useForm({
    defaultValues: userInfo,
  })

  const onSubmitUserInfo: SubmitHandler<typeof userInfo> = (values) => {
    setUserInfo(values)
    setIsUserInfoSubmitted(true)
  }

  const [isUserInfoSubmitted, setIsUserInfoSubmitted] = useState(false)
  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false)
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] =
    useState<boolean>(false)
  const [isDeliveryDateSelected, setIsDeliveryDateSelected] =
    useState<boolean>(false)

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
  })
  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    setShippingAddress(values)
    setIsAddressSelected(true)
  }

  useEffect(() => {
    if (!isMounted || !shippingAddress) return
    shippingAddressForm.setValue('fullName', shippingAddress.fullName)
    shippingAddressForm.setValue('street', shippingAddress.street)
    shippingAddressForm.setValue('city', shippingAddress.city)
    shippingAddressForm.setValue('country', shippingAddress.country)
    shippingAddressForm.setValue('postalCode', shippingAddress.postalCode)
    shippingAddressForm.setValue('province', shippingAddress.province)
    shippingAddressForm.setValue('phone', shippingAddress.phone)
  }, [items, isMounted, router, shippingAddress, shippingAddressForm])

  const handlePlaceOrder = async () => {
    try {
      const validItems = items.map(item => ({
        ...item,
        countInStock: item.countInStock || Math.max(item.quantity + 5, 10),
      }));

      // Validate user info is present
      if (!userInfo.name || !userInfo.email) {
        toast({
          description: 'Please provide your name and email before placing the order',
          variant: 'destructive',
        });
        return;
      }

      // Ensure shipping address is selected
      if (!shippingAddress) {
        toast({
          description: 'Please provide a shipping address',
          variant: 'destructive',
        });
        return;
      }

      // Create a clean guest user object - keep it as simple as possible
      const guestUser = {
        name: userInfo.name.trim(),
        email: userInfo.email.trim()
      };

      console.log("Submitting order with guest user:", guestUser);

      // Use direct MongoDB approach for guest users
      const res = await createDirectOrder({
        guestUser,
        items: validItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        expectedDeliveryDate: calculateFutureDate(
          availableDeliveryDates[deliveryDateIndex!].daysToDeliver
        ),
      });
      
      if (!res.success) {
        console.error("Order placement error:", res.message);
        toast({
          description: `Error: ${res.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          description: 'Order placed successfully as guest. Please save your order number for reference.',
          variant: 'default',
        });
        clearCart();
        router.push(`/checkout/${res.data?.orderId}`);
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast({
        description: `An error occurred while placing your order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleSelectPaymentMethod = () => {
    setIsAddressSelected(true)
    setIsPaymentMethodSelected(true)
  }
  const handleSelectShippingAddress = () => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)()
  }
  const CheckoutSummary = () => (
    <Card className="shadow-sm sticky top-4">
      <CardHeader className="bg-gray-50 border-b py-3">
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        {!isAddressSelected && (
          <div className='border-b mb-4'>
            <Button
              className='rounded-full w-full bg-primary hover:bg-primary/90'
              onClick={handleSelectShippingAddress}
            >
              Ship to this address
            </Button>
            <p className='text-xs text-center py-2'>
              Choose a shipping address and payment method in order to calculate
              shipping, handling, and tax.
            </p>
          </div>
        )}
        {isAddressSelected && !isPaymentMethodSelected && (
          <div className='mb-4'>
            <Button
              className='rounded-full w-full bg-primary hover:bg-primary/90'
              onClick={handleSelectPaymentMethod}
            >
              Use this payment method
            </Button>

            <p className='text-xs text-center py-2'>
              Choose a payment method to continue checking out. You&apos;ll
              still have a chance to review and edit your order before it&apos;s
              final.
            </p>
          </div>
        )}
        {isPaymentMethodSelected && isAddressSelected && (
          <div>
            <Button onClick={handlePlaceOrder} className='rounded-full w-full bg-green-600 hover:bg-green-700 text-white'>
              Place Your Order
            </Button>
            <p className='text-xs text-center py-2'>
              By placing your order, you agree to {site.name}&apos;s{' '}
              <Link href='/page/privacy-policy'>privacy notice</Link> and
              <Link href='/page/conditions-of-use'> conditions of use</Link>.
            </p>
          </div>
        )}

        <div className="mt-4">
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className="text-sm text-muted-foreground">Items:</span>
              <span className="font-medium">
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className='flex justify-between'>
              <span className="text-sm text-muted-foreground">Shipping & Handling:</span>
              <span className="font-medium">
                {shippingPrice === undefined ? (
                  '--'
                ) : shippingPrice === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className="text-sm text-muted-foreground">Tax:</span>
              <span className="font-medium">
                {taxPrice === undefined ? (
                  '--'
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between pt-3 border-t mt-2'>
              <span className="font-bold">Order Total:</span>
              <span className="font-bold text-lg">
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>
          </div>
        </div>
        
        {/* Order Items Summary */}
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-3">Items in your order ({items.reduce((acc, item) => acc + item.quantity, 0)})</h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.clientId} className="flex gap-3">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="64px"
                    style={{ objectFit: 'contain' }}
                    className="rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium mt-1">
                    <ProductPrice price={item.price * item.quantity} plain />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Checkout progress step component
  const CheckoutStep = ({ 
    number, 
    title, 
    isActive, 
    isCompleted, 
    icon 
  }: { 
    number: number; 
    title: string; 
    isActive: boolean; 
    isCompleted: boolean;
    icon: React.ReactNode;
  }) => (
    <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        isCompleted ? 'bg-green-100 text-green-600' : 
        isActive ? 'bg-primary text-white' : 
        'bg-gray-100 text-gray-400'
      }`}>
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{title}</span>
    </div>
  );

  return (
    <main className='max-w-6xl mx-auto highlight-link'>
      {/* Checkout Progress */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <CheckoutStep 
            number={1} 
            title="Your Information" 
            isActive={!isUserInfoSubmitted} 
            isCompleted={isUserInfoSubmitted}
            icon={<CircleUser className="w-5 h-5" />}
          />
          <div className="hidden md:block border-t border-gray-200 flex-grow mx-2"></div>
          <CheckoutStep 
            number={2} 
            title="Shipping Address" 
            isActive={isUserInfoSubmitted && !isAddressSelected} 
            isCompleted={isAddressSelected}
            icon={<MapPin className="w-5 h-5" />}
          />
          <div className="hidden md:block border-t border-gray-200 flex-grow mx-2"></div>
          <CheckoutStep 
            number={3} 
            title="Payment Method" 
            isActive={isAddressSelected && !isPaymentMethodSelected} 
            isCompleted={isPaymentMethodSelected}
            icon={<CreditCard className="w-5 h-5" />}
          />
          <div className="hidden md:block border-t border-gray-200 flex-grow mx-2"></div>
          <CheckoutStep 
            number={4} 
            title="Review & Place Order" 
            isActive={isPaymentMethodSelected} 
            isCompleted={false}
            icon={<Package className="w-5 h-5" />}
          />
        </div>
      </div>

      <div className='grid md:grid-cols-4 gap-6'>
        <div className='md:col-span-3'>
          {/* User Information */}
          <div>
            <div className='flex text-primary text-lg font-bold my-2'>
              <span className='w-8'>1 </span>
              <span>Your Information</span>
              <span className="ml-2 text-sm font-normal self-center">(Guest Checkout)</span>
            </div>
            {!isUserInfoSubmitted ? (
              <Card className='md:ml-8 my-4 shadow-sm border-primary/20'>
                <CardContent className='p-6'>
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
                    <p className="text-sm text-blue-700">
                      Complete your information below to continue as a guest. No account is required.
                    </p>
                  </div>
                  <form onSubmit={userInfoForm.handleSubmit(onSubmitUserInfo)} className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='name' className="text-sm font-medium">Full Name</Label>
                      <Input
                        id='name'
                        placeholder="Enter your full name"
                        className="focus-visible:ring-primary"
                        {...userInfoForm.register('name', { required: true })}
                      />
                      {userInfoForm.formState.errors.name && (
                        <p className="text-xs text-red-500">Full name is required</p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='email' className="text-sm font-medium">Email Address</Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder="Enter your email address"
                        className="focus-visible:ring-primary"
                        {...userInfoForm.register('email', { required: true })}
                      />
                      {userInfoForm.formState.errors.email && (
                        <p className="text-xs text-red-500">Valid email is required</p>
                      )}
                      <p className="text-xs text-muted-foreground">We'll send your order confirmation to this email address.</p>
                    </div>
                    <Button type='submit' className='rounded-full w-full bg-primary hover:bg-primary/90'>
                      Continue to Shipping
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>1 </span>
                <span>Your Information</span>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          {isUserInfoSubmitted && (
            <div>
              <div className='flex text-primary text-lg font-bold my-2'>
                <span className='w-8'>2 </span>
                <span>Shipping Address</span>
              </div>
              <div>
                {isAddressSelected && shippingAddress ? (
                  <div className='grid grid-cols-1 md:grid-cols-12    my-3  pb-3'>
                    <div className='col-span-5 flex text-lg font-bold '>
                      <span className='w-8'>1 </span>
                      <span>Shipping address</span>
                    </div>
                    <div className='col-span-5 '>
                      <p>
                        {shippingAddress.fullName} <br />
                        {shippingAddress.street} <br />
                        {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                      </p>
                    </div>
                    <div className='col-span-2'>
                      <Button
                        variant={'outline'}
                        onClick={() => {
                          setIsAddressSelected(false)
                          setIsPaymentMethodSelected(true)
                          setIsDeliveryDateSelected(true)
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='flex text-primary text-lg font-bold my-2'>
                      <span className='w-8'>1 </span>
                      <span>Enter shipping address</span>
                    </div>
                    <Form {...shippingAddressForm}>
                      <form
                        method='post'
                        onSubmit={shippingAddressForm.handleSubmit(
                          onSubmitShippingAddress
                        )}
                        className='space-y-4'
                      >
                        <Card className='md:ml-8 my-4'>
                          <CardContent className='p-4 space-y-2'>
                            <div className='text-lg font-bold mb-2'>
                              Your address
                            </div>

                            <div className='flex flex-col gap-5 md:flex-row'>
                              <FormField
                                control={shippingAddressForm.control}
                                name='fullName'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Enter full name'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div>
                              <FormField
                                control={shippingAddressForm.control}
                                name='street'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Enter address'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className='flex flex-col gap-5 md:flex-row'>
                              <FormField
                                control={shippingAddressForm.control}
                                name='city'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                      <Input placeholder='Enter city' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={shippingAddressForm.control}
                                name='province'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>Province</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Enter province'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={shippingAddressForm.control}
                                name='country'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>Country</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Enter country'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className='flex flex-col gap-5 md:flex-row'>
                              <FormField
                                control={shippingAddressForm.control}
                                name='postalCode'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>Postal Code</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Enter postal code'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={shippingAddressForm.control}
                                name='phone'
                                render={({ field }) => (
                                  <FormItem className='w-full'>
                                    <FormLabel>Phone number</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder='Enter phone number'
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                          <CardFooter className='  p-4'>
                            <Button
                              type='submit'
                              className='rounded-full font-bold'
                            >
                              Ship to this address
                            </Button>
                          </CardFooter>
                        </Card>
                      </form>
                    </Form>
                  </>
                )}
              </div>
            </div>
          )}
          {/* payment method */}
          <div className='border-y'>
            {isPaymentMethodSelected && paymentMethod ? (
              <div className='grid  grid-cols-1 md:grid-cols-12  my-3 pb-3'>
                <div className='flex text-lg font-bold  col-span-5'>
                  <span className='w-8'>2 </span>
                  <span>Payment Method</span>
                </div>
                <div className='col-span-5 '>
                  <p>{paymentMethod}</p>
                </div>
                <div className='col-span-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsPaymentMethodSelected(false)
                      if (paymentMethod) setIsDeliveryDateSelected(true)
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : isAddressSelected ? (
              <>
                <div className='flex text-primary text-lg font-bold my-2'>
                  <span className='w-8'>2 </span>
                  <span>Choose a payment method</span>
                </div>
                <Card className='md:ml-8 my-4'>
                  <CardContent className='p-4'>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value)}
                    >
                      {availablePaymentMethods.map((pm) => (
                        <div key={pm.name} className='flex items-center py-1 '>
                          <RadioGroupItem
                            value={pm.name}
                            id={`payment-${pm.name}`}
                          />
                          <Label
                            className='font-bold pl-2 cursor-pointer'
                            htmlFor={`payment-${pm.name}`}
                          >
                            {pm.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className='p-4'>
                    <Button
                      onClick={handleSelectPaymentMethod}
                      className='rounded-full font-bold'
                    >
                      Use this payment method
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>2 </span>
                <span>Choose a payment method</span>
              </div>
            )}
          </div>
          {/* items and delivery date */}
          <div>
            {isDeliveryDateSelected && deliveryDateIndex != undefined ? (
              <div className='grid  grid-cols-1 md:grid-cols-12  my-3 pb-3'>
                <div className='flex text-lg font-bold  col-span-5'>
                  <span className='w-8'>3 </span>
                  <span>Items and shipping</span>
                </div>
                <div className='col-span-5'>
                  <p>
                    Delivery date:{' '}
                    {
                      formatDateTime(
                        calculateFutureDate(
                          availableDeliveryDates[deliveryDateIndex]
                            .daysToDeliver
                        )
                      ).dateOnly
                    }
                  </p>
                  <ul>
                    {items.map((item, _index) => (
                      <li key={_index}>
                        {item.name} x {item.quantity} = {item.price}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='col-span-2'>
                  <Button
                    variant={'outline'}
                    onClick={() => {
                      setIsPaymentMethodSelected(true)
                      setIsDeliveryDateSelected(false)
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : isPaymentMethodSelected && isAddressSelected ? (
              <>
                <div className='flex text-primary  text-lg font-bold my-2'>
                  <span className='w-8'>3 </span>
                  <span>Review items and shipping</span>
                </div>
                <Card className='md:ml-8'>
                  <CardContent className='p-4'>
                    <p className='mb-2'>
                      <span className='text-lg font-bold text-green-700'>
                        Arriving{' '}
                        {
                          formatDateTime(
                            calculateFutureDate(
                              availableDeliveryDates[deliveryDateIndex!]
                                .daysToDeliver
                            )
                          ).dateOnly
                        }
                      </span>{' '}
                      If you order in the next {timeUntilMidnight().hours} hours
                      and {timeUntilMidnight().minutes} minutes.
                    </p>
                    <div className='grid md:grid-cols-2 gap-6'>
                      <div>
                        {items.map((item, _index) => (
                          <div key={_index} className='flex gap-4 py-2'>
                            <div className='relative w-16 h-16'>
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes='20vw'
                                style={{
                                  objectFit: 'contain',
                                }}
                              />
                            </div>

                            <div className='flex-1'>
                              <p className='font-semibold'>
                                {item.name}, {item.color}, {item.size}
                              </p>
                              <p className='font-bold'>
                                <ProductPrice price={item.price} plain />
                              </p>

                              <Select
                                value={item.quantity.toString()}
                                onValueChange={(value) => {
                                  if (value === '0') removeItem(item)
                                  else updateItem(item, Number(value))
                                }}
                              >
                                <SelectTrigger className='w-24'>
                                  <SelectValue>
                                    Qty: {item.quantity}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent position='popper'>
                                  {Array.from({
                                    length: item.countInStock,
                                  }).map((_, i) => (
                                    <SelectItem key={i + 1} value={`${i + 1}`}>
                                      {i + 1}
                                    </SelectItem>
                                  ))}
                                  <SelectItem key='delete' value='0'>
                                    Delete
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className=' font-bold'>
                          <p className='mb-2'> Choose a shipping speed:</p>

                          <ul>
                            <RadioGroup
                              value={
                                availableDeliveryDates[deliveryDateIndex!].name
                              }
                              onValueChange={(value) =>
                                setDeliveryDateIndex(
                                  availableDeliveryDates.findIndex(
                                    (address) => address.name === value
                                  )!
                                )
                              }
                            >
                              {availableDeliveryDates.map((dd) => (
                                <div key={dd.name} className='flex'>
                                  <RadioGroupItem
                                    value={dd.name}
                                    id={`address-${dd.name}`}
                                  />
                                  <Label
                                    className='pl-2 space-y-2 cursor-pointer'
                                    htmlFor={`address-${dd.name}`}
                                  >
                                    <div className='text-green-700 font-semibold'>
                                      {
                                        formatDateTime(
                                          calculateFutureDate(dd.daysToDeliver)
                                        ).dateOnly
                                      }
                                    </div>
                                    <div>
                                      {(dd.freeShippingMinPrice > 0 &&
                                      itemsPrice >= dd.freeShippingMinPrice
                                        ? 0
                                        : dd.shippingPrice) === 0 ? (
                                        'FREE Shipping'
                                      ) : (
                                        <ProductPrice
                                          price={dd.shippingPrice}
                                          plain
                                        />
                                      )}
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>3 </span>
                <span>Items and shipping</span>
              </div>
            )}
          </div>
          {isPaymentMethodSelected && isAddressSelected && (
            <div className='mt-6'>
              <div className='block md:hidden'>
                <CheckoutSummary />
              </div>

              <Card className='hidden md:block '>
                <CardContent className='p-4 flex flex-col md:flex-row justify-between items-center gap-3'>
                  <Button onClick={handlePlaceOrder} className='rounded-full'>
                    Place Your Order
                  </Button>
                  <div className='flex-1'>
                    <p className='font-bold text-lg'>
                      Order Total: <ProductPrice price={totalPrice} plain />
                    </p>
                    <p className='text-xs'>
                      {' '}
                      By placing your order, you agree to {
                        site.name
                      }&apos;s{' '}
                      <Link href='/page/privacy-policy'>privacy notice</Link>{' '}
                      and
                      <Link href='/page/conditions-of-use'>
                        {' '}
                        conditions of use
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <CheckoutFooter />
        </div>
        <div className='hidden md:block'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}
export default CheckoutForm
