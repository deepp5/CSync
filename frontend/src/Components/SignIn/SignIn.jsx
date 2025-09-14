import React from 'react'
import colorLogo from '../../assets/colorCSync.png'
import './SignIn.css'




export default function SignInBox(){
    



    return(

        <div className='clear-box-container'>
            <div id='logo-container'>
                <img src={colorLogo} alt='Logo'/>
                <h3 className='title'>Sign in to CSync</h3>
            </div>

            <form className='sign-option' id='sign-option'>
                <div className='userName-container'>
                    <label htmlFor="UserName">Username or email address</label>
                    <input type='text' id='UserName' className='UserName' placeholder='Enter your Username or email address'/>

                </div>

                <div className='password-container'>
                    <label htmlFor='Password'>Password</label>
                    <input type='text' id='Password' className='Password' placeholder='Enter your Password'/>
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

    )
}