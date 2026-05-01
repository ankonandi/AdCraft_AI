import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, LayoutDashboard, CalendarCheck, Settings, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/social/dashboard", label: "Social", icon: CalendarCheck },
  { to: "/social/settings", label: "Keys", icon: Settings },
];

export const Navigation = ({ showAuth = true }: { showAuth?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
      toast({ title: "Signed out successfully" });
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-foreground group">
          <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-marigold shadow-soft transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <span className="tracking-tight">AdCraft <span className="text-primary">AI</span></span>
        </Link>

        {showAuth && (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 h-10 rounded-xl text-sm font-medium transition-colors",
                    isActive(to)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground/70">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {showAuth && open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-up">
          <div className="container mx-auto px-4 py-3 grid gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                onClick={() => { setOpen(false); navigate(to); }}
                className={cn(
                  "flex items-center gap-3 px-3 h-12 rounded-xl text-base font-medium",
                  isActive(to) ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted",
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
            <button
              onClick={() => { setOpen(false); handleLogout(); }}
              className="flex items-center gap-3 px-3 h-12 rounded-xl text-base font-medium text-foreground/80 hover:bg-muted"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
