import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserModel } from "@/schemas/user.schema";

export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user from the database
    const UserModel = getUserModel();
    const user = await UserModel.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return the overlay token and role
    return NextResponse.json({
      overlayToken: user.overlayToken || "not-generated-yet",
      role: user.role
    });
  } catch (error) {
    console.error("Error fetching user overlay token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
