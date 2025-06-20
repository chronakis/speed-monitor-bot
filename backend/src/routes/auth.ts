import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// Sign up with email and password
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  try {
    console.log('🚀 Starting signup process for:', email);
    console.log('📧 Email redirect URL:', `${process.env.FRONTEND_URL}/auth/callback`);
    console.log('🔧 FRONTEND_URL env var:', process.env.FRONTEND_URL);
    console.log('🌐 All relevant env vars:', {
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL?.substring(0, 30) + '...'
    });
    
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });

    console.log('📡 Supabase signUp completed. Error:', error ? error.message : 'none');

    if (error) {
      console.error('❌ Supabase signUp error:', error);
      throw createError(error.message, 400);
    }

    console.log('Supabase signUp response:', {
      user: data.user ? { 
        id: data.user.id, 
        email: data.user.email, 
        confirmed: data.user.email_confirmed_at,
        role: data.user.role 
      } : null,
      session: data.session ? 'exists' : 'null'
    });

    if (data.user) {
      console.log('User data received:', {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
        created_at: data.user.created_at
      });

      // If user has confirmed email, create preferences immediately
      if (data.user.email_confirmed_at) {
        console.log('User email is confirmed, creating user preferences...');
        const { error: insertError } = await supabaseAdmin
          .from('user_preferences')
          .insert({
            user_id: data.user.id,
            full_name: fullName || '',
            email: data.user.email || email,
            email_notifications: true,
            default_api_source: 'builtin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating user preferences:', insertError);
          throw createError(`PREFERENCES ERROR: ${insertError.message}`, 500);
        }
      } else {
        console.log('✅ User created but email not confirmed yet. User preferences will be created after email confirmation.');
      }
    } else {
      console.log('❌ No user returned from signUp - this might indicate an error or email confirmation required');
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at !== null
      }
    });
  } catch (error: any) {
    throw createError(error.message || 'Registration failed', 500);
  }
}));

// Sign in with email and password
router.post('/signin', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw createError(error.message, 401);
    }

    if (!data.user) {
      throw createError('Authentication failed', 401);
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null,
        lastSignIn: data.user.last_sign_in_at
      },
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at
      }
    });
  } catch (error: any) {
    throw createError(error.message || 'Login failed', 500);
  }
}));

// Sign in with Google (OAuth)
router.post('/google', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });

    if (error) {
      throw createError(error.message, 400);
    }

    res.json({
      success: true,
      url: data.url,
      message: 'Redirect to Google for authentication'
    });
  } catch (error: any) {
    throw createError(error.message || 'Google authentication failed', 500);
  }
}));

// Handle OAuth and email verification callback
router.get('/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=No authorization code received`);
  }

  try {
    const { data, error: exchangeError } = await supabaseAdmin.auth.exchangeCodeForSession(code as string);

    if (exchangeError) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(exchangeError.message)}`);
    }

    // If we have a user and session, this might be email verification
    if (data.user && data.session) {
      console.log('Processing callback for user:', {
        id: data.user.id,
        email: data.user.email,
        confirmed: data.user.email_confirmed_at,
        provider: data.user.app_metadata?.provider
      });

      // Check if user_preferences already exists
      const { data: existingPrefs, error: prefsCheckError } = await supabaseAdmin
        .from('user_preferences')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();

      if (prefsCheckError && prefsCheckError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking user preferences:', prefsCheckError);
      }

      // Create user preferences if they don't exist and user is confirmed
      if (!existingPrefs && data.user.email_confirmed_at) {
        console.log('Creating user preferences for confirmed user...');
        const { error: insertError } = await supabaseAdmin
          .from('user_preferences')
          .insert({
            user_id: data.user.id,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
            email: data.user.email || '',
            email_notifications: true,
            default_api_source: 'builtin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating user preferences in callback:', insertError);
          return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Failed to complete account setup')}`);
        }
        
        console.log('User preferences created successfully for:', data.user.email);
      }
    }

    // Set session cookies or redirect with tokens
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${data.session?.access_token}&refresh=${data.session?.refresh_token}`);
  } catch (error: any) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
}));

// Sign out
router.post('/signout', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('No authorization token provided', 401);
  }

  const token = authHeader.substring(7);

  try {
    // First verify the token by getting the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw createError('Invalid token', 401);
    }

    // For Supabase, client-side logout is handled by removing the token
    // Server-side we just confirm the operation
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    throw createError(error.message || 'Logout failed', 500);
  }
}));

// Get current user
router.get('/user', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('No authorization token provided', 401);
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      throw createError(error.message, 401);
    }

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || '',
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        provider: user.app_metadata?.provider
      }
    });
  } catch (error: any) {
    throw createError(error.message || 'Failed to get user', 500);
  }
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token is required', 400);
  }

  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw createError(error.message, 401);
    }

    res.json({
      success: true,
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at
      }
    });
  } catch (error: any) {
    throw createError(error.message || 'Token refresh failed', 500);
  }
}));

// Reset password
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw createError('Email is required', 400);
  }

  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`
    });

    if (error) {
      throw createError(error.message, 400);
    }

    res.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    });
  } catch (error: any) {
    throw createError(error.message || 'Password reset failed', 500);
  }
}));

// Handle OAuth user creation - call this after successful OAuth
router.post('/oauth-user', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError('No authorization token provided', 401);
  }

  const token = authHeader.substring(7);

  try {
    // Get user from Supabase using the token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw createError('Invalid token or user not found', 401);
    }

    // Check if user_preferences already exists
    const { data: existingPrefs, error: checkError } = await supabaseAdmin
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw createError('Error checking user preferences', 500);
    }

    // If user preferences don't exist, create them
    if (!existingPrefs) {
      const { error: insertError } = await supabaseAdmin
        .from('user_preferences')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email,
          email_notifications: true,
          default_api_source: 'builtin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw createError(`Error creating user preferences: ${insertError.message}`, 500);
      }
    }

    res.json({
      success: true,
      message: 'OAuth user setup completed',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        provider: user.app_metadata?.provider
      }
    });
  } catch (error: any) {
    throw createError(error.message || 'OAuth user setup failed', 500);
  }
}));

export default router; 