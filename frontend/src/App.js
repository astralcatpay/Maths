import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import MathStudio from "@/pages/MathStudio";

function App() {
  return (
    <div className="App app-bg min-h-screen text-foreground">
      <div className="grid-pattern" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MathStudio />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(240 14% 9%)",
            border: "1px solid hsla(180, 100%, 55%, 0.25)",
            color: "#eaffff",
          },
        }}
      />
    </div>
  );
}

export default App;
