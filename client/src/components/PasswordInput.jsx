import { useState } from 'react'

export default function PasswordInput({ label, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="password-field">
        <input
          className="form-input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button type="button" className="password-toggle" onClick={() => setVisible((v) => !v)}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
