-- Add comprehensive maintenance tasks in French

-- 1. Maintenance régulière (préventive)
INSERT INTO public.maintenance_tasks (code, libelle, type, interval_km, interval_jours, duree_estimee_min) VALUES
('VID-001', 'Vidange d''huile moteur', 'preventive', 10000, NULL, 30),
('FIL-001', 'Remplacement du filtre à huile', 'preventive', 10000, NULL, 15),
('FIL-002', 'Remplacement du filtre à air', 'preventive', 20000, NULL, 20),
('FIL-003', 'Remplacement du filtre à carburant/gasoil', 'preventive', 30000, NULL, 25),
('FIL-004', 'Remplacement du filtre d''habitacle (climatisation)', 'preventive', NULL, 365, 15),
('FLU-001', 'Vérification et remplissage liquide de frein', 'preventive', NULL, 180, 10),
('FLU-002', 'Vérification et remplissage liquide de refroidissement', 'preventive', NULL, 90, 10),
('FLU-003', 'Vérification et remplissage liquide direction assistée', 'preventive', NULL, 180, 10),
('FLU-004', 'Vérification et remplissage liquide lave-glace', 'preventive', NULL, 30, 5),
('BOU-001', 'Contrôle et remplacement bougies d''allumage', 'preventive', 40000, NULL, 45),
('ECH-001', 'Contrôle système d''échappement', 'preventive', NULL, 180, 20),
('COU-001', 'Contrôle courroies et chaînes de distribution', 'preventive', 60000, NULL, 30),
('ECL-001', 'Vérification phares, feux et clignotants', 'preventive', NULL, 90, 15),

-- 2. Pneumatiques
('PNE-001', 'Contrôle pression des pneus', 'preventive', NULL, 30, 10),
('PNE-002', 'Contrôle usure des pneus / remplacement', 'preventive', NULL, 90, 20),
('PNE-003', 'Équilibrage et parallélisme', 'preventive', 20000, NULL, 60),
('PNE-004', 'Rotation des pneus', 'preventive', 10000, NULL, 30),

-- 3. Freins
('FRE-001', 'Contrôle plaquettes et disques', 'preventive', NULL, 180, 30),
('FRE-002', 'Remplacement plaquettes/disques', 'preventive', 40000, NULL, 120),
('FRE-003', 'Contrôle liquide de frein', 'preventive', NULL, 90, 10),
('FRE-004', 'Inspection tambours et mâchoires', 'preventive', NULL, 365, 45),

-- 4. Suspension et direction
('SUS-001', 'Vérification des amortisseurs', 'preventive', NULL, 180, 30),
('SUS-002', 'Contrôle rotules et biellettes', 'preventive', NULL, 180, 45),
('SUS-003', 'Inspection ressorts et silentblocs', 'preventive', NULL, 365, 60),
('DIR-001', 'Vérification direction assistée', 'preventive', NULL, 180, 20),

-- 5. Batterie et électricité
('BAT-001', 'Contrôle état de la batterie', 'preventive', NULL, 90, 15),
('BAT-002', 'Nettoyage cosses et bornes', 'preventive', NULL, 180, 10),
('ELE-001', 'Test système de charge (alternateur)', 'preventive', NULL, 180, 20),
('ELE-002', 'Contrôle fusibles et relais', 'preventive', NULL, 365, 30),
('ELE-003', 'Contrôle capteurs électroniques et voyants', 'preventive', NULL, 180, 25),

-- 6. Climatisation et chauffage
('CLI-001', 'Contrôle et recharge gaz réfrigérant', 'preventive', NULL, 365, 45),
('CLI-002', 'Contrôle ventilateur et chauffage', 'preventive', NULL, 180, 20),
('CLI-003', 'Remplacement filtre habitacle climatisation', 'preventive', NULL, 365, 15),

-- 7. Transmission et embrayage
('TRA-001', 'Contrôle et remplacement huile boîte vitesses', 'preventive', 60000, NULL, 60),
('EMB-001', 'Vérification embrayage (patinage, bruit)', 'preventive', NULL, 180, 30),
('TRA-002', 'Contrôle joints et soufflets', 'preventive', NULL, 365, 45),

-- 8. Contrôles périodiques spécifiques
('ANT-001', 'Contrôle système antipollution (catalyseur, FAP)', 'preventive', NULL, 365, 30),
('CHA-001', 'Contrôle amortisseurs et châssis', 'preventive', NULL, 365, 60),
('PAR-001', 'Contrôle pare-brise et essuie-glaces', 'preventive', NULL, 180, 15),
('ACC-001', 'Inspection accessoires (ceintures, airbags, avertisseurs)', 'preventive', NULL, 365, 30),

-- 9. Nettoyage et entretien esthétique
('NET-001', 'Lavage régulier intérieur et extérieur', 'preventive', NULL, 30, 60),
('NET-002', 'Cirage protection peinture', 'preventive', NULL, 180, 45),
('NET-003', 'Nettoyage sièges et tapis', 'preventive', NULL, 90, 30),
('NET-004', 'Traitement cuir/plastique', 'preventive', NULL, 180, 45),

-- 10. Maintenance administrative
('ADM-001', 'Contrôle technique obligatoire', 'preventive', NULL, 365, 120),
('ADM-002', 'Renouvellement assurance et vignette', 'preventive', NULL, 365, 30),
('ADM-003', 'Gestion historiques maintenance véhicule', 'preventive', NULL, 90, 15);