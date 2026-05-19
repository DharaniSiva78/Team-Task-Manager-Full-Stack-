const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Helper function to update project status based on its tasks
const updateProjectStatus = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;
    
    const tasks = await Task.find({ project: projectId });
    
    if (tasks.length === 0) {
      project.status = 'active';
      await project.save();
      return;
    }
    
    const allTasksCompleted = tasks.every(task => task.status === 'completed');
    
    if (allTasksCompleted) {
      project.status = 'completed';
    } else {
      project.status = 'active';
    }
    
    await project.save();
    console.log(`Project ${project.name} status updated to: ${project.status}`);
  } catch (error) {
    console.error('Error updating project status:', error);
  }
};

// Get all tasks for a user
router.get('/', auth, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find()
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
    } else {
      tasks = await Task.find({ assignedTo: req.userId })
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
    }
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task (admin only)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { title, description, project, assignedTo, dueDate, priority } = req.body;
    
    // Verify project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = new Task({
      title,
      description,
      project,
      assignedTo,
      assignedBy: req.userId,
      dueDate: new Date(dueDate),
      priority: priority || 'medium'
    });
    
    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    await task.populate('assignedBy', 'name email');
    
    // Update project status (project becomes active since it has tasks)
    await updateProjectStatus(project);
    
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status (assigned user or admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has permission to update this task
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    await task.save();
    
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    
    // IMPORTANT: Update project status based on all tasks
    await updateProjectStatus(task.project);
    
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task (admin only)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, status } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (priority) task.priority = priority;
    if (status) task.status = status;
    
    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    
    // Update project status
    await updateProjectStatus(task.project);
    
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task (admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const projectId = task.project;
    await task.deleteOne();
    
    // Update project status after task deletion
    await updateProjectStatus(projectId);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;