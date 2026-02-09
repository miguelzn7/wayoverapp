import React, {useState} from "react";
import './welcome.css';
import { supabase } from "../lib/supabase";

const WelcomePage = ({ onLoginSuccess }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    

    // handle email authentication and signup
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            
            let authResponse; 

            if (isSignUp) {
                // sign up with email
                authResponse = await supabase.auth.signUp({ email, password });
            } else {
                authResponse = await supabase.auth.signInWithPassword({ email, password });
            }
            if (authResponse.error) throw authResponse.error;

            if (authResponse.data.session) {
              onLoginSuccess();
            }

        
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;

        } catch (err) {
            setError(err.message);
        }
    };

     return (
    <div className="welcome-container">
      <div className="welcome-card">
        {/* Logo */}
        <div className="welcome-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="white"/>
            <path d="M14 28L24 18L34 28" stroke="#155e31" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 24L28 16" stroke="#155e31" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="30" cy="14" r="2" fill="#155e31"/>
          </svg>
        </div>

        <h1 className="welcome-title">welcome to<br/>wayover</h1>
        <p className="welcome-subtitle">selamat datang</p>

        {error && <div className="error-message">{error}</div>}

        {!isSignUp ? (
          <>
            <form onSubmit={handleEmailAuth}>
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group">
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Log In'}
              </button>
            </form>

            <button onClick={handleGoogleSignIn} className="btn-google">
              <img 
                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                alt="Google" 
                className="google-icon" 
              />
              Log In with Google
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button className="btn-secondary" onClick={() => setIsSignUp(true)}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            <form onSubmit={handleEmailAuth}>
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group">
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Sign Up'}
              </button>
            </form>

            <p className="toggle-text">
              Already have an account?{' '}
              <span onClick={() => setIsSignUp(false)}>Log In</span>
            </p>
          </>
        )}

        <p className="welcome-tagline">Indonesian thrift finds, delivered worldwide</p>
      </div>
    </div>
  );
};

export default WelcomePage;
