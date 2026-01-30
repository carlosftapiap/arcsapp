-- Consulta para identificar plantillas y sus items sin prompts
-- Ejecuta esto en Supabase SQL Editor para ver el estado actual

SELECT 
    ct.name AS plantilla,
    ct.product_type,
    COUNT(ci.id) AS total_items,
    COUNT(ci.ai_prompt) AS items_con_prompt,
    COUNT(*) FILTER (WHERE ci.ai_prompt IS NULL OR ci.ai_prompt = '') AS items_sin_prompt
FROM checklist_templates ct
LEFT JOIN checklist_items ci ON ci.template_id = ct.id
WHERE ct.active = true
GROUP BY ct.id, ct.name, ct.product_type
ORDER BY ct.name;

-- Ver códigos de items sin prompt para Biológicos
SELECT code, module, title_i18n_json->>'es' as titulo
FROM checklist_items ci
JOIN checklist_templates ct ON ct.id = ci.template_id
WHERE ct.product_type = 'biologic'
  AND (ci.ai_prompt IS NULL OR ci.ai_prompt = '')
ORDER BY ci.sort_order;

-- Ver códigos de items sin prompt para Dispositivos Médicos  
SELECT code, module, title_i18n_json->>'es' as titulo
FROM checklist_items ci
JOIN checklist_templates ct ON ct.id = ci.template_id
WHERE ct.product_type = 'device_medical'
  AND (ci.ai_prompt IS NULL OR ci.ai_prompt = '')
ORDER BY ci.sort_order;
