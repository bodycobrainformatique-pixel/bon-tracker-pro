// Onglet de gestion des paramètres de carburant

import { useState, useEffect } from 'react';
import { CarburantParameter, BonType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ParametresTab = () => {
  const [parameters, setParameters] = useState<CarburantParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      const { data, error } = await supabase
        .from('carburant_parameters')
        .select('*')
        .order('type');

      if (error) throw error;

      const mappedParams = (data || []).map(param => ({
        type: param.type as BonType,
        prix: Number(param.prix),
        createdAt: param.created_at,
        updatedAt: param.updated_at
      }));

      setParameters(mappedParams);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres de carburant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateParameter = (type: BonType, prix: number) => {
    setParameters(prev => 
      prev.map(param => 
        param.type === type 
          ? { ...param, prix } 
          : param
      )
    );
  };

  const saveParameters = async () => {
    setSaving(true);
    try {
      for (const param of parameters) {
        const { error } = await supabase
          .from('carburant_parameters')
          .update({ prix: param.prix })
          .eq('type', param.type);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (type: BonType): string => {
    switch (type) {
      case 'gasoil': return 'Gasoil';
      case 'essence': return 'Essence';
      case 'hybride': return 'Hybride';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des paramètres...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Paramètres des Carburants</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Prix par Litre (TND)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {parameters.map((param, index) => (
            <div key={param.type}>
              <div className="flex items-center space-x-4">
                <div className="w-24">
                  <Label className="font-medium">{getTypeLabel(param.type)}</Label>
                </div>
                <div className="flex-1 max-w-xs">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={param.prix}
                    onChange={(e) => updateParameter(param.type, parseFloat(e.target.value) || 0)}
                    placeholder="Prix en TND/L"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  TND/Litre
                </div>
              </div>
              {index < parameters.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          <div className="pt-4 flex justify-end">
            <Button 
              onClick={saveParameters} 
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};