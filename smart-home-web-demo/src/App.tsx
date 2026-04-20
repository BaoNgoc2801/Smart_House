import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { HomeDemo } from './pages/HomeDemo';
import { ElderlyDashboard } from './pages/ElderlyDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/demo" replace />} />
          <Route path="demo" element={<HomeDemo />} />
          <Route path="dashboard" element={<ElderlyDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
