import { z } from 'zod';

// Validation for chauffeur form
export const chauffeurSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(1, { message: "Le nom est obligatoire" })
    .max(100, { message: "Le nom doit faire moins de 100 caractères" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets" }),
  prenom: z
    .string()
    .trim()
    .min(1, { message: "Le prénom est obligatoire" })
    .max(100, { message: "Le prénom doit faire moins de 100 caractères" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: "Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets" }),
  cin: z
    .string()
    .trim()
    .min(8, { message: "Le CIN doit contenir au moins 8 caractères" })
    .max(20, { message: "Le CIN doit faire moins de 20 caractères" })
    .regex(/^[0-9]+$/, { message: "Le CIN ne peut contenir que des chiffres" }),
  telephone: z
    .string()
    .trim()
    .min(8, { message: "Le téléphone doit contenir au moins 8 caractères" })
    .max(20, { message: "Le téléphone doit faire moins de 20 caractères" })
    .regex(/^[\d\s+()-]+$/, { message: "Format de téléphone invalide" }),
  email: z
    .string()
    .trim()
    .email({ message: "Adresse email invalide" })
    .max(255, { message: "L'email doit faire moins de 255 caractères" })
    .optional()
    .or(z.literal('')),
  adresse: z
    .string()
    .trim()
    .min(1, { message: "L'adresse est obligatoire" })
    .max(500, { message: "L'adresse doit faire moins de 500 caractères" }),
  date_embauche: z
    .string()
    .min(1, { message: "La date d'embauche est obligatoire" }),
  statut: z
    .enum(['actif', 'inactif', 'suspendu'], { message: "Statut invalide" }),
  notes: z
    .string()
    .max(1000, { message: "Les notes doivent faire moins de 1000 caractères" })
    .optional()
});

// Validation for bon form
export const bonSchema = z.object({
  numero: z
    .string()
    .trim()
    .min(1, { message: "Le numéro de bon est obligatoire" })
    .max(50, { message: "Le numéro doit faire moins de 50 caractères" })
    .regex(/^[A-Z0-9\-_]+$/, { message: "Le numéro ne peut contenir que des lettres majuscules, chiffres, tirets et underscores" }),
  date: z
    .string()
    .min(1, { message: "La date est obligatoire" }),
  type: z
    .enum(['gasoil', 'essence', 'gasoil50'], { message: "Type de carburant invalide" }),
  montant: z
    .number()
    .positive({ message: "Le montant doit être positif" })
    .max(10000, { message: "Le montant ne peut pas dépasser 10000" }),
  vehicule_id: z
    .string()
    .uuid({ message: "Véhicule invalide" }),
  chauffeur_id: z
    .string()
    .uuid({ message: "Chauffeur invalide" }),
  km_initial: z
    .number()
    .nonnegative({ message: "Les kilomètres doivent être positifs" })
    .max(9999999, { message: "Les kilomètres ne peuvent pas dépasser 9,999,999" }),
  notes: z
    .string()
    .max(1000, { message: "Les notes doivent faire moins de 1000 caractères" })
    .optional()
});

// Validation for vehicle form
export const vehiculeSchema = z.object({
  immatriculation: z
    .string()
    .trim()
    .min(1, { message: "L'immatriculation est obligatoire" })
    .max(20, { message: "L'immatriculation doit faire moins de 20 caractères" })
    .regex(/^[A-Z0-9\s-]+$/, { message: "Format d'immatriculation invalide" }),
  marque: z
    .string()
    .trim()
    .min(1, { message: "La marque est obligatoire" })
    .max(50, { message: "La marque doit faire moins de 50 caractères" }),
  modele: z
    .string()
    .trim()
    .min(1, { message: "Le modèle est obligatoire" })
    .max(50, { message: "Le modèle doit faire moins de 50 caractères" }),
  annee: z
    .number()
    .int()
    .min(1900, { message: "Année invalide" })
    .max(new Date().getFullYear() + 1, { message: "Année invalide" }),
  type_carburant: z
    .enum(['gasoil', 'essence', 'gasoil50'], { message: "Type de carburant invalide" }),
  couleur: z
    .string()
    .max(30, { message: "La couleur doit faire moins de 30 caractères" })
    .optional(),
  capacite_reservoir: z
    .number()
    .positive({ message: "La capacité doit être positive" })
    .max(1000, { message: "Capacité réservoir trop élevée" })
    .optional(),
  notes: z
    .string()
    .max(1000, { message: "Les notes doivent faire moins de 1000 caractères" })
    .optional()
});

export type ChauffeurFormData = z.infer<typeof chauffeurSchema>;
export type BonFormData = z.infer<typeof bonSchema>;
export type VehiculeFormData = z.infer<typeof vehiculeSchema>;