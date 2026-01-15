import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import Notificacoes from './Notificacoes'
import auth from '../auth'

function Layout({ children }) {
  const location = useLocation()
  const { darkMode, toggleDarkMode } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const user = auth.getUser()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/negocios', label: 'Negócios', icon: '💼' },
    { path: '/funil', label: 'Funil', icon: '🎯' },
    { path: '/relatorios', label: 'Relatórios', icon: '📈' },
    // { path: '/lembretes', label: 'Lembretes', icon: '🔔' }, // Temporariamente oculto do menu (tela pequena)
    { path: '/backup', label: 'Backup', icon: '💾' }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
                <img 
                  src="https://www.madetech.com.br/loja/wp-content/uploads/2025/08/cropped-logo-2.png" 
                  alt="Madetech Logo"
                  className="h-8 sm:h-10 w-auto cursor-pointer"
                />
              </Link>
              
              {/* Menu Desktop */}
              <div className="hidden xl:flex ml-4 space-x-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      location.pathname === item.path
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="ml-1.5">{item.label}</span>
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
              
              {/* Menu do Usuário */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline">{user.username}</span>
                  {auth.isAdmin() && <span className="hidden md:inline text-xs bg-purple-500 text-white px-2 py-0.5 rounded">Admin</span>}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{auth.isAdmin() ? 'Administrador' : 'Usuário'}</p>
                    </div>
                    <button
                      onClick={() => auth.logout()}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🚪 Sair
                    </button>
                  </div>
                )}
              </div>
              
              {/* Botão Menu Mobile */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="xl:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu Mobile */}
        {showMobileMenu && (
          <div className="xl:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">{user.username}</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {auth.isAdmin() ? 'Administrador' : 'Usuário'}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={() => auth.logout()}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  🚪 Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
