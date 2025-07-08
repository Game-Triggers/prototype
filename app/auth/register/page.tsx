"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/lib/schema-types";
import { AlertCircle, Check } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.companyName.trim()) return "Company name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8) return "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords don't match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    
    setFormError("");
    setIsSubmitting(true);
    
    try {
      // Send registration request to our dedicated registration API route
      const response = await fetch(`/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          password: formData.password,
          role: UserRole.BRAND,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      
      // Show success state
      setFormSuccess(true);
      
      // Auto sign-in after a brief delay
      setTimeout(async () => {
        await signIn("credentials", {
          redirect: true,
          callbackUrl: "/dashboard",
          email: formData.email,
          password: formData.password,
        });
      }, 1500);
      
    } catch (error: unknown) {
      console.error("Registration error:", error);
      setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (formSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold">Registration Successful!</h1>
          <p className="mt-2 text-muted-foreground">
            Your brand account has been created. Signing you in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Create an Account</h1>
          <p className="mt-2 text-muted-foreground">
            Register your brand on Gametriggers
          </p>
        </div>

        <Card className="p-6">
          {formError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                Your Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="companyName" className="block text-sm font-medium">
                Company Name
              </label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          By registering, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}