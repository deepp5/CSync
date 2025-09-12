import React from "react";
import Aurora from "../Components/Aurora";

export default function SignUp(){
    return(
        <div>
            <Aurora
                colorStops={['#fa4efd', '#9172f8', '#21daf2']}
                blend={0.5}
                amplitude={1.15}
                speed={0.6}
            />
        </div>
    );
}