# User Profile Management System

## Overview
Complete Discord-style user profile management system with Cloudinary integration for image storage.

## Features Implemented

### Backend

#### 1. Database Schema (Prisma)
Enhanced User model with:
- `displayName` - Separate from username
- `avatar` & `avatarPublicId` - Profile picture with Cloudinary
- `banner` & `bannerPublicId` - Profile banner with Cloudinary
- `bio` - User description (190 chars max)
- `pronouns` - User pronouns
- `themeColor` - Profile accen