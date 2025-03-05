# Deployment Guide for Next.js Application

This guide provides instructions for deploying your Next.js application to various platforms.

## Option 1: Deploy to Vercel (Recommended)

Vercel is the platform created by the team behind Next.js and offers the most seamless deployment experience.

### Steps:

1. Create a GitHub repository for your project (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repository.git
   git push -u origin main
   ```

2. Sign up for a free account on [Vercel](https://vercel.com)

3. Once logged in, click "Import Project" and select "Import Git Repository"

4. Select your GitHub account and the repository containing your Next.js app

5. Configure your project:
   - Framework Preset: Next.js
   - Environment Variables: Add any environment variables your app needs
   - Build and Output Settings: Default settings should work fine

6. Click "Deploy"

That's it! Vercel will automatically build and deploy your application. You'll receive a unique URL where your app is accessible.

## Option 2: Deploy to Netlify

Netlify is another excellent option for hosting Next.js applications.

### Steps:

1. Create a GitHub repository as described above

2. Sign up for a free account on [Netlify](https://netlify.com)

3. Click "New site from Git" and select GitHub

4. Select your repository

5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

6. Click "Deploy site"

## Option 3: Deploy to GitHub Pages

For GitHub Pages, you need some additional configuration since it's designed for static sites.

### Steps:

1. Install the gh-pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add these scripts to your package.json:
   ```json
   "scripts": {
     "build": "next build",
     "export": "next build && next export",
     "deploy": "npm run export && gh-pages -d out"
   }
   ```

3. Create a file called `next.config.js` in your project root (if it doesn't already exist):
   ```javascript
   module.exports = {
     basePath: '/your-repository-name',
     assetPrefix: '/your-repository-name/',
   }
   ```

4. Run the deploy command:
   ```bash
   npm run deploy
   ```

5. Go to your GitHub repository settings, navigate to "Pages" and ensure it's set to use the gh-pages branch.

## Option 4: Deploy to AWS Amplify

AWS Amplify provides a simple way to deploy and host Next.js applications.

### Steps:

1. Create a GitHub repository as described above

2. Sign up for an AWS account and navigate to the Amplify Console

3. Click "Connect app" and select GitHub

4. Choose your repository and branch

5. Configure build settings:
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

6. Click "Save and deploy"

## Notes for Production Deployment

Regardless of which platform you choose, make sure to:

1. Add environment variables for production (API keys, secrets, etc.)
2. Set up custom domains if needed
3. Configure SSL certificates
4. Set up CI/CD pipelines for automated deployments

For your specific airtime application, ensure that:

1. The API endpoint for your airtime service is accessible from your deployed application
2. Any rate-limiting functionality works correctly in production
3. Environment variables are properly configured for production use
