import React, { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import './TeamManagement.css';
import logo from '../assets/logo/Logo Option 01.svg';

function TeamManagementPage() {
  const { session } = useClerk();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Product Manager');

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = await session.getToken();
      
      const response = await fetch('http://localhost:5001/api/directors/team-members', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setTeamMembers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add team member
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await session.getToken();
      
      // Log what we're sending
      console.log('Sending team member data:', { name, email, role });
      
      const response = await fetch('http://localhost:5001/api/directors/team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, role })
      });

      // Check for error responses and log them
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(`Failed to add team member: ${response.status} ${response.statusText}`);
      }

      // Reset form and refresh list
      fetchTeamMembers();
      
      // After successful addition, close the popup
      setShowAddForm(false);
      // Reset form fields
      setName('');
      setEmail('');
      setRole('Product Manager');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete team member
  const handleDeleteMember = async (id) => {
    try {
      setLoading(true);
      const token = await session.getToken();
      
      const response = await fetch(`http://localhost:5001/api/directors/team-members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete team member');
      }

      // Refresh list
      fetchTeamMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to close the popup when clicking outside
  const handleClosePopup = (e) => {
    if (e.target.className === 'popup-overlay') {
      setShowAddForm(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="team-management">
      <div className="team-header">
        <div className="logo-container">
          <img 
            src={logo} 
            alt="Product Assessment Tool Logo" 
            className="header-logo"
          />
        </div>
        <button 
          className="add-member-button" 
          onClick={() => setShowAddForm(true)}
        >
          Add Team Member
        </button>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Popup for Add Member Form */}
      {showAddForm && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content">
            <div className="popup-header">
              <h2>Add New Team Member</h2>
              <button 
                className="close-button" 
                onClick={() => setShowAddForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="add-member-form">
              <form onSubmit={handleAddMember}>
                <div>
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter team member's full name"
                    className={name ? 'filled' : ''}
                  />
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter team member's email address"
                    className={email ? 'filled' : ''}
                  />
                </div>
                <div>
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className={role !== 'Product Manager' ? 'filled' : ''}
                  >
                    <option value="Product Manager">Product Manager (PM)</option>
                    <option value="Product Designer">Product Designer (UX/UI Designer)</option>
                    <option value="Developer">Developer</option>
                    <option value="Product Marketer">Product Marketer</option>
                    <option value="Business Analyst">Business Analyst</option>
                  </select>
                </div>
                <button type="submit">Add Member</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="team-members-list">
        {loading ? (
          <p>Loading team members...</p>
        ) : teamMembers.length === 0 ? (
          <p>No team members found. Add your first team member to get started.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>
                      {member.role === 'Product Manager' ? 'Product Manager (PM)' :
                       member.role === 'Product Designer' ? 'Product Designer (UX/UI Designer)' :
                       member.role === 'Developer' ? 'Developer' :
                       member.role === 'Product Marketer' ? 'Product Marketer' :
                       member.role === 'Business Analyst' ? 'Business Analyst' : 
                       member.role}
                    </td>
                    <td>
                      <button 
                        className="delete-icon" 
                        onClick={() => handleDeleteMember(member.id)}
                        aria-label="Remove member"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#FF5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {teamMembers.length > 0 && !loading && !error && (
              <div className="status-bar">
                <p>Showing {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TeamManagementPage; 