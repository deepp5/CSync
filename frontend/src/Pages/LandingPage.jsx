import React from "react";
import Aurora from "../Components/Aurora";
import NavBar from "../Components/NavBar";
import HomePage from "../Components/HomePage";
import AboutUs from "../Components/AboutUs";

export default function LandingPage(){
    return(
    <div>
        <Aurora
            colorStops={['#fa4efd', '#9172f8', '#21daf2']}
            blend={0.5}
            amplitude={1.15}
            speed={0.6}
        />
        <NavBar/>
        <HomePage/>
        <AboutUs/>
    </div>);
}

