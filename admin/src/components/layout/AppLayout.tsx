import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isMessaging = location.pathname === '/messaging';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMessaging ? 0 : 24,
            background: '#F0F4FF',
            display: 'flex',
            flexDirection: 'column',
            gap: isMessaging ? 0 : 24,
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
