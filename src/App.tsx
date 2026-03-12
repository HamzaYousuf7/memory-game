import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import RememberNumber from "./Pages/RememberNumber";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      <Route path="/remember-number" element={<RememberNumber />} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </>
  );
};

export default App;
