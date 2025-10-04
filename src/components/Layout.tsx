import { Link, useLocation } from "react-router-dom";
import { Activity, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-mesh">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 lg:py-4">
          <div className="flex flex-col space-y-3 lg:space-y-0">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                LoRa Mesh — Elephant Alert Demo
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                Visual demonstration of mesh network alert propagation with real SMS delivery
              </p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-col sm:flex-row gap-2 mt-3 lg:mt-4">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm",
                isActive("/")
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Activity className="w-4 h-4" />
              <span className="whitespace-nowrap">Mesh Simulation</span>
            </Link>
            <Link
              to="/contacts"
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm",
                isActive("/contacts")
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <Users className="w-4 h-4" />
              <span className="whitespace-nowrap">Contacts</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;