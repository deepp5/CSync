import React, { useState, useRef } from 'react';
//import {motion, useScroll, useTransfrom} from "framer-motion";

import './HeroPage.css'
import Aurora from './Aurora';
import Typewriter from 'typewriter-effect'


export default function HomePage() {
    return (
        <main className="hero-section" id="home" href="home">
            <h1 className="hero-title">Built by engineers<span className="comma">,</span> <br></br>for engineers<span className="period">.</span></h1>
            <Typewriter 
            options={{
                strings: ["Created to bring people closer, one project at a time."],
                autoStart: true,
                loop: true,
                
            }}></Typewriter>
        </main>
    );
}