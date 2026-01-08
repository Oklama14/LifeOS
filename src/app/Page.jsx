import { useState } from "react"
import { Home, ListTodo, Wallet, Dumbbell, BookOpen, LogOut } from "lucide-react"
import { auth } from "../firebase"

// Importando as abas
import HomeTab from "../components/home-tab"
import TodoTab from "../components/todo-tab"
import FinanceTab from "../components/finance-tab"
import WorkoutTab from "../components/workout-tab"
import JournalTab from "../components/journal-tab"

export default function Page({ user }) {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* CONTEÚDO PRINCIPAL */}
      <main className="pb-24">
        {activeTab === "home" && <HomeTab onChangeTab={setActiveTab} user={user} />}
        {activeTab === "todo" && <TodoTab />}
        {activeTab === "workout" && <WorkoutTab />}
        {activeTab === "finance" && <FinanceTab />}
        {activeTab === "journal" && <JournalTab />}
      </main>

      {/* BARRA DE NAVEGAÇÃO FIXA EMBAIXO */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-2 py-3 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        <NavButton 
          active={activeTab === "home"} 
          onClick={() => setActiveTab("home")} 
          icon={Home} 
          label="Home" 
        />
        
        <NavButton 
          active={activeTab === "todo"} 
          onClick={() => setActiveTab("todo")} 
          icon={ListTodo} 
          label="Tarefas" 
        />
        
        {/* Botão Central de Destaque (Treino) */}
        <button 
          onClick={() => setActiveTab("workout")}
          className={`relative -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            activeTab === "workout" ? "bg-gray-900 text-white" : "bg-purple-600 text-white"
          }`}
        >
          <Dumbbell className="w-6 h-6" />
        </button>

        <NavButton 
          active={activeTab === "finance"} 
          onClick={() => setActiveTab("finance")} 
          icon={Wallet} 
          label="Finanças" 
        />
        
        <NavButton 
          active={activeTab === "journal"} 
          onClick={() => setActiveTab("journal")} 
          icon={BookOpen} 
          label="Diário" 
        />

      </nav>

      {/* Botão de Sair Discreto (canto superior, só aparece na Home) */}
      {activeTab === "home" && (
        <button 
          onClick={() => auth.signOut()}
          className="fixed top-5 right-4 z-40 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Componente auxiliar para os botões da barra (para não repetir código)
function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 w-16 transition-colors ${
        active ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
      }`}
    >
      <Icon className={`w-6 h-6 ${active ? "fill-purple-100" : ""}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}