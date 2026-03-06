import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TrackingBoard } from './components/TrackingBoard';
import { PatientChart } from './components/PatientChart';
import { resetPatients } from './store';

export default function App() {
  useEffect(() => {
    resetPatients().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TrackingBoard />} />
          <Route path="patient/:id" element={<PatientChart />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
