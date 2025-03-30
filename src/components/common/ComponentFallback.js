import React from 'react';

const ComponentFallback = ({ name = 'Component' }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', margin: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{ color: '#555' }}>{name} no disponible</h3>
      <p>Este componente no está disponible en este momento.</p>
    </div>
  );
};

export default ComponentFallback;
