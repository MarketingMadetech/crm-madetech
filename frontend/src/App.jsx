import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Negocios from './pages/Negocios'
import NegocioForm from './pages/NegocioForm'
import Funil from './pages/Funil'
import Lembretes from './pages/Lembretes'
import Relatorios from './pages/Relatorios'

function App() {
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
      </Routes>
    </Layout>
  )
}

export default App
