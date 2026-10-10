import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen lg:flex" style={{ backgroundColor: "#F6F6F6" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 lg:ml-64">
        {/* ── Mobile header ala Header_Buyer (green rounded-b-2xl) ── */}
        <div
          className="lg:hidden sticky top-0 z-20 px-5 pt-12 pb-4 rounded-b-2xl mb-1"
          style={{ backgroundColor: "#14532d" }}
        >
          <div className="flex flex-row items-center gap-2.5 pl-12">
            <div className="flex-1">
              <p className="text-white font-bold text-lg leading-tight">
                FarmGate Direct
              </p>
            </div>
          </div>
        </div>
        <main className="flex-1 w-full min-w-0 overflow-x-clip px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
