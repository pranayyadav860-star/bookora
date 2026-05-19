import React, { useEffect, useRef } from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AuthCallback() {

  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  // PREVENT MULTIPLE EXECUTIONS

  const processedRef = useRef(false);

  useEffect(() => {

    // STOP INFINITE LOOP

    if (processedRef.current) return;

    processedRef.current = true;

    const params =
      new URLSearchParams(
        location.search
      );

    const token =
      params.get("token");

    const userParam =
      params.get("user");

    const errorParam =
      params.get("error");

    // HANDLE AUTH ERROR

    if (errorParam) {

      console.error(
        "Auth error:",
        errorParam
      );

      navigate(
        "/login?error=social_auth_failed",
        {
          replace: true,
        }
      );

      return;

    }

    // HANDLE SUCCESS LOGIN

    if (token && userParam) {

      try {

        const user = JSON.parse(
          decodeURIComponent(
            userParam
          )
        );

        // SAVE LOGIN

        login(token, user);

        // SMALL DELAY PREVENTS LOOP

        setTimeout(() => {

          navigate("/", {
            replace: true,
          });

        }, 300);

      } catch (err) {

        console.error(
          "Error parsing user data:",
          err
        );

        navigate(
          "/login?error=invalid_data",
          {
            replace: true,
          }
        );

      }

    } else {

      console.error(
        "Missing token or user data"
      );

      navigate(
        "/login?error=missing_data",
        {
          replace: true,
        }
      );

    }

  }, []); // IMPORTANT: EMPTY ARRAY

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">

      <div className="text-center">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">

          Completing Login

        </h2>

        <p className="text-gray-600">

          Please wait...

        </p>

      </div>

    </div>

  );

}

export default AuthCallback;