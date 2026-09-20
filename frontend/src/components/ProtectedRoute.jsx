import { Navigate } from 'react-router-dom';
const ProtectedRoute = ({ children, roles }) => {
    const userInfoString = localStorage.getItem('userInfo');
    if (!userInfoString) return <Navigate to="/login" replace />;
    const userInfo = JSON.parse(userInfoString);
    if (roles && !roles.includes(userInfo.role)) return <Navigate to="/" replace />;
    return children;
};
export default ProtectedRoute;
