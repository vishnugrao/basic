import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const preprocessingData = await req.json();
        
        const { error } = await supabase
            .from('Preprocessing')
            .insert(preprocessingData.preprocessing)
            .select();

        if (error) throw error;
        
        return NextResponse.json({ message: 'Preprocessing batch processed successfully', preprocessing: preprocessingData });
    } catch (error) {
        console.error('Error processing preprocessing batch:', error);
        return NextResponse.json({ error: 'Failed to process preprocessing batch' }, { status: 500 });
    }
} 