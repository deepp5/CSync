import { useEffect, useState } from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import LandingPage from "./Pages/LandingPage";

export default function App() {
  //IDK WHAT ANY OF THIS IS??? ------------------------
  // const [users, setUsers] = useState([]);

  // useEffect(() => {
  //   fetch("http://localhost:5000/users")
  //     .then((res) => res.json())
  //     .then((data) => setUsers(data));
  // }, []);
  //---------------------------------------------------

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />}/>
      </Routes>
    </Router>

   
    
  );
}
