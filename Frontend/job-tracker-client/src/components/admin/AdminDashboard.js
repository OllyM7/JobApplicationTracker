import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { PlusIcon, UserIcon, ChartBarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

// Admin dashboard sub-components
const AdminUsers = ({ onError }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const [usersResponse, rolesResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/roles')
        ]);
        
        // Handle users data - check for the $values structure first
        let usersData = [];
        if (usersResponse.data && Array.isArray(usersResponse.data.$values)) {
          // Handle the {"$id": ..., "$values": [...]} structure
          usersData = usersResponse.data.$values;
        } else if (Array.isArray(usersResponse.data)) {
          // Handle the case where it's already a plain array
          usersData = usersResponse.data;
        } else if (usersResponse.data && typeof usersResponse.data === 'object') {
          // Fallback: Try converting object values to array (might be less reliable)
          const usersArrayFromObject = Object.values(usersResponse.data);
          // Basic check if the converted array looks like user objects
          if (usersArrayFromObject.length > 0 && typeof usersArrayFromObject[0] === 'object') {
             usersData = usersArrayFromObject;
          } else {
             console.error('Expected users array or {$values: []} but got object:', usersResponse.data);
             const errorMsg = 'Invalid users data format received from server.';
             setError(errorMsg);
             if (onError) onError(errorMsg);
          }
        } else {
          console.error('Expected users array but got:', typeof usersResponse.data, usersResponse.data);
          const errorMsg = 'Invalid users data format received from server. Expected an array of users.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
        
        setUsers(usersData); // Set the extracted or processed users data
        
        // Handle roles data - convert to array if it's an object
        if (Array.isArray(rolesResponse.data)) {
          setAllRoles(rolesResponse.data);
        } else if (rolesResponse.data && typeof rolesResponse.data === 'object') {
          // If it's an object, try to extract roles from it or convert to array
          const rolesArray = Object.values(rolesResponse.data);
          if (rolesArray.length > 0) {
            setAllRoles(rolesArray);
          } else {
            console.error('Expected roles array but got empty object:', rolesResponse.data);
            setAllRoles([]);
          }
        } else {
          console.error('Expected roles array but got:', typeof rolesResponse.data, rolesResponse.data);
          setAllRoles([]);
        }
      } catch (err) {
        console.error('Error fetching users/roles:', err);
        setUsers([]);
        setAllRoles([]);
        const errorMsg = 'Failed to fetch users or roles. ' + (err.response?.data?.message || err.message);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [onError]);
  
  // Ensure users is an array
  const usersArray = Array.isArray(users) ? users : [];

  // Ensure each user has a unique id
  const usersWithIds = usersArray.map((user, index) => {
    if (!user.id) {
      return { ...user, id: `temp-id-${index}` };
    }
    return user;
  });

  const filteredUsers = usersWithIds.filter(user => {
    const matchesSearch = !searchQuery || 
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.userName && user.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = !roleFilter || 
      (Array.isArray(user.roles) && user.roles.includes(roleFilter));
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newRole) return;
    
    try {
      await api.post('/admin/assign-role', {
        userId: selectedUser.id,
        roleName: newRole
      });
      
      setUsers(usersArray.map(user => {
        if (user.id === selectedUser.id) {
          // Make sure roles is an array before adding the new role
          const userRoles = Array.isArray(user.roles) ? user.roles : [];
          return {
            ...user,
            roles: [...new Set([...userRoles, newRole])]
          };
        }
        return user;
      }));
      
      setShowModal(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (err) {
      setError('Failed to assign role. Please try again.');
      console.error(err);
    }
  };

  const handleRemoveRole = async (userId, roleName) => {
    if (!window.confirm(`Are you sure you want to remove the ${roleName} role from this user?`)) {
      return;
    }
    
    try {
      await api.post('/admin/remove-role', {
        userId: userId,
        roleName: roleName
      });
      
      setUsers(usersArray.map(user => {
        if (user.id === userId) {
          // Make sure roles is an array before filtering
          const userRoles = Array.isArray(user.roles) ? user.roles : [];
          return {
            ...user,
            roles: userRoles.filter(role => role !== roleName)
          };
        }
        return user;
      }));
    } catch (err) {
      setError('Failed to remove role. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${userId}`);
      
      setUsers(usersArray.filter(user => user.id !== userId));
    } catch (err) {
      setError('Failed to delete user. Please try again.');
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Username', 'Email', 'Roles', 'Created Date'];
    
    const csvData = filteredUsers.map(user => [
      user.userName || '',
      user.email || '',
      Array.isArray(user.roles) ? user.roles.join(', ') : '',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900">User Management</h2>
          <div className="flex space-x-2">
            <button 
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Export CSV
            </button>
            <button 
              onClick={() => {
                setNewRole('');
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Role
            </button>
          </div>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="search" className="sr-only">Search</label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Search by email or username"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All roles</option>
              {allRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="sr-only">Sort by</label>
            <select
              id="sort-order"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user.id || `user-${user.email}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.userName || 'No username'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(user.roles) ? user.roles.map((role) => (
                            <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {role}
                              <button 
                                onClick={() => handleRemoveRole(user.id, role)}
                                className="ml-1 text-blue-500 hover:text-blue-700"
                              >
                                &times;
                              </button>
                            </span>
                          )) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No roles
                            </span>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 ${
                  currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 ${
                  currentPage === totalPages ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredUsers.length)}
                  </span> of <span className="font-medium">{filteredUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    &laquo;
                  </button>
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      onClick={() => paginate(number + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === number + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {number + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      currentPage === totalPages ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAssignRole}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        {selectedUser ? `Assign Role to ${selectedUser.userName}` : 'Create New Role'}
                      </h3>
                      <div className="mt-4">
                        {selectedUser ? (
                          <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                              Select Role
                            </label>
                            <select
                              id="role"
                              name="role"
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              required
                            >
                              <option value="">Select a role</option>
                              {allRoles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">
                              Role Name
                            </label>
                            <input
                              type="text"
                              name="roleName"
                              id="roleName"
                              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {selectedUser ? 'Assign Role' : 'Create Role'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedUser(null);
                      setNewRole('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminStats = ({ onError }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // 'week', 'month', 'year', 'all'
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/admin/stats${dateRange !== 'all' ? `?range=${dateRange}` : ''}`);
        
        if (response.data && typeof response.data === 'object') {
          setStats(response.data);
          
          // Prepare chart data
          // Application status distribution chart - ensure jobsByStatus is an array
          const jobsByStatus = Array.isArray(response.data.jobsByStatus) 
            ? response.data.jobsByStatus 
            : [];
          const statusLabels = jobsByStatus.map(item => item.status) || [];
          const statusCounts = jobsByStatus.map(item => item.count) || [];
           
          // User registration trend (mock data if not available)
          const userTrendLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          const userTrendData = [5, 8, 12, 15, 22, response.data.newUsers30Days || 24];
           
          setChartData({
            applicationStatus: {
              labels: statusLabels,
              datasets: [{
                label: 'Applications by Status',
                data: statusCounts,
                backgroundColor: [
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                  'rgba(255, 159, 64, 0.6)',
                ],
                borderWidth: 1
              }]
            },
            userTrend: {
              labels: userTrendLabels,
              datasets: [{
                label: 'New User Registrations',
                data: userTrendData,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            }
          });
        } else {
          console.error('Expected object but got:', typeof response.data, response.data);
          setStats(null);
          setChartData(null);
          const errorMsg = 'Failed to fetch statistics. Invalid data format received.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStats(null);
        setChartData(null);
        const errorMsg = 'Failed to fetch statistics. ' + (err.response?.data?.message || err.message);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange, onError]);

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  // Export statistics to CSV
  const exportStatsToCSV = () => {
    if (!stats) return;
    
    const headers = ['Metric', 'Value'];
    
    const flattenedStats = [
      ['Total Users', stats.totalUsers || 0],
      ['Active Users', stats.activeUsers || 0],
      ['New Users (30 days)', stats.newUsers30Days || 0],
      ['Admin Count', stats.adminCount || 0],
      ['Recruiter Count', stats.recruiterCount || 0],
      ['Total Applications', stats.totalApplications || 0],
      ['Applications (30 days)', stats.applications30Days || 0],
      ['Interview Count', stats.interviewCount || 0],
      ['Offer Count', stats.offerCount || 0],
      ['Average Applications Per User', stats.avgApplicationsPerUser?.toFixed(1) || 0]
    ];
    
    // Add status counts
    if (stats.jobsByStatus) {
      stats.jobsByStatus.forEach(status => {
        flattenedStats.push([`${status.status} Applications`, status.count]);
      });
    }
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...flattenedStats.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'admin-statistics.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range and export controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 bg-white rounded-md shadow p-2">
          <button
            onClick={() => handleDateRangeChange('all')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              dateRange === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => handleDateRangeChange('30days')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              dateRange === '30days' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleDateRangeChange('7days')}
            className={`px-3 py-1 text-sm font-medium rounded ${
              dateRange === '7days' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
        </div>
        <button
          onClick={exportStatsToCSV}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Export Stats
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">System Overview</h2>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-indigo-700">Total Users</h3>
              <p className="text-3xl font-bold text-indigo-900 mt-2">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-indigo-500 mt-1">
                {stats?.newUsers30Days || 0} new in last 30 days
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-700">Active Jobs</h3>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats?.activeJobs || 0}</p>
              <p className="text-sm text-green-500 mt-1">
                {stats?.totalJobs - (stats?.activeJobs || 0)} inactive
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-purple-700">Applications</h3>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats?.totalApplications || 0}</p>
              <p className="text-sm text-purple-500 mt-1">
                {stats?.interviewCount || 0} in interview stage
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Statistics</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Active Users</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.activeUsers || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Admins</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.adminCount || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Recruiters</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.recruiterCount || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">New Users (30 days)</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.newUsers30Days || 0}</dd>
              </div>
            </dl>
            
            {/* User Trend Chart */}
            {chartData && (
              <div className="mt-6 h-64">
                <h4 className="text-sm font-medium text-gray-500 mb-2">User Registration Trend</h4>
                <div className="h-full">
                  {/* If using Chart.js, you would render a Line chart here */}
                  {/* For simplicity, showing a mock visualization */}
                  <div className="h-full flex items-end space-x-2">
                    {chartData.userTrend.datasets[0].data.map((value, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t" 
                          style={{ height: `${(value / Math.max(...chartData.userTrend.datasets[0].data)) * 100}%` }}
                        ></div>
                        <span className="text-xs mt-1">{chartData.userTrend.labels[index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Statistics</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Applications (30 days)</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.applications30Days || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Interviews</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.interviewCount || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Offers</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.offerCount || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Average Applications/User</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats?.avgApplicationsPerUser?.toFixed(1) || 0}</dd>
              </div>
            </dl>
            
            {/* Application Status Chart */}
            {chartData && chartData.applicationStatus.labels.length > 0 && (
              <div className="mt-6 h-64">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Applications by Status</h4>
                <div className="h-full">
                  {/* If using Chart.js, you would render a Pie/Doughnut chart here */}
                  {/* For simplicity, showing a mock visualization */}
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col space-y-2 w-full">
                      {chartData.applicationStatus.labels.map((label, index) => {
                        const count = chartData.applicationStatus.datasets[0].data[index];
                        const total = chartData.applicationStatus.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        return (
                          <div key={index} className="w-full">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{label}</span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="h-2.5 rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: chartData.applicationStatus.datasets[0].backgroundColor[index]
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional statistics section for upcoming deadlines */}
      {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Application Deadlines</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {stats.upcomingDeadlines.slice(0, 5).map((application) => (
                <li key={application.id} className="px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{application.position} at {application.companyName}</p>
                      <p className="text-sm text-gray-500">Applied by: {application.applicantEmail || 'Unknown'}</p>
                    </div>
                    <div className="text-sm text-right">
                      <p className="font-medium text-red-600">
                        Deadline: {new Date(application.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500">
                        {Math.ceil((new Date(application.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
};

const AdminJobs = ({ onError }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/jobs');
        
        // Handle jobs data - check for the $values structure first
        let jobsData = [];
        if (response.data && Array.isArray(response.data.$values)) {
          // Handle the {"$id": ..., "$values": [...]} structure
          jobsData = response.data.$values;
        } else if (Array.isArray(response.data)) {
          // Handle the case where it's already a plain array
          jobsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Fallback: Try converting object values to array
          const jobsArrayFromObject = Object.values(response.data);
          if (jobsArrayFromObject.length > 0 && typeof jobsArrayFromObject[0] === 'object') {
            jobsData = jobsArrayFromObject;
          } else {
            console.error('Expected jobs array or {$values: []} but got object:', response.data);
            const errorMsg = 'Invalid data format received from server. Expected an array of jobs.';
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }
        } else {
          console.error('Expected jobs array but got:', typeof response.data, response.data);
          const errorMsg = 'Invalid data format received from server. Expected an array of jobs.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
        
        setJobs(jobsData); // Set the extracted or processed jobs data

      } catch (err) {
        console.error('Error fetching jobs:', err);
        setJobs([]);
        const errorMsg = 'Failed to fetch jobs. Please try again later. ' + (err.response?.data?.message || err.message);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [onError]);
  
  const jobsArray = Array.isArray(jobs) ? jobs : [];
  
  // Ensure each job has a unique id
  const jobsWithIds = jobsArray.map((job, index) => {
    if (!job.id) {
      return { ...job, id: `temp-job-id-${index}` };
    }
    return job;
  });
  
  const statuses = [...new Set(jobsWithIds.map(job => job.status || 'Unknown'))];

  const filteredJobs = jobsWithIds.filter(job => {
    const matchesSearch = !searchQuery || 
      (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
    } else {
      return new Date(a.postedDate || 0) - new Date(b.postedDate || 0);
    }
  });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const fetchApplications = async (jobId) => {
    try {
      setLoadingApplications(true);
      const response = await api.get(`/admin/jobs/${jobId}/applications`);
      let processedApplications = [];
      
      if (Array.isArray(response.data)) {
        processedApplications = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object, try to extract applications from it or convert to array
        processedApplications = Object.values(response.data);
        if (processedApplications.length === 0) {
          console.error('Expected array but got empty object:', response.data);
          setError('Invalid data format received for applications.');
        }
      } else {
        console.error('Expected array but got:', typeof response.data, response.data);
        setError('Invalid data format received for applications.');
      }
      
      // Ensure each application has a unique id
      const applicationsWithIds = processedApplications.map((app, index) => {
        if (!app.id) {
          return { ...app, id: `temp-app-id-${index}` };
        }
        return app;
      });
      
      setApplications(applicationsWithIds);
      setSelectedJob(jobsArray.find(job => job.id === jobId) || { id: jobId, title: 'Unknown Job', company: 'Unknown Company' });
      setShowApplicationsModal(true);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to fetch applications for this job. ' + (err.response?.data?.message || err.message));
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Company', 'Posted By', 'Applications', 'Status', 'Date Posted'];
    
    const csvData = filteredJobs.map(job => [
      job.title || '',
      job.company || '',
      job.recruiterName || '',
      job.applicationCount || '0',
      job.isActive ? 'Active' : 'Inactive',
      new Date(job.postedDate).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'jobs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900">All Job Postings</h2>
          <button 
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Export CSV
          </button>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="job-search" className="sr-only">Search</label>
            <input
              type="text"
              id="job-search"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Search by title or company"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="job-sort-order" className="sr-only">Sort by</label>
            <select
              id="job-sort-order"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posted By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Posted
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentJobs.length > 0 ? (
                  currentJobs.map((job) => (
                    <tr key={job.id || `job-${job.title}-${job.company}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{job.title || 'Untitled Job'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.company || 'Unknown Company'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{job.recruiterName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => fetchApplications(job.id)} 
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {job.applicationCount || 0} {job.applicationCount === 1 ? 'application' : 'applications'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          job.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.postedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => fetchApplications(job.id)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          View Applications
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No jobs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 ${
                  currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 ${
                  currentPage === totalPages ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredJobs.length)}
                  </span> of <span className="font-medium">{filteredJobs.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    &laquo;
                  </button>
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      onClick={() => paginate(number + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === number + 1
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {number + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      currentPage === totalPages ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showApplicationsModal && selectedJob && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Applications for {selectedJob.title} at {selectedJob.company}
                    </h3>
                    <div className="mt-4">
                      {loadingApplications ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                      ) : applications.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Applicant
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Applied Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {applications.map(app => (
                                <tr key={app.id || `app-${app.applicantEmail}-${app.applicationDate}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{app.applicantName || app.applicantEmail || 'Unknown Applicant'}</div>
                                    <div className="text-sm text-gray-500">{app.applicantEmail || 'No email'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${
                                        app.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                                        app.status === 'Interviewing' ? 'bg-yellow-100 text-yellow-800' :
                                        app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        app.status === 'AwaitingOffer' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }
                                    `}>
                                      {app.status || 'Unknown'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : 'Unknown date'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No applications found for this job.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowApplicationsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [dashboardError, setDashboardError] = useState(null);

  // Map of tab IDs to components
  const tabComponents = {
    'stats': <AdminStats onError={(err) => setDashboardError(err)} />,
    'users': <AdminUsers onError={(err) => setDashboardError(err)} />,
    'jobs': <AdminJobs onError={(err) => setDashboardError(err)} />,
    'roles': <AdminRoles onError={(err) => setDashboardError(err)} />
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage system users and settings</p>
      </div>
      
      {dashboardError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Dashboard Error</p>
          <p>{dashboardError}</p>
        </div>
      )}

      <div className="bg-white shadow">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="stats">Statistics</option>
            <option value="users">Users</option>
            <option value="jobs">Jobs</option>
            <option value="roles">Roles</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('stats')}
              className={`${
                activeTab === 'stats'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`${
                activeTab === 'jobs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
            >
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`${
                activeTab === 'roles'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Roles
            </button>
          </nav>
        </div>
      </div>
      
      <div>
        {tabComponents[activeTab]}
      </div>
    </div>
  );
};

// Add the AdminRoles component
const AdminRoles = ({ onError }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersInRole, setUsersInRole] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/admin/roles');
        
        if (Array.isArray(response.data)) {
          setRoles(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // If it's an object, try to extract roles from it or convert to array
          const rolesArray = Object.values(response.data);
          if (rolesArray.length > 0) {
            setRoles(rolesArray);
          } else {
            console.error('Expected array of roles but got empty object:', response.data);
            setRoles([]);
            const errorMsg = 'Failed to fetch roles. Invalid data format received from server.';
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }
        } else {
          console.error('Expected array of roles but got:', typeof response.data, response.data);
          setRoles([]);
          const errorMsg = 'Failed to fetch roles. Invalid data format received from server.';
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setRoles([]);
        const errorMsg = 'Failed to fetch roles. ' + (err.response?.data?.message || err.message);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [onError]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    try {
      setError(null);
      const response = await api.post('/admin/roles', { name: newRoleName.trim() });
      
      // Validate the response
      if (response.data) {
        // If response.data is a string (role name), add it to roles
        if (typeof response.data === 'string') {
          setRoles([...roles, response.data]);
        } 
        // If response.data is an object with a name property, add that
        else if (typeof response.data === 'object' && response.data.name) {
          setRoles([...roles, response.data.name]);
        } 
        // Otherwise just refetch the roles
        else {
          const rolesResponse = await api.get('/admin/roles');
          if (Array.isArray(rolesResponse.data)) {
            setRoles(rolesResponse.data);
          }
        }
      }
      
      setNewRoleName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create role:', err);
      setError('Failed to create role. ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`Are you sure you want to delete the ${roleName} role? This may affect users with this role.`)) {
      return;
    }
    
    try {
      setError(null);
      await api.delete(`/admin/roles/${roleName}`);
      setRoles(roles.filter(role => role !== roleName));
    } catch (err) {
      console.error('Failed to delete role:', err);
      setError('Failed to delete role. It may be in use or you do not have permission. ' + 
        (err.response?.data?.message || err.message));
    }
  };

  const fetchUsersInRole = async (roleName) => {
    try {
      setLoadingUsers(true);
      setError(null);
      const response = await api.get(`/admin/roles/${roleName}/users`);
      let processedUsers = [];
      
      if (Array.isArray(response.data)) {
        processedUsers = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object, try to extract users from it or convert to array
        processedUsers = Object.values(response.data);
        if (processedUsers.length === 0) {
          console.error('Expected array of users but got empty object:', response.data);
          setError('Invalid data format received for users in role.');
        }
      } else {
        console.error('Expected array of users but got:', typeof response.data, response.data);
        setError('Invalid data format received for users in role.');
      }
      
      // Ensure each user has a unique id
      const usersWithIds = processedUsers.map((user, index) => {
        if (!user.id) {
          return { ...user, id: `temp-role-user-id-${index}` };
        }
        return user;
      });
      
      setUsersInRole(usersWithIds);
      setSelectedRole(roleName);
      setShowUsersModal(true);
    } catch (err) {
      console.error('Failed to fetch users with role:', err);
      setError('Failed to fetch users with this role. ' + (err.response?.data?.message || err.message));
      setUsersInRole([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Ensure roles is an array
  const rolesArray = Array.isArray(roles) ? roles : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Role Management</h2>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create Role
          </button>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rolesArray.length > 0 ? (
                  rolesArray.map((role) => (
                    <tr key={role}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => fetchUsersInRole(role)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Users
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Prevent deletion of core roles */}
                        {!['Admin', 'User', 'Recruiter'].includes(role) && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? 'Loading roles...' : error ? 'Error loading roles' : 'No roles found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateRole}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Create New Role
                      </h3>
                      <div className="mt-4">
                        <label htmlFor="role-name" className="block text-sm font-medium text-gray-700">
                          Role Name
                        </label>
                        <input
                          type="text"
                          name="role-name"
                          id="role-name"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Users in Role Modal */}
      {showUsersModal && selectedRole && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Users with {selectedRole} Role
                    </h3>
                    <div className="mt-4">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                      ) : usersInRole.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Username
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Other Roles
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {usersInRole.map((user, index) => (
                                <tr key={user.id || `role-user-${user.email || index}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.userName || 'N/A'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                      {Array.isArray(user.roles) ? 
                                        user.roles
                                          .filter(role => role !== selectedRole)
                                          .map(role => (
                                            <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              {role}
                                            </span>
                                          )) 
                                        : 
                                        <span className="text-sm text-gray-500">None</span>
                                      }
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No users found with this role.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowUsersModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 