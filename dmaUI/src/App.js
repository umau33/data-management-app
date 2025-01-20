

import React, { useContext } from 'react';
import DataForm from './Dataform';
import { ThemeContext } from './ThemeContext'; // Import the ThemeContext
import './App.css';

function App() {
  const { theme } = useContext(ThemeContext); // Use the current theme

  return (
    <div
      className="App"
      style={{
        minHeight: '100vh',
        backgroundColor: theme === 'light' ? '#ffffff' : '#333333',
        color: theme === 'light' ? '#000000' : '#ffffff',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
  
      <DataForm />
    </div>
  );
}

export default App;

