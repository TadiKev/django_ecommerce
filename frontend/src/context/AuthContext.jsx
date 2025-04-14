import { createContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api";

export const AuthContext = createContext(false);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(""); 

  const handleAuth = () => {
    const token = localStorage.getItem("access");
    if (token) {
      const decoded = jwtDecode(token);
      const expiry_date = decoded.exp;
      const current_time = Date.now() / 1000;

      if (expiry_date >= current_time) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  function get_username() {
    api.get("get_username")
      .then(res => {
        setUsername(res.data.username); 
      })
      .catch(err => {
        console.log(err.message);
      });
  }

  useEffect(() => {
    handleAuth();
    get_username();
  }, []);

  const authValue = { isAuthenticated, setIsAuthenticated, username, get_username };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
