'use client';

import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowRight, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatPrice } from '@/lib/utils';
import Image from 'next/image';
import styles from './success-ui.module.css';

interface SuccessUIProps {
  order: any;
  orderLink: string;
  deliveryDate: string;
  displayItems: any[];
  hasMoreItems: boolean;
  additionalItemsCount: number;
}

export default function SuccessUI({
  order,
  orderLink,
  deliveryDate,
  displayItems,
  hasMoreItems,
  additionalItemsCount
}: SuccessUIProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-green-50 border-b text-center pb-10 pt-10 relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${styles.bgPattern}`}></div>
            <div className="mx-auto bg-white rounded-full p-3 w-20 h-20 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-700">Payment Successful!</CardTitle>
            <p className="text-green-600 mt-2">
              Your order has been received and is now being processed
            </p>
          </CardHeader>
          
          <CardContent className="pt-8 pb-6 px-6 md:px-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-gray-500" />
                  Order Summary
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono">{order._id.toString().substring(0, 10)}...</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{formatDateTime(order.createdAt).dateTime}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                  
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600">Total Amount:</span>
                    <span>{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-gray-500" />
                    Delivery Information
                  </h3>
                  
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Estimated Delivery:</span> {deliveryDate}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your order will be delivered to the address you provided
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <Package className="mr-2 h-5 w-5 text-gray-500" />
                  Items in Your Order
                </h3>
                
                <div className="space-y-4">
                  {displayItems.map((item) => (
                    <div key={item.clientId} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 border">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} {item.size && `• Size: ${item.size}`} {item.color && `• ${item.color}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {hasMoreItems && (
                    <p className="text-sm text-gray-500 italic">
                      +{additionalItemsCount} more item{additionalItemsCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 px-6 py-6 md:px-10 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <p className="text-sm text-gray-600">
              Thank you for shopping with us!
            </p>
            
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/">
                  Continue Shopping
                </Link>
              </Button>
              
              <Button asChild className="gap-2">
                <Link href={orderLink}>
                  View Order Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>A confirmation email has been sent to your email address.</p>
          <p className="mt-1">
            If you have any questions, please{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact our support team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
} 