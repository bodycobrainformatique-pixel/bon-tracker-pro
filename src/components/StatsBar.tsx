// Barre de statistiques en temps réel

import { Statistics } from '@/types';
import { Card } from '@/components/ui/card';
import { Fuel, Banknote, Route, AlertTriangle } from 'lucide-react';

interface StatsBarProps {
  statistics: Statistics;
}

export const StatsBar = ({ statistics }: StatsBarProps) => {
  return (
    <div className="flex items-center space-x-4">
      <Card className="px-3 py-2 flex items-center space-x-2">
        <div className="bg-fuel rounded p-1">
          <Fuel className="h-3 w-3 text-fuel-foreground" />
        </div>
        <div className="text-xs">
          <div className="text-muted-foreground">Gasoil</div>
          <div className="font-semibold">{statistics.montantGasoil.toFixed(2)}€</div>
        </div>
      </Card>

      <Card className="px-3 py-2 flex items-center space-x-2">
        <div className="bg-cash rounded p-1">
          <Banknote className="h-3 w-3 text-cash-foreground" />
        </div>
        <div className="text-xs">
          <div className="text-muted-foreground">Espèces</div>
          <div className="font-semibold">{statistics.montantEspeces.toFixed(2)}€</div>
        </div>
      </Card>

      <Card className="px-3 py-2 flex items-center space-x-2">
        <div className="bg-info rounded p-1">
          <Route className="h-3 w-3 text-info-foreground" />
        </div>
        <div className="text-xs">
          <div className="text-muted-foreground">Distance</div>
          <div className="font-semibold">{statistics.totalDistance.toFixed(0)} km</div>
        </div>
      </Card>

      {statistics.anomaliesCount > 0 && (
        <Card className="px-3 py-2 flex items-center space-x-2 border-destructive">
          <div className="bg-destructive rounded p-1">
            <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
          </div>
          <div className="text-xs">
            <div className="text-muted-foreground">Anomalies</div>
            <div className="font-semibold text-destructive">{statistics.anomaliesCount}</div>
          </div>
        </Card>
      )}
    </div>
  );
};