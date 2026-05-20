import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isAfter, parseISO } from 'date-fns';
import Navbar from './Navbar';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    averageProjectProgress: 0  // NEW: average progress across all projects
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Calculate progress for a single project (0-100)
  const calculateProjectProgress = (projectTasks) => {
    if (projectTasks.length === 0) return 0;
    
    let totalProgress = 0;
    projectTasks.forEach(task => {
      if (task.status === 'completed') {
        totalProgress += 100;
      } else if (task.status === 'in-progress') {
        totalProgress += 50;
      }
      // pending tasks add 0
    });
    
    return totalProgress / projectTasks.length;
  };
  
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const projectsRes = await axios.get('https://team-task-manager-backend-jhdq.onrender.com/api/projects', { headers });
      const projects = projectsRes.data;
      
      const tasksRes = await axios.get('https://team-task-manager-backend-jhdq.onrender.com/api/tasks', { headers });
      const tasks = tasksRes.data;
      setAllTasks(tasks);
      
      const now = new Date();
      
      // Calculate project statistics and average progress
      let completedProjects = 0;
      let totalProjectProgress = 0;
      
      const projectsWithProgress = projects.map(project => {
        const projectTasks = tasks.filter(task => {
          const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
          return taskProjectId === project._id;
        });
        
        const progress = calculateProjectProgress(projectTasks);
        totalProjectProgress += progress;
        
        if (projectTasks.length > 0) {
          const allCompleted = projectTasks.every(task => task.status === 'completed');
          if (allCompleted) {
            completedProjects++;
          }
        }
        
        return { ...project, progress, taskCount: projectTasks.length };
      });
      
      const averageProjectProgress = projects.length > 0 ? totalProjectProgress / projects.length : 0;
      
      // Calculate task statistics
      const completed = tasks.filter(t => t.status === 'completed');
      const overdue = tasks.filter(t => t.status !== 'completed' && isAfter(now, parseISO(t.dueDate)));
      const inProgress = tasks.filter(t => t.status === 'in-progress');
      const pending = tasks.filter(t => t.status === 'pending');
      
      setStats({
        totalProjects: projects.length,
        completedProjects: completedProjects,
        totalTasks: tasks.length,
        completedTasks: completed.length,
        inProgressTasks: inProgress.length,
        pendingTasks: pending.length,
        overdueTasks: overdue.length,
        averageProjectProgress: Math.round(averageProjectProgress)
      });
      
      setRecentTasks(tasks.slice(0, 5));
      setRecentProjects(projectsWithProgress.slice(0, 3));
      
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };
  
  const getProjectStatusMessage = (projectId) => {
    const projectTasks = allTasks.filter(task => {
      const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
      return taskProjectId === projectId;
    });
    
    if (projectTasks.length === 0) return { text: 'No tasks created yet', color: 'text-gray-500' };
    
    const completedCount = projectTasks.filter(t => t.status === 'completed').length;
    const inProgressCount = projectTasks.filter(t => t.status === 'in-progress').length;
    const pendingCount = projectTasks.filter(t => t.status === 'pending').length;
    
    if (completedCount === projectTasks.length) {
      return { text: '✓ All tasks completed!', color: 'text-green-600' };
    } else if (inProgressCount > 0) {
      return { text: `⚙️ ${inProgressCount} in progress, ${pendingCount} pending`, color: 'text-blue-600' };
    } else {
      return { text: `⏳ ${pendingCount} tasks pending`, color: 'text-orange-600' };
    }
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-800">
    {user.role === 'admin' ? (
      <>Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin</span>!</>
    ) : (
      <>Welcome back, {user.name}!</>
    )}
  </h1>
  <p className="text-gray-600 mt-2">
    {user.role === 'admin' 
      ? '👑 You have full administrative access to manage projects, tasks, and team members.'
      : '📋 Here\'s what\'s happening with your tasks today.'}
  </p>
</div>
        
        
        {/* Stats Grid - 7 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs uppercase tracking-wide">Total Projects</p>
                <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
              </div>
              <div className="text-3xl">📁</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs uppercase tracking-wide">Completed Projects</p>
                <p className="text-3xl font-bold mt-1">{stats.completedProjects}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          {/* NEW: Average Progress Card */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-xs uppercase tracking-wide">Avg Project Progress</p>
                <p className="text-3xl font-bold mt-1">{stats.averageProjectProgress}%</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-teal-800 rounded-full h-1.5">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.averageProjectProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs uppercase tracking-wide">Total Tasks</p>
                <p className="text-3xl font-bold mt-1">{stats.totalTasks}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs uppercase tracking-wide">Completed Tasks</p>
                <p className="text-3xl font-bold mt-1">{stats.completedTasks}</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs uppercase tracking-wide">In Progress</p>
                <p className="text-3xl font-bold mt-1">{stats.inProgressTasks}</p>
              </div>
              <div className="text-3xl">⚙️</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-xs uppercase tracking-wide">Overdue Tasks</p>
                <p className="text-3xl font-bold mt-1">{stats.overdueTasks}</p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Recent Tasks</h2>
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task._id} className="border-b border-gray-200 pb-4 last:border-0 hover:bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Project: {task.project?.name || 'N/A'}</span>
                      <span className="text-gray-500">Due: {format(parseISO(task.dueDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Recent Projects</h2>
            {recentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects created yet.</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => {
                  const projectTasks = allTasks.filter(task => {
                    const taskProjectId = typeof task.project === 'object' ? task.project._id : task.project;
                    return taskProjectId === project._id;
                  });
                  const completedCount = projectTasks.filter(t => t.status === 'completed').length;
                  const inProgressCount = projectTasks.filter(t => t.status === 'in-progress').length;
                  const statusMessage = getProjectStatusMessage(project._id);
                  const progress = project.progress || 0;
                  
                  const barColor = progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300';
                  
                  return (
                    <div key={project._id} className="border-b border-gray-200 pb-4 last:border-0 hover:bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          progress === 100 && projectTasks.length > 0 ? 'bg-green-100 text-green-800' : 
                          progress > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {progress === 100 && projectTasks.length > 0 ? 'completed' : 
                           progress > 0 ? `${Math.round(progress)}% done` : 'no tasks'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <p className="text-gray-500"><span className="font-semibold">Owner:</span> {project.owner?.name}</p>
                        <p className="text-gray-500"><span className="font-semibold">Deadline:</span> {format(new Date(project.deadline), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">
                            {Math.round(progress)}% ({completedCount} completed, {inProgressCount} in progress)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className={`text-xs mt-2 ${statusMessage.color}`}>
                          {statusMessage.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Project Completion Summary - UPDATED */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Project Progress Summary</h2>
          
          
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Average Project Progress</span>
                <span className="font-semibold text-teal-600 text-lg">{stats.averageProjectProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-teal-500 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-xs text-white"
                  style={{ width: `${stats.averageProjectProgress}%` }}
                >
                  {stats.averageProjectProgress > 20 && `${stats.averageProjectProgress}%`}
                </div>
              </div>
              
              <div className="flex justify-between mt-6 text-sm">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-green-600">{stats.completedProjects}</p>
                  <p className="text-gray-500 text-xs">Fully Completed<br/>(all tasks done)</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalProjects - stats.completedProjects}</p>
                  <p className="text-gray-500 text-xs">Active Projects<br/>(in progress)</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
                  <p className="text-gray-500 text-xs">Total Projects</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    className="text-gray-200"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-teal-500 transition-all duration-500"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - (stats.averageProjectProgress / 100))}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {stats.averageProjectProgress}%
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Fully Completed (100%)</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Average Progress: {stats.averageProjectProgress}%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Partially Complete (1-99%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;