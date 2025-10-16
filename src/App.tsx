import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import PumpFun from "./pages/PumpFun";

const App: React.FC = () => {
  return (
    <div className="bg-gray-950 min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pumpfun" element={<PumpFun />} />
      </Routes>
    </div>
  );
};

export default App;
