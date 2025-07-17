import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  DollarSign, 
  Users, 
  CreditCard,
  Scale,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Petty Cash',
    href: '/petty-cash',
    icon: DollarSign,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'User Loans',
    href: '/loans',
    icon: CreditCard,
  },
  {
    name: 'Garnishments',
    href: '/garnishments',
    icon: Scale,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      'bg-card border-r border-border h-screen flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-bold text-primary">
            CashFlow Guard+
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    'hover:bg-muted hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground',
                    collapsed ? 'justify-center' : 'justify-start'
                  )
                }
              >
                <item.icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            Internal Finance Console
          </div>
        )}
      </div>
    </div>
  );
}