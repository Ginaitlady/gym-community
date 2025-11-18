import { supabase } from '../lib/supabase';

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'member' | 'trainer' | 'admin';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  user?: T;
  errors?: Array<{ msg: string; param: string }>;
}

export interface SignInData {
  email: string;
  password: string;
}

export const api = {
  async signUp(data: SignUpData): Promise<ApiResponse> {
    try {
      console.log('🔵 Sign Up Attempt:', { email: data.email, hasPassword: !!data.password });
      
      // Check Supabase connection
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase not configured:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
        return {
          success: false,
          message: 'Supabase is not configured. Please check your .env file.',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedEmail = data.email.trim().toLowerCase();
      
      if (!emailRegex.test(normalizedEmail)) {
        console.error('❌ Invalid email format:', normalizedEmail);
        return {
          success: false,
          message: 'Please enter a valid email address',
          errors: [{ param: 'email', msg: 'Invalid email format' }],
        };
      }

      // First, sign up the user with Supabase Auth
      console.log('🔵 Calling Supabase auth.signUp...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      console.log('🔵 Auth response:', { 
        hasUser: !!authData?.user, 
        hasError: !!authError,
        errorMessage: authError?.message 
      });

      if (authError) {
        console.error('❌ Supabase Auth Error:', authError);
        console.error('❌ Full error object:', JSON.stringify(authError, null, 2));
        console.error('❌ Error code:', authError.status);
        console.error('❌ Error message:', authError.message);
        
        // Handle specific Supabase errors
        let errorMessage = authError.message || 'Sign up failed';
        
        // Supabase returns "Email address 'xxx' is invalid" for various reasons
        if (authError.message?.includes('invalid') || authError.message?.includes('Invalid')) {
          // Check if it's actually a valid email format
          if (emailRegex.test(normalizedEmail)) {
            errorMessage = 'This email address cannot be used. Please try a different email or check your Supabase settings.';
            console.error('❌ Email format is valid but Supabase rejected it. Check Supabase Auth settings.');
          } else {
            errorMessage = 'Please enter a valid email address';
          }
        } else if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (authError.message?.includes('Password') || authError.message?.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else if (authError.message?.includes('network') || authError.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and Supabase configuration.';
        }

        return {
          success: false,
          message: errorMessage,
          errors: [{ param: 'email', msg: errorMessage }],
        };
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth.signUp');
        return {
          success: false,
          message: 'Failed to create user account. Please try again.',
        };
      }

      // Then, insert user profile into the users table
      console.log('🔵 Creating user profile in database...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          email: normalizedEmail,
          phone: data.phone || null,
          role: data.role || 'member',
          date_of_birth: data.dateOfBirth || null,
          gender: data.gender || null,
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        
        // Check if it's a duplicate key error (user already exists)
        if (profileError.code === '23505' || profileError.message?.includes('duplicate')) {
          return {
            success: false,
            message: 'This email is already registered. Please sign in instead.',
          };
        }

        // Check if table doesn't exist
        if (profileError.code === '42P01' || profileError.message?.includes('does not exist')) {
          return {
            success: false,
            message: 'Database table not found. Please run the SQL script in Supabase to create the users table.',
          };
        }

        // Check RLS policy issues
        if (profileError.code === '42501' || profileError.message?.includes('policy')) {
          return {
            success: false,
            message: 'Permission denied. Please check your Supabase Row Level Security policies.',
          };
        }

        return {
          success: true,
          message: 'Account created, but profile setup incomplete. Please contact support.',
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        };
      }

      console.log('✅ Sign up successful!');

      return {
        success: true,
        message: 'User created successfully! Please check your email to verify your account.',
        user: {
          id: profileData.id,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          email: profileData.email,
          role: profileData.role,
          createdAt: profileData.created_at,
        },
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection and try again.',
      };
    }
  },

  async signIn(data: SignInData): Promise<ApiResponse> {
    try {
      console.log('🔵 Sign In Attempt:', { email: data.email });
      
      // Check Supabase connection
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase not configured:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
        return {
          success: false,
          message: 'Supabase is not configured. Please check your .env file.',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const normalizedEmail = data.email.trim().toLowerCase();
      
      if (!emailRegex.test(normalizedEmail)) {
        console.error('❌ Invalid email format:', normalizedEmail);
        return {
          success: false,
          message: 'Please enter a valid email address',
          errors: [{ param: 'email', msg: 'Invalid email format' }],
        };
      }

      console.log('🔵 Calling Supabase auth.signInWithPassword...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: data.password,
      });

      console.log('🔵 Auth response:', { 
        hasUser: !!authData?.user, 
        hasError: !!authError,
        errorMessage: authError?.message 
      });

      if (authError) {
        console.error('❌ Supabase Auth Error:', authError);
        
        let errorMessage = authError.message || 'Sign in failed';
        
        if (authError.message?.includes('Invalid login credentials') || authError.message?.includes('invalid')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (authError.message?.includes('Email not confirmed') || authError.message?.includes('not confirmed')) {
          errorMessage = 'Please verify your email address before signing in.';
        } else if (authError.message?.includes('network') || authError.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and Supabase configuration.';
        }

        return {
          success: false,
          message: errorMessage,
          errors: [{ param: 'email', msg: errorMessage }],
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Sign in failed. Please try again.',
        };
      }

      // Get user profile from users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return {
        success: true,
        message: 'Signed in successfully!',
        user: profileData || {
          id: authData.user.id,
          email: authData.user.email,
        },
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection and try again.',
      };
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('🔍 getCurrentUser: No auth user found');
      return null;
    }

    console.log('🔍 getCurrentUser: Auth user ID:', user.id);
    
    const { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ getCurrentUser: Error fetching profile:', error);
      return user; // Return auth user if profile fetch fails
    }

    console.log('🔍 getCurrentUser: Profile data:', profileData);
    return profileData || user;
  },
};