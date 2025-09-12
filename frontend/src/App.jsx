import { useEffect, useState } from "react";
import LandingPage from "./Pages/LandingPage";

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <div>
      <LandingPage />
    </div>

   
    
  );
}
