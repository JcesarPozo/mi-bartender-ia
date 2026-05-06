'use client';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai'; // función del paquete 'ai'

export default function TestDepsPage() {
  // Probar uuid
  const testUuid = uuidv4();
  
  // Probar zod
  const TestSchema = z.object({ name: z.string() });
  const testData = TestSchema.parse({ name: "Bartender" });
  
  // Verificar que Supabase se puede inicializar (sin credenciales reales, solo sintaxis)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejemplo.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-key';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Verificar que el SDK de AI/OpenAI está presente
  const hasOpenAI = !!openai;
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Prueba de dependencias</h1>
      <ul>
        <li>✅ uuid: {testUuid}</li>
        <li>✅ zod: {testData.name}</li>
        <li>✅ supabase: cliente creado (URL: {supabaseUrl})</li>
        <li>✅ @ai-sdk/openai: {hasOpenAI ? 'disponible' : 'NO disponible'}</li>
        <li>✅ 'ai' package: {typeof generateText === 'function' ? 'función generateText disponible' : 'NO disponible'}</li>
      </ul>
      <p>Si ves este mensaje sin errores en consola, todas las dependencias funcionan.</p>
    </div>
  );
}