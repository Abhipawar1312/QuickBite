// App.tsx
import React, { useEffect, lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Loading from "./components/ui/Loading";
import { useUserStore } from "./store/useUserStore";

// lazy-loaded route components
const SignUp = lazy(() => import("./auth/SignUp"));
const Login = lazy(() => import("./auth/Login"));
const ForgetPassword = lazy(() => import("./auth/ForgetPassword"));
const ResetPassword = lazy(() => import("./auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./auth/VerifyEmail"));
const HeroSection = lazy(() => import("./components/HeroSection"));
const MainLayout = lazy(() => import("./layout/MainLayout"));
const Profile = lazy(() => import("./components/Profile"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const RestaurantDetail = lazy(() => import("./components/RestaurantDetail"));
const Cart = lazy(() => import("./components/Cart"));
const Restaurant = lazy(() => import("./admin/Restaurant"));
const AddMenu = lazy(() => import("./admin/AddMenu"));
const Orders = lazy(() => import("./admin/Orders"));
const Success = lazy(() => import("./components/Success"));

// Route guards (no change)
const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useUserStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isVerified) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
};
const AuthenticatedUser = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useUserStore();
  if (isAuthenticated && user?.isVerified) return <Navigate to="/" replace />;
  return <>{children}</>;
};
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useUserStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.admin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Define your router
const appRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      { path: "/", element: <HeroSection /> },
      { path: "/profile", element: <Profile /> },
      { path: "/search/:text", element: <SearchPage /> },
      { path: "/restaurant/:id", element: <RestaurantDetail /> },
      { path: "/cart", element: <Cart /> },
      { path: "/order/status", element: <Success /> },
      {
        path: "/admin/restaurant",
        element: (
          <AdminRoute>
            <Restaurant />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/menu",
        element: (
          <AdminRoute>
            <AddMenu />
          </AdminRoute>
        ),
      },
      {
        path: "/admin/orders",
        element: (
          <AdminRoute>
            <Orders />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <AuthenticatedUser>
        <Login />
      </AuthenticatedUser>
    ),
  },
  {
    path: "/signup",
    element: (
      <AuthenticatedUser>
        <SignUp />
      </AuthenticatedUser>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <AuthenticatedUser>
        <ForgetPassword />
      </AuthenticatedUser>
    ),
  },
  { path: "/resetpassword/:token", element: <ResetPassword /> },
  { path: "/verify-email", element: <VerifyEmail /> },
]);

function App() {
  const { checkAuthentication, isCheckingAuth } = useUserStore();

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  if (isCheckingAuth) return <Loading />;

  // Wrap the entire router in a Suspense boundary
  return (
    <main>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={appRouter} />
      </Suspense>
    </main>
  );
}

export default App;
