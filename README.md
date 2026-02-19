# AI Resume Parser

AI Resume Parser is a full-stack web application that analyzes resumes (PDF) and extracts structured information such as skills, education, experience, and key sections using modern web technologies.

The project is built using the React Router full-stack template with server-side rendering and deployed on Vercel. It also integrates Puter for browser-based file handling and storage support.

🔗 Live Demo: https://ai-parseresume.vercel.app/

---

## 🚀 Overview

AI Resume Parser allows users to:

- Upload a resume (PDF)
- Extract structured resume data
- View organized resume insights
- Process files securely in the browser environment

This project demonstrates full-stack architecture, SSR, file processing, modern routing, and production-ready deployment practices.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router (Full-Stack Framework)
- Vite
- Tailwind CSS
- JavaScript (ES6+)

### Backend / Server-Side
- Node.js runtime
- Server-side rendering (SSR)
- API routes for resume parsing

### File Handling
- Puter (browser-based file handling & storage integration)
- PDF parsing libraries

### Deployment
- Vercel

---

## ✨ Features

- 📄 Resume upload (PDF support)
- 🧠 Resume text extraction & structured output
- 📂 Browser-based file handling using Puter
- ⚡ Server-side rendering
- 🔥 Hot Module Replacement (HMR)
- 🎨 Responsive UI with TailwindCSS
- 🚀 Production-ready build setup
- 🌐 Live deployed version

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/rajnish-012/ai-resume-parser.git
cd ai-resume-parser


Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
