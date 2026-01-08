import { useState, useEffect } from "react"
import { 
  Sun, Moon, Coffee, 
  CheckCircle2, Dumbbell, BookOpen, 
  ArrowRight, Wallet
} from "lucide-react"
import { db, auth } from "../firebase"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"

// Receba 'theme' e 'toggleTheme' se quiser colocar o botão aqui, ou se vier via props
export default function HomeTab({ onChangeTab, toggleTheme, theme }) {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("Arthur")
  
  const [stats, setStats] = useState({
    pendingTasks: 0,
    spentToday: 0,
    workoutDone: false,
    journalDone: false,
    lastJournalPreview: ""
  })

  useEffect(() => {
    // Função para buscar dados de todas as coleções
    const fetchDashboardData = async () => {
      try {
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0))
        const endOfDay = new Date(today.setHours(23, 59, 59, 999))
        
        // Converter para Timestamp do Firestore (se necessário para comparações diretas)
        // Mas para simplificar, vamos filtrar no JS em alguns casos onde as datas são strings
        
        // 1. FINANÇAS (Gastos de Hoje)
        // Nota: Finance usa users/{uid}/transactions
        let spentToday = 0
        if (auth.currentUser) {
          const transRef = collection(db, `users/${auth.currentUser.uid}/transactions`)
          // Pegamos as transações recentes para filtrar no cliente (mais fácil que criar index composto agora)
          const qTrans = query(transRef, orderBy("date", "desc"), limit(20)) 
          const transSnap = await getDocs(qTrans)
          
          const todayString = new Date().toISOString().split('T')[0] // YYYY-MM-DD
          
          transSnap.forEach(doc => {
            const data = doc.data()
            if (data.date === todayString && data.type === 'expense') {
              spentToday += Number(data.amount)
            }
          })
        }

        // 2. TAREFAS (Pendentes)
        // Assumindo coleção 'todos' na raiz (ajuste se for users/{uid}/todos)
        const todoRef = collection(db, "todos")
        const qTodo = query(todoRef, where("completed", "==", false))
        const todoSnap = await getDocs(qTodo)
        const pendingTasks = todoSnap.size

        // 3. TREINOS (Feito hoje?)
        // Assumindo coleção 'workout_logs' na raiz
        const workoutRef = collection(db, "workout_logs")
        const qWorkout = query(workoutRef, orderBy("createdAt", "desc"), limit(1))
        const workoutSnap = await getDocs(qWorkout)
        
        let workoutDone = false
        if (!workoutSnap.empty) {
          const lastWorkout = workoutSnap.docs[0].data()
          // Verifica se o createdAt é de hoje
          const workoutDate = lastWorkout.createdAt?.toDate()
          if (workoutDate && workoutDate >= startOfDay && workoutDate <= endOfDay) {
            workoutDone = true
          }
        }

        // 4. DIÁRIO (Escrito hoje?)
        const journalRef = collection(db, "journal")
        const qJournal = query(journalRef, orderBy("createdAt", "desc"), limit(1))
        const journalSnap = await getDocs(qJournal)
        
        let journalDone = false
        let lastJournalPreview = ""
        
        if (!journalSnap.empty) {
          const lastEntry = journalSnap.docs[0].data()
          const entryDate = lastEntry.createdAt?.toDate()
          
          if (entryDate && entryDate >= startOfDay && entryDate <= endOfDay) {
            journalDone = true
          }
          lastJournalPreview = lastEntry.content || ""
        }

        setStats({
          pendingTasks,
          spentToday,
          workoutDone,
          journalDone,
          lastJournalPreview
        })

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: "Bom dia", icon: Sun }
    if (hour < 18) return { text: "Boa tarde", icon: Sun }
    return { text: "Boa noite", icon: Moon }
  }

  const { text: greetingText, icon: GreetingIcon } = getGreeting()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24 space-y-6">
      
      {/* HEADER */}
      <div className="pt-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <GreetingIcon className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greetingText}, {userName}
          </h1>
        </div>
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
          {userName.charAt(0)}
        </div>
      </div>

      {/* FOCUS GRID */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Card Finanças */}
        <div 
          onClick={() => onChangeTab("finance")}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3">
            <Wallet className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-500">Gastos Hoje</p>
          <p className="text-lg font-bold text-gray-900">R$ {stats.spentToday.toFixed(2)}</p>
        </div>

        {/* Card Tarefas */}
        <div 
          onClick={() => onChangeTab("todo")}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-500">Pendentes</p>
          <p className="text-lg font-bold text-gray-900">{stats.pendingTasks} tarefas</p>
        </div>
      </div>

      {/* STATUS DO DIA (Treino e Diário) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Status do Dia</h2>
        
        {/* Treino Check */}
        <div 
          onClick={() => onChangeTab("workout")}
          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
            stats.workoutDone 
              ? "bg-green-50 border-green-100" 
              : "bg-white border-gray-100 hover:border-purple-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stats.workoutDone ? "bg-green-200 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Treino</p>
              <p className="text-xs text-gray-500">
                {stats.workoutDone ? "Concluído! 💪" : "Ainda não treinou hoje"}
              </p>
            </div>
          </div>
          {!stats.workoutDone && <ArrowRight className="w-4 h-4 text-gray-400" />}
        </div>

        {/* Diário Check */}
        <div 
          onClick={() => onChangeTab("journal")}
          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
            stats.journalDone 
              ? "bg-purple-50 border-purple-100" 
              : "bg-white border-gray-100 hover:border-purple-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stats.journalDone ? "bg-purple-200 text-purple-700" : "bg-gray-100 text-gray-500"
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Diário</p>
              <p className="text-xs text-gray-500">
                {stats.journalDone ? "Registro feito ✍️" : "Como você está hoje?"}
              </p>
            </div>
          </div>
          {!stats.journalDone && <ArrowRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* DICA / INSIGHT (Extra) */}
      {!stats.journalDone && (
        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-purple-200">
          <div className="flex gap-3">
            <Coffee className="w-6 h-6 opacity-80" />
            <div>
              <p className="font-bold text-sm mb-1">Momento de Reflexão</p>
              <p className="text-xs opacity-90 leading-relaxed">
                Tire 5 minutos para registrar como foi seu dia. Isso ajuda a clarear a mente e reduzir a ansiedade.
              </p>
            </div>
          </div>
        </div>
      )}

      {stats.journalDone && stats.lastJournalPreview && (
         <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-bold">Sua nota de hoje</p>
            <p className="text-sm text-gray-600 italic line-clamp-2">"{stats.lastJournalPreview}"</p>
         </div>
      )}

    </div>
  )
}