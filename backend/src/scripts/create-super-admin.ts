import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Define enums locally since the import path is not found
enum UserRole {
  USER = 'user',
  STREAMER = 'streamer',
  BRAND = 'brand',
  ADMIN = 'admin',
}

enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
}

// Load environment variables from various locations (similar to app.module.ts)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.local' });

// Define user schema identical to our application schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      required: true,
    },
    authProviderId: { type: String },
    channelUrl: { type: String },
    category: [{ type: String }],
    language: [{ type: String }],
    description: { type: String },
    overlaySettings: {
      position: { type: String, default: 'bottom-right' },
      size: { type: String, default: 'medium' },
      opacity: { type: Number, default: 80 },
      backgroundColor: { type: String, default: 'transparent' },
    },
    overlayToken: { type: String },
    overlayLastSeen: { type: Date },
    overlayActive: { type: Boolean, default: false },
    testCampaign: {
      title: { type: String },
      mediaUrl: { type: String },
      mediaType: { type: String },
      testMode: { type: Boolean },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true },
);

// Create the User model
const User = mongoose.model('User', userSchema);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt for user input
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Main function to create a super admin
 */
async function createSuperAdmin() {
  try {
    // Get MongoDB URI from environment or use default
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/gametriggers';
    console.log('👉 Connecting to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully!');

    // Collect admin information
    console.log('\n📝 Please provide the super admin details:');
    const email = await question('Email: ');
    const name = await question('Name: ');
    const password = await question('Password (min 8 characters): ');

    // Validate inputs
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('Invalid email address');
    }

    if (!name || name.trim().length < 2) {
      throw new Error('Name is too short');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error(
        `User with email ${email} already exists. Use a different email or update the existing user.`,
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const adminUser = new User({
      email,
      name,
      role: UserRole.ADMIN,
      authProvider: AuthProvider.EMAIL,
      password: hashedPassword,
      description: 'Super Admin User',
    });

    // Save user to database
    await adminUser.save();

    // Print success message
    console.log('\n✅ Super admin created successfully!');
    console.log('----------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${UserRole.ADMIN}`);
    console.log('----------------------------------');
    console.log('You can now sign in with these credentials.');
  } catch (error) {
    console.error('\n❌ Error creating super admin:');
    console.error(error instanceof Error ? error.message : error);
  } finally {
    // Close MongoDB connection and readline interface
    await mongoose.connection.close();
    rl.close();
  }
}

// Execute the function
createSuperAdmin();
