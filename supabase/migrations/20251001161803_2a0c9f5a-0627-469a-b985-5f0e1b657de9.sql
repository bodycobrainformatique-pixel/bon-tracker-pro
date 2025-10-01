-- Fix Security Definer View Issue
-- Recreate views without SECURITY DEFINER to respect user's RLS policies
-- The secure access functions (get_vehicle_daily_stats, get_vehicle_current_km) 
-- should be used instead for authenticated queries

-- Drop and recreate v_vehicule_daily_stats without SECURITY DEFINER
DROP VIEW IF EXISTS v_vehicule_daily_stats;

CREATE VIEW v_vehicule_daily_stats AS
SELECT 
  v.id AS vehicule_id,
  v.immatriculation,
  b.date AS jour,
  SUM(b.distance) AS km_total,
  SUM(b.montant / COALESCE(cp.prix, 1)) AS litres_total,
  SUM(b.montant) AS cout_tnd,
  CASE 
    WHEN SUM(b.distance) > 0 
    THEN (SUM(b.montant / COALESCE(cp.prix, 1)) * 100) / SUM(b.distance)
    ELSE NULL 
  END AS l_per_100km
FROM bons b
JOIN vehicules v ON b.vehicule_id = v.id
LEFT JOIN carburant_parameters cp ON v.type_carburant = cp.type
WHERE b.status = 'ferme' 
  AND b.distance IS NOT NULL 
  AND b.distance > 0
GROUP BY v.id, v.immatriculation, b.date;

-- Drop and recreate v_vehicule_km_current without SECURITY DEFINER
DROP VIEW IF EXISTS v_vehicule_km_current;

CREATE VIEW v_vehicule_km_current AS
SELECT 
  v.id AS vehicule_id,
  v.immatriculation,
  COALESCE(MAX(b.km_final), 0) AS current_km
FROM vehicules v
LEFT JOIN bons b ON v.id = b.vehicule_id
GROUP BY v.id, v.immatriculation;

-- Drop and recreate vehicules_current_odometer without SECURITY DEFINER
DROP VIEW IF EXISTS vehicules_current_odometer;

CREATE VIEW vehicules_current_odometer AS
SELECT 
  v.id AS vehicule_id,
  v.immatriculation,
  COALESCE(MAX(b.km_final), 0) AS current_km
FROM vehicules v
LEFT JOIN bons b ON v.id = b.vehicule_id
GROUP BY v.id, v.immatriculation;