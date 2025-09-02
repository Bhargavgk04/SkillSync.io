# SkillSync.io 🎯

**AI-Powered Skill-to-GitHub Issue Matcher**

SkillSync.io is an intelligent platform that uses AI to match developers with GitHub issues based on their skills, experience, and preferences. Stop wasting time searching through thousands of issues - let our AI find the perfect contribution opportunities for you.

## Live @ https://skillsync-io.netlify.app/

## ✨ Features

### 🤖 AI-Powered Matching
- **Smart Skill Extraction**: Automatically analyzes your GitHub profile, repositories, and contribution history
- **Intelligent Recommendations**: AI algorithm matches you with issues based on your expertise
- **Difficulty Assessment**: Issues are categorized by difficulty level (beginner to expert)
- **Personalized Scoring**: Each recommendation comes with a match score and reasoning

### 🔍 Issue Discovery
- **Continuous Aggregation**: Background jobs fetch issues from trending repositories
- **Smart Filtering**: Focuses on "good first issue", "help wanted", and beginner-friendly issues
- **Real-time Updates**: Fresh issues are added every 30 minutes
- **Advanced Search**: Filter by language, difficulty, labels, and keywords

### 📊 Developer Dashboard
- **Skill Analytics**: Visual breakdown of your programming languages and frameworks
- **Progress Tracking**: Monitor your open source contributions and achievements
- **Achievement System**: Earn badges for milestones and contributions
- **Saved Issues**: Bookmark interesting issues for later

### 🎨 Modern Interface
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Mode**: Comfortable viewing in any environment
- **Intuitive Navigation**: Clean, developer-friendly interface
- **Fast Performance**: Built with modern web technologies

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **GitHub Account** (for OAuth authentication)
- **GitHub Personal Access Token** (for API access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skillsync-io.git
   cd skillsync-io
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**

   Create `.env` files in both server and client directories:

   **Server (.env)**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/skillsync

   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

   # GitHub API
   GITHUB_API_TOKEN=your_github_personal_access_token

   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=3d

   # App URLs
   CLIENT_URL=http://localhost:5173
   PORT=5000
   NODE_ENV=development
   ```

   **Client (.env)**
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **GitHub OAuth Setup**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App with:
     - Homepage URL: `http://localhost:5173`
     - Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
   - Copy the Client ID and Client Secret to your server `.env`

5. **Start the application**
   ```bash
   # Start the server (from server directory)
   npm run dev

   # Start the client (from client directory)
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🏗️ Architecture

### Tech Stack

**Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls

**Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Octokit** - GitHub API client
- **Node-cron** - Task scheduling

### Project Structure

```
skillsync-io/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── jobs/               # Background jobs
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   └── package.json
└── README.md
```

## 🔧 API Documentation

### Authentication Endpoints

```http
GET  /api/auth/github           # Redirect to GitHub OAuth
GET  /api/auth/github/callback  # GitHub OAuth callback
GET  /api/auth/me              # Get current user
POST /api/auth/logout          # Logout user
POST /api/auth/refresh-skills  # Refresh user skills analysis
```

### Issue Endpoints

```http
GET  /api/issues/recommendations  # Get personalized recommendations
GET  /api/issues/all             # Get all issues (paginated)
GET  /api/issues/search          # Search issues with filters
GET  /api/issues/:id             # Get issue details
POST /api/issues/:id/save        # Save/bookmark issue
DELETE /api/issues/:id/save      # Remove saved issue
POST /api/issues/:id/solved      # Mark issue as solved
GET  /api/issues/user/saved      # Get user's saved issues
GET  /api/issues/user/solved     # Get user's solved issues
```

### User Endpoints

```http
GET  /api/user/stats           # Get user statistics
PUT  /api/user/preferences     # Update user preferences
POST /api/user/skills          # Add manual skill
DELETE /api/user/skills/:name  # Remove skill
```

## 🤖 AI Matching Algorithm

The AI matching system uses a sophisticated scoring algorithm:

### Skill Extraction
1. **Repository Analysis**: Scans languages, frameworks, and technologies
2. **Contribution Patterns**: Analyzes commit messages and activity
3. **Confidence Scoring**: Assigns confidence levels to detected skills
4. **Level Assessment**: Determines skill levels (beginner to expert)

### Issue Matching
The matching score is calculated using weighted factors:

- **Language Match (40%)**: Issues in user's known languages
- **Skill Match (30%)**: Required skills vs user's skills  
- **Difficulty Match (20%)**: User's preferred difficulty levels
- **Freshness (10%)**: Newer issues get priority

### Continuous Learning
- User interactions improve future recommendations
- Feedback loops enhance matching accuracy
- Regular profile re-analysis keeps skills current

## 🔄 Background Jobs

### Issue Aggregation
- **Frequency**: Every 30 minutes
- **Sources**: Trending repositories, good first issues
- **Processing**: AI analysis for difficulty and required skills
- **Storage**: Cached in MongoDB for fast retrieval

### Skill Analysis
- **Trigger**: New user registration, manual refresh
- **Process**: GitHub API data extraction and AI processing
- **Output**: Structured skill and language data

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**



---


### Made with ❤️ by the SkillSync.io team ###

*Empowering developers to find their perfect open source contributions through AI*