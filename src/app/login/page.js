'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      //setMessage('Login Successful! Redirecting...');
      setTimeout(() => {
        router.push('/'); 
      }, 1000);
    } else {
      setMessage(data.message || 'Login failed');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5 card p-4 shadow">
          <h2 className="text-center mb-4">Login to My Recipe</h2>
          {message && (
            <div className={`alert ${message.includes('Successful') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="email@example.com"
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="********"
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>
          <div className="text-center mt-3">
            <small>Don't have an account? <Link href="/register" className="text-decoration-none fw-bold">Register here</Link></small>
          </div>
        </div>
      </div>
    </div>
  );
}