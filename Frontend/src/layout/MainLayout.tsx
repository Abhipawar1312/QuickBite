import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import { Outlet } from "react-router-dom";
import { RoleOnboardingModal } from "@/components/RoleOnboardingModal";
import { ChatPanel } from "@/components/ChatPanel";
import { useChatStore } from "@/store/useChatStore";
import { useUserStore } from "@/store/useUserStore";

const MainLayout = () => {
  const { user } = useUserStore();
  const { activeChatOrderId, isChatOpen, closeChat } = useChatStore();

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

      {activeChatOrderId && (
        <ChatPanel
          orderId={activeChatOrderId}
          open={isChatOpen}
          onOpenChange={(open) => {
            if (!open) closeChat();
          }}
          currentUserId={user?._id || ""}
        />
      )}
    </div>
  );
};

export default MainLayout;

