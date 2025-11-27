import React, {useState} from 'react'

import colorLogo from '../../assets/whiteCSync.png'
import './SignInBox.css'

export default function SignInBox(){

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const handleInputChange = (e) => {
        const {name, value } = e.target;

        if(errors[name]){
            setErrors(prev => ({...prev, [name]: ''}));
        } 
        setFormData(prev => ({...prev, [name]: value}));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if(!formData.username.trim()){
            newErrors.username = 'Username or email is required';
        }else if(formData.username.length < 5){ // change this so that we set a requirement for the username. We should add more conditions to this and password.
            newErrors.username = 'Username must be atleast 5 characters long';
        }

        if(!formData.password){
            newErrors.password = 'Password is required';
        }else if(formData.password.length < 8){
            newErrors.password = 'Password must be atleast 8 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);

        //uncomment the next lines of code as soon as database is running 
        //and change some things so that it matches with the database req
        
        // try {
        // // Here's where you'll integrate with your backend
        //     console.log('Form submitted:', formData);
            
        //     // Example backend call (replace with your actual endpoint)
        //     const response = await fetch('/api/auth/login', {
        //         method: 'POST',
        //         headers: {
        //         'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({
        //         username: formData.username,
        //         password: formData.password
        //         })
        //     });
        
        //     if (response.ok) {
        //         const data = await response.json();
        //         console.log('Login successful:', data);
        //         // Handle successful login (redirect, store token, etc.)
        //         // Example: localStorage.setItem('token', data.token);
        //         // Example: navigate('/dashboard');
        //     } else {
        //         const errorData = await response.json();
        //         setErrors({ submit: errorData.message || 'Login failed' });
        //     }
        
        // } catch (error) {
        //     console.error('Login error:', error);
        //     setErrors({ submit: 'Network error. Please try again.' });
        // } finally {
        //     setIsLoading(false);
            
        // }
    };


    //try getting sign in with google set up and the logic for the forgot password
//     const handleGoogleSignIn = () => {
//         console.log('Google sign in clicked');
//         // Implement your Google OAuth logic here
//     };

//   // Handle Forgot Password
//     const handleForgotPassword = (e) => {
//         e.preventDefault();
//         console.log('Forgot password clicked');
//         // Implement forgot password logic here
//     };



    return(
        <div className='login-page-container'>
            <div className='clear-box-container'>
                <div id='logo-container'>
                    <img src={colorLogo} alt='Logo'/>
                    <h3 className='title'>Sign in to CSync</h3>
                </div>

                <form className='sign-option' id='sign-option' onSubmit={handleSubmit}>
                    <div className='username-container'>
                        <label htmlFor="username">Email address</label>

                        <input 
                        type='text' 
                        id='username' 
                        name='username' 
                        className='username'
                        placeholder='Enter your email address' 
                        value={formData.username}
                        onChange={handleInputChange}
                        autoComplete="username"
                        disabled={isLoading}
                        />
                        {/*errors.username && (<span className="error-message">{errors.username}</span>)*/}

                    </div>

                    <div className='password-container'>
                        <label htmlFor='password'>Password</label>
                        {/* <a href='#forgotpassword' className='forgot-password-link' onClick={handleForgotPassword}}> Forgot Password? </a> */} {/*Get a new page for forgot password will need this*/}
                        <input 
                        type={showPassword ? 'text' : 'password'}
                        id='password' 
                        name='password'
                        className='password' 
                        placeholder='Enter your password' 
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            // onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}>
                            {/* {showPassword ? '👁️' : '👁️‍🗨️'} */}
                        </button>
                        {/* {errors.password && (
                        <span className="error-message">{errors.password}</span>
                        )} */}
                    </div>

                    <div className='submit-container'>
                        <button type='submit'>Sign in</button>
                    </div>

                </form>
                <div className='or' id='or'>
                    <p>or</p>
                </div>
                <div className='auth-with-different-signins'>
                {/* <button type="button" className="google-signin-btn" onClick={onSignIn} /* <-- call your Google sign-in function>
                        <img src="/google-logo.svg" alt="Google logo" className="google-icon"/>
                        Continue with Google
                    </button> */}
                    {/* add more sign in options in the future */}
                </div>
            </div>

        </div>
    )
}