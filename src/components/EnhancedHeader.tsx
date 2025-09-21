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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Statistics, CarburantParameter } from '@/types';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  Truck, 
  Save, 
  LogOut, 
  ChevronDown, 
  Fuel, 
  DollarSign, 
  Route, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Menu
} from 'lucide-react';

interface EnhancedHeaderProps {
  user: User | null;
  statistics: Statistics;
  isSaving: boolean;
  onSave: () => void;
  onSignOut: () => void;
  anomaliesCount: number;
}

export const EnhancedHeader = ({ 
  user, 
  statistics, 
  isSaving, 
  onSave, 
  onSignOut,
  anomaliesCount 
}: EnhancedHeaderProps) => {
  const [fuelParameters, setFuelParameters] = useState<CarburantParameter[]>([]);
  const [isKpiOpen, setIsKpiOpen] = useState(false);

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
      }
    };

    loadFuelParameters();

    // Real-time subscription for fuel parameters
    const channel = supabase
      .channel('fuel-parameters-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'carburant_parameters' }, 
        () => {
          console.log('🔄 Fuel parameters changed, reloading...');
          if (mounted) {
            loadFuelParameters();
          }
        }
      )
      .subscribe();

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

  const getFuelPrice = (type: 'gasoil' | 'essence') => {
    const param = fuelParameters.find(p => p.type === type);
    return param ? param.prix : 0;
  };

  return (
    <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-3">
        {/* Main header row */}
        <div className="flex items-center justify-between">
          {/* Left: App branding */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2.5 shadow-sm">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Traçabilité des Bons
              </h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs bg-muted">
                    {getUserInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {user?.email?.split('@')[0] || 'Utilisateur'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: KPIs (desktop) + Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop KPIs */}
            <div className="hidden lg:flex items-center gap-3">
              <KPICards 
                statistics={statistics}
                fuelParameters={fuelParameters}
                anomaliesCount={anomaliesCount}
              />
            </div>

            {/* Mobile KPI toggle */}
            <div className="lg:hidden">
              <Collapsible open={isKpiOpen} onOpenChange={setIsKpiOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    KPI
                    <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isKpiOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onSave}
                disabled={isSaving}
                variant="default"
                size="sm"
                className="hidden sm:flex"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Sync...' : 'Sauvegarder'}
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">Connecté en tant que</div>
                    <div className="text-muted-foreground truncate">{user?.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSave} disabled={isSaving} className="sm:hidden">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Synchronisation...' : 'Sauvegarder'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile KPIs (collapsible) */}
        <div className="lg:hidden">
          <Collapsible open={isKpiOpen} onOpenChange={setIsKpiOpen}>
            <CollapsibleContent className="pt-3">
              <KPICards 
                statistics={statistics}
                fuelParameters={fuelParameters}
                anomaliesCount={anomaliesCount}
                isMobile={true}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </header>
  );
};

// Separate KPI Cards component for reusability
interface KPICardsProps {
  statistics: Statistics;
  fuelParameters: CarburantParameter[];
  anomaliesCount: number;
  isMobile?: boolean;
}

const KPICards = ({ statistics, fuelParameters, anomaliesCount, isMobile = false }: KPICardsProps) => {
  const getFuelPrice = (type: 'gasoil' | 'essence') => {
    const param = fuelParameters.find(p => p.type === type);
    return param ? param.prix : 0;
  };

  const getAnomaliesColor = () => {
    if (anomaliesCount === 0) return 'bg-success/10 text-success border-success/20';
    if (anomaliesCount <= 3) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  const containerClass = isMobile 
    ? "grid grid-cols-2 sm:grid-cols-4 gap-3" 
    : "flex items-center gap-3";

  return (
    <div className={containerClass}>
      {/* Gasoil Price */}
      <Card className="px-3 py-2 bg-fuel/10 border-fuel/20">
        <div className="flex items-center space-x-2">
          <div className="bg-fuel/20 rounded-md p-1">
            <Fuel className="h-3 w-3 text-fuel" />
          </div>
          <div className="text-xs">
            <div className="text-muted-foreground">Gasoil</div>
            <div className="font-semibold text-fuel">
              {getFuelPrice('gasoil').toFixed(3)} TND/L
            </div>
          </div>
        </div>
      </Card>

      {/* Essence Price */}
      <Card className="px-3 py-2 bg-cash/10 border-cash/20">
        <div className="flex items-center space-x-2">
          <div className="bg-cash/20 rounded-md p-1">
            <DollarSign className="h-3 w-3 text-cash" />
          </div>
          <div className="text-xs">
            <div className="text-muted-foreground">Essence</div>
            <div className="font-semibold text-cash">
              {getFuelPrice('essence').toFixed(3)} TND/L
            </div>
          </div>
        </div>
      </Card>

      {/* Total Distance */}
      <Card className="px-3 py-2 bg-info/10 border-info/20">
        <div className="flex items-center space-x-2">
          <div className="bg-info/20 rounded-md p-1">
            <Route className="h-3 w-3 text-info" />
          </div>
          <div className="text-xs">
            <div className="text-muted-foreground">Distance</div>
            <div className="font-semibold text-info">
              {statistics.totalDistance.toFixed(0)} km
            </div>
          </div>
        </div>
      </Card>

      {/* Anomalies */}
      <Card className={`px-3 py-2 ${getAnomaliesColor()}`}>
        <div className="flex items-center space-x-2">
          <div className="bg-current/20 rounded-md p-1">
            <AlertTriangle className="h-3 w-3" />
          </div>
          <div className="text-xs">
            <div className="opacity-80">Anomalies</div>
            <div className="font-semibold">
              {anomaliesCount}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};