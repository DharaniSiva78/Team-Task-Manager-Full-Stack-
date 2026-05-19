const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Get all projects (admin sees all, members see their projects)
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('owner', 'name email')
        .populate('members', 'name email');
    } else {
      projects = await Project.find({
        $or: [
          { owner: req.userId },
          { members: req.userId }
        ]
      })
      .populate('owner', 'name email')
      .populate('members', 'name email');
    }
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && 
        project.owner._id.toString() !== req.userId && 
        !project.members.some(m => m._id.toString() === req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project (admin only)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, description, deadline, members } = req.body;
    
    const project = new Project({
      name,
      description,
      owner: req.userId,
      deadline: new Date(deadline),
      members: members || []
    });
    
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (admin only)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { name, description, status, deadline, members } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (deadline) project.deadline = new Date(deadline);
    if (members) project.members = members;
    
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete all tasks in this project
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project tasks
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check access
    if (req.user.role !== 'admin' && 
        project.owner.toString() !== req.userId && 
        !project.members.includes(req.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ADD MEMBER MANAGEMENT ENDPOINTS ==========

// Add member to project (admin only)
router.post('/:id/members', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already in project
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in project' });
    }
    
    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email');
    
    res.json({ message: 'Member added successfully', project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from project (admin only)
router.delete('/:id/members/:userId', auth, roleCheck('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    project.members = project.members.filter(
      member => member.toString() !== req.params.userId
    );
    await project.save();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;