import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Shield, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    isAuthor: false, 
    isReviewer: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.isAuthor && !formData.isReviewer) {
      setError("You must select at least one role.");
      return;
    }

    setLoading(true);

    let finalRole = '';
    if (formData.isAuthor && formData.isReviewer) {
      finalRole = 'both';
    } else if (formData.isReviewer) {
      finalRole = 'reviewer';
    } else if (formData.isAuthor) {
      finalRole = 'author';
    }

    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      username: formData.email.split('@')[0],
      password: formData.password,
      role: finalRole 
    };
    console.log("FINAL ROLE BEING SENT TO DATABASE:", finalRole);
    try {
      const response = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        let errorMessage = 'Registration failed';

       if (Array.isArray(errData.detail)) {
          errorMessage = errData.detail.map(err => 
            `Error in '${err.loc[err.loc.length - 1]}': ${err.msg}`
          ).join(', ');
        } else if (errData.detail) {
          errorMessage = errData.detail;
        }

        throw new Error(errorMessage);
      }

      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      setError(err.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="Enter your Full Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="your@mail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Roles</label>
              <div className="bg-white border border-gray-300 rounded-md p-4 space-y-3">
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      name="isAuthor"
                      type="checkbox"
                      checked={formData.isAuthor}
                      onChange={handleCheckboxChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">Author</label>
                    <p className="text-gray-500">I want to submit documents for review.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      name="isReviewer"
                      type="checkbox"
                      checked={formData.isReviewer}
                      onChange={handleCheckboxChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">Reviewer</label>
                    <p className="text-gray-500">I want to review and approve documents.</p>
                  </div>
                </div>

              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Registering...' : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}