import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; 

import Page from "./app/Page";
import LoginScreen from "./components/login-screen";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="ml-3 text-white font-bold">LifeOS</p>
      </div>
    );
  }

  // Se não tem usuário, Login
  if (!user) {
    return <LoginScreen />;
  }

  // Se tem usuário, App Principal
  return (
    <div className="min-h-screen bg-white">
      <Page user={user} />
    </div>
  );
}

export default App;