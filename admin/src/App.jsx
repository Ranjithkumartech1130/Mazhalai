import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-light">Loading...</div>
  }

  return (
    <Router basename="/admin-app">
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/*" 
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  )
}

export default App
