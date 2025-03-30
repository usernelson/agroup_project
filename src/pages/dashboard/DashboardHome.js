import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuthSafe } from '../../utils/contextHelpers';

const DashboardContainer = styled.div`
  padding: 1.5rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const WelcomeCard = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  h2 {
    margin-top: 0;
    color: var(--text-color);
    font-size: 1.5rem;
  }
  
  p {
    color: var(--text-muted);
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  
  .stat-title {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .stat-description {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-color);
  }
`;

const ActivitySection = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 1.5rem;
  
  h3 {
    margin-top: 0;
    color: var(--text-color);
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }
  
  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

/**
 * Dashboard Home Component
 * 
 * Main dashboard page showing key metrics and recent activity
 */
const DashboardHome = () => {
  // Using the safe auth helper that works with any version of the context
  const { userProfile, userRole } = useAuthSafe();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSessions: 0,
    completedActivities: 0,
    feedbackScore: 0
  });
  
  // Get user's first name for personalized greeting
  const firstName = userProfile?.firstName || 
                   userProfile?.given_name || 
                   userProfile?.name?.split(' ')?.[0] || 
                   'Usuario';
  
  // Simulate fetching dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simulated data
        setStats({
          activeSessions: Math.floor(Math.random() * 5) + 1,
          completedActivities: Math.floor(Math.random() * 20) + 5,
          feedbackScore: Math.floor(Math.random() * 20) + 80, // 80-100%
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };
  
  return (
    <DashboardContainer>
      <WelcomeCard>
        <h2>{getGreeting()}, {firstName}</h2>
        <p>
          {userRole === 'profesor' 
            ? 'Bienvenido a tu panel de profesor. Aquí puedes gestionar alumnos, ver estadísticas y acceder a todas las herramientas educativas.' 
            : 'Bienvenido a tu panel de alumno. Aquí puedes ver tu progreso, acceder a recursos y gestionar tu perfil.'}
        </p>
      </WelcomeCard>
      
      <StatsGrid>
        <StatCard>
          <div className="stat-title">Sesiones Activas</div>
          <div className="stat-value">{isLoading ? '...' : stats.activeSessions}</div>
          <div className="stat-description">Sesiones en curso actualmente</div>
        </StatCard>
        
        <StatCard>
          <div className="stat-title">Actividades Completadas</div>
          <div className="stat-value">{isLoading ? '...' : stats.completedActivities}</div>
          <div className="stat-description">En los últimos 30 días</div>
        </StatCard>
        
        <StatCard>
          <div className="stat-title">Calificación de Feedback</div>
          <div className="stat-value">{isLoading ? '...' : `${stats.feedbackScore}%`}</div>
          <div className="stat-description">Basado en las últimas evaluaciones</div>
        </StatCard>
      </StatsGrid>
      
      <ActivitySection>
        <h3>Actividad Reciente</h3>
        <div className="empty-state">
          No hay actividad reciente para mostrar
        </div>
      </ActivitySection>
    </DashboardContainer>
  );
};

export default DashboardHome;
