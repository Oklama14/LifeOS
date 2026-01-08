import { useState, useEffect } from "react"
import { Plus, TrendingUp, ShoppingCart, Car, Coffee, Home, Trash2, Edit2, Target, Wallet, PieChart as PieChartIcon, BarChart3, Filter, ChevronDown, ChevronUp, DollarSign, TrendingDown } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts"
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  serverTimestamp,
  where,
  getDocs
} from "firebase/firestore"
import { db, auth } from "../firebase"

// Categorias padrão
const DEFAULT_CATEGORIES = [
  { id: "alimentacao", name: "Alimentação", color: "#9333EA", icon: "ShoppingCart", type: "expense" },
  { id: "transporte", name: "Transporte", color: "#C084FC", icon: "Car", type: "expense" },
  { id: "lazer", name: "Lazer", color: "#E9D5FF", icon: "Coffee", type: "expense" },
  { id: "moradia", name: "Moradia", color: "#F3E8FF", icon: "Home", type: "expense" },
  { id: "saude", name: "Saúde", color: "#A855F7", icon: "Target", type: "expense" },
  { id: "educacao", name: "Educação", color: "#7C3AED", icon: "Target", type: "expense" },
  { id: "salario", name: "Salário", color: "#10B981", icon: "TrendingUp", type: "income" },
  { id: "investimentos", name: "Investimentos", color: "#059669", icon: "TrendingUp", type: "income" },
  { id: "outros", name: "Outros", color: "#6B7280", icon: "DollarSign", type: "expense" }
]

const ICON_MAP = {
  ShoppingCart, Car, Coffee, Home, Target, TrendingUp, DollarSign, Wallet
}

// Modal de Transação
function TransactionModal({ onClose, editTransaction = null, accounts, categories }) {
  const [formData, setFormData] = useState({
    name: editTransaction?.name || "",
    amount: editTransaction?.amount || "",
    category: editTransaction?.category || "",
    account: editTransaction?.account || "",
    date: editTransaction?.date || new Date().toISOString().split('T')[0],
    type: editTransaction?.type || "expense",
    notes: editTransaction?.notes || ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const transaction = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        account: formData.account,
        date: formData.date,
        type: formData.type,
        notes: formData.notes,
        createdAt: serverTimestamp()
      }

      if (editTransaction) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, editTransaction.id), transaction)
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/transactions`), transaction)
      }
      
      onClose()
    } catch (error) {
      console.error("Erro ao salvar transação:", error)
      alert("Erro ao salvar transação")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir esta transação?")) return
    
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, editTransaction.id))
      onClose()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      alert("Erro ao excluir transação")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {editTransaction ? "Editar Transação" : "Nova Transação"}
            </h2>
            {editTransaction && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: "expense"})}
                className={`p-3 rounded-xl font-medium transition ${
                  formData.type === "expense" 
                    ? "bg-red-500 text-white" 
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, type: "income"})}
                className={`p-3 rounded-xl font-medium transition ${
                  formData.type === "income" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Receita
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Supermercado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {categories
                  .filter(cat => cat.type === formData.type)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta *
              </label>
              <select
                required
                value={formData.account}
                onChange={(e) => setFormData({...formData, account: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Notas adicionais..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Salvando..." : editTransaction ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Modal de Conta
function AccountModal({ onClose, editAccount = null }) {
  const [formData, setFormData] = useState({
    name: editAccount?.name || "",
    type: editAccount?.type || "checking",
    balance: editAccount?.balance || "",
    color: editAccount?.color || "#9333EA"
  })
  const [loading, setLoading] = useState(false)

  const accountTypes = [
    { id: "checking", name: "Conta Corrente" },
    { id: "savings", name: "Poupança" },
    { id: "investment", name: "Investimento" },
    { id: "cash", name: "Dinheiro" },
    { id: "credit", name: "Cartão de Crédito" }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const account = {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance),
        color: formData.color,
        createdAt: serverTimestamp()
      }

      if (editAccount) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/accounts`, editAccount.id), account)
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/accounts`), account)
      }
      
      onClose()
    } catch (error) {
      console.error("Erro ao salvar conta:", error)
      alert("Erro ao salvar conta")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir esta conta?")) return
    
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/accounts`, editAccount.id))
      onClose()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      alert("Erro ao excluir conta")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {editAccount ? "Editar Conta" : "Nova Conta"}
            </h2>
            {editAccount && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Conta *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Nubank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {accountTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Inicial (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.balance}
                onChange={(e) => setFormData({...formData, balance: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="flex gap-2">
                {["#9333EA", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#6366F1"].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-10 h-10 rounded-full border-2 ${
                      formData.color === color ? "border-gray-800" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Salvando..." : editAccount ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Modal de Meta
function GoalModal({ onClose, editGoal = null }) {
  const [formData, setFormData] = useState({
    name: editGoal?.name || "",
    targetAmount: editGoal?.targetAmount || "",
    currentAmount: editGoal?.currentAmount || "0",
    deadline: editGoal?.deadline || "",
    color: editGoal?.color || "#9333EA"
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const goal = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        deadline: formData.deadline,
        color: formData.color,
        createdAt: serverTimestamp()
      }

      if (editGoal) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/goals`, editGoal.id), goal)
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/goals`), goal)
      }
      
      onClose()
    } catch (error) {
      console.error("Erro ao salvar meta:", error)
      alert("Erro ao salvar meta")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir esta meta?")) return
    
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/goals`, editGoal.id))
      onClose()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      alert("Erro ao excluir meta")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {editGoal ? "Editar Meta" : "Nova Meta"}
            </h2>
            {editGoal && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Meta *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Viagem para Europa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Alvo (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Salvando..." : editGoal ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Modal de Categoria
function CategoryModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: "#9333EA",
    icon: "DollarSign"
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const category = {
        name: formData.name,
        type: formData.type,
        color: formData.color,
        icon: formData.icon,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, `users/${auth.currentUser.uid}/categories`), category)
      onClose()
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Nova Categoria</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Academia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: "expense"})}
                  className={`p-3 rounded-xl font-medium transition ${
                    formData.type === "expense" 
                      ? "bg-red-500 text-white" 
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: "income"})}
                  className={`p-3 rounded-xl font-medium transition ${
                    formData.type === "income" 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Receita
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="flex gap-2">
                {["#9333EA", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#EF4444"].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, color})}
                    className={`w-10 h-10 rounded-full border-2 ${
                      formData.color === color ? "border-gray-800" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente Principal
export default function FinanceTab() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState("month")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)

  // Estados do Firebase
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [goals, setGoals] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Combinar categorias padrão com personalizadas
  const categories = [...DEFAULT_CATEGORIES, ...customCategories]

  // Listener de Transações
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/transactions`),
      orderBy("date", "desc")
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTransactions(data)
      setLoading(false)
    }, (error) => {
      console.error("Erro ao carregar transações:", error)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [])

  // Listener de Contas
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(collection(db, `users/${auth.currentUser.uid}/accounts`))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAccounts(data)
    })
    
    return () => unsubscribe()
  }, [])

  // Listener de Metas
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(collection(db, `users/${auth.currentUser.uid}/goals`))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setGoals(data)
    })
    
    return () => unsubscribe()
  }, [])

  // Listener de Categorias Personalizadas
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(collection(db, `users/${auth.currentUser.uid}/categories`))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCustomCategories(data)
    })
    
    return () => unsubscribe()
  }, [])

  // Cálculos
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  
  const monthExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const monthIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  // Dados do gráfico de pizza
  const expensesByCategory = categories
    .filter(cat => cat.type === "expense")
    .map(cat => {
      const total = transactions
        .filter(t => t.category === cat.id && t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      return { name: cat.name, value: total, color: cat.color }
    })
    .filter(item => item.value > 0)

  // Dados do gráfico de barras (últimos 6 meses)
  const monthlyData = [
    { month: "Ago", income: 4800, expense: 3200 },
    { month: "Set", income: 5000, expense: 3500 },
    { month: "Out", income: 5200, expense: 2800 },
    { month: "Nov", income: 4900, expense: 4100 },
    { month: "Dez", income: 5500, expense: 4500 },
    { month: "Jan", income: monthIncome, expense: monthExpenses }
  ]

  const getCategoryInfo = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId)
    if (!cat) return { name: "Outros", color: "#6B7280", icon: "DollarSign" }
    return cat
  }

  const getAccountName = (accountId) => {
    return accounts.find(acc => acc.id === accountId)?.name || "Desconhecido"
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowTransactionModal(true)
  }

  const handleEditAccount = (account) => {
    setEditingAccount(account)
    setShowAccountModal(true)
  }

  const handleEditGoal = (goal) => {
    setEditingGoal(goal)
    setShowGoalModal(true)
  }

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false)
    setEditingTransaction(null)
  }

  const handleCloseAccountModal = () => {
    setShowAccountModal(false)
    setEditingAccount(null)
  }

  const handleCloseGoalModal = () => {
    setShowGoalModal(false)
    setEditingGoal(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200">
          <p className="text-sm opacity-90 mb-1">Saldo Total</p>
          <p className="text-2xl font-bold">R$ {totalBalance.toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Gastos do Mês</p>
          <p className="text-2xl font-bold text-red-500">R$ {monthExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-700">Receitas</span>
          </div>
          <span className="text-lg font-bold text-green-600">R$ {monthIncome.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-700">Despesas</span>
          </div>
          <span className="text-lg font-bold text-red-600">R$ {monthExpenses.toFixed(2)}</span>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Saldo do Mês</span>
            <span className={`text-xl font-bold ${monthIncome - monthExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {(monthIncome - monthExpenses).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Gastos por Categoria</h2>
        {expensesByCategory.length > 0 ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={expensesByCategory} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum gasto registrado</p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Evolução Mensal</h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Bar dataKey="income" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Transações Recentes</h2>
          <button 
            onClick={() => setActiveTab("transactions")}
            className="text-sm text-purple-600 font-medium"
          >
            Ver todas
          </button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => {
            const categoryInfo = getCategoryInfo(transaction.category)
            const IconComponent = ICON_MAP[categoryInfo.icon] || DollarSign
            
            return (
              <div 
                key={transaction.id} 
                className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition"
                onClick={() => handleEditTransaction(transaction)}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${categoryInfo.color}20` }}
                >
                  <IconComponent className="w-5 h-5" style={{ color: categoryInfo.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{transaction.name}</p>
                  <p className="text-xs text-gray-400">{transaction.date} • {getAccountName(transaction.account)}</p>
                </div>
                <p className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Render Transactions Tab
  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-3 rounded-xl bg-white border border-gray-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>
          {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showFilters && (
          <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mês</option>
                <option value="3months">Últimos 3 meses</option>
                <option value="year">Este ano</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação registrada</p>
            <p className="text-sm">Clique no botão + para adicionar</p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const categoryInfo = getCategoryInfo(transaction.category)
            const IconComponent = ICON_MAP[categoryInfo.icon] || DollarSign
            
            return (
              <div 
                key={transaction.id} 
                className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => handleEditTransaction(transaction)}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${categoryInfo.color}20` }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: categoryInfo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{transaction.name}</p>
                    <p className="text-xs text-gray-400">{categoryInfo.name} • {getAccountName(transaction.account)}</p>
                    <p className="text-xs text-gray-400">{transaction.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  // Render Accounts Tab
  const renderAccounts = () => (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg">
        <p className="text-sm opacity-90 mb-1">Patrimônio Total</p>
        <p className="text-3xl font-bold mb-4">R$ {totalBalance.toFixed(2)}</p>
        <div className="flex gap-2">
          <div className="flex-1 p-3 rounded-xl bg-white/20 backdrop-blur">
            <p className="text-xs opacity-80">Contas</p>
            <p className="text-lg font-bold">{accounts.length}</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-white/20 backdrop-blur">
            <p className="text-xs opacity-80">Investimentos</p>
            <p className="text-lg font-bold">
              {accounts.filter(a => a.type === "investment").length}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Minhas Contas</h2>
          <button
            onClick={() => setShowAccountModal(true)}
            className="text-sm text-purple-600 font-medium"
          >
            + Adicionar
          </button>
        </div>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhuma conta cadastrada</p>
            <p className="text-sm">Adicione sua primeira conta</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition"
                onClick={() => handleEditAccount(account)}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${account.color}20` }}
                >
                  <Wallet className="w-6 h-6" style={{ color: account.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{account.name}</p>
                  <p className="text-xs text-gray-400">
                    {account.type === "checking" && "Conta Corrente"}
                    {account.type === "savings" && "Poupança"}
                    {account.type === "investment" && "Investimento"}
                    {account.type === "cash" && "Dinheiro"}
                    {account.type === "credit" && "Cartão de Crédito"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">R$ {account.balance.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Render Goals Tab
  const renderGoals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Metas Financeiras</h2>
        <button
          onClick={() => setShowGoalModal(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
        >
          + Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nenhuma meta cadastrada</p>
          <p className="text-sm">Defina suas metas financeiras</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const remaining = goal.targetAmount - goal.currentAmount
            
            return (
              <div 
                key={goal.id} 
                className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => handleEditGoal(goal)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{goal.name}</h3>
                    <p className="text-xs text-gray-400">Prazo: {goal.deadline}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">R$ {goal.currentAmount.toFixed(2)}</span>
                    <span className="font-semibold text-gray-800">R$ {goal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{progress.toFixed(0)}% concluído</span>
                  <span className="text-sm font-medium" style={{ color: goal.color }}>
                    Faltam R$ {remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // Render Reports Tab
  const renderReports = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Relatórios</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
          <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Receitas</p>
          <p className="text-xl font-bold text-green-600">R$ {monthIncome.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <TrendingDown className="w-6 h-6 text-red-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Despesas</p>
          <p className="text-xl font-bold text-red-600">R$ {monthExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
        {expensesByCategory.length > 0 ? (
          <div className="space-y-3">
            {expensesByCategory.map((item) => {
              const percentage = (item.value / monthExpenses) * 100
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-semibold text-gray-800">R$ {item.value.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% do total</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-4">Nenhum dado disponível</p>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Evolução (6 meses)</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="p-4 max-w-lg mx-auto">
        <div className="pt-4 pb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
          <p className="text-sm text-gray-500">Gerencie seu dinheiro</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "overview", label: "Visão Geral", icon: Home },
            { id: "transactions", label: "Transações", icon: ShoppingCart },
            { id: "accounts", label: "Contas", icon: Wallet },
            { id: "goals", label: "Metas", icon: Target },
            { id: "reports", label: "Relatórios", icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "transactions" && renderTransactions()}
        {activeTab === "accounts" && renderAccounts()}
        {activeTab === "goals" && renderGoals()}
        {activeTab === "reports" && renderReports()}

        {activeTab === "transactions" && (
          <button
            onClick={() => setShowCategoryModal(true)}
            className="mt-4 w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600 transition font-medium"
          >
            + Adicionar Categoria Personalizada
          </button>
        )}
      </div>

      {(activeTab === "overview" || activeTab === "transactions") && (
        <button
          onClick={() => setShowTransactionModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showTransactionModal && (
        <TransactionModal 
          onClose={handleCloseTransactionModal}
          editTransaction={editingTransaction}
          accounts={accounts}
          categories={categories}
        />
      )}
      {showAccountModal && (
        <AccountModal 
          onClose={handleCloseAccountModal}
          editAccount={editingAccount}
        />
      )}
      {showGoalModal && (
        <GoalModal 
          onClose={handleCloseGoalModal}
          editGoal={editingGoal}
        />
      )}
      {showCategoryModal && (
        <CategoryModal onClose={() => setShowCategoryModal(false)} />
      )}
    </div>
  )
}