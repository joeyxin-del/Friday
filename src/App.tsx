import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Library from "./pages/Library";
import Reader from "./pages/Reader";
import Watcher from "./pages/Watcher";
import Listener from "./pages/Listener";
import Settings from "./pages/Settings";
import Command from "./pages/Command";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/reader" element={<Reader />} />
          <Route path="/watcher" element={<Watcher />} />
          <Route path="/listener" element={<Listener />} />
          <Route path="/command" element={<Command />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;


