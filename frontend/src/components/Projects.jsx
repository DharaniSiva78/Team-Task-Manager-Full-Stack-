import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from './Navbar';
import toast from 'react-hot-toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    members: []
  });
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch projects and tasks in parallel
      const [projectsRes, tasksRes] = await Promise.all([
        axios.get('http://localhost:5000/api/projects', { headers }),
        axios.get('http://localhost:5000/api/tasks', { headers })
      ]);
      
      setProjects(projectsRes.data);
      setAllTasks(tasksRes.data);
      
      if (isAdmin) {
        const usersRes = await axios.get('http://localhost:5000/api/auth/users', { headers });
        setUsers(usersRes.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate project progress based on tasks - FIXED VERSION
  const calculateProjectProgress = (projectId) => {
    // Filter tasks that belong to this project
    const projectTasks = allTasks.filter(task => {
      // Handle both cases: task.project is object or string ID
      const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
      return taskProjectId === projectId;
    });
    
    console.log(`Project ${projectId} has ${projectTasks.length} tasks`); // Debug log
    
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const progress = (completedTasks / projectTasks.length) * 100;
    
    console.log(`Progress: ${completedTasks}/${projectTasks.length} = ${progress}%`); // Debug log
    
    return progress;
  };
  
  // Get dynamic project status based on tasks
  const getProjectDynamicStatus = (projectId) => {
    const projectTasks = allTasks.filter(task => {
      const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
      return taskProjectId === projectId;
    });
    
    if (projectTasks.length === 0) {
      return { text: 'no tasks', color: 'bg-gray-100 text-gray-800' };
    }
    
    const allCompleted = projectTasks.every(task => task.status === 'completed');
    const anyInProgress = projectTasks.some(task => task.status === 'in-progress');
    const anyOverdue = projectTasks.some(task => {
      return task.status !== 'completed' && new Date(task.dueDate) < new Date();
    });
    
    if (allCompleted) {
      return { text: 'completed', color: 'bg-green-100 text-green-800' };
    } else if (anyOverdue) {
      return { text: 'overdue', color: 'bg-red-100 text-red-800' };
    } else if (anyInProgress) {
      return { text: 'in-progress', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingProject) {
        await axios.put(`http://localhost:5000/api/projects/${editingProject._id}`, formData, { headers });
        toast.success('Project updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/projects', formData, { headers });
        toast.success('Project created successfully');
      }
      
      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        await axios.delete(`http://localhost:5000/api/projects/${id}`, { headers });
        toast.success('Project deleted successfully');
        await fetchData();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };
  
  const handleAddMember = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`http://localhost:5000/api/projects/${selectedProject._id}/members`, 
        { userId }, 
        { headers }
      );
      toast.success('Member added successfully');
      await fetchData();
      setShowMembersModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };
  
  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member from the project?')) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        await axios.delete(`http://localhost:5000/api/projects/${selectedProject._id}/members/${userId}`, { headers });
        toast.success('Member removed successfully');
        await fetchData();
      } catch (error) {
        toast.error('Failed to remove member');
      }
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      deadline: '',
      members: []
    });
    setEditingProject(null);
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading projects...</div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-600 mt-2">Manage and track all your projects</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              + Create Project
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const progress = calculateProjectProgress(project._id);
            const dynamicStatus = getProjectDynamicStatus(project._id);
            const projectTasks = allTasks.filter(t => {
              const taskProjectId = typeof t.project === 'object' ? t.project._id : t.project;
              return taskProjectId === project._id;
            });
            const completedCount = projectTasks.filter(t => t.status === 'completed').length;
            
            return (
              <div key={project._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${dynamicStatus.color}`}>
                    {dynamicStatus.text}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{project.description}</p>
                
                {/* Progress Bar Section */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Project Progress</span>
                    <span className="font-semibold">
                      {projectTasks.length > 0 ? `${Math.round(progress)}% (${completedCount}/${projectTasks.length})` : 'No tasks'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {progress === 100 && projectTasks.length > 0 && (
                    <div className="mt-2 text-green-600 text-sm font-semibold flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      ✓ All {projectTasks.length} Tasks Completed!
                    </div>
                  )}
                  {projectTasks.length === 0 && (
                    <div className="mt-2 text-gray-500 text-sm">
                      No tasks created yet. Create tasks to track progress.
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-500">
                    <span className="font-semibold">Owner:</span> {project.owner?.name}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-semibold">Deadline:</span> {format(new Date(project.deadline), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-semibold">Members:</span> {project.members?.length || 0}
                  </p>
                  {project.members && project.members.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-gray-700">Team Members:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.members.map(member => (
                          <span key={member._id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {member.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowMembersModal(true);
                      }}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      + Add Members
                    </button>
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setFormData({
                          name: project.name,
                          description: project.description,
                          deadline: project.deadline ? project.deadline.split('T')[0] : '',
                          members: project.members?.map(m => m._id) || []
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects yet. Click "Create Project" to get started!</p>
          </div>
        )}
        
        {/* Create/Edit Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project description"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                    {editingProject ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Add Members Modal */}
        {showMembersModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Add Members to "{selectedProject.name}"</h2>
              <p className="text-gray-600 mb-4 text-sm">Select users to add to this project:</p>
              
              {selectedProject.members && selectedProject.members.length > 0 && (
                <div className="mb-4">
                  <p className="font-semibold text-gray-700 mb-2">Current Members ({selectedProject.members.length}):</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProject.members.map(member => (
                      <div key={member._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="font-semibold text-gray-700 mb-2">Available Users:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.filter(u => 
                    !selectedProject.members?.some(m => m._id === u._id) && 
                    u._id !== selectedProject.owner?._id
                  ).map(user => (
                    <div key={user._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email} <span className="capitalize">({user.role})</span></p>
                      </div>
                      <button
                        onClick={() => handleAddMember(user._id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {users.filter(u => 
                    !selectedProject.members?.some(m => m._id === u._id) && 
                    u._id !== selectedProject.owner?._id
                  ).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No available users to add</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setSelectedProject(null);
                  }}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Projects;