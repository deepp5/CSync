import { useEffect, useState } from "react";
//import {motion, useScroll, useTransfrom} from "framer-motion";





import NavBar from './Components/LandingPage/NavBar'
import Aurora from './Components/LandingPage/Aurora';
import HomePage from "./Components/LandingPage/HomePage";
import AboutUs from "./Components/LandingPage/AboutUs";

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  // const { scrollY } = useScroll();

  // const homePageScale = useTransfrom(scrollY, [0,400], [1, 0.8]);
  // const homePageOpacity = useTransfrom[scrollY, [0,400], [1, 0]];


  return (
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
      {/*<div className="p-4">
      <h1 className="text-2xl font-bold text-blue-600">Users</h1>
      <ul className="mt-2">
        {users.map((u) => (
          <li key={u.id}>
            {u.name} - {u.email}
          </li>
        ))}
      </ul>
    </div>*/}

    </div>

   
    
  );
}
