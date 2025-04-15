import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';

// Create the authentication context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRoles = localStorage.getItem('userRoles');
        const userEmail = localStorage.getItem('userEmail');
        
        if (token && userRoles) {
            // Set up axios default headers for all requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser({
                token,
                roles: JSON.parse(userRoles),
                email: userEmail
            });
        }
        
        setLoading(false);
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await axios.post('https://localhost:7116/api/auth/login', { email, password });
            
            const { token, roles } = response.data;
            
            // Save auth data to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userRoles', JSON.stringify(roles));
            localStorage.setItem('userEmail', email);
            
            // Set up axios default headers for all requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser({
                token,
                roles,
                email
            });
            
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Register function
    const register = async (email, password, firstName, lastName) => {
        try {
            setLoading(true);
            const response = await axios.post('https://localhost:7116/api/auth/register', { 
                email, 
                password,
                firstName,
                lastName
            });
            
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('userEmail');
        
        // Remove the default Authorization header
        delete axios.defaults.headers.common['Authorization'];
        
        // Reset state
        setUser(null);
    };
    
    // Request password reset
    const forgotPassword = async (email) => {
        try {
            setLoading(true);
            await axios.post('https://localhost:7116/api/auth/forgot-password', { email });
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request password reset');
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    // Reset password with token
    const resetPassword = async (token, newPassword) => {
        try {
            setLoading(true);
            await axios.post('https://localhost:7116/api/auth/reset-password', { 
                token, 
                newPassword 
            });
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    // Verify email with token
    const verifyEmail = async (token, email) => {
        try {
            setLoading(true);
            await axios.post('https://localhost:7116/api/auth/verify-email', { token, email });
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify email');
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    // Google OAuth login
    const googleLogin = async (tokenId) => {
        try {
            setLoading(true);
            const response = await axios.post('https://localhost:7116/api/auth/google-login', { tokenId });
            
            const { token, roles, email } = response.data;
            
            // Save auth data to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userRoles', JSON.stringify(roles));
            localStorage.setItem('userEmail', email);
            
            // Set up axios default headers for all requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser({
                token,
                roles,
                email
            });
            
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    // Check if user has a specific role
    const hasRole = (role) => {
        if (!user || !user.roles) return false;
        
        // Handle different formats of roles
        if (Array.isArray(user.roles)) {
            return user.roles.includes(role);
        }
        
        // Handle string format (comma-separated roles)
        if (typeof user.roles === 'string') {
            return user.roles.split(',').map(r => r.trim()).includes(role);
        }
        
        // Handle object format with role names as keys
        if (typeof user.roles === 'object' && user.roles !== null) {
            // Handle the specific structure from ASP.NET where roles are in $values array
            if (user.roles.$values && Array.isArray(user.roles.$values)) {
                return user.roles.$values.includes(role);
            }
            
            // Check if it's an object with a specific structure
            if ('roleName' in user.roles || (Array.isArray(user.roles) && user.roles.length > 0 && 'roleName' in user.roles[0])) {
                // Handle array of role objects
                if (Array.isArray(user.roles)) {
                    return user.roles.some(r => r.roleName === role);
                }
                // Handle single role object
                return user.roles.roleName === role;
            }
            
            return role in user.roles || Object.keys(user.roles).includes(role);
        }
        
        return false;
    };
    
    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!user;
    };
    
    // Check if user is an admin
    const isAdmin = () => {
        return hasRole('Admin');
    };
    
    // Check if user is a recruiter
    const isRecruiter = () => {
        return hasRole('Recruiter');
    };
    
    // Provide the auth context value
    const contextValue = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        googleLogin,
        hasRole,
        isAuthenticated,
        isAdmin,
        isRecruiter
    };
    
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider }; 