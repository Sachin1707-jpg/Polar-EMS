import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Snowflake,
  Zap,
  Wind,
  Battery,
  Shield,
  ArrowRight,
  Activity,
} from 'lucide-react';

/**
 * Login Page Component
 * Professional split-screen authentication page for POLAR-EMS
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (username && password) {
        navigate('/dashboard');
      } else {
        setError('Please enter your username and password.');
      }
    } catch {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: Wind, label: 'Renewable Share', value: '68%', color: 'text-emerald-400' },
    { icon: Battery, label: 'Battery SOC', value: '72%', color: 'text-blue-400' },
    { icon: Zap, label: 'Fuel Savings', value: '30%', color: 'text-amber-400' },
    { icon: Shield, label: 'Uptime', value: '99.9%', color: 'text-violet-400' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#080e1a' }}>
      {/* ── Left Panel: Brand Hero ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #0f2348 100%)',
        }}
      >
        {/* Background orb glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0) 70%)',
            top: '-15%',
            left: '-10%',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500,
            height: 500,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0) 70%)',
            bottom: '-10%',
            right: '-5%',
            filter: 'blur(50px)',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                boxShadow: '0 0 20px rgba(59,130,246,0.5)',
              }}
            >
              <Snowflake size={22} className="text-white" />
            </div>
            <div>
              <div
                className="text-xl font-bold tracking-wide"
                style={{
                  background: 'linear-gradient(90deg, #93c5fd, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                POLAR-EMS
              </div>
              <div className="text-[10px] text-blue-300/60 uppercase tracking-widest">
                AI Energy Intelligence
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Animated Icon */}
            <div className="relative w-fit">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center animate-glow-pulse"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                }}
              >
                <Activity size={44} className="text-blue-200" />
              </div>
              {/* Orbit dot */}
              <div
                className="absolute w-4 h-4 rounded-full top-0 left-0"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  animation: 'orbit 3s linear infinite',
                  transformOrigin: '48px 48px',
                }}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">
                Polar Research Station Infrastructure · MoES – NCPOR
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                AI Energy Management
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  for Polar Research Stations
                </span>
              </h1>
              <p className="text-blue-200/60 text-lg leading-relaxed max-w-lg">
                Predict demand, optimize energy dispatch, and protect critical
                operations in Earth's most extreme environments.
              </p>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center space-x-3 p-4 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <stat.icon size={18} className={stat.color} />
                  <div>
                    <div className="text-xs text-blue-200/50 leading-none mb-1">
                      {stat.label}
                    </div>
                    <div className={`text-lg font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-blue-200/30">
            Ministry of Earth Sciences · National Centre for Polar and Ocean Research
          </div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Subtle radial bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(30,58,138,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center space-x-2 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            >
              <Snowflake size={18} className="text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{
                background: 'linear-gradient(90deg, #93c5fd, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              POLAR-EMS
            </span>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              background: 'rgba(14, 22, 40, 0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.08)',
            }}
          >
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                Welcome back
              </h2>
              <p className="text-sm text-gray-400">
                Sign in to access Mission Control
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label htmlFor="username" className="label">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <UserIcon size={16} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    className="input pl-10"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    id="remember-me"
                  />
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{
                      background: rememberMe
                        ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                        : 'transparent',
                      border: rememberMe
                        ? '1px solid #3b82f6'
                        : '1px solid rgba(255,255,255,0.15)',
                    }}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M1.5 5l2.5 2.5 4.5-4.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors select-none">
                    Keep me signed in
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="flex items-start space-x-3 p-3.5 rounded-lg text-sm animate-fade-in"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5',
                  }}
                >
                  <Shield size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit"
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-sm font-semibold"
                disabled={loading}
                style={{ borderRadius: '10px' }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-gray-600">
              Secure access to POLAR-EMS Mission Control
            </p>
          </div>

          {/* Version tag */}
          <p className="text-center text-xs text-gray-700 mt-4">
            POLAR-EMS v1.0 · Enterprise Polar Energy Management
          </p>
        </div>
      </div>
    </div>
  );
}
