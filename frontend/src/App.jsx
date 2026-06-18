import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import AuditLog from './pages/AuditLog';
import MyTasks from './pages/MyTasks';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/documents" element={<Layout><Documents /></Layout>} />
                <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/documents/:id" element={<Layout><DocumentDetails /></Layout>} />
        <Route path="/audit" element={<Layout><AuditLog /></Layout>} />
        <Route path="/tasks" element={<Layout><MyTasks /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;