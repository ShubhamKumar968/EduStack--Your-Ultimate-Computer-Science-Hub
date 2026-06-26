# EduStack 🚀

> **Pushing knowledge, Popping success.**

EduStack is a comprehensive subject library and resource platform designed specifically for Computer Science and Engineering (CSE) students. It acts as a one-stop hub for organizing notes, previous year papers, coding platforms, and curated YouTube resources, saving students the hassle of jumping between multiple tabs.

## ✨ Features
- **Subject Library:** Access curated resources, notes, and previous year papers for various CSE subjects (DSA, DBMS, Computer Networks, OOPs, etc.).
- **User Roles:** Distinct experiences for guests and hosts/admins.
- **Dark Mode Support:** Built-in seamless toggling between light and dark themes.
- **Resource Hub:** Curated external links for coding platforms (LeetCode, GeeksforGeeks, etc.) and YouTube playlists.
- **Responsive Design:** Beautiful, fluid UI tailored for desktops, tablets, and phones.

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML, CSS (TailwindCSS), Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, MySQL (as needed)
- **Tools:** Cloudinary, Razorpay (Test), Nodemailer (OTP)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/EduStack.git
   cd EduStack
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```
   *(Ensure you install dependencies in the root and/or server directories based on your setup)*

3. **Environment Variables:**
   Create a `.env` file in the `server` directory and configure the necessary variables (MongoDB URI, JWT Secret, Google OAuth, Cloudinary, etc.):
   ```env
   # Example for server/.env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   # ... add other required keys
   ```

4. **Run the Application:**
   ```bash
   npm start
   ```
   *(or whichever script you have configured to start the dev server)*

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/EduStack/issues) if you want to contribute.

## 📝 License
This project is built for the student community. Built with ♥ by a CSE student, for CSE students.
