import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus,
  Package,
  Building2,
  Edit,
  Trash2
} from 'lucide-react';
import { Vendor, PartsCatalog } from '@/types/maintenance';

interface MaintenancePartsProps {
  vendors: Vendor[];
  parts: PartsCatalog[];
  createVendor: (vendorData: any) => Promise<any>;
  updateVendor: (id: string, vendorData: any) => Promise<any>;
  deleteVendor: (id: string) => Promise<void>;
  createPart: (partData: any) => Promise<any>;
  updatePart: (id: string, partData: any) => Promise<any>;
  deletePart: (id: string) => Promise<void>;
}

export const MaintenanceParts = ({ 
  vendors, 
  parts, 
  createVendor, 
  updateVendor, 
  deleteVendor,
  createPart,
  updatePart,
  deletePart
}: MaintenancePartsProps) => {
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({
    nom: '',
    contact: '',
    telephone: '',
    email: '',
    adresse: ''
  });
  const [partFormData, setPartFormData] = useState({
    sku: '',
    nom: '',
    unite: 'pcs',
    prix: '',
    vendor_id: ''
  });

  const handleCreateVendor = async () => {
    try {
      await createVendor(vendorFormData);
      setVendorFormData({
        nom: '',
        contact: '',
        telephone: '',
        email: '',
        adresse: ''
      });
      setShowVendorDialog(false);
    } catch (error) {
      console.error('Error creating vendor:', error);
    }
  };

  const handleCreatePart = async () => {
    try {
      await createPart({
        ...partFormData,
        prix: partFormData.prix ? parseFloat(partFormData.prix) : null
      });
      setPartFormData({
        sku: '',
        nom: '',
        unite: 'pcs',
        prix: '',
        vendor_id: ''
      });
      setShowPartDialog(false);
    } catch (error) {
      console.error('Error creating part:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Pièces & Prestataires</h3>
        <p className="text-sm text-muted-foreground">
          Gérez le catalogue des pièces et la liste des prestataires
        </p>
      </div>

      <Tabs defaultValue="parts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="parts">Catalogue Pièces</TabsTrigger>
          <TabsTrigger value="vendors">Prestataires</TabsTrigger>
        </TabsList>

        <TabsContent value="parts">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium">Catalogue des pièces</h4>
                <p className="text-sm text-muted-foreground">
                  Référencement des pièces et leur prix
                </p>
              </div>

              <Dialog open={showPartDialog} onOpenChange={setShowPartDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter pièce
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Ajouter une pièce</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="sku">Référence (SKU)</Label>
                      <Input
                        id="sku"
                        value={partFormData.sku}
                        onChange={(e) => setPartFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Ex: FLT001"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nom">Nom de la pièce</Label>
                      <Input
                        id="nom"
                        value={partFormData.nom}
                        onChange={(e) => setPartFormData(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: Filtre à huile"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unite">Unité</Label>
                        <Select value={partFormData.unite} onValueChange={(value) => 
                          setPartFormData(prev => ({ ...prev, unite: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">Pièce(s)</SelectItem>
                            <SelectItem value="litre">Litre(s)</SelectItem>
                            <SelectItem value="kg">Kilogramme(s)</SelectItem>
                            <SelectItem value="mètre">Mètre(s)</SelectItem>
                            <SelectItem value="set">Set/Kit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="prix">Prix unitaire (TND)</Label>
                        <Input
                          id="prix"
                          type="number"
                          step="0.001"
                          value={partFormData.prix}
                          onChange={(e) => setPartFormData(prev => ({ ...prev, prix: e.target.value }))}
                          placeholder="0.000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="vendor">Fournisseur</Label>
                      <Select value={partFormData.vendor_id} onValueChange={(value) => 
                        setPartFormData(prev => ({ ...prev, vendor_id: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowPartDialog(false)}>
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleCreatePart}
                        disabled={!partFormData.sku || !partFormData.nom}
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              {parts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-mono text-sm">
                          {part.sku}
                        </TableCell>
                        <TableCell className="font-medium">
                          {part.nom}
                        </TableCell>
                        <TableCell>
                          {part.unite}
                        </TableCell>
                        <TableCell>
                          {part.prix ? `${part.prix.toFixed(3)} TND` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {part.vendor?.nom || 'Aucun'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Aucune pièce dans le catalogue</p>
                  <p className="text-sm">Ajoutez vos premières pièces</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-md font-medium">Liste des prestataires</h4>
                <p className="text-sm text-muted-foreground">
                  Fournisseurs et prestataires de service
                </p>
              </div>

              <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter prestataire
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Ajouter un prestataire</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="nom">Nom de l'entreprise</Label>
                      <Input
                        id="nom"
                        value={vendorFormData.nom}
                        onChange={(e) => setVendorFormData(prev => ({ ...prev, nom: e.target.value }))}
                        placeholder="Ex: Garage Central"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact">Personne de contact</Label>
                      <Input
                        id="contact"
                        value={vendorFormData.contact}
                        onChange={(e) => setVendorFormData(prev => ({ ...prev, contact: e.target.value }))}
                        placeholder="Ex: Ahmed Ben Ali"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                          id="telephone"
                          value={vendorFormData.telephone}
                          onChange={(e) => setVendorFormData(prev => ({ ...prev, telephone: e.target.value }))}
                          placeholder="Ex: +216 71 123 456"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={vendorFormData.email}
                          onChange={(e) => setVendorFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contact@garage.tn"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="adresse">Adresse</Label>
                      <Input
                        id="adresse"
                        value={vendorFormData.adresse}
                        onChange={(e) => setVendorFormData(prev => ({ ...prev, adresse: e.target.value }))}
                        placeholder="Adresse complète"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowVendorDialog(false)}>
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleCreateVendor}
                        disabled={!vendorFormData.nom}
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              {vendors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{vendor.nom}</div>
                            {vendor.adresse && (
                              <div className="text-sm text-muted-foreground">
                                {vendor.adresse}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.contact || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {vendor.telephone || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {vendor.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Aucun prestataire enregistré</p>
                  <p className="text-sm">Ajoutez vos prestataires et fournisseurs</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};