# College Athlete Wellness App

College Athlete Wellness is a mobile application built for student-athletes and coaches to centralize wellness check-ins, training logs, scheduling, and team communication.

This project was developed as my CSCI 481 Capstone project at UNC Asheville.

## Project Overview

Student-athletes often manage training, games, academics, travel, and recovery across several different tools. This app brings the main daily workflow into one place so athletes can enter useful data and coaches can review team-level information more easily.

The app supports two main user experiences:

- **Athletes** can complete daily wellness check-ins, view schedules, and submit workout log information.
- **Coaches** can review athlete check-ins, view trends, create team events, assign workouts, and review training submissions.

## Main Features

- Supabase authentication
- Role-based athlete and coach experiences
- Daily athlete wellness check-ins
- One check-in per athlete per day
- Coach check-in review and trend visibility
- Training log submission and workout assignment
- Personal and team calendar events
- Recurring calendar events
- Team membership-based data access
- TestFlight deployment using EAS

## Tech Stack

- **Frontend:** Expo React Native
- **Routing:** Expo Router
- **Backend / Database:** Supabase
- **Authentication:** Supabase Auth
- **Database Security:** Supabase Row Level Security policies
- **Deployment:** EAS Build and TestFlight

## Database Design

The database centers around user profiles and team membership.

Key tables include:

- `profiles`
- `teams`
- `team_memberships`
- `checkins`
- `workout_assignments`
- `workout_logs`
- `calendar_events`

Supabase Auth handles user accounts through `auth.users`, while app-specific user data is stored in `profiles`. Row Level Security policies are used to control access so athletes and coaches only access the data they are supposed to see.

## Running the Project Locally

Install dependencies:

```bash
npm install
```
