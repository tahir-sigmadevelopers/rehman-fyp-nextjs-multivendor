const { connectToDatabase } = require('../lib/db');
const WebPage = require('../lib/db/models/web-page.model').default;

const webPages = [
  {
    title: 'About Us',
    slug: 'about-us',
    content: `# About Us

Welcome to our online marketplace, where quality meets convenience. Established with a vision to transform the online shopping experience, we've grown into a platform that connects customers with a diverse range of products from trusted vendors around the world.

## Our Story

Founded in 2023, our journey began with a simple idea: create an online space where shoppers can find quality products from multiple vendors in one place. What started as a small team with big dreams has evolved into a thriving marketplace with thousands of products and a growing community of vendors and customers.

## Our Mission

We're committed to providing a seamless shopping experience by:

- Curating high-quality products from trusted vendors
- Ensuring secure and convenient transactions
- Supporting small businesses and independent sellers
- Prioritizing customer satisfaction at every step

## Our Team

Behind our platform is a dedicated team of professionals passionate about e-commerce, technology, and customer service. From our developers who maintain the website to our customer support specialists who assist with inquiries, every team member plays a vital role in delivering the best possible experience.

## Join Our Community

Whether you're a shopper looking for quality products or a vendor interested in expanding your reach, we invite you to join our growing community. Together, we're redefining the online shopping experience one transaction at a time.

Thank you for choosing us as your shopping destination!`,
    isPublished: true
  },
  {
    title: 'Customer Service',
    slug: 'customer-service',
    content: `# Customer Service

At our marketplace, we're committed to providing exceptional customer service. Our dedicated team is here to assist you with any questions, concerns, or issues you may encounter while shopping with us.

## Contact Information

- **Email:** support@example.com
- **Phone:** +1 (123) 456-7890
- **Hours:** Monday to Friday, 9:00 AM - 6:00 PM EST

## Frequently Asked Questions

### Orders and Shipping

**How can I track my order?**
You can track your order by logging into your account and visiting the "My Orders" section. There, you'll find tracking information for all your recent purchases.

**What is your shipping policy?**
We offer standard and express shipping options. Delivery times vary depending on your location and the shipping method selected at checkout. For more details, please visit our [Shipping Policy](/page/shipping) page.

### Returns and Refunds

**How do I return an item?**
If you're not satisfied with your purchase, you can initiate a return within 30 days of delivery. Visit the "My Orders" section in your account, select the order containing the item you wish to return, and follow the return instructions.

**What is your refund policy?**
Refunds are processed within 5-7 business days after we receive and inspect the returned item. For complete information, please refer to our [Returns Policy](/page/returns-policy) page.

### Account Management

**How do I reset my password?**
If you've forgotten your password, click on the "Forgot Password" link on the sign-in page and follow the instructions sent to your registered email address.

**How can I update my account information?**
Log into your account, navigate to the "Account Settings" section, and update your personal information, shipping addresses, and payment methods as needed.

## Additional Support

For any other questions or concerns not addressed above, please don't hesitate to contact our customer service team. We're here to help ensure your shopping experience is as smooth and enjoyable as possible.`,
    isPublished: true
  },
  {
    title: 'Help',
    slug: 'help',
    content: `# Help Center

Welcome to our Help Center! Here, you'll find information and resources to assist you with navigating our marketplace, making purchases, managing your account, and more.

## Getting Started

### Creating an Account

To create an account:
1. Click on the "Sign Up" button in the top right corner of the homepage
2. Enter your email address and create a password
3. Fill in your personal information
4. Verify your email address by clicking the link sent to your inbox

### Browsing Products

You can browse products by:
- Using the search bar to find specific items
- Exploring categories in the navigation menu
- Checking out featured collections on the homepage
- Viewing recommended products based on your browsing history

### Making a Purchase

To make a purchase:
1. Add items to your cart by clicking the "Add to Cart" button on product pages
2. Review your cart by clicking the cart icon in the top right corner
3. Proceed to checkout when you're ready to complete your purchase
4. Enter your shipping and payment information
5. Review your order and click "Place Order"

## Account Management

### Managing Your Profile

In your account settings, you can:
- Update your personal information
- Change your password
- Add or edit shipping addresses
- Manage payment methods
- View your order history

### Tracking Orders

To track an order:
1. Log into your account
2. Navigate to "My Orders"
3. Select the order you want to track
4. View the current status and shipping information

## Troubleshooting

### Payment Issues

If you encounter payment problems:
- Verify that your payment information is correct
- Check that your card has sufficient funds
- Ensure your billing address matches the address on file with your payment provider
- Try an alternative payment method

### Technical Difficulties

If you experience technical issues:
- Clear your browser cache and cookies
- Try using a different browser
- Disable browser extensions that might interfere with the site
- Contact our technical support team if problems persist

## Contact Support

If you need additional assistance, our customer service team is ready to help:
- **Email:** support@example.com
- **Phone:** +1 (123) 456-7890
- **Hours:** Monday to Friday, 9:00 AM - 6:00 PM EST`,
    isPublished: true
  }
];

async function createWebPages() {
  try {
    await connectToDatabase();
    
    console.log('Connected to database. Creating web pages...');
    
    for (const pageData of webPages) {
      // Check if the page already exists
      const existingPage = await WebPage.findOne({ slug: pageData.slug });
      
      if (existingPage) {
        console.log(`Page "${pageData.title}" already exists. Skipping...`);
        continue;
      }
      
      // Create the page
      await WebPage.create(pageData);
      console.log(`Created "${pageData.title}" page successfully!`);
    }
    
    console.log('All pages created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating web pages:', error);
    process.exit(1);
  }
}

createWebPages(); 