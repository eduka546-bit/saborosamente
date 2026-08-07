
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/api/public/seed-complementos')({
  component: SeedPage
})

function SeedPage() {
  const [status, setStatus] = useState('Iniciando...')

  useEffect(() => {
    async function run() {
      const categoryId = "8b421b84-5836-4080-8d24-1ed5fc4fcd9f";
      const products = [
        { nome: "CO01 - Frango Desfiado 150g", preco: 15.00, categoria_id: categoryId, descricao: "Frango desfiado suculento e temperado.", status: 'ativo' },
        { nome: "CO02 - Frango Americano 150g", preco: 15.00, categoria_id: categoryId, descricao: "Frango estilo americano, crocante por fora e macio por dentro.", status: 'ativo' },
        { nome: "CO03 - Frango Ensopado 150g", preco: 15.00, categoria_id: categoryId, descricao: "Frango ensopado com temperos naturais.", status: 'ativo' },
        { nome: "CO04 - Tiras de Carne de Patinho 150g", preco: 18.00, categoria_id: categoryId, descricao: "Tiras de carne de patinho grelhadas.", status: 'ativo' },
        { nome: "CO05 - Carne Moída de Patinho à Bolonhesa 150g", preco: 18.00, categoria_id: categoryId, descricao: "Carne moída de patinho com molho de tomate caseiro.", status: 'ativo' },
        { nome: "CO06 - Carne de Panela 150g", preco: 18.00, categoria_id: categoryId, descricao: "Carne de panela desfiando, cozida lentamente.", status: 'ativo' }
      ];

      for (const p of products) {
        setStatus(`Inserindo ${p.nome}...`)
        const { error } = await supabase.from('produtos').upsert(p, { onConflict: 'nome' })
        if (error) {
          setStatus(`Erro em ${p.nome}: ${error.message}`)
          return
        }
      }
      setStatus('Sucesso! Todos os complementos foram inseridos.')
    }
    run()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Seeding Complementos</h1>
      <p className="bg-gray-100 p-4 rounded">{status}</p>
      <p className="mt-4 text-sm text-gray-500">Certifique-se de estar logado como admin para que o RLS permita a inserção.</p>
    </div>
  )
}
