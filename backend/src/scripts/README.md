# Super Admin Creation Script

This script allows you to create a super admin user for the Instreamly Clone platform.

## Prerequisites

- Node.js and npm installed
- MongoDB connection (configured in the .env file)
- Dependencies installed (`npm install` in project root)

## How to Use

1. Run the following command from the project root:

```bash
npm run create:admin
```

2. Follow the prompts to enter the super admin details:
   - Email address
   - Name
   - Password (must be at least 8 characters)

3. The script will connect to the MongoDB database, check if the user already exists, and create a new admin user with the provided details.

4. Once created, you can log in to the platform using the provided credentials.

## Troubleshooting

- **MongoDB Connection Error**: Make sure your MongoDB instance is running and that the connection URI is correctly set in your environment variables (`MONGODB_URI`).
  
- **User Already Exists**: If a user with the provided email already exists, you'll need to use a different email address or update the existing user.

- **Dependency Issues**: If there are any missing dependencies, run `npm install` in both the project root and the backend directory.

## Note

This script should be run by system administrators only. The created user will have full admin privileges, including access to all data and administrative functions.
