import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const stepData = await req.json();
        
        const { error } = await supabase
            .from('Steps')
            .insert(stepData.steps);

        if (error) throw error;
        
        return NextResponse.json({ message: 'Step batch processed successfully', step: stepData });
    } catch (error) {
        console.error('Error processing step batch:', error);
        return NextResponse.json({ error: 'Failed to process step batch' }, { status: 500 });
    }
} 