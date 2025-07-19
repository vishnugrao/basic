import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const preprocessing = await req.json();
        
        const { error } = await supabase
            .from('Preprocessing')
            .insert(preprocessing);

        if (error) throw error;
        
        return NextResponse.json({ message: 'Preprocessing step created successfully', preprocessing: preprocessing });
    } catch (error) {
        console.error('Error creating preprocessing step:', error);
        return NextResponse.json({ error: 'Failed to create preprocessing step' }, { status: 500 });
    }
} 