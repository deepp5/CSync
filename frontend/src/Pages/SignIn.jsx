import React, {useState} from "react";
import Aurora from "../Components/LandingPage/Aurora";
import SignInBox from "../Components/SignIn/SignIn";

export default function SignIn(){
    const [username, setUsername] = useState("");
    return(
        <div>
            <Aurora
                colorStops={['#fa4efd', '#9172f8', '#21daf2']}
                blend={0.5}
                amplitude={1.15}
                speed={0.6}
            />
           
            <SignInBox/>
            
        </div>
    );
}