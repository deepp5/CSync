// import {React, useState, useRef } from "react"
// import {motion} from "framer-motion";
// import './AboutUs.css'
// import Deep from '../../assets/D.png'
// import Jay from '../../assets/J.png'
// import Vishrut from '../../assets/V.jpeg'



// export default function AboutUs() {

//     return(
//         <section id="about" className="about-section" href="#about">
//             <motion.h2 
//                 className="about-title"
//                 initial={{ opacity: 0, y: 50 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.8 }}
//                 viewport={{ once: true }}
//             >
//                 About Us
//             </motion.h2>

//             <div className="founders-container">
//                 {/* Deep */}
//                 <motion.div 
//                     className="founder-card"
//                     initial={{ opacity: 0, y: 20 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     whileHover={{ 
//                         scale: 1.05, 
//                         transition: {duration: .005},
//                     }}
//                 >
//                     <img src={Deep} alt="Deep" className="founder-img" />
//                     <div className="founder-box">
//                         <h3>Deep</h3>
//                         <p>
//                         Short description about Founder 1. Passionate about building, learning, and collaborating.
//                         </p>
//                     </div>
//                 </motion.div>
                

//                 {/* Jay */}
//                 <motion.div 
//                     className="founder-card"
//                     initial={{ opacity: 0, y: 20 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     whileHover={{ 
//                         scale: 1.05, 
//                         transition: {duration: .005},
//                     }}
//                 >
//                     <img src={Jay} alt="Jay" className="founder-img" />
//                     <div className="founder-box">
//                         <h3>Jay</h3>
//                         <p>
//                         Short description about Founder 2. Brings creativity and vision 
//                         to the team.
//                         </p>
//                     </div>
//                 </motion.div>

//                 {/* Vishrut */}
//                 <motion.div 
//                     className="founder-card"
//                     initial={{ opacity: 0, y: 20 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     whileHover={{ 
//                         scale: 1.05, 
//                         transition: {duration: .005},
//                     }}
//                 >
//                     <img src={Vishrut} alt="Vishrut" className="founder-img" />
//                     <div className="founder-box">
//                         <h3>Vishrut</h3>
//                         <p>
//                         Short description about Founder 3. Focused on innovation and 
//                         collaboration.
//                         </p>
//                     </div>
//                 </motion.div>
//             </div>
//         </section>

//     );

// }
