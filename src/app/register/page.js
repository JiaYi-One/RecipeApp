'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setMessage('Registration Successful!');
    } else {
      setSuccess(false);
      setMessage(data.message || 'Registration failed');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 card p-4 shadow">
          <h2 className="text-center mb-4">Join My Recipe</h2>
          {message && (
            <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-success w-100">Sign Up</button>
          </form>
          <div className="text-center mt-3">
            Already have an account? <Link href="/login" className="text-decoration-none fw-bold">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
