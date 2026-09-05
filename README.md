<div align="center">
  <img src="public/HUB.png" width="100%" alt="SST Hub Banner" />
</div>

# SST Hub

## Project Overview

SST Hub is a centralized digital ecosystem engineered to streamline operations and enhance the daily academic and social experience within the campus community. Built to address the fragmentation of student resources, the platform serves as a single unified interface bridging the gap between administrative announcements, academic tracking, and peer-to-peer engagement.

## Core Features & Implementation

* **Academic Logistics Engine**: Integrates a comprehensive academic calendar with real-time institutional announcements, ensuring students have immediate visibility into critical academic timelines.
* **Granular Task Tracking**: Features a specialized module for managing class notes and daily homework, deliberately architected to track granular daily tasks independently from standard, larger-scale assignments.
* **Community & Event Architecture**: Provides an organized hub for both official campus events and student-led house activities, improving campus-wide participation and scheduling visibility.
* **Real-Time Communication**: Incorporates an in-app messaging system and batch-specific networking groups to facilitate immediate, secure communication and collaboration among cohorts.
* **Resource Directory**: Acts as a digital concierge, offering an interactive student facility directory to help users quickly locate and utilize campus resources.

## Technology Stack

* **Architecture**: Hybrid application utilizing a modern React (Vite) single-page application frontend and a customized PHP REST API backend.
* **Chat System Architecture**: REST-based messaging architecture leveraging custom PHP endpoints for secure, structured peer-to-peer and group communications.
* **Database**: MySQL relational database, accessed securely via PDO connections for robust data integrity and session management.
* **PWA (Progressive Web App)**: Configured using `vite-plugin-pwa` with a Network-First caching strategy, allowing native-like installation and offline resilience.

## Configuration & API Keys

### Backend Configuration
The primary backend configuration file is located at `public/includes/config.php`. This file requires manual setup for:
* **Database Credentials:** `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME`.
* **Google OAuth:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for backend authentication callbacks.

## Run Locally

**Prerequisites:** Node.js, PHP, MySQL

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Set up the database:
   Import your database schema to your local MySQL server and update credentials in `public/includes/config.php`.
3. Set environment variables:
   Copy `.env.example` to `.env.local` and configure your keys (e.g., `GEMINI_API_KEY`).
4. Run the development server:
   ```bash
   npm run dev
   ```
