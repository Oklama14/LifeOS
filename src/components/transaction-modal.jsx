import { useState } from "react"
import { X } from "lucide-react"

export default function TransactionModal({ onClose }) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300 shadow-2xl">
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Nova Transação</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="text-sm font-medium text-gray-700">Valor</label>
            <input
              id="amount"
              type="number"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
            />
          </div>

          <div>
            <label htmlFor="category" className="text-sm font-medium text-gray-700">Categoria</label>
            <input
              id="category"
              placeholder="Ex: Alimentação"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
                className="flex-1 p-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors" 
                onClick={onClose}
            >
              Cancelar
            </button>
            <button 
                className="flex-1 p-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-md transition-colors" 
                onClick={onClose}
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}