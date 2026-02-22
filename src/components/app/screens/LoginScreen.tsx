'use client';

import React, { useState } from 'react';
import { Phone, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

const LoginScreen = () => {
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>('login');

  // Phone State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { showAlert } = useStore();

  // --- Google OAuth ---
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app',
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      showAlert('Error', error.message, 'error');
      setLoading(false);
    }
  };

  // --- Phone Logic ---
  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      showAlert('Error', 'Please enter a valid phone number', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+91' + phoneNumber,
      });
      if (error) throw error;
      setPhoneStep('verify');
      showAlert('Code Sent', 'Please check your messages.', 'success');
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: '+91' + phoneNumber,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Email Logic ---
  const handleEmailAuth = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      let error;
      let data;

      if (emailMode === 'signup') {
        const res = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: '',
            },
          },
        });
        error = res.error;
        data = res.data;
      } else {
        const res = await supabase.auth.signInWithPassword({ email, password });
        error = res.error;
        data = res.data;
      }

      if (error) throw error;

      if (emailMode === 'signup' && !data.session) {
        showAlert('Verify Email', 'Please check your email to verify your account.', 'info');
        setEmailMode('login');
      }
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showAlert('Email Required', 'Please enter your email address first to reset your password.', 'info');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/app',
      });

      if (error) throw error;

      showAlert('Reset Email Sent', 'We have sent a password reset link to your email.', 'success');
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-scroll">
        <div className="login-header">
          <h1 className="login-title">Welcome back!</h1>
          <p className="login-subtitle">Sign in to Loql</p>
        </div>

        {/* Method Toggle */}
        <div className="login-tab-container">
          <button
            className={`login-tab scale-pressable ${method === 'phone' ? 'active' : ''}`}
            onClick={() => setMethod('phone')}
          >
            <Phone size={20} color={method === 'phone' ? '#111827' : '#6B7280'} />
            <span className="login-tab-text">Phone</span>
          </button>
          <button
            className={`login-tab scale-pressable ${method === 'email' ? 'active' : ''}`}
            onClick={() => setMethod('email')}
          >
            <Mail size={20} color={method === 'email' ? '#111827' : '#6B7280'} />
            <span className="login-tab-text">Email</span>
          </button>
        </div>

        <div className="login-form">
          {method === 'phone' ? (
            <>
              {phoneStep === 'input' ? (
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div className="phone-row">
                    <div className="country-code">+91</div>
                    <input
                      className="phone-input"
                      placeholder="9876543210"
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">Verification Code</label>
                  <input
                    className="otp-input"
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}

              <button
                className="login-btn scale-pressable"
                onClick={phoneStep === 'input' ? handleSendOtp : handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  phoneStep === 'input' ? 'Get Code' : 'Verify & Login'
                )}
              </button>
            </>
          ) : (
            <>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="icon-input">
                  <Mail size={20} color="#9CA3AF" />
                  <input
                    className="text-input"
                    placeholder="john@example.com"
                    type="email"
                    autoCapitalize="none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="icon-input">
                  <Lock size={20} color="#9CA3AF" />
                  <input
                    className="text-input"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="login-btn scale-pressable"
                onClick={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  emailMode === 'login' ? 'Sign In' : 'Sign Up'
                )}
              </button>

              {emailMode === 'login' && (
                <button className="forgot-password-btn scale-pressable" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              )}

              <button
                className="switch-btn scale-pressable"
                onClick={() => setEmailMode(emailMode === 'login' ? 'signup' : 'login')}
                disabled={loading}
              >
                {emailMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">OR</span>
          <div className="divider-line" />
        </div>

        {/* Google Sign-In */}
        <button
          className="google-btn scale-pressable"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <div className="google-icon">G</div>
          <span className="google-btn-text">Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
