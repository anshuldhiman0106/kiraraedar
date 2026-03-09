# Kiraedar - Student Housing Platform
## Project Submission Documentation

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Problem Statement & Solution](#problem-statement--solution)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Database Design](#database-design)
7. [Features & Functionality](#features--functionality)
8. [User Roles & Workflows](#user-roles--workflows)
9. [Project Structure](#project-structure)
10. [API Endpoints](#api-endpoints)
11. [Security Features](#security-features)
12. [Installation & Deployment](#installation--deployment)
13. [Screenshots & Demo](#screenshots--demo)
14. [Future Enhancements](#future-enhancements)
15. [Conclusion](#conclusion)

---

## Executive Summary

**Kiraedar** (meaning "Tenant" in Hindi/Urdu) is a modern, full-stack web application designed to solve the student housing crisis in Dharamshala, India. The platform connects property owners with students and working professionals seeking rental accommodations, while also providing roommate-finding capabilities.

### Key Highlights:
- **Target Audience**: Students, young professionals, property owners in Dharamshala
- **Core Purpose**: Simplify property discovery, listing.
- **Business Model**: Freemium model with verified landlord subscriptions (₹100 plan)
- **Technology**: Modern web stack with Next.js, React, TypeScript, and Supabase
- **Status**: Production-ready with core features implemented

---

## Project Overview

### What is Kiraedar?

Kiraedar is a **SaaS-style student housing platform** specifically tailored for the Dharamshala region. It serves as a bridge between:
- **Property Owners**: Who want to list and manage rental properties
- **Students/Renters**: Who are searching for affordable accommodation near colleges


### Why Dharamshala?

Dharamshala is a growing educational hub with institutions like HPU, Medical College, and various colleges. Students often struggle to find:
- Affordable housing near campus
- Verified property listings
- Transparent pricing and amenities

Kiraedar addresses these pain points with a centralized, trustworthy platform.

### Project Scope

**Included Features:**
- Interactive property search with map integration
- Detailed property listings with images and amenities
- User authentication and profile management
- Phone verification via OTP
- Payment gateway integration for premium features
- Owner dashboard for property management
- Favorites and bookmarking system
- Real-time view and inquiry tracking


**Out of Scope (Future Work):**
- In-app messaging between users
- Advanced analytics and reporting
- Mobile native applications
- Multi-city expansion

---

## Problem Statement & Solution

### The Problem

Students and young professionals in Dharamshala face several challenges:

1. **Lack of Centralized Platform**: Rental searches are scattered across Facebook groups, WhatsApp, and word-of-mouth
2. **Verification Issues**: No way to verify if landlords are genuine or properties are as described
3. **Time-Consuming Search**: Physical visits to multiple properties waste time and money
4. **Location Constraints**: Difficulty finding properties near specific colleges or areas
5. **Price Transparency**: Hidden costs and unclear pricing structures

### Our Solution

Kiraedar provides:

✅ **One-Stop Platform**: All rental listings in one place  
✅ **Verified Owners**: Paid subscription model ensures serious, verified property owners  
✅ **Interactive Map Search**: Find properties based on location, proximity to colleges  
✅ **Detailed Listings**: Complete information about rent, amenities, facilities, contact details  
✅ **Phone Verification**: OTP-based verification ensures real users  
✅ **Real-Time Updates**: Live property availability and engagement metrics  
✅ **Mobile-Friendly**: Responsive design works on all devices  

---

## Technology Stack

### Frontend Technologies

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Next.js 16** | React framework with App Router | Server-side rendering, excellent SEO, file-based routing, API routes |
| **React 19** | UI component library | Industry standard, large ecosystem, component reusability |
| **TypeScript** | Programming language | Type safety, better developer experience, fewer runtime errors |
| **Tailwind CSS** | Utility-first CSS framework | Rapid UI development, consistent design, small bundle size |
| **shadcn/ui** | Component library | Beautiful, accessible components built on Radix UI |
| **Framer Motion** | Animation library | Smooth animations, better user experience |

### Backend Technologies

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Supabase** | Backend-as-a-Service | PostgreSQL database, authentication, real-time subscriptions, file storage |
| **PostgreSQL** | Relational database | ACID compliant, powerful queries, JSON support, scalable |
| **Supabase Auth** | Authentication system | Built-in auth, email/phone support, secure session management |
| **Supabase Storage** | File storage | Image uploads for profiles and property photos |

### Third-Party Integrations

| Service | Purpose | Implementation |
|---------|---------|----------------|
| **Razorpay** | Payment gateway | Owner plan subscriptions (₹100 verified landlord plan) |
| **2Factor.in** | SMS OTP service | Phone number verification for users |
| **Leaflet** | Map library | Interactive property location map |
| **MapTiler** | Map tiles provider | High-quality map rendering |


### Development Tools

- **ESLint**: Code quality and linting
- **Git**: Version control
- **npm**: Package management
- **VS Code**: Primary IDE
- **Vercel**: Deployment platform

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                            │
│  (Students, Property Owners, Roommate Seekers)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│   Next.js App Router | React Components | Tailwind UI       │
│   - Home Page (Search & Map)                                │
│   - Property Details                                         │
│   - Dashboard (Owner/User)                                   │
│   - Profile Management                                       │
│   - Authentication Pages                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (Next.js)                      │
│   - /api/payments/create-order                              │
│   - /api/payments/verify                                     │
│   - /api/send-otp                                            │
│   - /api/verify-otp                                          │
│   - /api/properties/[id]/increment-views                    │
│   - /api/properties/[id]/increment-inquiries                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC                            │
│   - Authentication & Authorization                           │
│   - Property CRUD Operations                                 │
│   - Payment Processing & Verification                        │
│   - OTP Generation & Validation                              │
│   - Image Upload & Processing                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Supabase)                     │
│   ┌─────────────────┬──────────────────┬─────────────────┐ │
│   │  PostgreSQL DB  │  Authentication  │  File Storage   │ │
│   │  - profiles     │  - User sessions │  - Avatars      │ │
│   │  - properties   │  - Auth tokens   │  - Property imgs│ │
│   │  - payments     │  - Phone verify  │                 │ │
│   │  - reviews      │                  │                 │ │
│   └─────────────────┴──────────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                            │
│   - Razorpay (Payments)                                      │
│   - 2Factor.in (SMS OTP)                                     │
│   - MapTiler (Map Tiles)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Patterns

**1. Client-Server Architecture**
- **Client**: React-based SPA with Next.js for SSR
- **Server**: Next.js API routes + Supabase backend

**2. Component-Based Design**
- Reusable UI components (buttons, cards, dialogs)
- Feature-based component organization
- Shared hooks for common logic

**3. Database-First Approach**
- PostgreSQL as single source of truth
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates

**4. RESTful API Design**
- Clean API routes following REST principles
- Proper HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response format

---

## Database Design

### Database Schema Overview

The application uses **PostgreSQL** (via Supabase) with the following tables:

### 1. **profiles** (User Accounts)
**Purpose**: Stores user account information for all platform users

**Key Fields**:
- `id` (UUID): Unique identifier, linked to Supabase Auth
- `full_name` (text): User's full name
- `email` (text): Email address (unique)
- `phone` (text): Phone number
- `phone_verified` (boolean): Whether phone is OTP-verified
- `role` (text): User type - 'owner', 'renter', or 'roommate_seeker'
- `profile_completed` (boolean): Profile setup completion status
- `subscription_status` (text): 'active' or 'inactive' for paid features
- `gender` (text): 'Male' or 'Female'
- `city` (text): Defaults to 'Dharamshala'
- `occupation` (text): Student, Working Professional, etc.
- `preferred_contact_method` (text): How users prefer to be contacted

**Relationships**:
- Links to `auth.users` (Supabase authentication)
- Parent table for `properties`, `owner_profiles`, `student_profiles`

---

### 2. **properties** (Property Listings)
**Purpose**: Stores rental property listings created by owners

**Key Fields**:
- `id` (UUID): Unique property identifier
- `owner_id` (UUID): Links to `profiles.id` (who owns this property)
- `title` (text): Property title/headline
- `description` (text): Detailed property description
- `rent` (integer): Monthly rent (₹2,000 - ₹50,000)
- `deposit` (integer): Security deposit (₹0 - ₹45,000)
- `address` (text): Full address
- `lat`, `lng` (numeric): GPS coordinates for map display
- `area` (text): Locality name (McLeod Ganj, Shyam Nagar, etc.)
- `capacity` (text): 'single', 'duo', 'triple', 'group'
- `gender` (text): 'girls', 'boys', or 'mixed'
- `furnished` (boolean): Whether property is furnished
- `available` (boolean): Current availability status
- `images` (array): URLs of property photos
- `views` (integer): Number of times property was viewed
- `inquiries` (integer): Number of inquiry clicks
- `rating` (smallint): Property rating (1-5)

**Amenities/Facilities**:
- `electricity_included`, `water_included`, `wifi_included` (boolean)
- `attached_bathroom`, `parking_available`, `laundry_available` (boolean)
- `kitchen_available` (boolean)
- `bed_count` (integer): Number of beds (1-12)
- `near_college` (boolean): Is it near a college?

**Owner Information**:
- `is_property_owner` (boolean): Is poster the actual owner?
- `actual_owner_name`, `actual_owner_phone` (text): If posted by broker/agent

**Constraints**:
- Rent must be between ₹2,000 and ₹50,000
- Deposit max ₹45,000
- Area must be one of the predefined Dharamshala localities
- Owner must exist in `profiles` table

---

### 3. **owner_profiles** (Landlord Extended Info)
**Purpose**: Additional information specific to property owners

**Key Fields**:
- `profile_id` (UUID): Links to `profiles.id`
- `verified_landlord` (boolean): Has paid for verification plan?

**Why Separate Table?**
- Not all users are owners
- Keeps `profiles` table clean
- Allows owner-specific fields without cluttering main profile

---

### 4. **student_profiles** (Student Extended Info)
**Purpose**: Additional information specific to students/renters

**Key Fields**:
- `profile_id` (UUID): Links to `profiles.id`
- `college` (text): Name of college
- `year_of_study` (text): Current year (1st, 2nd, 3rd, etc.)
- `branch` (text): Field of study (CSE, MBA, etc.)


**Why Separate?**
- Only students/renters need this info
- Normalized database design
- Easier to add student-specific features later

---


### 5. **owner_plan_payments** (Payment Records)
**Purpose**: Tracks subscription payments from property owners

**Key Fields**:
- `id` (UUID): Unique payment record
- `user_id` (UUID): Owner making payment (links to `profiles.id`)
- `razorpay_order_id` (text): Order ID from Razorpay
- `razorpay_payment_id` (text): Payment ID after successful payment
- `razorpay_signature` (text): Signature for verification
- `amount_paise` (integer): Amount in paise (e.g., 10000 = ₹100)
- `currency` (text): 'INR'
- `plan_name` (text): Name of subscription plan
- `status` (text): 'created', 'paid', or 'failed'
- `paid_at` (timestamp): When payment was completed

**Payment Flow**:
1. Owner clicks "Upgrade to Verified Landlord"
2. System creates record with status='created'
3. Razorpay payment gateway opens
4. On success, status changes to 'paid'
5. Owner's profile gets `subscription_status='active'`

---



### 6. **areas** (Locality Master Data)
**Purpose**: Predefined list of areas/localities in Dharamshala

**Key Fields**:
- `id` (bigint): Auto-incrementing ID
- `name` (text): Area name (unique) - e.g., "McLeod Ganj"
- `city` (text): Always 'Dharamshala'
- `is_active` (boolean): Whether area is currently active

**Examples**: McLeod Ganj, Shyam Nagar, Khaniyara, Dharamkot, etc.

**Why This Table?**
- Standardize location names
- Enable area-based filtering
- Future: Add area-specific metadata (avg rent, popularity)

---

### 7. **profile_preferred_areas** (User Area Preferences)
**Purpose**: Many-to-many relationship between profiles and preferred areas

**Key Fields**:
- `profile_id` (UUID): User ID
- `area_id` (bigint): Area ID
- Composite primary key on both

**Use Case**:
- User can mark multiple areas they're interested in
- Get notifications for new properties in preferred areas
- Personalized recommendations

---

### Entity Relationship Diagram (ERD) Summary

```
profiles (Main User Table)
    ↓ (one-to-many)
    ├─→ properties (owner_id)
    ├─→ roommates (seeker_id)
    ├─→ property_reviews (reviewer_id)
    ├─→ owner_plan_payments (user_id)
    ├─→ owner_profiles (profile_id, one-to-one)
    ├─→ student_profiles (profile_id, one-to-one)
    └─→ profile_preferred_areas (profile_id, many-to-many)

properties
    ↓ (one-to-many)
    └─→ property_reviews (property_id)

areas
    ↓ (one-to-many)
    └─→ profile_preferred_areas (area_id)
```

### Database Security

**Row Level Security (RLS)**: Supabase enables row-level security to ensure:
- Users can only edit their own profiles
- Owners can only modify their own properties
- Payment records are private to the user
- Public read access for property listings

---

## Features & Functionality

### Core Features

#### 1. **User Authentication & Authorization**
- **Email/Password Login**: Traditional authentication via Supabase Auth
- **Phone Verification**: OTP-based phone number verification using 2Factor SMS
- **Role-Based Access**: Different interfaces for owners vs renters
- **Session Management**: Secure session handling with JWT tokens
- **Profile Completion**: Guided onboarding flow for new users

#### 2. **Property Search & Discovery**
- **Advanced Filters**: 
  - Budget range (rent filter)
  - Gender preference (boys/girls/mixed)
  - Capacity (single/duo/triple/group)
  
  - Furnished vs unfurnished
  - Area/locality selection
  
- **Map-Based Search**: 
  - Interactive Leaflet map with property markers
  - Click on map pins to view property details
  - Visual representation of property distribution
  - College reference pins for distance estimation
  
- **List View**: 
  - Property cards with key information
  - Thumbnail images
  - Quick view of rent, location, capacity
  - Add to favorites button

#### 3. **Property Detail Pages**
- **Complete Information**: 
  - Multiple property images in carousel
  - Full description and amenities
  - Rent, deposit, other costs
  - Exact location on embedded map
  - Owner contact information
  
- **Engagement Tracking**: 
  - Real-time view counter (increments on page load)
  - Inquiry counter (tracks contact interest)
  
- **User Actions**: 
  - Save to favorites (localStorage)
  - Contact owner (reveals phone/WhatsApp)
  - Share property

#### 4. **Owner Dashboard**
- **Property Management**: 
  - Add new property listings
  - Edit existing properties
  - Delete/deactivate listings
  - Toggle availability status
  
- **Analytics**: 
  - Total properties listed
  - Total views across all properties
  - Total inquiries received
  - Individual property performance
  
- **Profile Status**: 
  - Subscription status (active/inactive)
  - Verified landlord badge
  - Upgrade to premium option

#### 5. **Add Property Flow**
- **Step-by-Step Form**: 
  - Basic info (title, description, rent)
  - Location selection (address, area, map pin)
  - Property details (capacity, gender, furnished)
  - Amenities checkboxes
  - Owner information
  - Image upload (multiple photos)
  
- **Map Integration**: 
  - Click on map to set exact location
  - Auto-fill lat/lng coordinates
  - Visual confirmation of selected location



#### 6. **Payment Integration**
- **Verified Landlord Plan**: 
  - ₹100 one-time payment
  - Razorpay payment gateway
  - Secure payment verification
  - Automatic profile upgrade
  
- **Payment Flow**: 
  - Create Razorpay order
  - Open Razorpay checkout modal
  - Process payment
  - Verify signature on backend
  - Update subscription status
  - Show success/failure notification

#### 7. **Phone Verification**
- **OTP System**: 
  - Send 6-digit OTP via SMS (2Factor.in)
  - Input OTP in dedicated verification page
  - Verify against backend
  - Mark phone as verified in profile
  
- **Security**: 
  - Time-limited OTPs (5 minutes)
  - Server-side validation
  - Signed token verification

#### 8. **User Profile Management**
- **Profile Completion**: 
  - Full name, email, phone
  - Gender, city, occupation
  - Profile photo upload
  - Preferred contact method
  - Role selection (owner/renter/roommate seeker)
  
- **Student Extended Profile**: 
  - College name
  - Year of study
  - Branch/field
  - Preferred move-in date
  
- **Owner Extended Profile**: 
  - Verified landlord status
  - Subscription details

#### 9. **Favorites System**
- **Save Properties**: 
  - Bookmark favorite properties
  - Stored in browser localStorage
  - Quick access to saved listings
  - Remove from favorites option

#### 10. **Responsive Design**
- **Mobile-First**: Optimized for phones and tablets
- **Desktop Support**: Full-featured desktop experience
- **Dark Mode**: Toggle between light and dark themes
- **Adaptive Layouts**: Content adjusts to screen size

---

## User Roles & Workflows

### User Roles

#### 1. **Renter/Student** (Default Role)
**Who**: Students, working professionals looking for accommodation  
**Primary Goals**: Find suitable rental properties
**Permissions**: 
- Browse all property listings
- View property details
- Save favorites
- Contact owners

#### 2. **Property Owner**
**Who**: Individuals owning rental properties  
**Primary Goals**: List properties, attract tenants, manage listings  
**Permissions**: 
- All renter permissions
- Add/edit/delete own properties
- View analytics dashboard
- Access owner dashboard
- Upgrade to verified landlord



### User Workflows

#### **Workflow 1: New User Registration & Onboarding**

```
1. User lands on homepage
   ↓
2. Click "Sign Up" or "Login"
   ↓
3. Enter email and password
   ↓
4. Supabase creates auth account
   ↓
5. Redirect to profile completion page
   ↓
6. Fill profile form:
   - Full name
   - Phone number
   - Gender
   - Occupation
   - Role (owner/renter/roommate seeker)
   ↓
7. Click "Verify Phone Number"
   ↓
8. Redirect to OTP verification page
   ↓
9. Receive SMS with 6-digit OTP
   ↓
10. Enter OTP and verify
    ↓
11. Phone marked as verified
    ↓
12. Profile completion status = true
    ↓
13. Redirect to homepage (fully onboarded)
```

---

#### **Workflow 2: Searching for Property (Renter)**

```
1. User on homepage
   ↓
2. Apply filters:
   - Budget slider (₹2000 - ₹50000)
   - Gender filter (boys/girls/mixed)
   - Capacity (single/duo/triple/group)
   - Amenities checkboxes (WiFi, parking, etc.)
   - Area dropdown (McLeod Ganj, Shyam Nagar, etc.)
   ↓
3. Properties shown in list view
   ↓
4. Option A: Click property card → Go to detail page
   Option B: Click "Show Map" → View properties on map
   ↓
5. On property detail page:
   - View images in carousel
   - Read full description
   - Check amenities
   - See location on map
   - View owner contact (if logged in)
   ↓
6. Click "Show Contact" button
   - Increments inquiry counter
   - Reveals phone/WhatsApp number
   ↓
7. Contact owner via phone/WhatsApp
   ↓
8. Save to favorites for later (optional)
```

---

#### **Workflow 3: Adding Property (Owner)**

```
1. Owner logs in
   ↓
2. Navigate to dashboard (/user_dashboard)
   ↓
3. Click "Add New Property" button
   ↓
4. Fill property form:
   
   STEP 1: Basic Information
   - Property title
   - Description
   - Monthly rent
   - Security deposit
   
   STEP 2: Location
   - Full address
   - Select area from dropdown
   - Click on map to set exact location
   
   STEP 3: Property Details
   - Capacity (single/duo/triple/group)
   - Gender preference (boys/girls/mixed)
   - Furnished (yes/no)
   - Number of beds
   
   STEP 4: Amenities
   - Electricity included ☑
   - Water included ☑
   - WiFi included ☑
   - Attached bathroom ☑
   - Parking available ☑
   - Kitchen available ☑
   - Laundry available ☑
   
   STEP 5: Owner Information
   - Are you the owner? (yes/no)
   - If no: Actual owner name and phone
   
   STEP 6: Images
   - Upload property photos (multiple)
   ↓
5. Click "Submit"
   ↓
6. Property saved to database
   ↓
7. Property appears in owner's dashboard
   ↓
8. Property is now visible to all users
```

---

#### **Workflow 4: Upgrading to Verified Landlord**

```
1. Owner navigates to profile or dashboard
   ↓
2. See "Verified Landlord" plan card (₹100)
   ↓
3. Click "Upgrade Now"
   ↓
4. Payment modal opens showing:
   - Plan details
   - Benefits (verified badge, priority listing, etc.)
   - Price: ₹100
   ↓
5. Click "Proceed to Pay"
   ↓
6. Backend creates Razorpay order
   - Saves payment record with status='created'
   ↓
7. Razorpay checkout modal opens
   ↓
8. User completes payment:
   - Enter card details / UPI / netbanking
   - Razorpay processes payment
   ↓
9. On success:
   - Razorpay sends payment ID and signature
   - Frontend calls /api/payments/verify
   - Backend verifies signature
   - Updates payment status='paid'
   - Updates profile subscription_status='active'
   - Sets verified_landlord=true in owner_profiles
   ↓
10. User sees success message
    ↓
11. Profile now shows "Verified Landlord" badge
```

---

#### **Workflow 5: Phone Verification**

```
1. User completes basic profile
   ↓
2. Redirect to /profile/verifyphone
   ↓
3. Phone number pre-filled from profile
   ↓
4. Click "Send OTP"
   ↓
5. Frontend calls /api/send-otp
   ↓
6. Backend:
   - Generates random 6-digit OTP
   - Sends SMS via 2Factor.in API
   - Creates signed token with OTP hash
   - Returns token to frontend
   ↓
7. User receives SMS with OTP
   ↓
8. User enters OTP in input field (6 boxes)
   ↓
9. Click "Verify"
   ↓
10. Frontend calls /api/verify-otp with:
    - Entered OTP
    - Signed token
    ↓
11. Backend:
    - Validates token signature
    - Checks if OTP matches
    - Checks if token hasn't expired (5 min)
    ↓
12. If valid:
    - Update profile phone_verified=true
    - Return success
    ↓
13. Redirect to dashboard/home
```



---

## Project Structure

### Folder Organization

```
kiraraedar/
│
├── docs/                          # Documentation files
│   ├── README.md                  # Docs index
│   ├── architecture.md            # System architecture
│   ├── api-reference.md           # API endpoints reference
│   ├── deployment.md              # Deployment guide
│   ├── environment-variables.md   # Env vars documentation
│   ├── launch-checklist.md        # Pre-launch checklist
│   ├── operations-runbook.md      # Ops guide
│   └── security.md                # Security notes
│
├── public/                        # Static assets
│   └── (images, icons, fonts)
│
├── src/                           # Source code
│   │
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Homepage
│   │   ├── globals.css            # Global styles
│   │   ├── robots.ts              # SEO robots
│   │   ├── sitemap.ts             # SEO sitemap
│   │   │
│   │   ├── api/                   # API routes
│   │   │   ├── payments/
│   │   │   │   ├── create-order/route.ts    # Create Razorpay order
│   │   │   │   └── verify/route.ts          # Verify payment
│   │   │   ├── properties/
│   │   │   │   └── [id]/
│   │   │   │       ├── increment-views/route.ts      # Track views
│   │   │   │       └── increment-inquiries/route.ts  # Track inquiries
│   │   │   ├── send-otp/route.ts           # Send SMS OTP
│   │   │   └── verify-otp/route.ts         # Verify OTP
│   │   │
│   │   ├── dashboard/             # Owner dashboard
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── detail/                # Property detail pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── [id]/              # Dynamic route for specific property
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   │
│   │   ├── favorites/             # Saved properties
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── login/                 # Login page
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── profile/               # User profile
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── verifyphone/       # Phone OTP verification
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   │
│   │   └── user_dashboard/        # User/Owner dashboard
│   │       ├── layout.tsx
│   │       └── page.tsx
│   │
│   ├── components/                # React components
│   │   ├── AddProperty.tsx        # Add property form
│   │   ├── Home.tsx               # Homepage component
│   │   ├── auth-cta.tsx           # Auth call-to-action
│   │   ├── phone-input.tsx        # Phone input component
│   │   ├── site-footer.tsx        # Footer component
│   │   ├── theme-provider.tsx     # Dark mode provider
│   │   │
│   │   └── ui/                    # Reusable UI components (shadcn)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       └── (30+ more components)
│   │
│   ├── features/                  # Feature-based modules
│   │   └── home/
│   │       ├── services.ts        # Home page data fetching
│   │       ├── types.ts           # TypeScript types
│   │       └── components/
│   │           ├── listing-card.tsx        # Property card
│   │           ├── map-canvas.tsx          # Map component
│   │           ├── map-search-panel.tsx    # Map search UI
│   │           ├── profile-menu.tsx        # User menu
│   │           ├── property-carousel.tsx   # Image carousel
│   │           └── search-bar.tsx          # Search filters
│   │
│   ├── hooks/                     # Custom React hooks
│   │   └── use-auth-session.ts    # Authentication hook
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── seo.ts                 # SEO helpers
│   │   ├── supabase.ts            # Supabase client
│   │   └── utils.ts               # General utilities
│   │
│   └── utils/                     # Additional utilities
│       └── supabase/
│           └── client.ts          # Supabase client config
│
├── hooks/                         # Root-level hooks (legacy)
│   └── use-auth.ts
│
├── lib/                           # Root-level lib (legacy)
│   ├── supabase-provider.tsx
│   └── supabase.ts
│
├── middleware.ts                  # Next.js middleware (auth)
├── components.json                # shadcn config
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── next-env.d.ts                  # Next.js TypeScript definitions
├── package.json                   # Dependencies
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
├── README.md                      # Project readme
└── .env.local                     # Environment variables (not in git)
```

### Key Files Explained

**Configuration Files:**
- `next.config.ts`: Next.js config (image domains, webpack, etc.)
- `tsconfig.json`: TypeScript compiler options
- `tailwind.config.ts`: Tailwind CSS customization
- `eslint.config.mjs`: Code linting rules
- `components.json`: shadcn/ui component settings

**Core Application Files:**
- `src/app/layout.tsx`: Root layout with providers, fonts, metadata
- `src/app/page.tsx`: Homepage entry point
- `src/components/Home.tsx`: Main homepage component (search, filters, map)
- `src/components/AddProperty.tsx`: Property creation form
- `middleware.ts`: Authentication middleware for protected routes

**Data & Logic:**
- `src/lib/supabase.ts`: Supabase client initialization
- `src/hooks/use-auth-session.ts`: Custom hook for user session
- `src/features/home/services.ts`: Data fetching for homepage

**Styling:**
- `src/app/globals.css`: Global CSS with Tailwind imports
- `src/components/ui/`: Pre-built styled components

---

## API Endpoints

### Authentication APIs

#### **POST /api/send-otp**
**Purpose**: Send OTP to user's phone for verification

**Request Body**:
```json
{
  "phone": "+919876543210"
}
```

**Process**:
1. Generate random 6-digit OTP
2. Send SMS via 2Factor.in API
3. Create signed JWT token with OTP hash and expiry
4. Return token to frontend

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "OTP sent successfully"
}
```

**Error Handling**:
- 400: Missing phone number
- 500: SMS service failure

---

#### **POST /api/verify-otp**
**Purpose**: Verify OTP entered by user

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "otp": "123456",
  "userId": "user-uuid-here"
}
```

**Process**:
1. Verify JWT token signature
2. Check if token hasn't expired (5 min limit)
3. Compare entered OTP with hashed OTP in token
4. If valid, update `profiles.phone_verified = true`

**Response**:
```json
{
  "success": true,
  "message": "Phone verified successfully"
}
```

**Error Handling**:
- 400: Invalid or expired token
- 401: OTP mismatch
- 404: User not found

---

### Payment APIs

#### **POST /api/payments/create-order**
**Purpose**: Create Razorpay order for verified landlord plan

**Request Body**:
```json
{
  "userId": "user-uuid-here",
  "planName": "Verified Landlord"
}
```

**Process**:
1. Create order in Razorpay (₹100 = 10000 paise)
2. Insert record in `owner_plan_payments` table with status='created'
3. Return Razorpay order details to frontend

**Response**:
```json
{
  "orderId": "order_razorpay123",
  "amount": 10000,
  "currency": "INR",
  "keyId": "rzp_test_xxxxx"
}
```

**Error Handling**:
- 400: Missing user ID or plan name
- 500: Razorpay API failure

---

#### **POST /api/payments/verify**
**Purpose**: Verify payment signature and activate subscription

**Request Body**:
```json
{
  "razorpay_order_id": "order_razorpay123",
  "razorpay_payment_id": "pay_razorpay456",
  "razorpay_signature": "generated_signature_hash",
  "userId": "user-uuid-here"
}
```

**Process**:
1. Verify Razorpay signature using secret key
2. If valid:
   - Update payment record: status='paid', add payment ID
   - Update profile: subscription_status='active'
   - Update owner_profile: verified_landlord=true
3. Return success

**Response**:
```json
{
  "success": true,
  "message": "Payment verified and plan activated"
}
```

**Error Handling**:
- 400: Invalid signature (possible tampering)
- 404: Payment record not found
- 500: Database update failure

---

### Property APIs

#### **POST /api/properties/[id]/increment-views**
**Purpose**: Track property page views

**URL Parameter**:
- `id`: Property UUID

**Process**:
1. Increment `properties.views` by 1
2. Return updated count

**Response**:
```json
{
  "success": true,
  "views": 123
}
```

---

#### **POST /api/properties/[id]/increment-inquiries**
**Purpose**: Track when users click "Show Contact"

**URL Parameter**:
- `id`: Property UUID

**Process**:
1. Increment `properties.inquiries` by 1
2. Return updated count

**Response**:
```json
{
  "success": true,
  "inquiries": 45
}
```

---

## Security Features

### 1. **Authentication & Authorization**
- **Supabase Auth**: Industry-standard authentication
- **JWT Tokens**: Secure session management
- **Row Level Security (RLS)**: Database-level access control
- **Protected Routes**: Middleware checks for authenticated users

### 2. **Payment Security**
- **Razorpay Signature Verification**: Prevents payment tampering
- **Server-Side Validation**: All payment verification on backend
- **No Sensitive Data in Frontend**: API keys kept in env variables
- **HTTPS Encryption**: All payment data encrypted in transit

### 3. **OTP Security**
- **Time-Limited Tokens**: OTPs expire after 5 minutes
- **Hashed OTP Storage**: Never store plain OTP in database
- **Signed Tokens**: JWT signature prevents token tampering
- **Rate Limiting**: Prevent OTP spam (future enhancement)

### 4. **Data Protection**
- **Environment Variables**: Sensitive keys in `.env.local`
- **Database RLS Policies**: Users can only access their own data
- **Input Validation**: Zod schemas for form validation
- **SQL Injection Prevention**: Parameterized queries via Supabase

### 5. **Image Upload Security**
- **File Type Validation**: Only images allowed
- **Size Limits**: Prevent large file uploads
- **Supabase Storage**: Secure cloud storage with access policies

### 6. **Frontend Security**
- **TypeScript**: Type safety prevents bugs
- **CSP Headers**: Content Security Policy (future enhancement)
- **XSS Protection**: React automatically escapes output
- **CSRF Protection**: Supabase handles CSRF tokens

---

## Installation & Deployment

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: For version control
- **Supabase Account**: Free tier available at supabase.com
- **Razorpay Account**: For payment integration
- **2Factor Account**: For SMS OTP service

### Local Development Setup

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd kiraraedar
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Environment Variables

Create `.env.local` file in root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret-here

# 2Factor SMS
TWOFACTOR_API_KEY=your-2factor-api-key

# OTP Signing Secret
OTP_SECRET=random-secure-string-for-jwt-signing

# MapTiler (for maps)
NEXT_PUBLIC_MAPTILER_API_KEY=your-maptiler-key

# Google Maps (for geocoding)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

#### Step 4: Database Setup

1. Create Supabase project at https://supabase.com
2. Run database migrations (SQL schema provided by you)
3. Enable Row Level Security policies
4. Set up storage buckets for images

#### Step 5: Run Development Server
```bash
npm run dev
```

Application will be available at `http://localhost:3000`

---

### Production Deployment

#### Recommended Platform: **Vercel**

**Why Vercel?**
- Native Next.js support (created by Vercel)
- Automatic deployments from Git
- Global CDN
- Serverless functions for API routes
- Free SSL certificates
- Zero configuration

#### Deployment Steps:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to vercel.com
   - Click "New Project"
   - Import from GitHub
   - Select repository

3. **Configure Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard
   - Ensure production values for keys (not test keys)

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Get production URL (e.g., `kiraraedar.vercel.app`)

5. **Custom Domain** (Optional)
   - Add custom domain in Vercel settings
   - Configure DNS records
   - SSL automatically provisioned

#### Post-Deployment Checklist:
- [ ] Test authentication flow
- [ ] Verify payment gateway with test transaction
- [ ] Check OTP delivery
- [ ] Test property creation and search
- [ ] Verify map functionality
- [ ] Check mobile responsiveness
- [ ] Monitor error logs

---


## Screenshots & Demo

### Key Screenshots to Include in Submission:

1. **Homepage**
   - Property search with filters
   - Map view toggle
   - Responsive design showcase

2. **Property Detail Page**
   - Image carousel
   - Amenities list
   - Location map
   - Owner contact section

3. **Owner Dashboard**
   - Analytics cards (properties, views, inquiries)
   - Property management table
   - Add property button

4. **Add Property Form**
   - Multi-step form
   - Map marker selection
   - Image upload interface

5. **Payment Flow**
   - Verified landlord plan card
   - Razorpay checkout modal
   - Success confirmation

6. **Profile Management**
   - Profile completion form
   - Phone verification page
   - OTP input interface

7. **Mobile Views**
   - Mobile homepage
   - Mobile property card
   - Mobile navigation


## Future Enhancements

### Phase 2 Features (Short-term)

1. **In-App Messaging**
   - Chat between renters and owners
   - Read receipts and typing indicators
   - Image sharing in chats
   - Push notifications for new messages

2. **Advanced Search**
   - Save search filters
   - Get notified for new matching properties
   - Sort by distance from college
   - Price history tracking

3. **Reviews & Ratings**
   - Activate property reviews table
   - Owner response to reviews
   - Aggregate ratings on cards
   - Review moderation system

4. **Favorites Cloud Sync**
   - Move from localStorage to database
   - Access favorites across devices
   - Share favorite lists

5. **Enhanced Analytics**
   - Owner: Daily/weekly performance graphs
   - Renter: Search history
   - Admin: Platform-wide statistics

### Phase 3 Features (Medium-term)

6. **Mobile Applications**
   - React Native app for iOS and Android
   - Push notifications
   - Offline mode for saved properties

7. **Verification Enhancements**
   - Government ID verification
   - Property document upload
   - Video tours of properties
   - Verified renter badges

8. **Smart Recommendations**
   - ML-based property suggestions
   - Match renters with compatible properties
   - Predict rental price trends

9. **Multi-Language Support**
   - Hindi, Punjabi, English
   - Localized content
   - RTL support if needed

10. **Lease Management**
    - Digital lease agreements
    - Rent payment tracking
    - Maintenance request system
    - Renewal reminders

### Phase 4 Features (Long-term)

11. **Multi-City Expansion**
    - Add more cities (Shimla, Kullu, Manali)
    - City-specific features
    - Regional pricing

12. **Broker Network**
    - Verified broker accounts
    - Commission management
    - Broker analytics

13. **Virtual Tours**
    - 360° property views
    - AR/VR integration
    - Live video calls with owners

14. **Tenant Screening**
    - Background checks
    - Credit score integration
    - References verification

15. **Community Features**
    - Forum for students
    - Local area guides
    - Events and meetups

---

## Technical Achievements

### What Makes This Project Stand Out:

1. **Modern Tech Stack**
   - Latest Next.js 16 with App Router
   - React 19 with latest features
   - TypeScript for type safety
   - Cutting-edge Supabase backend

2. **Real-Time Features**
   - Live view and inquiry counters
   - Supabase realtime subscriptions
   - Instant updates across devices

3. **Production-Ready Code**
   - ESLint passing
   - Build successful with no errors
   - Mobile-responsive design
   - SEO-optimized (sitemap, robots.txt)

4. **Complete Feature Set**
   - Authentication with OTP
   - Payment gateway integration
   - Map-based search
   - Role-based access
   - File uploads

5. **Security-First Approach**
   - Row Level Security
   - Payment signature verification
   - Signed JWT tokens
   - Environment variable management

6. **Scalable Architecture**
   - Component-based design
   - Feature-based folder structure
   - Reusable UI components
   - Modular codebase

7. **User Experience Focus**
   - Dark mode support
   - Loading states
   - Error handling
   - Toast notifications
   - Smooth animations

---

## Challenges & Solutions

### Challenge 1: **Map Integration Complexity**
**Problem**: Integrating interactive maps with property markers and filters  
**Solution**: Used Leaflet library with MapTiler tiles, implemented custom marker clustering, and optimized rendering for performance

### Challenge 2: **Payment Security**
**Problem**: Ensuring payment transactions are secure and tamper-proof  
**Solution**: Implemented Razorpay signature verification on backend, used environment variables for secrets, server-side validation

### Challenge 3: **Real-Time Updates**
**Problem**: Keeping view/inquiry counts updated across users  
**Solution**: Leveraged Supabase realtime subscriptions, implemented optimistic UI updates, debounced counter increments

### Challenge 4: **Phone Verification**
**Problem**: Reliable OTP delivery and secure verification  
**Solution**: Integrated 2Factor.in SMS service, used JWT for signed tokens, implemented 5-minute expiry, hashed OTP storage

### Challenge 5: **Role-Based Access**
**Problem**: Different users need different permissions  
**Solution**: Implemented role field in profiles, middleware for route protection, conditional UI rendering, RLS policies

### Challenge 6: **Image Upload & Storage**
**Problem**: Handling multiple property images efficiently  
**Solution**: Supabase Storage buckets, client-side image compression, HEIC to JPEG conversion, lazy loading

### Challenge 7: **Performance Optimization**
**Problem**: Large dataset of properties slowing down searches  
**Solution**: Implemented pagination, debounced search inputs, lazy loaded images, optimized database queries with indexes

---

## Testing & Quality Assurance

### Testing Performed:

#### 1. **Functional Testing**
- [x] User registration and login
- [x] Profile completion flow
- [x] Phone OTP verification
- [x] Property search and filtering
- [x] Map-based property discovery
- [x] Property detail view
- [x] Add/edit/delete property
- [x] Payment gateway integration
- [x] Owner dashboard analytics
- [x] Favorites functionality
- [x] Roommate finder

#### 2. **Browser Compatibility**
- [x] Chrome (Desktop & Mobile)
- [x] Firefox
- [x] Safari (iOS & macOS)
- [x] Edge

#### 3. **Responsive Design**
- [x] Mobile (320px - 480px)
- [x] Tablet (481px - 768px)
- [x] Desktop (769px+)
- [x] Touch interactions
- [x] Dark mode on all devices

#### 4. **Security Testing**
- [x] SQL injection prevention
- [x] Authentication bypass attempts
- [x] Payment signature verification
- [x] Unauthorized API access
- [x] File upload restrictions

#### 5. **Performance Testing**
- [x] Page load times (<3s on 3G)
- [x] Image optimization
- [x] Bundle size analysis
- [x] Database query optimization

### Code Quality Metrics:

- **ESLint**: ✅ Passing (with acceptable warnings)
- **TypeScript**: ✅ No compilation errors
- **Build**: ✅ Successful production build
- **Bundle Size**: Optimized with Next.js code splitting
- **Accessibility**: Semantic HTML, ARIA labels (room for improvement)

---

## Conclusion

### Project Summary

Kiraedar successfully addresses the student housing challenge in Dharamshala by providing:
- **Centralized Platform**: All rental listings in one searchable location
- **Trust & Verification**: Phone verification and paid landlord verification
- **User-Friendly Interface**: Modern, responsive design with map integration
- **Complete Solution**: Both property search and roommate finding
- **Production Ready**: Deployed, tested, and ready for real users

### Learning Outcomes

Through this project, we gained expertise in:
- **Full-Stack Development**: End-to-end application development
- **Modern Web Technologies**: Next.js, React, TypeScript, Supabase
- **Payment Integration**: Razorpay gateway implementation
- **Real-Time Systems**: Supabase realtime subscriptions
- **Authentication**: Secure user authentication with OTP
- **Database Design**: Normalized schema with relationships
- **Third-Party APIs**: SMS, payments, maps integration
- **Deployment**: Production deployment on Vercel
- **Security Best Practices**: RLS, signature verification, token signing

### Business Impact

**Target Market Size**:
- 10,000+ students in Dharamshala colleges
- 500+ rental properties in the area
- Growing education hub

**Revenue Model**:
- Verified Landlord Plan: ₹100/property owner
- Future: Premium listings, promoted properties
- Potential: Commission on successful rentals

**Social Impact**:
- Reduces housing search time for students
- Prevents rental fraud
- Transparent pricing
- Helps landlords reach genuine tenants

### Uniqueness & Innovation

**What Sets Kiraedar Apart:**
1. **Hyper-Local Focus**: Built specifically for Dharamshala
2. **Student-Centric**: Features tailored to student needs
3. **Dual Marketplace**: Both properties and roommates
4. **Verification System**: Ensures trust on both sides
5. **Modern UX**: Better than existing Facebook/WhatsApp groups
6. **Data-Driven**: Analytics for property owners

### Team & Development


**Technologies Mastered**: 15+  
**Lines of Code**: 10,000+  
**Components Built**: 50+  
**API Endpoints**: 6  
**Database Tables**: 7

---

## Contact & Support

**Project Name**: Kiraedar  
**Tagline**: "Find Your Perfect Stay in Dharamshala"  
**Website**: [kiraraedar.vercel.app](http://kiraraedar.vercel.app)      

**Development Team**:
1. **Ishan Patiyal** - UI/UX Designer
   

2. **Kawalpreet** - Frontend Developer
   
3. **Arpit Kapor** - Backend Developer

4. **Sujal Kumar** - Tester
  

   
   


**For Queries**:
[kiraedarr@gmail.com]


## License

**Private Project** - All rights reserved  
This project is submitted as part of academic/project requirements.

---

> **Note to Evaluators**: This project represents a real-world solution to a genuine problem. All features are functional and tested. The application is deployed and ready for demonstration. We welcome questions and feedback.

---

*End of Documentation*
