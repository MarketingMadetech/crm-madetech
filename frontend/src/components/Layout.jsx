import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Notificacoes from './Notificacoes'

function Layout({ children }) {
  const location = useLocation()
  const { darkMode, toggleDarkMode } = useTheme()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/negocios', label: 'Negócios', icon: '💼' },
    { path: '/funil', label: 'Funil', icon: '🎯' },
    { path: '/lembretes', label: 'Lembretes', icon: '🔔' },
    { path: '/relatorios', label: 'Relatórios', icon: '📈' }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img 
                  src="https://www.madetech.com.br/loja/wp-content/uploads/2025/08/cropped-logo-2.png" 
                  alt="Madetech Logo"
                  className="h-10 w-auto cursor-pointer"
                />
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 cursor-pointer">CRM Madetech</h1>
              </Link>
              <div className="ml-6 flex space-x-8">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Notificacoes />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
