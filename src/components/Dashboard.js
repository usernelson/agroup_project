import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Eliminar importación no utilizada
// import { primaryColor } from '../styles/GlobalStyles';

// ...existing code...

const Dashboard = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { logout, userRole } = useAuth();
  // Eliminar variables no utilizadas
  // const { isAuthenticated } = useAuth();
  // const [showExtendModal, setShowExtendModal] = useState(false);
  
  // ...existing code...
};
