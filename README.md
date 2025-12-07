# Vehicle Booking System

## Live URL
#### Interface
<p>TypeScript–এ interface খুব সহজেই অন্য interface বা এমনকি type কে extend করতে পারে। অর্থাৎ, নতুন interface তৈরি করার সময় আগের interface এর প্রপার্টিগুলো নিয়ে আরও নতুন প্রপার্টি যোগ করা যায়।</p>


## Features
#### Authentication & Authorization:

- User Registration & Login with JWT tokens
- Role-based Access Control: Admin vs Customer
- Secure password hashing with bcryptjs

#### Vehicle Management:
- Admin: Create, update, delete vehicles
- Public: View all available vehicles
- Vehicle Details: Name, type, registration number, daily rent price, availability status

#### Booking System
- Customers: Book available vehicles with date range
- Automatic Pricing: Calculates total based on daily rate × duration
- Real-time Availability: Updates vehicle status when booked/returned
- Booking Management: View, cancel, or mark as returned

#### User Management
- Admin: View all users, update roles, delete users
- Customers: Update own profile information
- Security: Customers can only access their own data

## Technology Stack

- Node.js with Express.js - Server framework
- TypeScript - Type-safe JavaScript
- PostgreSQL - Relational database
- Neon.tech - Serverless PostgreSQL hosting
- JWT - JSON Web Tokens for authentication
- bcryptjs - Password hashing

## Setup & Installation

- Clone the repository
```typescript
git clone https://github.com/TonmoyZohani/vehicle-booking-system.git
```

- Install Dependencies

```typescript
npm install
```
- Configure Environment Variables

```typescript
PORT=5000
CONNECTION_STRING=postgresql://username:password@host:port/database
JWT_SECRET=your-secret-jwt-key-here
```

- Start Development Server

```typescript
npm run dev
```
Server runs at: http://localhost:5000


## API Documentation

- Start Development Server

```typescript
http://localhost:5000
```

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/signup` | Public | Register new user |
| POST | `/api/v1/auth/signin` | Public | Login and get JWT |

---

### Vehicles
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/vehicles` | Admin only | Add new vehicle |
| GET | `/api/v1/vehicles` | Public | View all vehicles in the system |
| GET | `/api/v1/vehicles/:vehicleId` | Public | View specific vehicle details |
| PUT | `/api/v1/vehicles/:vehicleId` | Admin only | Update vehicle details |
| DELETE | `/api/v1/vehicles/:vehicleId` | Admin only | Delete vehicle |

---

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/users` | Admin only | View all users  |
| PUT | `/api/v1/users/:userId` | Admin or Own | Update user profile |
| DELETE | `/api/v1/users/:userId` | Admin only | Delete user |

---

### Bookings
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/bookings` | Customer or Admin | Create new booking|
| GET | `/api/v1/bookings` | Role-based | View bookings (role-based) |
| PUT | `/api/v1/bookings/:bookingId` | Role-based | Update booking status |
