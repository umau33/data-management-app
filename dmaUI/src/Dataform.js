import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Required for table support
import { ThemeContext } from './ThemeContext';

function DataForm() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [inputData, setInputData] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isGuestLogin, setIsGuestLogin] = useState(false);
  const [isGuestLoginFieldVisible, setIsGuestLoginFieldVisible] = useState(false);
  const [data, setData] = useState([]);
  const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
  const [updateData, setUpdateData] = useState('');
  const [updateId, setUpdateId] = useState(null);

  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    initializeGoogleSignIn();
  }, []);

  const initializeGoogleSignIn = () => {
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
    });
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large' }
    );
  };

  const handleGoogleSignIn = (response) => {
    const userObject = jwtDecode(response.credential);
    setUsername(userObject.name);
    setIsLoggedIn(true);
    setIsGuestLogin(false);
    fetchData();
  };

  const handleGuestLogin = () => {
    if (!guestName.trim()) {
      alert('Please enter a guest name.');
      return;
    }
    setUsername(guestName);
    setIsLoggedIn(true);
    setIsGuestLogin(true);
    fetchData();
  };

  const fetchData = () => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/data`)
      .then((response) => setData(response.data))
      .catch((error) => console.error('Error fetching data:', error));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post(`${process.env.REACT_APP_API_URL}/data`, { data: inputData, username })
      .then(() => {
        fetchData();
        setInputData('');
      })
      .catch((error) => console.error('Error submitting data:', error));
  };

  const handleDelete = (id) => {
    axios
      .delete(`${process.env.REACT_APP_API_URL}/data/${id}`)
      .then(() => fetchData())
      .catch((error) => console.error('Error deleting data:', error));
  };

  const handleUpdate = (id, currentData) => {
    setUpdateId(id);
    setUpdateData(currentData);
    setIsUpdatePopupOpen(true);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`${process.env.REACT_APP_API_URL}/data/${updateId}`, { data: updateData })
      .then(() => {
        fetchData();
        setIsUpdatePopupOpen(false);
        setUpdateData('');
        setUpdateId(null);
      })
      .catch((error) => console.error('Error updating data:', error));
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, 'DataTable.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Data Table', 14, 10);
    const tableColumnHeaders = ['ID', 'Data', 'Username'];
    const tableRows = data.map((item) => [item.id, item.data, item.username]);
    doc.autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 20,
    });
    doc.save('DataTable.pdf');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme === 'light' ? '#ffffff' : '#333333',
        color: theme === 'light' ? '#000000' : '#ffffff',
        transition: 'background-color 0.3s, color 0.3s',
      }}
    >
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '10px 15px',
          backgroundColor: theme === 'light' ? '#000000' : '#ffffff',
          color: theme === 'light' ? '#ffffff' : '#000000',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>

      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Data Management App</h1>
      {!isLoggedIn ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            <div id="google-signin-button"></div>
            <button
              onClick={() => setIsGuestLoginFieldVisible(!isGuestLoginFieldVisible)}
              style={{ padding: '10px 15px', cursor: 'pointer' }}
            >
              Guest Login
            </button>
          </div>
          {isGuestLoginFieldVisible && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <input
                type="text"
                placeholder="Enter Guest Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{ padding: '5px', marginRight: '10px' }}
              />
              <button onClick={handleGuestLogin} style={{ padding: '5px 10px' }}>
                Login
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <h2 style={{ textAlign: 'center' }}>Welcome, {username}!</h2>
       
          <table style={{ margin: '0 auto', borderCollapse: 'collapse', width: '80%', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
  <tbody>
    {data.map((item) => (
      <tr key={item.id}>
        <td>{item.id}</td>
        <td>{item.data}</td>
        <td>{item.username}</td>
        <td>
          <button onClick={() => handleUpdate(item.id, item.data)}>Update</button>
          <button onClick={() => handleDelete(item.id)} style={{ marginLeft: '10px' }}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

          <form onSubmit={handleSubmit} style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <input
              type="text"
              placeholder="Enter Data"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              required
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <button type="submit" style={{ padding: '5px 10px' }}>Insert Data</button>
          </form>
          <div style={{ textAlign: 'center', margin: '20px' }}>
            <button onClick={exportToExcel} style={{ padding: '5px 10px', marginRight: '10px' }}>
              Export to Excel
            </button>
            <button onClick={exportToPDF} style={{ padding: '5px 10px' }}>
              Export to PDF
            </button>
          </div>
          {isUpdatePopupOpen && (
            <div>
              <h3>Update Data</h3>
              <form onSubmit={handleUpdateSubmit}>
                <input
                  type="text"
                  value={updateData}
                  onChange={(e) => setUpdateData(e.target.value)}
                  required
                />
                <button type="submit">Update</button>
                <button onClick={() => setIsUpdatePopupOpen(false)} style={{ marginLeft: '10px' }}>
                  Cancel
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DataForm;
