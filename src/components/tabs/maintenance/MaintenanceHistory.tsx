import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Download,
  FileText,
  History,
  DollarSign
} from 'lucide-react';
import { Vehicule } from '@/types';
import { MaintenanceEvent } from '@/types/maintenance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MaintenanceHistoryProps {
  events: MaintenanceEvent[];
  vehicules: Vehicule[];
}

export const MaintenanceHistory = ({ events, vehicules }: MaintenanceHistoryProps) => {
  const [filters, setFilters] = useState({
    vehicule_id: '',
    date_from: undefined as Date | undefined,
    date_to: undefined as Date | undefined
  });

  const filteredEvents = events.filter(event => {
    if (filters.vehicule_id && event.vehicule_id !== filters.vehicule_id) return false;
    if (filters.date_from && event.date_realisation < format(filters.date_from, 'yyyy-MM-dd')) return false;
    if (filters.date_to && event.date_realisation > format(filters.date_to, 'yyyy-MM-dd')) return false;
    return true;
  });

  const totalCost = filteredEvents.reduce((sum, event) => sum + (event.cout_total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historique des maintenances</h3>
          <p className="text-sm text-muted-foreground">
            Consultez l'historique complet des maintenances effectuées
          </p>
        </div>

        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={filters.vehicule_id} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, vehicule_id: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Tous les véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les véhicules</SelectItem>
                {vehicules.map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id}>
                    {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !filters.date_from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_from ? format(filters.date_from, "dd/MM/yyyy", { locale: fr }) : "Date début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date_from}
                  onSelect={(date) => setFilters(prev => ({ ...prev, date_from: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !filters.date_to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_to ? format(filters.date_to, "dd/MM/yyyy", { locale: fr }) : "Date fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date_to}
                  onSelect={(date) => setFilters(prev => ({ ...prev, date_to: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {filteredEvents.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Coût total:</span>
              <Badge variant="outline" className="font-medium">
                {totalCost.toFixed(2)} TND
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Interventions:</span>
              <Badge variant="outline" className="font-medium">
                {filteredEvents.length}
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Events Table */}
      <Card>
        {filteredEvents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Tâche</TableHead>
                <TableHead>Odomètre</TableHead>
                <TableHead>Coûts</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {format(new Date(event.date_realisation), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{event.vehicule?.immatriculation}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.vehicule?.marque} {event.vehicule?.modele}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{event.task?.libelle}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.task?.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.odometre_km.toLocaleString()} km
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">{event.cout_total.toFixed(2)} TND</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        MO: {event.cout_main_oeuvre.toFixed(2)} • Pièces: {event.cout_pieces.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {event.commentaire || (
                        <span className="text-muted-foreground">Aucun commentaire</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Aucun historique de maintenance</p>
            <p className="text-sm">Les maintenances effectuées s'afficheront ici</p>
          </div>
        )}
      </Card>
    </div>
  );
};