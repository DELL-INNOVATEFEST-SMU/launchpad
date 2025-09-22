# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google AI API
# Get from Google AI Studio
GOOGLE_API_KEY=your_google_api_key_here

# Jina AI API
# Get from Jina AI platform
JINA_API_KEY=your_jina_api_key_here
```

## Security Notes

### Public Variables (NEXT*PUBLIC*\*)

- These are safe to expose to the client-side code
- Can be used in browser JavaScript
- The anon key has limited permissions based on your RLS policies

### Private Variables (no NEXT*PUBLIC* prefix)

- These are server-side only and should NEVER be exposed to the client
- Used in API routes and server actions only
- The service role key has full database access

## Key Differences

### Before (Insecure)

- Service key was being used in frontend code
- All database operations happened client-side
- Security risk if the key was exposed

### After (Secure)

- Service key only used in server-side API routes
- Frontend uses proper anon key or API routes
- Database access is controlled and secure

## Database Security Setup

In your Supabase dashboard, ensure you have proper Row Level Security (RLS) policies:

```sql
-- Option 1: Disable RLS if this is public data
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with anonymous read access
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to messages" ON messages
FOR SELECT USING (true);
```

## Getting Your Keys

1. **Supabase Keys**: Go to your Supabase project → Settings → API
2. **Google AI Key**: Visit [Google AI Studio](https://aistudio.google.com/)
3. **Jina AI Key**: Visit [Jina AI Platform](https://jina.ai/)

## Troubleshooting

- Make sure `.env.local` is in your `.gitignore` file
- Restart your development server after adding new environment variables
- Check that all required variables are set before deploying
