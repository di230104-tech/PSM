import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUserSession } from "./store/authSlice"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./Routes";
import "./styles/index.css"; 

const queryClient = new QueryClient();

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // On App load, check Supabase for an active session
    dispatch(loadUserSession());
  }, [dispatch]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
         <AppRoutes />  
      </div>
    </QueryClientProvider>
  );
}

export default App;