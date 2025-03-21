import React, { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import './TeamManagement.css';

function TeamManagementPage() {
  const { session } = useClerk();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSurveyLinkPopup, setShowSurveyLinkPopup] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [surveyLink, setSurveyLink] = useState('');
  const [surveyLinkError, setSurveyLinkError] = useState(null);
  const [surveyLinkLoading, setSurveyLinkLoading] = useState(false);
  const [surveyTemplates, setSurveyTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
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

  // Fetch survey templates
  useEffect(() => {
    const fetchSurveyTemplates = async () => {
      try {
        const token = await session.getToken();
        
        const response = await fetch('http://localhost:5001/api/surveys/templates', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch survey templates');
        }
        
        const data = await response.json();
        setSurveyTemplates(data);
        
        // Set first template as default selected
        if (data.length > 0) {
          setSelectedTemplateId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching survey templates:', err);
      }
    };
    
    fetchSurveyTemplates();
  }, [session]);
  
  // Generate survey link
  const handleGenerateSurveyLink = async () => {
    if (!selectedTemplateId) {
      setSurveyLinkError('Please select a survey template');
      return;
    }
    
    try {
      setSurveyLinkLoading(true);
      setSurveyLinkError(null);
      
      const token = await session.getToken();
      
      const response = await fetch('http://localhost:5001/api/surveys/assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          teamMemberId: selectedMember.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate survey link');
      }
      
      const data = await response.json();
      setSurveyLink(data.surveyUrl);
    } catch (err) {
      setSurveyLinkError(err.message);
    } finally {
      setSurveyLinkLoading(false);
    }
  };
  
  // Copy survey link to clipboard
  const handleCopySurveyLink = () => {
    navigator.clipboard.writeText(surveyLink)
      .then(() => {
        alert('Survey link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };
  
  // Open survey link popup
  const handleOpenSurveyLinkPopup = (member) => {
    setSelectedMember(member);
    setSurveyLink('');
    setSurveyLinkError(null);
    setShowSurveyLinkPopup(true);
  };
  
  // Close survey link popup
  const handleCloseSurveyLinkPopup = () => {
    setShowSurveyLinkPopup(false);
    setSelectedMember(null);
    setSurveyLink('');
  };

  useEffect(() => {
    fetchTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="team-management">
      <div className="team-header">
        <div className="logo-container">
          <h1 className="app-title">Team Members</h1>
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
                  <th>Survey Status</th>
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
                      {member.survey_status === 'submitted' ? (
                        <span className="status-completed">Completed</span>
                      ) : member.survey_status === 'link_generated' ? (
                        <span className="status-pending">Link Generated</span>
                      ) : (
                        <span className="status-unfilled">Not Started</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="action-button generate-survey"
                        onClick={() => handleOpenSurveyLinkPopup(member)}
                      >
                        Generate Survey Link
                      </button>
                      <button 
                        className="action-button delete"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        Delete
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

      {/* Survey Link Popup */}
      {showSurveyLinkPopup && (
        <div className="popup-overlay" onClick={handleCloseSurveyLinkPopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>Generate Survey Link</h2>
            <p>Generate a survey link for {selectedMember?.name}</p>
            
            {!surveyLink ? (
              <>
                <div className="form-group">
                  <label htmlFor="surveyTemplate">Select Survey Template:</label>
                  <select 
                    id="surveyTemplate" 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {surveyTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {surveyLinkError && <p className="error-message">{surveyLinkError}</p>}
                
                <div className="popup-actions">
                  <button 
                    className="action-button cancel"
                    onClick={handleCloseSurveyLinkPopup}
                  >
                    Cancel
                  </button>
                  <button 
                    className="action-button primary"
                    onClick={handleGenerateSurveyLink}
                    disabled={surveyLinkLoading || !selectedTemplateId}
                  >
                    {surveyLinkLoading ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="survey-link-container">
                  <input 
                    type="text" 
                    value={surveyLink} 
                    readOnly 
                    className="survey-link-input"
                  />
                  <button 
                    className="action-button copy"
                    onClick={handleCopySurveyLink}
                  >
                    Copy Link
                  </button>
                </div>
                <p className="survey-link-instructions">
                  Copy this link and share it with {selectedMember?.name}. 
                  The link will expire in 30 days.
                </p>
                <div className="popup-actions">
                  <button 
                    className="action-button primary"
                    onClick={handleCloseSurveyLinkPopup}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagementPage; 