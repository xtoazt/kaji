# Kaji Deployment Guide

## Vercel Deployment

Kaji has been configured for deployment on Vercel with the following structure:

### Project Structure
```
kaji/
├── api/                    # Vercel serverless functions
│   └── index.ts           # Main API handler
├── client/                # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── src/                   # Shared backend code
│   ├── database/
│   ├── server/
│   ├── services/
│   └── utils/
├── vercel.json           # Vercel configuration
└── package.json
```

### Environment Variables

Set these environment variables in your Vercel dashboard:

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_qLXwtgO1C7my@ep-calm-sky-adid046v-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# OpenRouter API Configuration
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Server Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ChromeOS Research Configuration
CHROMEOS_UPDATE_CHECK_INTERVAL=24
EXPLOIT_VALIDATION_ENABLED=true
AUTO_UPDATE_ENABLED=true

# Security Configuration
CORS_ORIGIN=https://your-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend Configuration
REACT_APP_API_URL=/api/v1
```

### Deployment Steps

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/your-username/kaji.git
   cd kaji
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Set Environment Variables**
   - In your Vercel dashboard, go to Settings > Environment Variables
   - Add all the environment variables listed above
   - Make sure to use a strong JWT_SECRET for production

4. **Deploy**
   - Vercel will automatically build and deploy your application
   - The build process will:
     - Install dependencies for both backend and frontend
     - Build the React frontend
     - Set up the serverless API functions

### API Endpoints

Once deployed, your API will be available at:
- `https://your-domain.vercel.app/api/v1/exploits`
- `https://your-domain.vercel.app/api/v1/chat`
- `https://your-domain.vercel.app/api/v1/reports`
- `https://your-domain.vercel.app/api/v1/users`
- `https://your-domain.vercel.app/api/v1/admin`
- `https://your-domain.vercel.app/api/v1/versions`

### Database Setup

The application will automatically:
1. Connect to your Neon PostgreSQL database
2. Initialize the database schema
3. Seed the database with historical ChromeOS versions
4. Add initial exploit data from the referenced repositories

### Features Included

✅ **Historical ChromeOS Versions**: Support for versions from 2018-2024
✅ **Existing Exploits**: Pre-populated with exploits from:
   - [Corellium Exploits](https://github.com/Burvyn/Corellium/tree/main/Exploits%20and%20Tools)
   - [ext-remover](https://github.com/3kh0/ext-remover)

✅ **AI Integration**: OpenRouter GPT-OSS API for vulnerability analysis
✅ **User Management**: Authentication and role-based access
✅ **Exploit Database**: Comprehensive vulnerability tracking
✅ **Chat Interface**: AI-powered security research assistant
✅ **Reporting System**: User feedback and validation

### Limitations on Vercel

- **Cron Jobs**: Disabled (serverless functions don't support persistent cron jobs)
- **File System**: Limited to temporary files
- **Execution Time**: 30-second limit per function call
- **Memory**: Limited to 1GB per function

### Custom Domain

To use a custom domain:
1. Go to your Vercel project settings
2. Add your domain in the Domains section
3. Update the CORS_ORIGIN environment variable
4. Configure DNS records as instructed by Vercel

### Monitoring

Monitor your deployment:
- **Vercel Dashboard**: View deployment status and logs
- **Function Logs**: Check API function execution logs
- **Database Logs**: Monitor Neon database performance
- **Error Tracking**: Built-in error handling and logging

### Troubleshooting

**Build Failures:**
- Check that all environment variables are set
- Verify database connection string is correct
- Ensure OpenRouter API key is valid

**Runtime Errors:**
- Check function logs in Vercel dashboard
- Verify database schema initialization
- Test API endpoints individually

**Database Issues:**
- Ensure Neon database is accessible
- Check connection string format
- Verify SSL requirements

### Security Considerations

- Use strong JWT secrets in production
- Enable HTTPS (automatic on Vercel)
- Configure CORS properly
- Monitor API usage and rate limits
- Regularly update dependencies

### Performance Optimization

- Database connection pooling is optimized for serverless
- Static assets are served from Vercel's CDN
- API responses are cached where appropriate
- Frontend is optimized with React best practices
