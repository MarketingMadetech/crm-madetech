import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Negocios from './pages/Negocios'
import NegocioForm from './pages/NegocioForm'
import Funil from './pages/Funil'
import Lembretes from './pages/Lembretes'
import Relatorios from './pages/Relatorios'
import Backup from './pages/Backup'

function App() {
  useEffect(() => {
    // Verificar autenticação ao carregar
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
    }
  }, []);

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
