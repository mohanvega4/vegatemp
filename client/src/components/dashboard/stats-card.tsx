import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Users,
  CalendarDays,
  DollarSign,
  Clock,
  BarChart2,
  Star,
  ShoppingBag,
  Inbox,
  MessageSquare,
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  linkText: string;
  linkHref: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgClass,
  iconTextClass,
  linkText,
  linkHref,
}: StatsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "users":
        return <Users className={cn("text-xl", iconTextClass)} />;
      case "calendar":
        return <CalendarDays className={cn("text-xl", iconTextClass)} />;
      case "dollar-sign":
        return <DollarSign className={cn("text-xl", iconTextClass)} />;
      case "clock":
        return <Clock className={cn("text-xl", iconTextClass)} />;
      case "chart":
        return <BarChart2 className={cn("text-xl", iconTextClass)} />;
      case "star":
        return <Star className={cn("text-xl", iconTextClass)} />;
      case "shopping-bag":
        return <ShoppingBag className={cn("text-xl", iconTextClass)} />;
      case "inbox":
        return <Inbox className={cn("text-xl", iconTextClass)} />;
      case "message-square":
        return <MessageSquare className={cn("text-xl", iconTextClass)} />;
      default:
        return <BarChart2 className={cn("text-xl", iconTextClass)} />;
    }
  };

  return (
    <Card className="overflow-hidden shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgClass)}>
            {getIcon()}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a href={linkHref} className="font-medium text-primary hover:text-primary/80">
            {linkText}
          </a>
        </div>
      </div>
    </Card>
  );
}
