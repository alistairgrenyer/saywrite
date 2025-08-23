import { useState } from 'react'
import { useAuth } from './hooks/useAuth.js'
import { LoginModal } from './components/LoginModal.js'
import { HostedApiClient } from './adapters/api/HostedApiClient.js'
import { RewriteRequest } from './core/models/rewrite.js'
import './App.css'
import './components/LoginModal.css'

const apiClient = new HostedApiClient()

function App() {
  const { authState, isLoading, error, login, logout, clearError } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [rewriteResult, setRewriteResult] = useState<string | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)

  const handleLogin = async (request: { email: string; password: string }) => {
    try {
      await login(request)
      setShowLoginModal(false)
    } catch (err) {
      // Error is handled by useAuth hook
    }
  }

  const handleRewrite = async () => {
    if (!authState.authenticated) {
      setShowLoginModal(true)
      return
    }

    setIsRewriting(true)
    try {
      const request: RewriteRequest = {
        transcript: "This is a test transcript that needs to be rewritten professionally.",
        profile: {
          id: "test-profile",
          name: "Professional",
          tone: "professional",
          constraints: ["clear", "concise"],
          format: "email",
          audience: "business",
          glossary: {},
          max_words: 350
        },
        options: {
          temperature: 0.5,
          provider_hint: "openai"
        }
      }

      const response = await apiClient.rewrite(request)
      setRewriteResult(response.draft)
    } catch (err: any) {
      console.error('Rewrite failed:', err)
      alert('Rewrite failed: ' + (err.message || 'Unknown error'))
    } finally {
      setIsRewriting(false)
    }
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <>
      <div className="app-header">
        <h1>SayWrite</h1>
        <div className="auth-status">
          {authState.authenticated ? (
            <div>
              <span>✅ Authenticated</span>
              <button onClick={logout} className="btn-secondary">Logout</button>
            </div>
          ) : (
            <div>
              <span>❌ Not authenticated</span>
              <button onClick={() => setShowLoginModal(true)} className="btn-primary">Login</button>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="card">
          <h2>Rewrite Service</h2>
          <p>Test the rewrite functionality with authentication.</p>
          <button 
            onClick={handleRewrite} 
            disabled={isRewriting}
            className="btn-primary"
          >
            {isRewriting ? 'Rewriting...' : 'Test Rewrite'}
          </button>
          
          {rewriteResult && (
            <div className="rewrite-result">
              <h3>Rewrite Result:</h3>
              <p>{rewriteResult}</p>
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          clearError()
        }}
        onLogin={handleLogin}
        error={error || undefined}
        isLoading={isLoading}
      />
    </>
  )
}

export default App
