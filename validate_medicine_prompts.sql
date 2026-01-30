-- Consulta para validar prompts de Medicamento General
SELECT 
    code,
    module,
    title_i18n_json->>'es' as titulo,
    CASE 
        WHEN ai_prompt IS NULL OR ai_prompt = '' THEN '❌ SIN PROMPT'
        WHEN ai_prompt LIKE '%REFERENCIAS%' OR ai_prompt LIKE '%CRUZADAS%' THEN '✅ CON PROMPT + REFERENCIAS'
        ELSE '⚠️ CON PROMPT (sin referencias claras)'
    END as estado_prompt,
    LENGTH(ai_prompt) as longitud_prompt
FROM checklist_items
WHERE template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'medicine_general' LIMIT 1
)
ORDER BY sort_order;

-- Ver contenido de prompts específicos para verificar referencias
SELECT 
    code,
    ai_prompt
FROM checklist_items
WHERE template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'medicine_general' LIMIT 1
)
AND code IN ('A-01', 'A-02', 'B-04', 'B-07', 'C-01', 'D-01', 'E-01', 'E-02')
ORDER BY code;
