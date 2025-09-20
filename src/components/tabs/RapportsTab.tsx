import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bon, Vehicule, Chauffeur, Anomalie } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, Car, User, RefreshCw, AlertTriangle, TrendingUp, Fuel } from 'lucide-react';

interface VehiculeReportStats {
  totalKm: number;
  totalMontant: number;
  totalBons: number;
  avgConsumption: number;
  anomaliesCount: number;
  fuelTypes: { [key: string]: number };
  monthlyData: Array<{
    month: string;
    km: number;
    montant: number;
    bons: number;
  }>;
}

interface ChauffeurReportStats {
  totalKm: number;
  totalMontant: number;
  totalBons: number;
  avgKmPerBon: number;
  anomaliesCount: number;
  vehiclesUsed: number;
  monthlyData: Array<{
    month: string;
    km: number;
    montant: number;
    bons: number;
  }>;
}

interface RapportsTabProps {
  vehicules: Vehicule[];
  chauffeurs: Chauffeur[];
  bons: Bon[];
  anomalies: Anomalie[];
}

export const RapportsTab = ({ vehicules, chauffeurs, bons, anomalies }: RapportsTabProps) => {
  const [reportType, setReportType] = useState<'vehicule' | 'chauffeur'>('vehicule');
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string>('');
  const [selectedChauffeurId, setSelectedChauffeurId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>(''); // Empty for "all time"
  const [dateTo, setDateTo] = useState<string>(''); // Empty for "all time"
  const [vehiculeStats, setVehiculeStats] = useState<VehiculeReportStats | null>(null);
  const [chauffeurStats, setChauffeurStats] = useState<ChauffeurReportStats | null>(null);
  const { toast } = useToast();

  // Filter bons based on selected criteria and date range
  const getFilteredBons = () => {
    let filtered = bons;

    // Filter by vehicle or chauffeur
    if (reportType === 'vehicule' && selectedVehiculeId) {
      filtered = filtered.filter(bon => bon.vehiculeId === selectedVehiculeId);
    } else if (reportType === 'chauffeur' && selectedChauffeurId) {
      filtered = filtered.filter(bon => bon.chauffeurId === selectedChauffeurId);
    }

    // Filter by date range if specified
    if (dateFrom) {
      filtered = filtered.filter(bon => bon.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(bon => bon.date <= dateTo);
    }

    return filtered;
  };

  // Calculate vehicle statistics
  const calculateVehiculeStats = (filteredBons: Bon[]): VehiculeReportStats => {
    const totalKm = filteredBons.reduce((sum, bon) => sum + (bon.distance || 0), 0);
    const totalMontant = filteredBons.reduce((sum, bon) => sum + bon.montant, 0);
    const totalBons = filteredBons.length;
    
    // Calculate fuel consumption (approximate)
    const avgConsumption = totalKm > 0 ? (totalMontant / totalKm) * 100 : 0; // TND per 100km as proxy
    
    // Count related anomalies
    const vehicleAnomalies = anomalies.filter(anomalie => {
      const bonIds = filteredBons.map(b => b.id);
      return bonIds.includes(anomalie.bonId) && anomalie.statut === 'a_verifier';
    });
    
    // Group by fuel type
    const fuelTypes = filteredBons.reduce((acc, bon) => {
      acc[bon.type] = (acc[bon.type] || 0) + bon.montant;
      return acc;
    }, {} as { [key: string]: number });

    // Group by month for trends
    const monthlyData = filteredBons.reduce((acc, bon) => {
      const month = bon.date.substring(0, 7); // YYYY-MM
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.km += bon.distance || 0;
        existing.montant += bon.montant;
        existing.bons += 1;
      } else {
        acc.push({
          month,
          km: bon.distance || 0,
          montant: bon.montant,
          bons: 1
        });
      }
      return acc;
    }, [] as Array<{ month: string; km: number; montant: number; bons: number }>);

    return {
      totalKm,
      totalMontant,
      totalBons,
      avgConsumption,
      anomaliesCount: vehicleAnomalies.length,
      fuelTypes,
      monthlyData: monthlyData.sort((a, b) => a.month.localeCompare(b.month))
    };
  };

  // Calculate chauffeur statistics
  const calculateChauffeurStats = (filteredBons: Bon[]): ChauffeurReportStats => {
    const totalKm = filteredBons.reduce((sum, bon) => sum + (bon.distance || 0), 0);
    const totalMontant = filteredBons.reduce((sum, bon) => sum + bon.montant, 0);
    const totalBons = filteredBons.length;
    const avgKmPerBon = totalBons > 0 ? totalKm / totalBons : 0;
    
    // Count unique vehicles used
    const uniqueVehicles = new Set(filteredBons.map(bon => bon.vehiculeId));
    const vehiclesUsed = uniqueVehicles.size;
    
    // Count related anomalies
    const chauffeurAnomalies = anomalies.filter(anomalie => {
      const bonIds = filteredBons.map(b => b.id);
      return bonIds.includes(anomalie.bonId) && anomalie.statut === 'a_verifier';
    });

    // Group by month for trends
    const monthlyData = filteredBons.reduce((acc, bon) => {
      const month = bon.date.substring(0, 7); // YYYY-MM
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.km += bon.distance || 0;
        existing.montant += bon.montant;
        existing.bons += 1;
      } else {
        acc.push({
          month,
          km: bon.distance || 0,
          montant: bon.montant,
          bons: 1
        });
      }
      return acc;
    }, [] as Array<{ month: string; km: number; montant: number; bons: number }>);

    return {
      totalKm,
      totalMontant,
      totalBons,
      avgKmPerBon,
      anomaliesCount: chauffeurAnomalies.length,
      vehiclesUsed,
      monthlyData: monthlyData.sort((a, b) => a.month.localeCompare(b.month))
    };
  };

  // Update stats when selection or filters change
  useEffect(() => {
    const filteredBons = getFilteredBons();
    
    if (reportType === 'vehicule' && selectedVehiculeId) {
      setVehiculeStats(calculateVehiculeStats(filteredBons));
    } else if (reportType === 'chauffeur' && selectedChauffeurId) {
      setChauffeurStats(calculateChauffeurStats(filteredBons));
    }
  }, [reportType, selectedVehiculeId, selectedChauffeurId, dateFrom, dateTo, bons, anomalies]);

  // Export functionality
  const exportCSV = () => {
    const filteredBons = getFilteredBons();
    if (filteredBons.length === 0) return;

    const headers = ['Date', 'Numéro', 'Type', 'Montant', 'KM Initial', 'KM Final', 'Distance', 'Véhicule', 'Chauffeur'];
    const csvContent = [
      headers.join(','),
      ...filteredBons.map(bon => {
        const vehicule = vehicules.find(v => v.id === bon.vehiculeId);
        const chauffeur = chauffeurs.find(c => c.id === bon.chauffeurId);
        return [
          bon.date,
          bon.numero,
          bon.type,
          bon.montant.toFixed(2),
          bon.kmInitial || '',
          bon.kmFinal || '',
          bon.distance?.toFixed(2) || '',
          vehicule?.immatriculation || '',
          `${chauffeur?.prenom || ''} ${chauffeur?.nom || ''}`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-${reportType}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart colors
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Rapports et Analyses</h2>
      </div>

      <Tabs value={reportType} onValueChange={(value) => setReportType(value as 'vehicule' | 'chauffeur')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicule" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Par Véhicule
          </TabsTrigger>
          <TabsTrigger value="chauffeur" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Par Chauffeur
          </TabsTrigger>
        </TabsList>

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
              {reportType === 'vehicule' ? (
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="chauffeur">Chauffeur</Label>
                  <Select value={selectedChauffeurId} onValueChange={setSelectedChauffeurId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chauffeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {chauffeurs.map(chauffeur => (
                        <SelectItem key={chauffeur.id} value={chauffeur.id}>
                          {chauffeur.prenom} {chauffeur.nom} ({chauffeur.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dateFrom">Du (optionnel)</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Depuis toujours"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">Au (optionnel)</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Jusqu'à aujourd'hui"
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tout temps
                  </Button>
                  <Button 
                    onClick={exportCSV} 
                    disabled={!((reportType === 'vehicule' && selectedVehiculeId) || (reportType === 'chauffeur' && selectedChauffeurId))}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="vehicule">
          {selectedVehiculeId && vehiculeStats && (
            <>
              {/* Vehicle Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distance totale</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vehiculeStats.totalKm.toFixed(1)} km</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Coût total</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vehiculeStats.totalMontant.toFixed(2)} TND</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nombre de bons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vehiculeStats.totalBons}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{vehiculeStats.anomaliesCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Charts */}
              {vehiculeStats.monthlyData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution mensuelle - Distance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={vehiculeStats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distance']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Line type="monotone" dataKey="km" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution mensuelle - Coût</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={vehiculeStats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(2)} TND`, 'Coût']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Bar dataKey="montant" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par type de carburant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(vehiculeStats.fuelTypes).map(([type, amount]) => ({
                              name: type,
                              value: amount
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(vehiculeStats.fuelTypes).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value.toFixed(2)} TND`, 'Montant']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Nombre de bons par mois</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={vehiculeStats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value}`, 'Bons']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Bar dataKey="bons" fill="hsl(var(--accent))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {!selectedVehiculeId && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  Sélectionnez un véhicule pour voir le rapport détaillé
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chauffeur">
          {selectedChauffeurId && chauffeurStats && (
            <>
              {/* Chauffeur Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distance totale</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chauffeurStats.totalKm.toFixed(1)} km</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Coût total</CardTitle>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chauffeurStats.totalMontant.toFixed(2)} TND</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nombre de bons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chauffeurStats.totalBons}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Véhicules utilisés</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chauffeurStats.vehiclesUsed}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Distance moy. par bon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chauffeurStats.avgKmPerBon.toFixed(1)} km</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{chauffeurStats.anomaliesCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Chauffeur Charts */}
              {chauffeurStats.monthlyData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution mensuelle - Distance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chauffeurStats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distance']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Line type="monotone" dataKey="km" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Évolution mensuelle - Coût</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chauffeurStats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(2)} TND`, 'Coût']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Bar dataKey="montant" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Nombre de bons par mois</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chauffeurStats.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value}`, 'Bons']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Bar dataKey="bons" fill="hsl(var(--accent))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance (km/bon)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chauffeurStats.monthlyData.map(item => ({
                          ...item,
                          kmPerBon: item.bons > 0 ? item.km / item.bons : 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)} km/bon`, 'Performance']}
                            labelFormatter={(label) => `Mois: ${label}`}
                          />
                          <Line type="monotone" dataKey="kmPerBon" stroke="hsl(var(--destructive))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {!selectedChauffeurId && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  Sélectionnez un chauffeur pour voir le rapport détaillé
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
};