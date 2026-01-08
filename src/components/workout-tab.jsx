import { useState, useEffect } from "react"
import { 
  Dumbbell, 
  Heart, 
  Clock, 
  Flame, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  Save, 
  History,
  Calendar,
  Pencil,
  Trash2,
  X
} from "lucide-react"

// Importações do Firebase
import { db } from "../firebase"
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore"

export default function WorkoutTab() {
  // --- ESTADOS ---
  const [view, setView] = useState("dashboard") // 'dashboard', 'create_plan', 'logging'
  
  const [plans, setPlans] = useState([]) 
  const [logs, setLogs] = useState([])   
  
  // Estados para Criação/Edição de Ficha
  const [editingPlanId, setEditingPlanId] = useState(null) // ID se estiver editando
  const [newPlanName, setNewPlanName] = useState("")
  const [newExercises, setNewExercises] = useState([{ name: "", sets: "3", reps: "10" }])

  // Estados para Registro/Edição de Treino (Log)
  const [activePlan, setActivePlan] = useState(null) // Se for novo treino a partir de ficha
  const [editingLogId, setEditingLogId] = useState(null) // Se for edição de histórico
  
  const [logData, setLogData] = useState({}) 
  const [cardioData, setCardioData] = useState({ time: "", calories: "" })

  // --- CARREGAR DADOS ---
  useEffect(() => {
    const qPlans = query(collection(db, "workout_plans"), orderBy("createdAt", "desc"))
    const unsubscribePlans = onSnapshot(qPlans, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    const qLogs = query(collection(db, "workout_logs"), orderBy("createdAt", "desc"))
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => {
      unsubscribePlans()
      unsubscribeLogs()
    }
  }, [])

  // --- RESET STATES ---
  const resetToDashboard = () => {
    setView("dashboard")
    setEditingPlanId(null)
    setNewPlanName("")
    setNewExercises([{ name: "", sets: "3", reps: "10" }])
    setActivePlan(null)
    setEditingLogId(null)
    setLogData({})
    setCardioData({ time: "", calories: "" })
  }

  // --- LÓGICA: FICHAS (PLANS) ---
  
  const handleEditPlan = (plan) => {
    setEditingPlanId(plan.id)
    setNewPlanName(plan.name)
    setNewExercises(plan.exercises)
    setView("create_plan")
  }

  const handleDeletePlan = async (e, id) => {
    e.stopPropagation() // Evita abrir o treino ao clicar na lixeira
    if (window.confirm("Tem certeza que deseja excluir esta ficha?")) {
      await deleteDoc(doc(db, "workout_plans", id))
    }
  }

  const addExerciseField = () => {
    setNewExercises([...newExercises, { name: "", sets: "3", reps: "10" }])
  }

  const removeExerciseField = (index) => {
    const updated = newExercises.filter((_, i) => i !== index)
    setNewExercises(updated)
  }

  const updateExerciseField = (index, field, value) => {
    const updated = [...newExercises]
    updated[index][field] = value
    setNewExercises(updated)
  }

  const handleSavePlan = async () => {
    if (!newPlanName.trim()) return alert("Dê um nome para a ficha!")
    
    const planData = {
      name: newPlanName,
      exercises: newExercises.filter(e => e.name.trim() !== ""),
      updatedAt: serverTimestamp()
    }

    try {
      if (editingPlanId) {
        // Atualizar existente
        await updateDoc(doc(db, "workout_plans", editingPlanId), planData)
      } else {
        // Criar novo
        await addDoc(collection(db, "workout_plans"), {
          ...planData,
          createdAt: serverTimestamp()
        })
      }
      resetToDashboard()
    } catch (error) {
      console.error("Erro ao salvar ficha:", error)
    }
  }

  // --- LÓGICA: TREINOS (LOGS) ---

  const startWorkout = (plan) => {
    setActivePlan(plan)
    setEditingLogId(null)
    // Prepara inputs vazios baseados na ficha
    const initialLog = {}
    plan.exercises.forEach((ex, i) => {
      initialLog[i] = { weight: "", reps: ex.reps } 
    })
    setLogData(initialLog)
    setCardioData({ time: "", calories: "" })
    setView("logging")
  }

  const handleEditLog = (log) => {
    setEditingLogId(log.id)
    setActivePlan(null) // Não estamos usando uma ficha base, mas sim o log existente
    
    // Reconstrói o logData baseado no que foi salvo
    const loadedLog = {}
    log.exercises.forEach((ex, i) => {
      loadedLog[i] = { weight: ex.weight, reps: ex.doneReps }
    })
    setLogData(loadedLog)
    
    setCardioData({ 
      time: log.cardio?.time || "", 
      calories: log.cardio?.calories || "" 
    })
    
    setView("logging")
  }

  const handleDeleteLog = async (id) => {
    if (window.confirm("Apagar este registro do histórico?")) {
      await deleteDoc(doc(db, "workout_logs", id))
    }
  }

  const handleFinishWorkout = async () => {
    try {
      // Determina a lista de exercícios (se veio de uma ficha ou se é edição de log antigo)
      const sourceExercises = activePlan ? activePlan.exercises : logs.find(l => l.id === editingLogId).exercises

      // Monta o objeto final
      const exercisesDone = sourceExercises.map((ex, i) => ({
        name: ex.name,
        targetSets: ex.targetSets || ex.sets, // Fallback para compatibilidade
        doneReps: logData[i]?.reps || ex.doneReps || ex.reps,
        weight: logData[i]?.weight || ex.weight || "0"
      }))

      const payload = {
        exercises: exercisesDone,
        cardio: {
          time: cardioData.time || "0",
          calories: cardioData.calories || "0"
        },
        updatedAt: serverTimestamp()
      }

      if (editingLogId) {
        // Atualiza Log Existente
        await updateDoc(doc(db, "workout_logs", editingLogId), payload)
      } else {
        // Cria Novo Log
        await addDoc(collection(db, "workout_logs"), {
          ...payload,
          planName: activePlan.name,
          dateDisplay: new Date().toLocaleDateString('pt-BR'),
          createdAt: serverTimestamp(),
        })
      }

      resetToDashboard()
    } catch (error) {
      console.error("Erro ao salvar treino:", error)
    }
  }

  // --- RENDERIZAÇÃO ---

  // 1. TELA DE FICHA (CRIAR OU EDITAR)
  if (view === "create_plan") {
    return (
      <div className="p-4 max-w-lg mx-auto pb-24 space-y-4">
        <button onClick={resetToDashboard} className="flex items-center text-gray-500 mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {editingPlanId ? "Editar Ficha" : "Nova Ficha"}
        </h1>
        
        <input 
          className="w-full p-3 rounded-xl border border-gray-200"
          placeholder="Nome do Treino (ex: Treino A - Peito)"
          value={newPlanName}
          onChange={e => setNewPlanName(e.target.value)}
        />

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Exercícios</h3>
          {newExercises.map((ex, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input 
                className="flex-1 p-3 rounded-xl border border-gray-200 text-sm"
                placeholder="Nome"
                value={ex.name}
                onChange={e => updateExerciseField(i, 'name', e.target.value)}
              />
              <input 
                className="w-14 p-3 rounded-xl border border-gray-200 text-sm text-center"
                placeholder="Sets"
                value={ex.sets}
                onChange={e => updateExerciseField(i, 'sets', e.target.value)}
              />
              <input 
                className="w-14 p-3 rounded-xl border border-gray-200 text-sm text-center"
                placeholder="Reps"
                value={ex.reps}
                onChange={e => updateExerciseField(i, 'reps', e.target.value)}
              />
              <button onClick={() => removeExerciseField(i)} className="text-red-400 p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addExerciseField} className="text-sm text-purple-600 font-semibold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Adicionar exercício
          </button>
        </div>

        <button onClick={handleSavePlan} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold mt-4">
          Salvar Ficha
        </button>
      </div>
    )
  }

  // 2. TELA DE REGISTRO/EDIÇÃO DE TREINO
  if (view === "logging") {
    // Determina quais exercícios mostrar (da ficha ativa ou do log em edição)
    const exercisesToList = activePlan 
      ? activePlan.exercises 
      : logs.find(l => l.id === editingLogId)?.exercises || []
      
    const title = activePlan 
      ? activePlan.name 
      : logs.find(l => l.id === editingLogId)?.planName || "Editar Treino"

    return (
      <div className="p-4 max-w-lg mx-auto pb-24 space-y-6">
        <button onClick={resetToDashboard} className="flex items-center text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">
            {editingLogId ? "Editando registros passados" : "Preencha o que você realizou hoje"}
          </p>
        </div>

        <div className="space-y-4">
          {exercisesToList.map((ex, i) => (
            <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-gray-800">{ex.name}</span>
                {activePlan && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    Meta: {ex.sets}x{ex.reps}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400">Carga (kg)</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-gray-200 rounded-lg"
                    value={logData[i]?.weight || ""}
                    onChange={(e) => setLogData({...logData, [i]: { ...logData[i], weight: e.target.value }})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400">Reps Feitas</label>
                  <input 
                    type="number"
                    className="w-full p-2 border border-gray-200 rounded-lg"
                    value={logData[i]?.reps || ""}
                    onChange={(e) => setLogData({...logData, [i]: { ...logData[i], reps: e.target.value }})}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cardio */}
        <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <h3 className="font-bold text-purple-900 flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5" /> Cardio
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-purple-700">Tempo (min)</label>
              <input 
                type="number"
                className="w-full p-2 border border-purple-200 rounded-lg bg-white"
                value={cardioData.time}
                onChange={e => setCardioData({...cardioData, time: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-purple-700">Calorias (kcal)</label>
              <input 
                type="number"
                className="w-full p-2 border border-purple-200 rounded-lg bg-white"
                value={cardioData.calories}
                onChange={e => setCardioData({...cardioData, calories: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button onClick={handleFinishWorkout} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> {editingLogId ? "Atualizar Treino" : "Finalizar Treino"}
        </button>
      </div>
    )
  }

  // 3. DASHBOARD
  const lastWorkout = logs[0]

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      <div className="pt-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treinos</h1>
          <p className="text-sm text-gray-500">Gerencie sua evolução</p>
        </div>
        <button 
          onClick={() => { resetToDashboard(); setView("create_plan"); }}
          className="bg-gray-900 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nova Ficha
        </button>
      </div>

      {/* LAST WORKOUT CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold">Último Cardio</h2>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Clock className="w-5 h-5 opacity-70" />
             <div>
                <p className="text-xs opacity-70 uppercase tracking-wider">Tempo</p>
                <p className="text-2xl font-bold">{lastWorkout?.cardio?.time || "0"} min</p>
             </div>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex items-center gap-3">
             <Flame className="w-5 h-5 opacity-70" />
             <div>
                <p className="text-xs opacity-70 uppercase tracking-wider">Calorias</p>
                <p className="text-2xl font-bold">{lastWorkout?.cardio?.calories || "0"}</p>
             </div>
          </div>
        </div>
      </div>

      {/* PLAN LIST */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Iniciar Treino</h2>
        {plans.length === 0 && (
          <div className="text-center p-6 border-dashed border-2 border-gray-200 rounded-xl text-gray-400">
            Nenhuma ficha criada.
          </div>
        )}
        {plans.map((plan) => (
          <div key={plan.id} className="flex gap-2">
            <button
              onClick={() => startWorkout(plan)}
              className="flex-1 p-4 flex items-center justify-between bg-white border border-gray-100 rounded-xl shadow-sm hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{plan.name}</p>
                  <p className="text-sm text-gray-500">{plan.exercises.length} exercícios</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-700" />
            </button>
            
            {/* Botões de Ação da Ficha */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleEditPlan(plan)}
                className="h-full px-3 bg-gray-100 rounded-xl hover:bg-blue-100 text-blue-600 flex items-center justify-center"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => handleDeletePlan(e, plan.id)}
                className="h-full px-3 bg-gray-100 rounded-xl hover:bg-red-100 text-red-600 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LOG HISTORY */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5" /> Histórico Recente
        </h2>
        
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group">
            {/* Botões de Edição/Exclusão do Histórico (Aparecem no hover em Desktop, ou sempre visíveis se preferir) */}
            <div className="absolute top-4 right-4 flex gap-2">
               <button onClick={() => handleEditLog(log)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                 <Pencil className="w-4 h-4" />
               </button>
               <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>

            <div className="flex justify-between items-start mb-2 pr-16">
              <div>
                <p className="font-bold text-gray-800">{log.planName}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" /> {log.dateDisplay}
                </div>
              </div>
            </div>
            
            {/* Lista dos Exercícios */}
            <div className="space-y-1 mt-3">
              {log.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{ex.name}</span>
                  <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                    {ex.weight}kg ({ex.doneReps} reps)
                  </span>
                </div>
              ))}
              {log.exercises.length > 3 && (
                <p className="text-xs text-center text-gray-400 mt-1">...e mais {log.exercises.length - 3}</p>
              )}
            </div>
            
            {(Number(log.cardio?.time) > 0) && (
               <div className="mt-3 pt-2 border-t border-gray-50 flex items-center gap-2 text-xs text-orange-600 font-medium">
                 <Heart className="w-3 h-3" />
                 Cardio: {log.cardio.time}min / {log.cardio.calories}kcal
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}