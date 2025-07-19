import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const ingredient = await req.json();
        
        const { error } = await supabase
            .from('Ingredients')
            .insert(ingredient);

        if (error) throw error;
        
        return NextResponse.json({ message: 'Ingredient created successfully', ingredient: ingredient });
    } catch (error) {
        console.error('Error creating ingredient:', error);
        return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 });
    }
} 