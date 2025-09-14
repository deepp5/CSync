import React from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/SignIn/SignIn";

export default function SignIn(){
    return(
        <body>
            <Aurora
                colorStops={['#fa4efd', '#9172f8', '#21daf2']}
                blend={0.5}
                amplitude={1.15}
                speed={0.6}
            />
           
            <SignInBox/>
           
            
        </body>
    );
}