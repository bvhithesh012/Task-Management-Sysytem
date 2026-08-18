# Task Management System

A full-stack Task Management System built for the AbleSpace Full Stack Developer (Fresher) Technical Assessment.

The application provides a responsive task management experience with task, project, label, subtask, and comment management, guest authentication, persistent themes, and a NestJS REST API backed by PostgreSQL and Prisma.

---

## Live Demo

**Live Application:**  
`ADD_DEPLOYED_FRONTEND_URL_HERE`

**Backend API:**  
`ADD_DEPLOYED_BACKEND_URL_HERE`

> The deployed application is intended to remain publicly accessible for the required assessment review period.

---

## GitHub Repository

https://github.com/bvhithesh012/Task-Management-Sysytem

---

# Assessment Requirements

This project was developed according to the AbleSpace technical assessment requirements.

The assessment specifies:

- Next.js with App Router
- Tailwind CSS
- NestJS
- TypeScript
- A database such as PostgreSQL
- Close implementation of the provided Figma design
- Theme support with persistence
- Guest Login
- Reusable components
- Clean NestJS APIs
- Validation
- Good project structure
- Responsive design
- Part 2 product understanding submission

---

# Features

## Authentication

- Guest Login
- JWT-based authentication
- Protected backend routes
- Persistent authenticated session
- Logout
- Login again after logout
- Authentication state maintained across page refreshes

---

## Task Management

- Create tasks
- View tasks
- Edit tasks
- Delete tasks
- Task status
- Task priority
- Due dates
- Task descriptions
- Reporter information
- Project association

Supported task statuses:

- TODO
- DOING
- COMPLETED
- ON_HOLD

Supported priorities:

- NO_PRIORITY
- LOW
- MEDIUM
- HIGH
- URGENT

---

## Projects

- Create projects
- View projects
- Edit projects
- Delete projects
- Project priority
- Project due date
- Project lead
- Project-task association

---

## Labels

- Create labels
- View labels
- Delete labels
- Assign labels to tasks
- Remove labels from tasks
- View labels associated with a task

---

## Subtasks

- Create subtasks
- View subtasks
- Mark subtasks as completed
- Update subtasks
- Delete subtasks

---

## Comments

- Add comments to tasks
- View comments
- Edit comments
- Delete comments
- Associate comments with users and tasks

---

## Theme Support

The application supports light and dark themes.

The selected theme is persisted so that refreshing the page does not reset the user's theme preference.

The interface was also reviewed for:

- Text visibility
- Background contrast
- Navigation visibility
- Cards and panels
- Buttons
- Forms
- Modals
- Dark-mode readability
- Light-mode readability

---

## Responsive Design

The application is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

Responsive behavior was considered for:

- Navigation
- Task layouts
- Cards
- Forms
- Modals
- Tables/lists
- Calendar
- Project views
- Settings
- Task management interactions

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Next.js App Router

## Backend

- NestJS
- TypeScript
- REST APIs
- JWT authentication
- class-validator
- class-transformer

## Database

- PostgreSQL
- Prisma ORM
- Prisma Client

## Testing

- Jest
- NestJS Testing
- Supertest

---

# Architecture

The project uses a separated frontend and backend architecture.

```text
                         Task Management System
                                  |
             +--------------------+--------------------+
             |                                         |
             v                                         v
       Next.js Frontend                           NestJS Backend
             |                                         |
             | HTTP / REST API                          |
             +-------------------->---------------------+
                                                       |
                                                       v
                                                  Prisma ORM
                                                       |
                                                       v
                                                  PostgreSQL
