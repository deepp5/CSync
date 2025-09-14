import React, {useState} from 'react'

import colorLogo from '../../assets/colorCSync.png'
import './SignIn.css'




export default function SignInBox(){

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const {errors, setErrors} = useState({});
    const {isLoading, setIsLoading} = useState(false);
    const {showPassword, setShowPassword} = useState(false);
    
    const handleInputChange = (e) => {
        const {name, value } = e.target;

        if(errors[name]){
            setErrors(prev => ({...prev, [name]: ''}));
        } 
        setFormData(prev => ({...prev, [name]: value}));
    };

    return(
        <div className='login-page-container'>
            <div className='clear-box-container'>
                <div id='logo-container'>
                    <img src={colorLogo} alt='Logo'/>
                    <h3 className='title'>Sign in to CSync</h3>
                </div>

                <form className='sign-option' id='sign-option'>
                    <div className='userName-container'>
                        <label htmlFor="UserName">Username or email address</label>
                        <input type='text' id='UserName' className='UserName' placeholder='Enter your Username or email address' onChange={handleUsernameChange} onFocus={(e) => e.stopPropagation}/>

                    </div>

                    <div className='password-container'>
                        <label htmlFor='Password'>Password</label>
                        <input type='text' id='Password' className='Password' placeholder='Enter your Password' onChange={handlePasswordChange} onFocus={(e) => e.stopPropagation}/>
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