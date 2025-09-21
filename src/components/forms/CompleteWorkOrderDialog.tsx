import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MaintenanceWorkOrder, PartsCatalog } from '@/types/maintenance';
import { Plus, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PartsUsed {
  part_id: string;
  quantite: number;
  prix_unitaire: number;
}

interface CompleteWorkOrderDialogProps {
  workOrder: MaintenanceWorkOrder | null;
  parts: PartsCatalog[];
  onComplete: (data: {
    work_order_id: string;
    date_realisation: string;
    odometre_km: number;
    commentaire?: string;
    cout_main_oeuvre: number;
    cout_pieces: number;
    pieces_utilisees: PartsUsed[];
    fichiers?: File[];
  }) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export const CompleteWorkOrderDialog = ({
  workOrder,
  parts,
  onComplete,
  onClose,
  open
}: CompleteWorkOrderDialogProps) => {
  const [formData, setFormData] = useState({
    date_realisation: format(new Date(), 'yyyy-MM-dd'),
    odometre_km: '',
    commentaire: '',
    cout_main_oeuvre: '',
    pieces_utilisees: [] as PartsUsed[],
    fichiers: [] as File[]
  });

  const [loading, setLoading] = useState(false);

  const handleAddPart = () => {
    setFormData(prev => ({
      ...prev,
      pieces_utilisees: [...prev.pieces_utilisees, { part_id: '', quantite: 1, prix_unitaire: 0 }]
    }));
  };

  const handleRemovePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pieces_utilisees: prev.pieces_utilisees.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: keyof PartsUsed, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      pieces_utilisees: prev.pieces_utilisees.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        fichiers: [...prev.fichiers, ...Array.from(files)]
      }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fichiers: prev.fichiers.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalCost = () => {
    const partsCost = formData.pieces_utilisees.reduce((sum, part) => {
      return sum + (part.quantite * part.prix_unitaire);
    }, 0);
    const laborCost = parseFloat(formData.cout_main_oeuvre) || 0;
    return partsCost + laborCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;

    setLoading(true);
    try {
      const partsCost = formData.pieces_utilisees.reduce((sum, part) => {
        return sum + (part.quantite * part.prix_unitaire);
      }, 0);

      await onComplete({
        work_order_id: workOrder.id,
        date_realisation: formData.date_realisation,
        odometre_km: parseInt(formData.odometre_km),
        commentaire: formData.commentaire || undefined,
        cout_main_oeuvre: parseFloat(formData.cout_main_oeuvre) || 0,
        cout_pieces: partsCost,
        pieces_utilisees: formData.pieces_utilisees,
        fichiers: formData.fichiers.length > 0 ? formData.fichiers : undefined
      });

      // Reset form
      setFormData({
        date_realisation: format(new Date(), 'yyyy-MM-dd'),
        odometre_km: '',
        commentaire: '',
        cout_main_oeuvre: '',
        pieces_utilisees: [],
        fichiers: []
      });
      
      onClose();
    } catch (error) {
      console.error('Error completing work order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!workOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compléter l'ordre de travail</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de l'ordre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Véhicule:</span>
                  <p className="font-medium">{workOrder.vehicule?.immatriculation}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tâche:</span>
                  <p className="font-medium">{workOrder.task?.libelle}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Priorité:</span>
                  <Badge variant={workOrder.priorite === 'haute' ? 'destructive' : 
                    workOrder.priorite === 'moyenne' ? 'default' : 'secondary'}>
                    {workOrder.priorite}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Échéance:</span>
                  <p className="font-medium">
                    {workOrder.due_date ? format(new Date(workOrder.due_date), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                    {workOrder.due_km && ` - ${workOrder.due_km} km`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails de réalisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_realisation">Date de réalisation *</Label>
                  <Input
                    id="date_realisation"
                    type="date"
                    value={formData.date_realisation}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_realisation: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="odometre_km">Kilométrage *</Label>
                  <Input
                    id="odometre_km"
                    type="number"
                    value={formData.odometre_km}
                    onChange={(e) => setFormData(prev => ({ ...prev, odometre_km: e.target.value }))}
                    placeholder="Kilométrage actuel"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="commentaire">Commentaires</Label>
                <Textarea
                  id="commentaire"
                  value={formData.commentaire}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentaire: e.target.value }))}
                  placeholder="Détails sur la réalisation, observations..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parts Used */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pièces utilisées</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPart}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une pièce
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.pieces_utilisees.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune pièce ajoutée
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.pieces_utilisees.map((partUsed, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Select
                          value={partUsed.part_id}
                          onValueChange={(value) => handlePartChange(index, 'part_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une pièce" />
                          </SelectTrigger>
                          <SelectContent>
                            {parts.map((part) => (
                              <SelectItem key={part.id} value={part.id}>
                                {part.nom} - {part.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="number"
                          min="1"
                          value={partUsed.quantite}
                          onChange={(e) => handlePartChange(index, 'quantite', parseInt(e.target.value))}
                          placeholder="Quantité"
                        />
                        
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={partUsed.prix_unitaire}
                          onChange={(e) => handlePartChange(index, 'prix_unitaire', parseFloat(e.target.value))}
                          placeholder="Prix unitaire"
                        />
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePart(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coûts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cout_main_oeuvre">Coût main d'œuvre (TND)</Label>
                <Input
                  id="cout_main_oeuvre"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cout_main_oeuvre}
                  onChange={(e) => setFormData(prev => ({ ...prev, cout_main_oeuvre: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Coût pièces:</span>
                  <span className="font-medium">
                    {formData.pieces_utilisees.reduce((sum, part) => sum + (part.quantite * part.prix_unitaire), 0).toFixed(2)} TND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Coût main d'œuvre:</span>
                  <span className="font-medium">{(parseFloat(formData.cout_main_oeuvre) || 0).toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{calculateTotalCost().toFixed(2)} TND</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fichiers joints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="files">Ajouter des fichiers</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>

              {formData.fichiers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Fichiers ajoutés:</h4>
                  {formData.fichiers.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Traitement...' : 'Compléter la maintenance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};