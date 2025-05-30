'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    const testSupabase = async () => {
      const { data, error } = await supabase.from('vehicules').select('*').limit(1)
      if (error) {
        console.error('❌ Supabase PAS connecté :', error)
      } else {
        console.log('✅ Supabase connecté ! Données :', data)
      }
    }

    testSupabase()
  }, [])

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Test Supabase</h1>
      <p>Regarde la console pour le résultat 🔍</p>
    </main>
  )
}
