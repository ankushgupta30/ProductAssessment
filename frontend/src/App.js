import React from 'react';
import { ClerkProvider, SignIn, SignUp, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import TeamManagementPage from './pages/TeamManagementPage'; // Make sure this path is correct
import ErrorBoundary from './ErrorBoundary';
import { ReactComponent as Logo3 } from './assets/logo3.svg';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';

// Use environment variable for publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function App() {
  if (!clerkPubKey) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px' }}>
        <h2>Configuration Error</h2>
        <p>Missing Clerk publishable key. Please check your environment variables.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPubKey}>
        <BrowserRouter>
          <div className="App">
            <header className="App-header">
              <div className="header-logo-container">
                <div className="logos-group">
                  <Logo3 className="app-header-logo" />
                </div>
              </div>
              <nav>
                <SignedOut>
                  <Link to="/sign-in" className="nav-link">Sign In</Link>
                  <Link to="/sign-up" className="nav-link">Sign Up</Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/" className="nav-link">Home</Link>
                  <Link to="/team-management" className="nav-link">Team Management</Link>
                  <UserButton />
                </SignedIn>
              </nav>
            </header>

            <main className="App-main">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
                <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
                <Route 
                  path="/team-management" 
                  element={
                    <ProtectedRoute>
                      <TeamManagementPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
