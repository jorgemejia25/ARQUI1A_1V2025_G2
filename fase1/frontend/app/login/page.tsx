/**
 * LoginPage - Main login page component for the SIEPA system
 *
 * Provides the authentication entry point for users. Renders the login layout and form,
 * handling user credential input and validation. The layout is centered and styled for
 * accessibility and responsiveness.
 *
 * Features:
 * - Centered login card with branding and form
 * - Email and password input fields with validation
 * - Error handling and feedback for invalid credentials
 * - Responsive design for all screen sizes
 * - Integration-ready for authentication logic or API
 *
 * @returns The login page with layout and login form
 *
 * @example
 * This component is automatically rendered when navigating to `/login`
 * and uses the LoginLayout template through Next.js app router.
 */
import React from "react";
import  LoginLayout  from "@/components/templates/LoginLayout";

export default function App() {
  return (
    <div className="dark bg-[#0A0A0C]">
      <LoginLayout />
    </div>
  );
};