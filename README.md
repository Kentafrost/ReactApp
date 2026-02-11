# 🚀 React Web UI Project

A modern full-stack web application built with React frontend, Node.js backend, and Python services.

## 📖 Documentation Site

**🌟 [View Live Documentation](./docs/index.html) 🌟**

To quickly open the documentation site:
```bash
# Open documentation in browser
npm run docs

# Or directly open the file
# Windows: start docs/index.html
# macOS: open docs/index.html  
# Linux: xdg-open docs/index.html
```

**Features:**
- 🌐 **AI-powered translation** (10 languages supported)
- 📱 **Responsive design** with dark mode
- 🎨 **Interactive demos** and examples
- 📋 **Comprehensive API reference**

---

## 🏗️ Project Structure

```
react-web-ui/
├── frontend/          # React application
├── backend/           # Node.js API services  
│   ├── routes/        # FastAPI routes
│   └── script/        # Python services & tools
├── docs/              # Documentation site with AI translation
├── batch/             # Automation scripts
└── README.md          # This file
```

## 🛠️ Tech Stack

- **Frontend**: React 19.2.0, Chakra UI, Framer Motion
- **Backend**: Node.js, FastAPI (Python)
- **Services**: Python 3.13+, AWS SDK, Computer Vision
- **Documentation**: Static site with AI translation (10 languages)

## 🤖 Features

- ⚛️ Modern React frontend with Chakra UI components
- 🔌 FastAPI backend with automatic OpenAPI documentation
- 🐍 Python services for data processing and automation
- 🌐 AI-powered documentation with 10-language translation support
- 📱 Responsive design with dark mode support
- 🚀 Hot reload development environment

---

## 📦 Installation

### Prerequisites
- **Node.js** >=14.0.0
- **Python** >=3.13.0
- **npm** and **pip**

### 📋 Installation Commands

**1: Install Root Dependencies**
```bash
npm install
```

**2: Install Frontend Dependencies** 
```bash
cd frontend && npm install
cd ..
```

**3: Install Backend Dependencies**
```bash
cd backend && npm install
cd ..
```

**4: Create Python Virtual Environment**
```bash
cd backend/script
python -m venv venv
```

**5: Activate Virtual Environment**
```bash
# Windows:
venv\Scripts\activate

# macOS/Linux:  
source venv/bin/activate
```

**6: Install Python Packages**
```bash
pip install -r requirements.txt
```

### 🎯 One-Line Installation

**Windows:**
```cmd
npm install && cd frontend && npm install && cd ../backend && npm install && cd script && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt
```

**macOS/Linux:**
```bash
npm install && cd frontend && npm install && cd ../backend && npm install && cd script && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

---

## 📋 Dependencies Summary

### 🌐 Node.js Packages

| Category | Package Name | Version | Description |
|----------|--------------|---------|-------------|
| **Root Project** | @emotion/react | ^11.14.0 | CSS-in-JS library |
| | @emotion/styled | ^11.14.1 | Styled components |
| | @mui/material | ^7.3.6 | Material-UI components |
| **Frontend** | @chakra-ui/react | ^3.30.0 | UI component library |
| | react | ^19.2.0 | React framework |
| | react-dom | ^19.2.0 | React DOM renderer |
| | react-router-dom | ^7.10.1 | React routing |
| | react-scripts | ^5.0.1 | React build tools |
| | framer-motion | ^12.23.25 | Animation library |
| **Development** | eslint | ^8.45.0 | Code linting |
| | prettier | ^3.0.0 | Code formatting |
| | typescript | ^5.2.2 | TypeScript support |
| | vite | ^4.4.9 | Build tool |

### 🐍 Python Packages

| Category | Key Packages | Purpose |
|----------|--------------|---------|
| **AWS & Cloud** | awscli, boto3, botocore | AWS services integration |
| **Data Processing** | pandas, numpy | Data manipulation and analysis |
| **Web & APIs** | requests, beautifulsoup4 | HTTP requests and web scraping |
| **Computer Vision** | opencv-python, pillow | Image processing |
| **Video Processing** | moviepy, imageio-ffmpeg | Video editing and conversion |
| **GUI Automation** | PyAutoGUI, pytesseract | Desktop automation and OCR |
| **Google Services** | google-api-python-client | Google APIs integration |

*Complete list (77 packages total): See `backend/script/requirements.txt`*

---

## 🔍 Installation Verification

### Node.js Verification

**1: Check Installed Packages**
```bash
npm list --depth=0
```

**2: Test Frontend Build**
```bash
cd frontend && npm start
```

**3: Build Production Version**
```bash
npm run build
```

### Python Verification

**1: Activate Virtual Environment**
```bash
# macOS/Linux
source backend/script/venv/bin/activate

# Windows
backend\script\venv\Scripts\activate
```

**2: Check Installed Packages**
```bash
pip list
```

**3: Test Python Imports**
```bash
python -c "import pandas, numpy, requests; print('Success!')"
```

---

## 🚀 Running the Application

**1: Start Frontend Development Server**
```bash
cd frontend
npm start
# Opens at http://localhost:3000
```

**2: Start Backend API (FastAPI)**
```bash
cd backend/routes
uvicorn main:app --reload --port 5000
# API available at http://localhost:5000
```

**3: Start Backend Python Services**
```bash
cd backend/script
# Activate virtual environment first
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**4: View Documentation Site**
```bash
# Open in browser
open docs/index.html  # macOS
start docs/index.html # Windows
# Features AI-powered translation system
```

---

## 🔧 Package Management

### List Currently Installed Libraries
```bash
# List all installed packages (current directory)
npm list --depth=0

# List installed packages in each directory
cd frontend && npm list --depth=0    # Frontend packages
cd ../backend && npm list --depth=0  # Backend packages
cd ..                                 # Return to root

# Export package list to file
npm list --json > package-list.json

# Check for outdated packages
npm outdated

# Show package information
npm info <package-name>
```

### Development Commands
```bash
# Package Management
npm list --depth=0        # List installed packages
npm outdated             # Check for updates
npm update               # Update packages
npm install <package>    # Install new package

# Development
npm start                # Start frontend (in frontend/)
npm run build           # Build for production
npm test                # Run tests
npm run lint            # Run ESLint
npm run format          # Format with Prettier

# Python environment
source venv/bin/activate  # Activate Python environment (venv\Scripts\activate on Windows)
pip list                 # List installed Python packages
pip freeze > requirements.txt  # Export Python packages to file
```

### Troubleshooting Missing Dependencies
```bash
# Fix missing dependencies in frontend
cd frontend
npm install prettier@^3.0.0 vite@^4.4.9 typescript@^5.2.2

# Clean install (if npm install fails)
rm -rf node_modules package-lock.json  # Delete existing files
npm install                             # Fresh install

# Check and fix package versions
npm audit                              # Security audit
npm audit fix                          # Automatic fixes
```

---

## 💡 Development Tips

- **Virtual Environment**: Always activate the Python virtual environment before running Python scripts
- **Node Versions**: Ensure Node.js >=14.0.0 for compatibility  
- **Package Updates**: Run `npm update` and `pip install --upgrade -r requirements.txt` periodically
- **Environment Variables**: Configure `.env` files as needed
- **Hot Reload**: Both frontend and backend support hot reload during development

---

**🎉 Installation complete! Start developing with the commands above.**