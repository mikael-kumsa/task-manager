import React, {useState} from "react";
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import './Login.css';

function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); //Toggle b/n login/signup

    // Handle email/password auth
    const handleEmailAuth = async (e) =>{
        e.preventDefault();
        try{
            if (isLogin){
                //sign in existing user
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // create new user
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (error){
            alert(error.message);
        }
    };

    //handle auth with google
    const handleGoogleAuth = async () =>{
        try{
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error){
            alert(error.message);
        }
    };

    return(
        <div className="login-container">
            <div className="login-card">
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

                {/* Emaol / Passworrd form */}
                <form onSubmit={handleEmailAuth} className="email-form">
                    <input
                        type="email"
                        placeholder="michael@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="email-btn">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                {/*Google Sing in */}
                <button onClick={handleGoogleAuth} className="google-btn">
                    Sign in with Google
                </button>

                {/*login or signup change */}
                <p className="toggle-text">
                    {isLogin ? "Don't have an account? " : "Already have an account?"}
                    <span onClick={() => setIsLogin (!isLogin)} className="toggle-link"> {isLogin ? 'Sign Up' : "Login"}</span>
                </p>
            </div>
        </div>
    )


}

export default Login;