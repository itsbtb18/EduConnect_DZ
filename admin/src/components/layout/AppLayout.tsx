import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const AppLayout: React.FC = () => (
  <div className="app-layout">
    <Header />
    <div className="app-layout__body">
      <Sidebar />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;
