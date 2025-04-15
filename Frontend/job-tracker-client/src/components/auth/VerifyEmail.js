import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmail = () => {
  const { verifyEmail, error } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const verifiedParam = searchParams.get('verified') === 'true';
  const errorParam = searchParams.get('error') === 'true';
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(verifiedParam);

  useEffect(() => {
    const verify = async () => {
      // If we have a verified parameter, we don't need to verify again
      if (verifiedParam) {
        setVerified(true);
        return;
      }
      
      // If we have an error parameter, don't try to verify
      if (errorParam) {
        return;
      }
      
      // Only verify if we have both token and email
      if (token && email) {
        setVerifying(true);
        const success = await verifyEmail(token, email);
        setVerifying(false);
        
        if (success) {
          setVerified(true);
        }
      }
    };
    
    verify();
  }, [token, email, verifyEmail, verifiedParam, errorParam]);

  // If the backend already verified the email (verified=true in query)
  if (verifiedParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Your email has been verified successfully.</span>
            <div className="mt-4">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Login to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If the backend reported an error (error=true in query)
  if (errorParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Verification failed!</strong>
            <span className="block sm:inline"> The verification link is invalid or has expired.</span>
            <div className="mt-4">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy verification flow - this will handle the case where neither verified nor error params are present
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Invalid request!</strong>
            <span className="block sm:inline"> No verification token or email provided.</span>
            <div className="mt-4">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
            <div className="mt-4 flex justify-center">
              <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Your email has been verified successfully.</span>
            <div className="mt-4">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Login to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Verification failed!</strong>
          <span className="block sm:inline"> {error || 'There was an error verifying your email.'}</span>
          <div className="mt-4">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 