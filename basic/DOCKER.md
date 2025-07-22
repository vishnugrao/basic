# Docker Setup

This project includes Docker and Docker Compose configurations for both development and production environments with nginx reverse proxy.

## Files Overview

- `Dockerfile` - Production-ready multi-stage build with environment variables
- `Dockerfile.dev` - Development-focused build with hot reloading
- `docker-compose.yml` - Production configuration with nginx and Supabase
- `docker-compose.dev.yml` - Development configuration with additional services
- `nginx.conf` - Nginx reverse proxy configuration
- `init.sql` - Database initialization script (for development only)

## Prerequisites

- Docker Desktop installed
- Docker Compose V2
- Supabase project setup with database

## Environment Variables

Create a `.env.local` file in the project root with these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key

# Node Environment
NODE_ENV=production
```

## Production Setup

The production setup uses:
- **Nginx** as reverse proxy with rate limiting and security headers
- **Next.js app** running in a container with Supabase database
- **No local PostgreSQL** - relies on Supabase cloud database

1. **Create environment file**:
   ```bash
   # Create .env.local with your actual values (see Environment Variables section above)
   ```

2. **Start production environment**:
   ```bash
   docker-compose up --build -d
   ```

3. **Access services**:
   - Application: http://localhost (port 80)
   - Health check: http://localhost/health

4. **Stop services**:
   ```bash
   docker-compose down
   ```

## Development Setup

1. **Create environment file**:
   ```bash
   # Create .env.local with your development values
   ```

2. **Start development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access services**:
   - Next.js app: http://localhost:3000
   - PostgreSQL (local dev): localhost:5433
   - Adminer (DB admin): http://localhost:8080

4. **Stop services**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## Nginx Configuration

The nginx reverse proxy provides:

- **Load balancing** to Next.js backend
- **Rate limiting** (API: 10 req/s, Login: 5 req/min)
- **Security headers** (X-Frame-Options, X-XSS-Protection, etc.)
- **Static file caching** with long-term cache headers
- **Extended timeouts** for API calls (especially OpenAI)
- **Health check endpoint** at `/health`
- **Protection** against access to sensitive files

### Nginx Features:
- Gzip compression for better performance
- Request timeout handling
- Security-focused configuration
- Proper proxy headers for client IP forwarding

## Database Configuration

### Production
- Uses **Supabase** cloud database
- No local PostgreSQL required
- Configure connection via environment variables

### Development  
- Includes local PostgreSQL for development
- Adminer interface for database management
- Uses separate database name for dev environment

## Useful Commands

```bash
# Build without cache
docker-compose build --no-cache

# View logs for specific service
docker-compose logs -f web
docker-compose logs -f nginx

# Execute commands in running container
docker-compose exec web sh
docker-compose exec nginx sh

# Reset development environment
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build

# Check nginx configuration
docker-compose exec nginx nginx -t

# Reload nginx configuration
docker-compose exec nginx nginx -s reload
```

## Troubleshooting

### Port conflicts
If you get port conflicts, change the port mappings in the docker-compose files.

### Environment variable issues
- Ensure all required environment variables are set in `.env.local`
- Check that Supabase URL and keys are correct
- Verify Stripe and OpenAI API keys are valid

### Nginx issues
- Check nginx logs: `docker-compose logs nginx`
- Validate configuration: `docker-compose exec nginx nginx -t`
- Ensure web service is running before nginx starts

### Build issues
- Clear Docker cache: `docker system prune -a`
- Rebuild without cache: `docker-compose build --no-cache`
- Check environment variables are properly set during build

### Database connection issues
- Verify Supabase connection details
- Check that Supabase project is active
- Ensure network connectivity to Supabase

## Security Notes

- Environment variables contain sensitive information - never commit `.env.local`
- Nginx configuration includes security headers and rate limiting
- Sensitive files are blocked from external access
- Use HTTPS in production (configure SSL certificates in nginx)

## Production Deployment

For production deployment:

1. Set up SSL certificates in nginx configuration
2. Update `server_name` in nginx.conf to your domain
3. Configure proper DNS records
4. Set production environment variables
5. Consider using Docker Swarm or Kubernetes for scaling

Make sure to add `.env.local` to your `.gitignore` file. 