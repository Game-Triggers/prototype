# Super Admin Creation Tool

This tool allows you to create an admin user with full administrative privileges for the Instreamly Clone platform.

## How to Use

### Option 1: Using PowerShell (Windows)

1. Run the PowerShell script from the project root:
   ```
   .\create-admin.ps1
   ```

2. Follow the prompts to enter:
   - Email address
   - Name
   - Password (minimum 8 characters)

### Option 2: Using npm

1. Run the following command from the project root:
   ```
   npm run create:admin
   ```

2. Follow the prompts to enter the super admin details.

## Requirements

- The MongoDB database must be accessible (configured in your .env file)
- All dependencies must be installed (run `npm install` in both project root and backend folder if needed)

## Notes

- This script should only be used by system administrators
- The created user will have the ADMIN role with full access to all features
- You can use this admin account to manage other users, view analytics, and perform administrative tasks

## Troubleshooting

If you encounter any issues:

1. Check that MongoDB is running and accessible
2. Verify your .env configuration
3. Make sure all dependencies are installed
4. Check for errors in the console output

For detailed information, refer to the README.md file in the `backend/src/scripts/` directory.
