import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const ingredientData = await req.json();
        
        const { error } = await supabase
            .from('Ingredients')
            .insert(ingredientData.ingredients);

        if (error) throw error;
        
        return NextResponse.json({ message: 'Ingredient batch processed successfully', ingredient: ingredientData });
    } catch (error) {
        console.error('Error processing ingredient batch:', error);
        return NextResponse.json({ error: 'Failed to process ingredient batch' }, { status: 500 });
    }
} 