# Freundschaftsbuch App

A collaborative friendship book application where users can create and design digital scrapbooks together.

## Features

- **User Authentication**: Register/login with JWT tokens
- **Role-based Permissions**: Admin, Editor, Viewer roles for each book
- **Real-time Collaboration**: Multiple users can edit simultaneously using WebSockets
- **Canvas Drawing**: Integrated tldraw framework for rich drawing and design
- **Page Management**: Navigate between different pages in each book
- **PostgreSQL Database**: Persistent storage for users, books, and canvas data

## Tech Stack

- **Frontend**: React, tldraw, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt

## Setup

1. **Database Setup**:
   ```sql
   CREATE DATABASE freundschaftsbuch;
   ```

2. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

3. **Configure Environment**:
   - Update `backend/.env` with your PostgreSQL credentials

4. **Run Application**:
   ```bash
   npm run dev
   ```

## Usage

1. Register/login at `http://localhost:3000`
2. Create a new friendship book from the dashboard
3. Open a book to start drawing and designing
4. Invite others by sharing the book (admin can manage permissions)
5. Collaborate in real-time on different pages

## Roles

- **Admin**: Full access, can manage permissions
- **Editor**: Can edit and save pages
- **Viewer**: Read-only access

## API Endpoints

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/books` - Get user's books
- `POST /api/books` - Create new book
- `GET /api/books/:id/pages` - Get book pages
- `PUT /api/books/:id/pages/:pageNumber` - Save page data