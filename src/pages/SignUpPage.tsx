import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'

export default function SignUpPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [notice, setNotice] = useState<string | null>(null)

  // With email confirmation off, signUp starts a session straight away.
  useEffect(() => {
    if (user !== null) {
      navigate('/habits', { replace: true })
    }
  }, [user, navigate])

  const handleSignUp = async (email: string, password: string) => {
    setNotice(null)
    const { error, needsConfirmation } = await signUp(email, password)
    if (error !== null) return error
    if (needsConfirmation) {
      setNotice(`Check ${email} for a confirmation link, then sign in.`)
    }
    return null
  }

  return (
    <AuthForm
      title="Create account"
      subtitle="Use your email and a password of six characters or more."
      submitLabel="Sign up"
      pendingLabel="Creating account…"
      passwordAutoComplete="new-password"
      onSubmit={handleSignUp}
      notice={notice}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    />
  )
}
