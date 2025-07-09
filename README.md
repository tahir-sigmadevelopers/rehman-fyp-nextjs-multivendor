# Multi-Vendor E-Commerce Website

|                |                                  |
| -------------- | -------------------------------- |
| Framework      | Next.js 15, React 19             |
| UI             | Tailwind, Shadcn, Recharts       |
| Database       | MongoDB, Mongoose                |
| Payment        | Stripe                           |
| Deployment     | Github, Vercel                   |
| Authentication | Auth.js, Google Auth, Magic Link |
| Others         | uploadthing, resend, zod, etc    |

## About

This is a multi-vendor e-commerce platform built with Next.js 15 and MongoDB, developed by Rehman Ahmed.

## Features

- Complete e-commerce website with modern UI using Next.js server components
- Multi-vendor support allowing sellers to register and manage their products
- Responsive design with Shadcn UI and Tailwind CSS
- MongoDB database with Mongoose models
- Form handling with react-hook-forms and zod data validator
- Server actions for data updates without API endpoints
- Shopping cart management using HTTP cookies
- Authentication and authorization with Auth.js
- Customer dashboard for profile management and order tracking
- Vendor dashboard for product and order management
- Admin dashboard with charts, product, order and user management
- Multi-language support
- Stripe payment integration

## Run Locally

1. Clone repo

   ```shell
    $ git clone https://github.com/tahir-sigmadevelopers/multi-vendor-ecommerce.git
    $ cd multi-vendor-ecommerce
   ```

2. Create Env File

   - Duplicate .example-env and rename it to .env.local

3. Setup MongoDB

   - Cloud MongoDB
     - Create database at https://mongodb.com/
     - In .env.local file update MONGODB_URI to db url
   - OR Local MongoDB
     - Install it from https://www.MongoDB.org/download
     - In .env.local file update MONGODB_URI to db url

4. Seed Data

   ```shell
     npm run seed
   ```

5. Install and Run

   ```shell
     npm install
     npm run dev
   ```

6. Admin Login

   - Open http://localhost:3000
   - Click Sign In button
   - Enter admin email "admin@example.com" and password "123456" and click Sign In

## Contact

Rehman Ahmed : contact.to.ahmadirfan@gmail.com
