-- Optional cleanup of bogus anomalies created with null distance issues
DELETE FROM anomalies
WHERE type IN ('distance_invalide','distance_incoherente','conso_outlier_med','conso_outlier_high')
  AND (notes ILIKE '%null%' OR notes IS NULL OR description ILIKE '%null%');