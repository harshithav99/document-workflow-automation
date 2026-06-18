import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, CheckCircle, FolderKanban } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!response.ok) throw new Error('Invalid credentials. Please try again.');

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-gray-200">
        
        <div className="flex flex-col items-center mb-8">
          <FolderKanban size={48} className="text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mt-2">Document Management System</p>
          <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register for a new account
          </Link>
        </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 text-center">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. author_harshitha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}