import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import SoloGame from './SoloGame'
import MultiGame from './MultiGame'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/solo" element={<SoloGame />} />
        <Route path="/multi" element={<MultiGame />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)