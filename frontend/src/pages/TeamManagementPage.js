import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './TeamManagement.css';

const TeamManagementPage = () => {
  const { getToken } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Member' });

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch('http://localhost:5000/api/directors/team-members', {
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
  const addTeamMember = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch('http://localhost:5000/api/directors/team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMember)
      });

      if (!response.ok) {
        throw new Error('Failed to add team member');
      }

      // Reset form and refresh list
      setNewMember({ name: '', email: '', role: 'Member' });
      fetchTeamMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete team member
  const deleteTeamMember = async (id) => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`http://localhost:5000/api/directors/team-members/${id}`, {
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="team-management">
      <h1>Team Management</h1>
      
      {/* Add Team Member Form */}
      <div className="add-member-form">
        <h2>Add Team Member</h2>
        <form onSubmit={addTeamMember}>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newMember.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={newMember.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              name="role"
              value={newMember.role}
              onChange={handleInputChange}
            >
              <option value="Member">Member</option>
              <option value="Lead">Lead</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>
      
      {/* Team Members List */}
      <div className="team-members-list">
        <h2>Team Members</h2>
        
        {loading && <p>Loading...</p>}
        
        {error && (
          <div className="error">
            <p>Error: {error}</p>
            <button onClick={fetchTeamMembers}>Try Again</button>
          </div>
        )}
        
        {teamMembers.length === 0 && !loading && !error ? (
          <p>No team members found. Add your first team member above.</p>
        ) : (
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
                  <td>{member.role}</td>
                  <td>
                    <button onClick={() => deleteTeamMember(member.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeamManagementPage; 