const fs = require('fs');
const path = require('path');

// Create .env.production.example
const productionEnvContent = `# MongoDB
MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/database?retryWrites=true&w=majority

# Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Upload Thing (for file uploads)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Stripe (if using Stripe payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# PayPal (if using PayPal payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=production
`;

const scriptDir = path.dirname(__filename);
const rootDir = path.join(scriptDir, '..');
const prodEnvPath = path.join(rootDir, '.env.production.example');

fs.writeFileSync(prodEnvPath, productionEnvContent);
console.log(`Created ${prodEnvPath}`);

// Create .env.local.example
const localEnvContent = `# MongoDB
MONGODB_URI=mongodb://localhost:27017/multivendor

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Upload Thing (for file uploads)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Stripe (if using Stripe payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# PayPal (if using PayPal payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=sandbox
`;

const localEnvPath = path.join(rootDir, '.env.local.example');
fs.writeFileSync(localEnvPath, localEnvContent);
console.log(`Created ${localEnvPath}`);

console.log('Environment example files created successfully!'); 