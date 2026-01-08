import { useState, useEffect } from "react"
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  serverTimestamp 
} from "firebase/firestore"
import { db, auth } from "../firebase" // Importa sua conexão
import { Trash2, Plus, Loader2 } from "lucide-react"

export default function TodoTab() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState("")
  const [loading, setLoading] = useState(true)

  // 1. EFEITO: Carregar tarefas em tempo real
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    // Cria uma referência para a pasta de tarefas DO USUÁRIO ATUAL
    const q = query(
      collection(db, "users", user.uid, "tasks"),
      orderBy("createdAt", "desc") // Ordena das mais novas para as mais antigas
    )

    // O onSnapshot fica "ouvindo" mudanças no banco
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefasDoBanco = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTodos(tarefasDoBanco)
      setLoading(false)
    })

    return () => unsubscribe() // Limpa o ouvinte quando sair da tela
  }, [])

  // 2. FUNÇÃO: Adicionar Tarefa
  const handleAddTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    const user = auth.currentUser
    if (!user) return

    try {
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        text: newTodo,
        completed: false,
        priority: "média", // Padrão
        tag: "geral",     // Padrão
        createdAt: serverTimestamp()
      })
      setNewTodo("") // Limpa o campo
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error)
    }
  }

  // 3. FUNÇÃO: Marcar como feita
  const toggleTodo = async (id, currentStatus) => {
    const user = auth.currentUser
    if (!user) return

    const taskRef = doc(db, "users", user.uid, "tasks", id)
    await updateDoc(taskRef, {
      completed: !currentStatus
    })
  }

  // 4. FUNÇÃO: Deletar tarefa
  const deleteTodo = async (id) => {
    const user = auth.currentUser
    if (!user) return
    
    // Confirmação simples
    if (window.confirm("Quer mesmo excluir esta tarefa?")) {
      await deleteDoc(doc(db, "users", user.uid, "tasks", id))
    }
  }

  // Auxiliar de cores (Mantive o visual anterior)
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "alta": return "bg-red-100 text-red-700 border-red-200"
      case "média": return "bg-orange-100 text-orange-700 border-orange-200"
      case "baixa": return "bg-blue-100 text-blue-700 border-blue-200"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
        <p className="text-sm text-gray-500">Organize seu dia</p>
      </div>

      {/* Input de Nova Tarefa (NOVO) */}
      <form onSubmit={handleAddTodo} className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-sm"
        />
        <button 
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </form>

      {/* Resumo/Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Pendentes</p>
          <p className="text-3xl font-bold text-purple-600">{todos.filter((t) => !t.completed).length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Concluídas</p>
          <p className="text-3xl font-bold text-green-600">{todos.filter((t) => t.completed).length}</p>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-purple-600" />
          </div>
        )}

        {!loading && todos.length === 0 && (
           <p className="text-center text-gray-400 py-4">Nenhuma tarefa ainda. Adicione uma acima!</p>
        )}

        {todos
          .sort((a, b) => Number(a.completed) - Number(b.completed))
          .map((todo) => (
            <div key={todo.id} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-start gap-4 transition-all hover:shadow-md group">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="mt-1 w-5 h-5 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
              <div className="flex-1">
                <p className={`font-medium mb-2 ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {todo.text}
                </p>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md border bg-purple-50 text-purple-700 border-purple-200 font-medium">
                    #{todo.tag}
                  </span>
                </div>
              </div>
              
              {/* Botão de Deletar (Só aparece ao passar o mouse ou clicar) */}
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}