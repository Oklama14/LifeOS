import { useState, useEffect } from "react"
import { Calendar, Sparkles, Save, Loader2 } from "lucide-react"

// Imports do Firebase
import { db } from "../firebase"
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore"

export default function JournalTab() {
  const [newEntry, setNewEntry] = useState("")
  const [entries, setEntries] = useState([]) // Agora começa vazio!
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true) // Loading inicial da lista

  // --- ESCUTAR DADOS EM TEMPO REAL ---
  useEffect(() => {
    // 1. Cria a query: Coleção 'journal', ordenada por criação (mais recente primeiro)
    const q = query(collection(db, "journal"), orderBy("createdAt", "desc"))

    // 2. Ativa o listener (escutador)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 3. Transforma os dados do Firebase em um array simples
      const journalData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setEntries(journalData)
      setIsLoadingData(false)
    }, (error) => {
      console.error("Erro ao buscar diário:", error)
      setIsLoadingData(false)
    })

    // 4. Limpeza: Desliga o escutador se o usuário sair da tela (evita vazamento de memória)
    return () => unsubscribe()
  }, [])

  // --- FUNÇÃO DE SALVAR (Igual à anterior) ---
  const handleSaveEntry = async () => {
    if (!newEntry.trim()) return

    setIsSaving(true)

    try {
      const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      const formattedDate = new Date().toLocaleDateString('pt-BR', dateOptions);

      await addDoc(collection(db, "journal"), {
        content: newEntry,
        createdAt: serverTimestamp(),
        dateDisplay: formattedDate,
      })

      setNewEntry("")
      // Não precisa chamar função de recarregar, o onSnapshot faz isso sozinho!
      
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Diário</h1>
        <p className="text-sm text-gray-500">Registre seus pensamentos</p>
      </div>

      {/* CARD DE NOVA ENTRADA */}
      <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm shadow-purple-100">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-purple-900">Nova Entrada</h2>
        </div>
        <textarea
          placeholder="Como foi seu dia hoje?..."
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          disabled={isSaving}
          className="w-full min-h-[120px] mb-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
        />
        <button 
          onClick={handleSaveEntry}
          disabled={isSaving || !newEntry.trim()}
          className={`w-full py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 transition-colors 
            ${isSaving || !newEntry.trim() 
              ? 'bg-purple-300 cursor-not-allowed text-purple-50' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
        >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Registro
              </>
            )}
        </button>
      </div>

      {/* LISTA DE ENTRADAS ANTERIORES */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Entradas Anteriores</h2>
        
        {/* Loading State */}
        {isLoadingData && (
          <div className="text-center text-gray-400 py-4 flex flex-col items-center">
             <Loader2 className="w-6 h-6 animate-spin mb-2" />
             <p className="text-sm">Carregando suas memórias...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingData && entries.length === 0 && (
          <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>Seu diário está vazio. Comece a escrever hoje! ✍️</p>
          </div>
        )}

        {/* Lista Real */}
        {entries.map((entry) => (
          <div key={entry.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              {/* Usamos dateDisplay aqui, ou 'Sem data' se der erro */}
              <p className="text-sm font-bold text-purple-600">
                {entry.dateDisplay || "Data indisponível"}
              </p>
            </div>
            <p className="text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}