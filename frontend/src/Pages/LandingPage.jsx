import React from "react";
import Aurora from "../Components/LandingPage/Aurora";
import NavBar from "../Components/LandingPage/NavBar";
import HomePage from "../Components/LandingPage/HeroPage";
import AboutUs from "../Components/LandingPage/AboutUs";
import FeaturesPage from "../Components/LandingPage/Features";
import FAQ from "../Components/LandingPage/FAQ";
import ContactUs from "../Components/LandingPage/ContactUs"
import Footer from "../Components/LandingPage/Footer"

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
            <FeaturesPage/>
            <FAQ/>
            <ContactUs/>
            <Footer/>

        </div>
    );
}

