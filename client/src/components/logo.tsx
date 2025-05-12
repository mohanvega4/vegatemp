import { cn } from "@/lib/utils";
// Direct image path for better compatibility
const vegaShowLogo = "/vega-show-logo.png";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  showText?: boolean;
}

export function Logo({ className, variant = "full", showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={vegaShowLogo}
        alt="Vega Show Logo"
        className="h-full w-auto object-contain"
      />
      {showText && (
        <span className="ml-2 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Vega Show
        </span>
      )}
    </div>
  );
}
