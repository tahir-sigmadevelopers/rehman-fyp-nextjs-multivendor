import { connectToDatabase } from '@/lib/db'
import Setting from '@/lib/db/models/setting.model'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized access
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    
    if (secret !== 'your-secret-key') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    
    // Get the current settings
    const settings = await Setting.findOne()
    
    return NextResponse.json({
      success: true,
      settings: settings ? JSON.parse(JSON.stringify(settings)) : null
    })
  } catch (error) {
    console.error('Error getting settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get settings', error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized access
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    
    if (secret !== 'your-secret-key') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    
    console.log('Updating site name to TradeBiz');
    
    // Drop the existing settings to ensure fresh ones
    const dropResult = await Setting.collection.drop().catch(err => {
      // Collection might not exist yet, which is OK
      console.log('Collection drop error (might be ok):', err.message);
      return { acknowledged: false, reason: err.message };
    });
    
    console.log('Drop result:', dropResult);
    
    // Create fresh settings with TradeBiz name
    const newSettings = {
      common: {
        freeShippingMinPrice: 35,
        isMaintenanceMode: false,
        defaultTheme: 'Light',
        defaultColor: 'Gold',
        pageSize: 9,
      },
      site: {
        name: 'TradeBiz',
        description: 'TradeBiz is a sample Ecommerce website built with Next.js, Tailwind CSS, and MongoDB.',
        keywords: 'Next Ecommerce, Next.js, Tailwind CSS, MongoDB',
        url: 'https://next-mongo-ecommerce-final.vercel.app',
        logo: '/icons/logo.svg',
        slogan: 'Spend less, enjoy more.',
        author: 'Next Ecommerce',
        copyright: '2000-2024, Next-Ecommerce.com, Inc. or its affiliates',
        email: 'admin@example.com',
        address: '123, Main Street, Anytown, CA, Zip 12345',
        phone: '+1 (123) 456-7890',
      },
      availableLanguages: [
        { code: 'en-US', name: 'English' },
        { code: 'ar', name: 'العربية' },
        { code: 'fr', name: 'Français' }
      ],
      defaultLanguage: 'en-US',
      availableCurrencies: [
        { name: 'United States Dollar', code: 'USD', symbol: '$', convertRate: 1 },
        { name: 'Euro', code: 'EUR', symbol: '€', convertRate: 0.96 },
        { name: 'UAE Dirham', code: 'AED', symbol: 'AED', convertRate: 3.67 }
      ],
      defaultCurrency: 'USD',
      availablePaymentMethods: [
        { name: 'PayPal', commission: 0 },
        { name: 'Stripe', commission: 0 },
        { name: 'Cash On Delivery', commission: 0 }
      ],
      defaultPaymentMethod: 'PayPal',
      availableDeliveryDates: [
        { name: 'Tomorrow', daysToDeliver: 1, shippingPrice: 12.9, freeShippingMinPrice: 0 },
        { name: 'Next 3 Days', daysToDeliver: 3, shippingPrice: 6.9, freeShippingMinPrice: 0 },
        { name: 'Next 5 Days', daysToDeliver: 5, shippingPrice: 4.9, freeShippingMinPrice: 35 }
      ],
      defaultDeliveryDate: 'Next 5 Days',
      carousels: [
        {
          title: 'Most Popular Shoes For Sale',
          buttonCaption: 'Shop Now',
          image: '/images/banner3.jpg',
          url: '/search?category=Shoes'
        },
        {
          title: 'Best Sellers in T-Shirts',
          buttonCaption: 'Shop Now',
          image: '/images/banner1.jpg',
          url: '/search?category=T-Shirts'
        },
        {
          title: 'Best Deals on Wrist Watches',
          buttonCaption: 'See More',
          image: '/images/banner2.jpg',
          url: '/search?category=Wrist Watches'
        }
      ]
    };
    
    // Create new settings
    const createdSettings = await Setting.create(newSettings);
    console.log('Created new settings with site name:', createdSettings.site.name);
    
    // Clear cached settings in the global object
    const globalForSettings = global as any
    if (globalForSettings.cachedSettings) {
      globalForSettings.cachedSettings = null
      console.log('Cleared cached settings');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Site name updated to TradeBiz',
      settings: JSON.parse(JSON.stringify(createdSettings))
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update settings', error: String(error) },
      { status: 500 }
    )
  }
} 