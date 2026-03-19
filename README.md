# Lost No More

A full-stack lost and found platform built for campus use. Students can report lost or found items, get notified via email when a match is posted, and coordinate returns — without relying on WhatsApp groups or admin desks.

**Live:** [lost-and-found-murex-five.vercel.app](https://lost-and-found-murex-five.vercel.app)  
**Backend:** Hosted on AWS EC2

---

## Screenshots

### Landing Page
![Landing Page](./screenshots/Landing.png)

### Dashboard
![Dashboard](./screenshots/Dashboard.png)

### Report Item Form
![Report Form](./screenshots/reportform.png)

### Login
![Login](./screenshots/Login.png)

---

## What it does

- **Authentication** — Restricted to `@chitkarauniversity.edu.in` emails with JWT-based session management
- **Report Items** — Post lost or found items with images, location, and contact details
- **Item Status** — Mark reports as `Lost`, `Found`, or `Returned`
- **Email Notifications** — Users get notified when a new item is reported
- **Dashboard** — View and filter all reports by type

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js (App Router) + TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Image Upload | Multer + Cloudinary |
| Auth | JWT + Cookie Tokens |
| Security | Rate Limiting |
| DevOps | Docker, GitHub Actions (CI/CD), AWS EC2 |

---

## Deployment

Originally hosted on Render — migrated to a Dockerized AWS EC2 instance to eliminate cold starts.  
This cut first-request response latency by ~10 seconds and improved overall uptime.  
Uptime is monitored via UptimeRobot.

Every push to `main` triggers a GitHub Actions workflow that SSHs into EC2 and redeploys automatically.

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account

### Steps

1. Clone the repo
   ```sh
   git clone https://github.com/Deepanshu902/lost-no-more.git
   cd lost-no-more
   ```

2. Install dependencies
   ```sh
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. Set up environment variables  
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=8000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

4. Run locally
   ```sh
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```

---

## License

MIT License