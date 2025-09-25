import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Truck } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Truck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Gestion de Parc Automobile</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Système de traçabilité et gestion des bons de carburant pour votre flotte
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Admin Access */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/auth')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Accès Administrateur</CardTitle>
              <CardDescription className="text-base">
                Gestion complète du parc automobile, chauffeurs, véhicules et maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Se connecter en tant qu'Admin
              </Button>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p>• Gestion des bons de carburant</p>
                <p>• Suivi des chauffeurs et véhicules</p>
                <p>• Planification de maintenance</p>
                <p>• Rapports et statistiques</p>
              </div>
            </CardContent>
          </Card>

          {/* Chauffeur Access */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/chauffeur/auth')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-2xl">Accès Chauffeur</CardTitle>
              <CardDescription className="text-base">
                Interface simplifiée pour créer et gérer vos bons de carburant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" size="lg">
                Se connecter en tant que Chauffeur
              </Button>
              <div className="mt-4 text-sm text-muted-foreground space-y-1">
                <p>• Création de bons de carburant</p>
                <p>• Photo du compteur kilométrique</p>
                <p>• Suivi de vos bons</p>
                <p>• Interface mobile friendly</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Système sécurisé de gestion de parc automobile
          </p>
        </div>
      </div>
    </div>
  );
}