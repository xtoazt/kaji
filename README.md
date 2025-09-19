# Kaji - AI-Powered ChromeOS Vulnerability Research Platform

Kaji is an advanced AI-powered platform for ChromeOS vulnerability research and analysis. It uses GPT-OSS (via OpenRouter) to train models specifically for finding exploits and vulnerabilities in ChromeOS versions, while providing a comprehensive web interface for security researchers.

## Features

### 🤖 AI-Powered Research
- **GPT-OSS Integration**: Uses OpenRouter's GPT-OSS API for advanced vulnerability analysis
- **Self-Updating Knowledge Base**: Automatically updates with new ChromeOS versions and vulnerabilities
- **Intelligent Exploit Discovery**: AI identifies potential new vulnerabilities based on existing patterns
- **Automated Analysis**: AI analyzes and categorizes vulnerabilities with confidence scores

### 🔍 Comprehensive Database
- **Exploit Management**: Store and manage ChromeOS exploits with detailed metadata
- **Version Tracking**: Track vulnerabilities across different ChromeOS versions (2018-2024)
- **CVE Integration**: Link exploits to CVE identifiers and CVSS scores
- **Categorization**: Organize vulnerabilities by type and severity
- **Historical Data**: Pre-populated with exploits from [Corellium](https://github.com/Burvyn/Corellium) and [ext-remover](https://github.com/3kh0/ext-remover)

### 💬 Interactive AI Assistant
- **Chat Interface**: Ask questions about ChromeOS security and vulnerabilities
- **Context-Aware Responses**: AI understands your research context and provides relevant answers
- **Session Management**: Maintain conversation history across sessions
- **Expert Knowledge**: Access to comprehensive ChromeOS security knowledge

### 📊 Analytics & Reporting
- **Real-time Statistics**: View vulnerability trends and statistics
- **Severity Distribution**: Understand the landscape of ChromeOS vulnerabilities
- **User Reports**: Community-driven error reporting and validation
- **Admin Dashboard**: Comprehensive management interface

### 🔒 Security & Authentication
- **User Management**: Role-based access control (User, Researcher, Admin)
- **Secure API**: JWT-based authentication with rate limiting
- **Data Validation**: Comprehensive input validation and sanitization
- **Audit Logging**: Complete audit trail of all system activities

## Technology Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **PostgreSQL** (Neon Database) for data storage
- **OpenRouter API** for AI functionality
- **JWT** for authentication
- **Winston** for logging
- **Node-cron** for scheduled tasks

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **React Hook Form** for form management
- **React Hot Toast** for notifications

### Infrastructure
- **Docker** for containerization
- **Neon Database** for PostgreSQL hosting
- **OpenRouter** for AI API access

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (optional)
- Neon Database account
- OpenRouter API key
- Vercel account (for deployment)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kaji
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://neondb_owner:npg_qLXwtgO1C7my@ep-calm-sky-adid046v-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=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
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Initialize the database**
   ```bash
   npm run dev:server
   ```
   The server will automatically initialize the database schema on first run.

5. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 3001) and frontend development server (port 3000).

### Vercel Deployment (Recommended)

1. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables**
   - Go to your Vercel dashboard
   - Add all environment variables from `env.example`
   - Redeploy to apply changes

3. **Access Your Application**
   - Frontend: `https://your-app.vercel.app`
   - API: `https://your-app.vercel.app/api/v1`

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f kaji
   ```

## API Documentation

The API is RESTful and follows standard conventions. Base URL: `/api/v1`

### Authentication
- **POST** `/users/register` - Register new user
- **POST** `/users/login` - Login user
- **GET** `/users/profile` - Get user profile
- **PUT** `/users/profile` - Update user profile

### Exploits
- **GET** `/exploits` - List exploits with filtering
- **GET** `/exploits/:id` - Get exploit details
- **POST** `/exploits` - Create new exploit
- **PUT** `/exploits/:id` - Update exploit
- **DELETE** `/exploits/:id` - Delete exploit
- **POST** `/exploits/:id/analyze` - AI analysis of exploit

### Chat
- **POST** `/chat/sessions` - Create chat session
- **GET** `/chat/sessions` - List user sessions
- **POST** `/chat/sessions/:id/messages` - Send message
- **GET** `/chat/sessions/:id/messages` - Get messages

### Reports
- **POST** `/reports` - Submit user report
- **GET** `/reports` - List reports
- **GET** `/reports/:id` - Get report details
- **PATCH** `/reports/:id/status` - Update report status (admin)

### Admin
- **GET** `/admin/stats` - System statistics
- **GET** `/admin/logs` - System logs
- **POST** `/admin/scan/:versionId` - Trigger AI scan
- **GET** `/admin/users` - User management

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **chromeos_versions** - ChromeOS version information
- **exploits** - Vulnerability and exploit data
- **vulnerability_categories** - Vulnerability type categorization
- **user_reports** - User-submitted reports and feedback
- **chat_sessions** - AI chat session management
- **chat_messages** - Chat message history
- **ai_training_data** - AI model training data
- **system_logs** - Application and system logs

## AI Integration

Kaji uses OpenRouter's GPT-OSS API for several AI-powered features:

1. **Exploit Analysis**: Analyzes vulnerability data and provides detailed security assessments
2. **Vulnerability Discovery**: Identifies potential new vulnerabilities based on existing patterns
3. **User Assistance**: Provides expert answers to security research questions
4. **Report Validation**: Validates user-submitted reports using AI analysis
5. **Knowledge Updates**: Maintains and updates ChromeOS security knowledge base

## Security Considerations

- All API endpoints are rate-limited
- JWT tokens are used for authentication
- Input validation and sanitization on all endpoints
- SQL injection protection through parameterized queries
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Comprehensive audit logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: security@kaji.com
- Documentation: https://docs.kaji-security.com
- GitHub Issues: https://github.com/kaji-security/kaji/issues

## Roadmap

- [ ] Advanced exploit code analysis
- [ ] Integration with additional vulnerability databases
- [ ] Real-time vulnerability monitoring
- [ ] Mobile application
- [ ] API rate limiting improvements
- [ ] Advanced AI model fine-tuning
- [ ] Multi-language support
- [ ] Enhanced reporting and analytics

---

**Kaji** - Empowering ChromeOS security research through AI
