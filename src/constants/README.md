# Shared Enums

This directory contains enum constants that match the Prisma schema enums in the backend.

## Usage

Import the enums you need:

```javascript
import { Role, VehicleType, MaintenanceType } from '@/constants/enums'

// Use in comparisons
if (user.role === Role.ADMIN) {
  // Admin logic
}

// Use in forms/dropdowns
const vehicleTypes = Object.values(VehicleType)
```

## Important

**These enums must be kept in sync with `backend/prisma/schema.prisma`**

When you add/modify enums in the Prisma schema, update both:
- `/backend/src/constants/enums.ts`
- `/frontend/src/constants/enums.js`

## Available Enums

- `Role` - User roles (USER, ADMIN)
- `RecordType` - Medical record types
- `VitalType` - Vital sign types
- `ReminderFrequency` - Reminder frequencies
- `VehicleType` - Vehicle types (CAR, SUV, PICKUP, etc.)
- `MaintenanceType` - Maintenance types (OIL_CHANGE, BRAKE_PAD_REPLACEMENT, etc.)
- `PaymentMethod` - Payment methods
- `ExpenseFrequency` - Expense frequencies
