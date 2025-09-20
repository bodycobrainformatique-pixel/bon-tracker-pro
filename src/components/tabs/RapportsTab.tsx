import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Vehicule } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, Car } from 'lucide-react';

interface DailyStats {
  vehicule_id: string;
  immatriculation: string;
  jour: string;
  km_total: number;
  cout_tnd: number;
  litres_total: number;
  l_per_100km: number;
}

interface RapportsTabProps {
  vehicules: Vehicule[];
}

export const RapportsTab = ({ vehicules }: RapportsTabProps) => {
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadDailyStats = async () => {
    if (!selectedVehiculeId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('v_vehicule_daily_stats')
        .select('*')
        .eq('vehicule_id', selectedVehiculeId)
        .order('jour', { ascending: true });

      if (dateFrom) {
        query = query.gte('jour', dateFrom);
      }
      if (dateTo) {
        query = query.lte('jour', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDailyStats(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les statistiques: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVehiculeId) {
      loadDailyStats();
    }
  }, [selectedVehiculeId, dateFrom, dateTo]);

  const exportCSV = () => {
    if (dailyStats.length === 0) return;

    const headers = ['Date', 'Immatriculation', 'KM Total', 'Coût (TND)', 'Litres Total', 'L/100km'];
    const csvContent = [
      headers.join(','),
      ...dailyStats.map(row => [
        row.jour,
        row.immatriculation,
        row.km_total?.toFixed(2) || '0',
        row.cout_tnd?.toFixed(2) || '0',
        row.litres_total?.toFixed(2) || '0',
        row.l_per_100km?.toFixed(2) || '0'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-vehicule-${selectedVehiculeId}-${dateFrom}-${dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate totals
  const totals = dailyStats.reduce((acc, row) => ({
    km_total: acc.km_total + (row.km_total || 0),
    cout_tnd: acc.cout_tnd + (row.cout_tnd || 0),
    litres_total: acc.litres_total + (row.litres_total || 0)
  }), { km_total: 0, cout_tnd: 0, litres_total: 0 });

  const avgConsumption = totals.km_total > 0 ? (totals.litres_total * 100) / totals.km_total : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Rapports par véhicule</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicule">Véhicule</Label>
              <Select value={selectedVehiculeId} onValueChange={setSelectedVehiculeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.map(vehicule => (
                    <SelectItem key={vehicule.id} value={vehicule.id}>
                      {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Du</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Au</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={exportCSV} 
                disabled={!selectedVehiculeId || dailyStats.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedVehiculeId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distance totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.km_total.toFixed(1)} km</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coût total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.cout_tnd.toFixed(2)} TND</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Litres totaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.litres_total.toFixed(1)} L</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consommation moy.</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgConsumption.toFixed(1)} L/100km</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {dailyStats.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distance journalière (km)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jour" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distance']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line type="monotone" dataKey="km_total" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Litres consommés</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jour" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)} L`, 'Litres']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="litres_total" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coût journalier (TND)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jour" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)} TND`, 'Coût']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="cout_tnd" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Consommation (L/100km)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jour" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value?.toFixed(1) || '0'} L/100km`, 'Consommation']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line type="monotone" dataKey="l_per_100km" stroke="hsl(var(--accent-foreground))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {loading && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">Chargement des statistiques...</div>
              </CardContent>
            </Card>
          )}

          {!loading && dailyStats.length === 0 && selectedVehiculeId && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  Aucune donnée disponible pour cette période
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};