# Team Task Manager

A full-stack task management application with role-based access control for teams to collaborate on projects, assign tasks, and track progress in real-time.

## Live Demo

- **Frontend:** [Your Railway Frontend URL]
- **Backend API:** [Your Railway Backend URL]

## Features

### Authentication
- User registration with email/password
- Secure JWT-based authentication
- Password encryption using bcrypt

### Role-Based Access Control

| Feature | Admin | Member |
|---------|-------|--------|
| Create/Edit/Delete Projects | ✅ | ❌ |
| Add/Remove Team Members | ✅ | ❌ |
| Create/Edit/Delete Tasks | ✅ | ❌ |
| Assign Tasks to Members | ✅ | ❌ |
| View All Projects/Tasks | ✅ | ❌ |
| Update Task Status | ✅ | ✅ |
| View Personal Dashboard | ✅ | ✅ |

### Project Management
- Create projects with name, description, and deadline
- Edit project details
- Delete projects (cascades to tasks)
- Add/remove team members to projects
- View project progress based on task completion

### Task Management
- Create tasks with title, description, priority, and due date
- Assign tasks to specific team members
- Update task status (Pending → In Progress → Completed)
- Priority levels: Low, Medium, High, Urgent
- Automatic overdue detection

### Dashboard
- Statistics overview (projects, tasks, completion rates)
- Recent tasks list
- Project progress tracking
- Task status visualization

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hot Toast
- date-fns

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- express-validator

## Project Structure
team-task-manager/
├── backend/
│ ├── models/
│ │ ├── User.js
│ │ ├── Project.js
│ │ └── Task.js
│ ├── middleware/
│ │ ├── auth.js
│ │ └── roleCheck.js
│ ├── routes/
│ │ ├── auth.js
│ │ ├── projects.js
│ │ └── tasks.js
│ ├── server.js
│ └── .env
└── frontend/
├── src/
│ ├── components/
│ │ ├── Login.jsx
│ │ ├── Signup.jsx
│ │ ├── Dashboard.jsx
│ │ ├── Projects.jsx
│ │ ├── Tasks.jsx
│ │ ├── Navbar.jsx
│ │ └── PrivateRoute.jsx
│ ├── App.jsx
│ ├── main.jsx
│ └── index.css
├──.env 
|__index.html
└── package.json

## Backend Setup
    cd backend
    npm install
    npm run dev

## Frontend Setup
    cd frontend
    npm install
    npm run dev

## Create Admin User
    cd backend
    node create-admin.js