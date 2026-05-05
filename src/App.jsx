import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';
import Home from './pages/Home';
import Log from './pages/Log';
import Progress from './pages/Progress';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import ToastContainer from './components/ToastContainer';

function App() {
  const { loadingAuth, isOnboarded } = useAppContext();

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={isOnboarded ? <Navigate to="/app" replace /> : <Landing />} />
        <Route path="/login" element={isOnboarded ? <Navigate to="/app" replace /> : <Login />} />
        <Route path="/onboarding" element={isOnboarded ? <Navigate to="/app" replace /> : <Onboarding />} />

        <Route path="/app" element={isOnboarded ? <Layout /> : <Navigate to="/" replace />}>
          <Route index element={<Home />} />
          <Route path="log" element={<Log />} />
          <Route path="progress" element={<Progress />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
