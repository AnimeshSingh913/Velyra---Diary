import React, { useState, useRef, useEffect } from 'react'

interface PasswordDialogProps {
  mode: 'create' | 'login'
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Password dialog for creating or entering the master password.
 * Appears as a floating glass-morphic panel over the 3D scene.
 */
export function PasswordDialog({
  mode,
  onSuccess,
  onCancel,
}: PasswordDialogProps): React.JSX.Element {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the input on mount
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Please enter a password.')
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    if (mode === 'create' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      let result: { success: boolean; error?: string }

      if (mode === 'create') {
        result = await window.diaryAPI.auth.createPassword(password)
      } else {
        result = await window.diaryAPI.auth.login(password)
      }

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Authentication failed.')
        setPassword('')
        setConfirmPassword('')
        inputRef.current?.focus()
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="password-overlay" onKeyDown={handleKeyDown}>
      <div className="password-backdrop" onClick={onCancel} />

      <form className="password-dialog" onSubmit={handleSubmit}>
        {/* Header ornament & Brand */}
        <div className="password-dialog__brand">VELYRA</div>

        <h2 className="password-dialog__title">
          {mode === 'create' ? 'Create Your Password' : 'Enter Your Password'}
        </h2>

        <p className="password-dialog__subtitle">
          {mode === 'create'
            ? 'Choose a master password to protect your diary. Remember it well — it cannot be recovered.'
            : 'Enter your master password to unlock the diary.'}
        </p>

        {/* Password Input */}
        <div className="password-dialog__field">
          <label htmlFor="password-input" className="password-dialog__label">
            {mode === 'create' ? 'New Password' : 'Password'}
          </label>
          <div className="password-dialog__input-wrap">
            <input
              ref={inputRef}
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-dialog__input"
              placeholder="Enter password…"
              autoComplete="off"
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-dialog__toggle-vis"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '◉' : '◎'}
            </button>
          </div>
        </div>

        {/* Confirm Password (create mode only) */}
        {mode === 'create' && (
          <div className="password-dialog__field">
            <label htmlFor="confirm-input" className="password-dialog__label">
              Confirm Password
            </label>
            <div className="password-dialog__input-wrap">
              <input
                id="confirm-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="password-dialog__input"
                placeholder="Confirm password…"
                autoComplete="off"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Password strength hint (create mode) */}
        {mode === 'create' && password.length > 0 && (
          <div className="password-dialog__strength">
            <div className="password-dialog__strength-bar">
              <div
                className="password-dialog__strength-fill"
                style={{
                  width: `${Math.min(100, (password.length / 12) * 100)}%`,
                  backgroundColor:
                    password.length < 4
                      ? 'var(--accent-danger)'
                      : password.length < 8
                        ? 'var(--accent-gold)'
                        : 'var(--accent-emerald)',
                }}
              />
            </div>
            <span className="password-dialog__strength-text">
              {password.length < 4
                ? 'Too short'
                : password.length < 8
                  ? 'Fair'
                  : 'Strong'}
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="password-dialog__error">
            <span className="password-dialog__error-icon">⚠</span>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="password-dialog__actions">
          <button
            type="button"
            className="password-dialog__btn password-dialog__btn--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="password-dialog__btn password-dialog__btn--submit"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <span className="password-dialog__spinner" />
            ) : mode === 'create' ? (
              'Create Password'
            ) : (
              'Unlock Diary'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
