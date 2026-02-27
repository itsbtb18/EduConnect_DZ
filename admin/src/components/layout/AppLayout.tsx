import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './AppLayout.css';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isMessaging = location.pathname === '/messaging';

  return (
    <div className="app-layout">
      <Header />
      <div className="app-layout__body">
        <Sidebar />
        <div className={`app-layout__content${isMessaging ? ' app-layout__content--flush' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
