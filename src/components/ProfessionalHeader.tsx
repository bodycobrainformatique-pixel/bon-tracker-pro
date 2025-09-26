import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Statistics, CarburantParameter } from '@/types';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  Truck, 
  LogOut, 
  ChevronDown, 
  Fuel, 
  DollarSign, 
  Route, 
  AlertTriangle,
  Download,
  Settings,
  Menu,
  FileText,
  Users,
  BarChart3,
  Wifi,
  WifiOff,
  FileDown,
  Wrench
} from 'lucide-react';

interface ProfessionalHeaderProps {
  user: User | null;
  statistics: Statistics;
  onSignOut: () => void;
  anomaliesCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAnomaliesClick: () => void;
}

export const ProfessionalHeader = ({ 
  user, 
  statistics, 
  onSignOut,
  anomaliesCount,
  activeTab,
  onTabChange,
  onAnomaliesClick
}: ProfessionalHeaderProps) => {
  const [fuelParameters, setFuelParameters] = useState<CarburantParameter[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load and subscribe to fuel parameters for real-time updates
  useEffect(() => {
    let mounted = true;
    
    const loadFuelParameters = async () => {
      try {
        const { data, error } = await supabase
          .from('carburant_parameters')
          .select('*')
          .order('type');

        if (error) throw error;

        if (mounted) {
          const mappedParams = (data || []).map(param => ({
            type: param.type as 'gasoil' | 'essence' | 'gasoil50',
            prix: Number(param.prix),
            createdAt: param.created_at,
            updatedAt: param.updated_at
          }));

          setFuelParameters(mappedParams);
        }
      } catch (error) {
        console.error('Error loading fuel parameters:', error);
        setIsConnected(false);
      }
    };

    loadFuelParameters();

    // Real-time subscription for fuel parameters and connection status
    const channel = supabase
      .channel('header-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'carburant_parameters' }, 
        () => {
          console.log('🔄 Fuel parameters changed, reloading...');
          setIsConnected(true);
          if (mounted) {
            loadFuelParameters();
          }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bons' }, 
        () => {
          setIsConnected(true);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'anomalies' }, 
        () => {
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const getUserInitials = (email: string | undefined) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getFuelPrice = (type: 'gasoil' | 'essence' | 'gasoil50') => {
    const param = fuelParameters.find(p => p.type === type);
    return param ? param.prix : 0;
  };

  const navigationItems = [
    { id: 'bons', label: 'Bons', icon: FileText },
    { id: 'chauffeurs', label: 'Chauffeurs', icon: Users },
    { id: 'vehicules', label: 'Véhicules', icon: Truck },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'rapports', label: 'Rapports', icon: BarChart3 },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ];

  const handleExport = (format: string) => {
    console.log(`Exporting as ${format}`);
    // TODO: Implement export functionality
  };

  return (
    <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: App branding */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2.5 shadow-sm">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Gestion de la Parc Automobile
                </h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                  <span className="hidden sm:inline">
                    {isConnected ? 'Connecté en temps réel' : 'Hors ligne'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Navigation shortcuts (desktop) */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="relative"
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                    {item.id === 'anomalies' && anomaliesCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                        {anomaliesCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Right: User profile */}
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="space-y-4 mt-6">
                      <div className="text-lg font-semibold">Navigation</div>
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              onTabChange(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {item.label}
                            {item.id === 'anomalies' && anomaliesCount > 0 && (
                              <Badge variant="destructive" className="ml-auto">
                                {anomaliesCount}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-32 truncate">
                      {user?.email?.split('@')[0] || 'Utilisateur'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">Connecté en tant que</div>
                    <div className="text-muted-foreground truncate">{user?.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onTabChange('parametres')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres rapides
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open('/chauffeur/auth', '_blank')}>
                    <Users className="w-4 h-4 mr-2" />
                    Accès Chauffeur
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* KPI Cards */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide min-w-0 flex-1">
              {/* Gasoil Price */}
              <Card className="flex-shrink-0 px-3 py-2 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500 rounded-md p-1.5">
                    <Fuel className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-blue-900">
                      {getFuelPrice('gasoil').toFixed(3)} TND
                    </div>
                    <div className="text-blue-700 text-xs">Gasoil</div>
                  </div>
                </div>
              </Card>

              {/* Gasoil 50 Price */}
              <Card className="flex-shrink-0 px-3 py-2 bg-teal-50 border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="bg-teal-500 rounded-md p-1.5">
                    <Fuel className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-teal-900">
                      {getFuelPrice('gasoil50').toFixed(3)} TND
                    </div>
                    <div className="text-teal-700 text-xs">Gasoil 50</div>
                  </div>
                </div>
              </Card>

              {/* Essence Price */}
              <Card className="flex-shrink-0 px-3 py-2 bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="bg-orange-500 rounded-md p-1.5">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-orange-900">
                      {getFuelPrice('essence').toFixed(3)} TND
                    </div>
                    <div className="text-orange-700 text-xs">Essence</div>
                  </div>
                </div>
              </Card>

              {/* Total Distance */}
              <Card className="flex-shrink-0 px-3 py-2 bg-green-50 border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-500 rounded-md p-1.5">
                    <Route className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-green-900">
                      {statistics.totalDistance.toFixed(0)} km
                    </div>
                    <div className="text-green-700 text-xs">Distance</div>
                  </div>
                </div>
              </Card>

              {/* Anomalies */}
              <Card 
                className="flex-shrink-0 px-3 py-2 bg-red-50 border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                onClick={onAnomaliesClick}
              >
                <div className="flex items-center space-x-2">
                  <div className="bg-red-500 rounded-md p-1.5">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-red-900">
                      {anomaliesCount}
                    </div>
                    <div className="text-red-700 text-xs">Anomalies</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Area */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {/* Sync Status */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-success" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
              </div>


              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Actions Menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileDown className="w-4 h-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};