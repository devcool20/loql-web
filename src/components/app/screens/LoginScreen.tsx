'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};

const LoginScreen = () => {
  const [method, setMethod] = useState<'phone' | 'email'>('email');
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>('login');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useStore();
  const isSignup = emailMode === 'signup';

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
    } catch (error: unknown) {
      console.error('OAuth error:', error);
      showAlert('Error', getErrorMessage(error), 'error');
      setLoading(false);
    }
  };

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
    } catch (error: unknown) {
      showAlert('Error', getErrorMessage(error), 'error');
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
    } catch (error: unknown) {
      showAlert('Error', getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error: unknown) {
      showAlert('Error', getErrorMessage(error), 'error');
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
    } catch (error: unknown) {
      showAlert('Error', getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen auth-screen">
      <div className="login-scroll auth-scroll">
        <motion.div
          className="auth-hero-card"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${method}-${emailMode}-${phoneStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <h1 className="login-title auth-title font-serif">
                {method === 'phone'
                  ? phoneStep === 'verify'
                    ? 'Enter your code.'
                    : 'Welcome home.'
                  : isSignup
                    ? 'Create your account.'
                    : 'Welcome home.'}
              </h1>
              <p className="login-subtitle auth-subtitle">
                {method === 'phone'
                  ? phoneStep === 'verify'
                    ? 'Enter the one-time code sent to your phone.'
                    : 'Sign in with your phone number.'
                  : isSignup
                    ? 'Use email to start. Your profile and society come next.'
                    : 'Sign in to discover trusted items, samvaad, and rentals nearby.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="login-tab-container auth-method-switch" aria-label="Choose login method">
          {(['phone', 'email'] as const).map((option) => {
            const active = method === option;
            const Icon = option === 'phone' ? Phone : Mail;
            return (
              <motion.button
                key={option}
                type="button"
                className={`login-tab auth-method-tab ${active ? 'active' : ''}`}
                onClick={() => setMethod(option)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              >
                {active && <motion.span layoutId="auth-method-pill" className="auth-tab-pill" />}
                <Icon size={17} />
                <span className="login-tab-text">{option === 'phone' ? 'Phone' : 'Email'}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="login-form auth-form">
          {method === 'phone' ? (
            <>
              {phoneStep === 'input' ? (
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div className={`phone-row auth-phone-row ${focusedField === 'phone' ? 'is-focused' : ''}`}>
                    <div className="country-code">+91</div>
                    <input
                      className="phone-input"
                      placeholder="9876543210"
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">Verification Code</label>
                  <input
                    className={`otp-input ${focusedField === 'otp' ? 'is-focused' : ''}`}
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onFocus={() => setFocusedField('otp')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}

              <motion.button
                type="button"
                className="login-btn auth-primary-btn"
                onClick={phoneStep === 'input' ? handleSendOtp : handleVerifyOtp}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  <Loader2 size={18} className="auth-spin" />
                ) : (
                  <>
                    {phoneStep === 'input' ? 'Get secure code' : 'Verify and enter'}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </>
          ) : (
            <>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className={`icon-input auth-input-shell ${focusedField === 'email' ? 'is-focused' : ''}`}>
                  <span className="auth-input-icon"><Mail size={18} /></span>
                  <input
                    className="text-input"
                    placeholder="john@example.com"
                    type="email"
                    autoCapitalize="none"
                    value={email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className={`icon-input auth-input-shell ${focusedField === 'password' ? 'is-focused' : ''}`}>
                  <span className="auth-input-icon"><Lock size={18} /></span>
                  <input
                    className="text-input"
                    placeholder={isSignup ? 'Create a strong password' : 'Enter your password'}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-ghost-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="button"
                className="login-btn auth-primary-btn"
                onClick={handleEmailAuth}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  <Loader2 size={18} className="auth-spin" />
                ) : (
                  <>
                    {isSignup ? 'Create account' : 'Enter Loql'}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>

              {emailMode === 'login' && (
                <button type="button" className="forgot-password-btn auth-link-btn" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              )}

              <button
                type="button"
                className="switch-btn auth-switch-btn"
                onClick={() => setEmailMode(emailMode === 'login' ? 'signup' : 'login')}
                disabled={loading}
              >
                {emailMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </>
          )}
        </div>

        <div className="divider auth-divider">
          <div className="divider-line" />
          <span className="divider-text">OR</span>
          <div className="divider-line" />
        </div>

        <motion.button
          type="button"
          className="google-btn auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
        >
          <div className="google-icon auth-google-icon">G</div>
          <span className="google-btn-text">Continue with Google</span>
        </motion.button>

        <Image className="auth-diya-accent" src="/diya-removebg-preview.png" alt="" width={116} height={116} aria-hidden="true" />
      </div>
    </div>
  );
};

export default LoginScreen;
