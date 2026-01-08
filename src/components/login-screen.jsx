import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { LogIn } from "lucide-react";

export default function LoginScreen() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erro ao logar:", error);
      alert("Erro ao fazer login com Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-600 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-purple-600" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Life OS</h1>
            <p className="text-gray-500 mt-2">Organize sua vida em um só lugar.</p>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          Entrar com Google
        </button>
      </div>
    </div>
  );
}