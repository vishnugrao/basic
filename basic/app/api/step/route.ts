import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const step = await req.json();
        
        const { error } = await supabase
            .from('Steps')
            .insert(step);

        if (error) throw error;
        
        return NextResponse.json({ message: 'Step created successfully' });
    } catch (error) {
        console.error('Error creating step:', error);
        return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
    }
} 