import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import { Outlet } from "react-router-dom";
import { RoleOnboardingModal } from "@/components/RoleOnboardingModal";

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen m-2 md:m-0">
      <ScrollToTop />
      <RoleOnboardingModal />
      <header>
        <Navbar />
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer>
        <Footer />
      </footer>
    </div>
  );
};

export default MainLayout;
