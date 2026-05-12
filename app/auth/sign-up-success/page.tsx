import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
      <div className="page-bg relative w-full min-h-screen md:h-screen overflow-hidden flex items-center justify-center p-4 sm:p-8">
        {/* --- BG Design --- */}
        <div className="blob blob-periwinkle hidden md:block"
        style={{ width: 500, height: 500, top: -120, right: -120, opacity: 0.3 }}/>
        <div className="blob blob-pink hidden md:block" 
          style={{ width: 400, height: 400, bottom: 100, left: -100, opacity: 0.3 }}/>
          
  
        {/* --- Form Container --- */}
        <div className="card max-w-md w-full mx-auto h-fit">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--periwinkle-light)] text-[var(--periwinkle)] flex items-center justify-center mb-5">
              <MailCheck className="w-8 h-8" strokeWidth={2.5} />
            </div>
            
            {/* Typography */}
            <h2 className="heading-lg mb-2">Thank you for signing up!</h2>
            <p className="body text-[var(--gray)] mb-6 px-4">
              Please check your email to confirm your account.
            </p>
            
            {/* Action Button */}
            <Link href="/auth/login" className="btn btn-primary w-full justify-center">
              Go to Login
            </Link>
          </div>
        </div>
    </div>
    );
}