import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Negocios from './pages/Negocios'
import NegocioForm from './pages/NegocioForm'
import Funil from './pages/Funil'
import Lembretes from './pages/Lembretes'
import Relatorios from './pages/Relatorios'
import Backup from './pages/Backup'
import Login from './pages/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticação ao carregar
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Se não estiver autenticado, mostrar apenas login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/funil" element={<Funil />} />
        <Route path="/lembretes" element={<Lembretes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/negocios" element={<Negocios />} />
        <Route path="/negocios/novo" element={<NegocioForm />} />
        <Route path="/negocios/:id/editar" element={<NegocioForm />} />
        <Route path="/backup" element={<Backup />} />
      </Routes>
    </Layout>
  )
}

export default App
