import React, { useState, useRef } from 'react';
//import {motion, useScroll, useTransfrom} from "framer-motion";

import './HomePage.css'
import Aurora from './Aurora';


export default function HomePage() {

    // const { scrollY } = useScroll();

    // const homePageScale = useTransfrom(scrollY, [0,400], [1, 0.8]);
    // const homePageOpacity = useTransfrom[scrollY, [0,400], [1, 0]];



    return (


        <main className="hero-section">
            <h1 className="hero-title">CSync</h1>
            <p className="hero-subtitle">"Empowering the collaborate in <br/>
                <span className="highlight">build</span>,{" "}
                <span className="highlight">learn</span> and{" "}
                <span className="highlight">collaborate</span>."
            </p>
        </main>



    )

}