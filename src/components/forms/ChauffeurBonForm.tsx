import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X } from 'lucide-react';
import type { Vehicule, Chauffeur } from '@/types';
import { bonSchema } from '@/lib/validation/forms';

interface ChauffeurBonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChauffeurBonForm({ isOpen, onClose, onSuccess }: ChauffeurBonFormProps) {
  const [formData, setFormData] = useState({
    numero: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    montant: '',
    vehiculeId: '',
    chauffeurId: '',
    kmInitial: '',
    notes: ''
  });
  
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // Get user's profile to find their chauffeur_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      // Find the chauffeur record that matches the user's email
      const { data: chauffeurData } = await supabase
        .from('chauffeurs')
        .select('id')
        .eq('email', profile?.email || user.email)
        .eq('statut', 'actif')
        .single();

      if (chauffeurData) {
        // Automatically set the logged-in chauffeur's ID
        setFormData(prev => ({ ...prev, chauffeurId: chauffeurData.id }));
      }

      const [vehiculesRes, chauffeursRes] = await Promise.all([
        supabase.from('vehicules').select('*').eq('statut', 'en_service'),
        supabase.from('chauffeurs').select('*').eq('statut', 'actif')
      ]);

      if (vehiculesRes.error) throw vehiculesRes.error;
      if (chauffeursRes.error) throw chauffeursRes.error;

      // Map database fields to interface fields
      const mappedVehicules: Vehicule[] = (vehiculesRes.data || []).map(v => ({
        id: v.id,
        immatriculation: v.immatriculation,
        marque: v.marque || '',
        modele: v.modele || '',
        annee: v.annee,
        couleur: v.couleur,
        typeCarburant: v.type_carburant as 'gasoil' | 'essence' | 'gasoil50',
        capaciteReservoir: v.capacite_reservoir,
        statut: v.statut as 'en_service' | 'hors_service',
        createdAt: v.created_at,
        updatedAt: v.updated_at
      }));

      const mappedChauffeurs: Chauffeur[] = (chauffeursRes.data || []).map(c => ({
        id: c.id,
        nom: c.nom,
        prenom: c.prenom,
        matricule: c.cin,
        telephone: c.telephone,
        email: c.email,
        adresse: c.adresse,
        statut: c.statut as 'actif' | 'inactif',
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));

      setVehicules(mappedVehicules);
      setChauffeurs(mappedChauffeurs);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('odometer-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('odometer-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    if (!imageFile) {
      toast({
        title: "Photo obligatoire",
        description: "Veuillez prendre une photo du compteur kilométrique",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Validate form data
      const validatedData = bonSchema.parse({
        numero: formData.numero,
        date: formData.date,
        type: formData.type,
        montant: parseFloat(formData.montant),
        vehicule_id: formData.vehiculeId,
        chauffeur_id: formData.chauffeurId,
        km_initial: formData.kmInitial ? parseFloat(formData.kmInitial) : 0,
        notes: formData.notes
      });
      
      // Upload image first
      const imageUrl = await uploadImage(imageFile);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');
      
      // Create bon
      const { error } = await supabase.from('bons').insert({
        ...validatedData,
        odometer_image_url: imageUrl
      });
      
      if (error) throw error;
      
      // Reset form
      setFormData({
        numero: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        montant: '',
        vehiculeId: '',
        chauffeurId: '',
        kmInitial: '',
        notes: ''
      });
      removeImage();
      setValidationErrors({});
      
      onSuccess();
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path[0]) newErrors[err.path[0]] = err.message;
        });
        setValidationErrors(newErrors);
      } else {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nouveau Bon de Carburant</DialogTitle>
          <DialogDescription className="text-sm">
            Remplissez les informations du bon et ajoutez une photo du compteur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Numéro du bon *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Ex: B001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de carburant *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoil">Gasoil</SelectItem>
                  <SelectItem value="essence">Essence</SelectItem>
                  <SelectItem value="gasoil50">Gasoil 50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant">Montant (TND) *</Label>
              <Input
                id="montant"
                type="number"
                step="0.001"
                min="0"
                value={formData.montant}
                onChange={(e) => handleInputChange('montant', e.target.value)}
                placeholder="0.000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicule">Véhicule *</Label>
              <Select value={formData.vehiculeId} onValueChange={(value) => handleInputChange('vehiculeId', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.map((vehicule) => (
                    <SelectItem key={vehicule.id} value={vehicule.id}>
                      {vehicule.immatriculation} - {vehicule.marque} {vehicule.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chauffeur is automatically set to logged-in user, no need to show dropdown */}

            <div className="space-y-2">
              <Label htmlFor="kmInitial">Kilométrage initial</Label>
              <Input
                id="kmInitial"
                type="number"
                min="0"
                value={formData.kmInitial}
                onChange={(e) => handleInputChange('kmInitial', e.target.value)}
                placeholder="Ex: 15000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Photo du compteur * <span className="text-sm font-normal text-muted-foreground">(Obligatoire)</span>
            </Label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center">
                <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-medium">Ajouter une photo du compteur</p>
                  <p className="text-xs sm:text-sm text-muted-foreground px-2">
                    Prenez une photo claire du compteur kilométrique
                  </p>
                </div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" className="mt-3 sm:mt-4 w-full sm:w-auto" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Choisir une photo
                    </span>
                  </Button>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Compteur" 
                      className="w-full max-w-md mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Photo du compteur ajoutée
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !imageFile} className="w-full sm:w-auto">
              {loading ? "Création..." : "Créer le bon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}