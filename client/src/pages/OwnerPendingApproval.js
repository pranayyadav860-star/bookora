// src/pages/OwnerPendingApproval.js
import { Link } from "react-router-dom";

function OwnerPendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-2">Registration Submitted!</h1>
        <p className="text-gray-600 mb-4">
          Your hotel owner registration is pending admin approval.
          We'll notify you via email once approved.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This usually takes 24-48 hours.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

export default OwnerPendingApproval;