import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React from "react";

export default function ProtectedRoute({ children }: { children: React.JSX.Element }) {
    const { user, loading } = useAuth();
    if (loading){
        return <div>Loading...</div>
    }
    return user ? children : <Navigate to="/login" replace />;
}
