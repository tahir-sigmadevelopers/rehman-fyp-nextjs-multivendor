# Deployment Guide for Multi-Vendor E-commerce Platform

This guide will help you deploy your Multi-Vendor E-commerce Platform to various hosting platforms.

## Prerequisites

Before deployment, make sure you have:

1. A working application that builds successfully with `npm run build`
2. All environment variables ready for production
3. A Git repository with your code

## Environment Variables

You'll need to set up the following environment variables in your deployment environment:

```
# MongoDB
MONGODB_URI=

# Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=

# Email (Resend)
RESEND_API_KEY=

# Upload Thing (for file uploads)
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# Stripe (if using Stripe payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal (if using PayPal payments)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=production
```

## Deployment Options

### 1. Vercel (Recommended for Next.js)

Vercel is the platform built by the creators of Next.js and is the easiest way to deploy your Next.js application.

1. Sign up or log in to [Vercel](https://vercel.com)
2. Import your Git repository
3. Configure your project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add your environment variables in the Vercel dashboard
5. Deploy!

#### Automatic Deployments

Once connected to your repository, Vercel will automatically deploy when you push changes to your main branch.

### 2. AWS Amplify

AWS Amplify provides a Git-based workflow for deploying and hosting fullstack serverless applications.

1. Log in to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)
2. Connect your repository
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
4. Add your environment variables in the Amplify Console
5. Deploy!

### 3. Netlify

Netlify is another great option for hosting your Next.js application.

1. Sign up or log in to [Netlify](https://netlify.com)
2. Import your Git repository
3. Configure your build settings:
   - Build Command: `npm run build`
   - Publish Directory: `.next`
4. Add your environment variables in the Netlify dashboard
5. Deploy!

## Production Considerations

1. **Database Connection**: Ensure your MongoDB connection string uses a production database
2. **Performance**: Consider using a MongoDB Atlas cluster for better performance
3. **Scaling**: For high-traffic sites, consider setting up a caching layer
4. **Monitoring**: Set up monitoring tools like Sentry or LogRocket to track errors
5. **Analytics**: Implement analytics to track user behavior

## Troubleshooting

If you encounter any issues during deployment:

1. Check the build logs for any errors
2. Verify that all environment variables are set correctly
3. Make sure your database is accessible from your hosting provider
4. Check for any version compatibility issues between packages

## Post-Deployment

After successful deployment:

1. Set up your custom domain
2. Configure SSL certificates
3. Test the application thoroughly in the production environment
4. Set up monitoring and alerting
5. Regularly back up your database 