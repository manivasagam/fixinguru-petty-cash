# Deployment Guide for Vercel

## Prerequisites

1. **GitHub Account**: Ensure your code is pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL Database**: Set up a production database (recommend Neon, Supabase, or Railway)

## Step-by-Step Deployment

### 1. Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Fixinguru Petty Cash System"
   git branch -M main
   git remote add origin https://github.com/yourusername/fixinguru-petty-cash.git
   git push -u origin main
   ```

### 2. Database Setup

1. **Create Production Database**:
   - Sign up for [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   - Create a new PostgreSQL database
   - Get your connection string (DATABASE_URL)

2. **Apply Database Schema**:
   ```bash
   # Set your DATABASE_URL environment variable
   export DATABASE_URL="postgresql://..."
   
   # Push schema to production database
   npm run db:push
   ```

### 3. Deploy to Vercel

1. **Import Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   In the Vercel dashboard, add these environment variables:

   ```env
   DATABASE_URL=postgresql://your-connection-string
   SESSION_SECRET=generate-a-secure-random-string
   REPLIT_DOMAINS=your-app-name.vercel.app
   ISSUER_URL=https://replit.com/oidc
   REPL_ID=your-repl-id-from-replit
   NODE_ENV=production
   ```

3. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### 4. Authentication Setup

1. **Update Replit Auth**:
   - Go to your Replit project settings
   - Update the allowed domains to include your Vercel domain
   - Add your Vercel URL as a callback URL

2. **Test Authentication**:
   - Visit your deployed app
   - Try logging in with your Replit account

### 5. File Upload Configuration

**Important**: Vercel's serverless functions have limitations for file uploads. For production use, consider:

1. **Use Vercel Blob Storage**:
   ```bash
   npm install @vercel/blob
   ```

2. **Or integrate with Cloudinary/AWS S3**:
   - Set up external file storage service
   - Update the upload handlers in your code

### 6. Post-Deployment Checklist

- [ ] Database connection works
- [ ] Authentication flow works
- [ ] File uploads work (or external storage configured)
- [ ] All API endpoints respond correctly
- [ ] Environment variables are set correctly
- [ ] SSL certificate is active
- [ ] Custom domain configured (if needed)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | `super-secret-key-123` |
| `REPLIT_DOMAINS` | Allowed domains for auth | `myapp.vercel.app` |
| `ISSUER_URL` | OpenID Connect issuer | `https://replit.com/oidc` |
| `REPL_ID` | Your Replit project ID | `your-repl-id` |
| `NODE_ENV` | Environment mode | `production` |

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Verify DATABASE_URL is correct
   - Ensure database allows external connections
   - Check if schema is applied (`npm run db:push`)

2. **Authentication Not Working**:
   - Verify REPLIT_DOMAINS matches your Vercel domain
   - Check REPL_ID is correct
   - Ensure callback URLs are configured in Replit

3. **File Uploads Not Working**:
   - Vercel serverless functions have 50MB limit
   - Consider using Vercel Blob or external storage
   - Check file upload paths and permissions

4. **Build Failures**:
   - Check that all dependencies are in package.json
   - Verify TypeScript compilation succeeds
   - Ensure environment variables are set during build

### Performance Optimization

1. **Database Connection Pooling**:
   - Use connection pooling for better performance
   - Consider PgBouncer for high-traffic applications

2. **Static Asset Optimization**:
   - Images are automatically optimized by Vercel
   - Use Vercel's built-in CDN for static assets

3. **Caching**:
   - Implement appropriate caching headers
   - Use Vercel's edge caching where possible

## Monitoring

1. **Vercel Analytics**:
   - Enable Vercel Analytics in your dashboard
   - Monitor performance and usage

2. **Error Tracking**:
   - Consider integrating Sentry or similar
   - Monitor application logs via Vercel dashboard

3. **Database Monitoring**:
   - Use your database provider's monitoring tools
   - Set up alerts for connection limits and performance

## Custom Domain (Optional)

1. **Add Custom Domain**:
   - Go to your Vercel project settings
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Environment Variables**:
   - Update `REPLIT_DOMAINS` to include your custom domain
   - Update Replit auth settings

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Replit Auth Guide**: [docs.replit.com](https://docs.replit.com)
- **Database Issues**: Check your database provider's documentation