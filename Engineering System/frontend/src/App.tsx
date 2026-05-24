import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import IssueDetail from "./pages/IssueDetail";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/issue/:id" element={<IssueDetail />} />
      </Routes>
    </Layout>
  );
}

