-- ============================================================
-- fix_passwords.sql
-- Actualiza los password_hash de todos los usuarios del seed
-- con un hash bcrypt válido de la contraseña: GlobalGemba2026!
-- 
-- EJECUTAR EN psql:
--   \i database/fix_passwords.sql
-- ============================================================

UPDATE usuarios
SET password_hash = '$2a$12$3nr/G1LKpV8kHZFxqpDTwOsM2It.W20hhvr27iWwRRWiHHbSA.k0C'
WHERE email IN (
    'admin@globalgemba.com',
    'carlos.rodriguez@globalgemba.com',
    'laura.martinez@globalgemba.com',
    'alvaro.garcia@globalgemba.com',
    'rodrigo.lopez@globalgemba.com',
    'roberto.sanchez@globalgemba.com',
    'jorge.fernandez@globalgemba.com',
    'david.perez@globalgemba.com'
);

-- Verificar el resultado
SELECT email, LEFT(password_hash, 10) || '...' AS hash_preview, activo
FROM usuarios
ORDER BY email;
