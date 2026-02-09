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
        <h1>WAYOVER</h1>
        

        {error && <div className="error-message">{error}</div>}

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
          
          <button type="submit" className="email-btn" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleGoogleSignIn} className="google-btn">
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="google-icon" 
          />
          Continue with Google
        </button>

        <p className="toggle-text">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
