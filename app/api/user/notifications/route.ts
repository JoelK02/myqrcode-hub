import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET endpoint to fetch notification preferences
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the user from the request cookie
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('notifications')
      .eq('id', user.id)
      .single();
    
    if (error) {
      // If profile doesn't exist, create one with default settings
      if (error.code === 'PGRST116') { // No rows returned
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({ id: user.id, notifications: true })
          .select()
          .single();
        
        if (createError) {
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }
        
        return NextResponse.json(newProfile);
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to update notification preferences
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the user from the request cookie
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const body = await req.json();
    
    if (typeof body.notifications !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Update the user's profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ notifications: body.notifications })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 