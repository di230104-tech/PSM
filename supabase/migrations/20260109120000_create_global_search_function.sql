CREATE OR REPLACE FUNCTION global_search(search_term TEXT)
RETURNS TABLE(
    id TEXT,
    type TEXT,
    name TEXT,
    description TEXT,
    path TEXT,
    -- Add asset-specific fields, nullable
    product_name TEXT,
    model TEXT,
    serial_number TEXT,
    category TEXT,
    status TEXT,
    location TEXT,
    assigned_to TEXT,
    date_added TIMESTAMPTZ,
    relevance_score INT,
    is_favorite BOOLEAN,
    image TEXT,
    image_alt TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id::text,
        'asset' as type,
        a.product_name as name,
        'Serial: ' || a.serial_number || ', Tag: ' || a.asset_tag as description,
        '/assets/' || a.id::text as path,
        a.product_name,
        a.model,
        a.serial_number,
        a.category,
        a.status,
        (SELECT d.name FROM public.departments d WHERE d.id = a.current_department_id) as location,
        (SELECT e.full_name FROM public.employees e WHERE e.id = a.assigned_to_employee_id) as assigned_to,
        a.created_at as date_added,
        100 as relevance_score, -- Placeholder
        false as is_favorite,   -- Placeholder
        a.image_url as image,
        a.product_name as image_alt
    FROM
        public.assets a
    WHERE
        a.product_name ILIKE '%' || search_term || '%' OR
        a.asset_tag ILIKE '%' || search_term || '%' OR
        a.serial_number ILIKE '%' || search_term || '%' OR
        a.model ILIKE '%' || search_term || '%'

    UNION ALL

    SELECT
        e.id::text,
        'employee' as type,
        e.full_name as name,
        'Email: ' || e.email || ', ID: ' || e.employee_number as description,
        '/admin/employee-management' as path,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 50, false, NULL, NULL
    FROM
        public.employees e
    WHERE
        e.full_name ILIKE '%' || search_term || '%' OR
        e.email ILIKE '%' || search_term || '%' OR
        e.employee_number ILIKE '%' || search_term || '%'

    UNION ALL

    SELECT
        d.id::text,
        'department' as type,
        d.name as name,
        'Department' as description,
        '/admin/department-management' as path,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 40, false, NULL, NULL
    FROM
        public.departments d
    WHERE
        d.name ILIKE '%' || search_term || '%'

    UNION ALL

    SELECT
        s.id::text,
        'supplier' as type,
        s.company_name as name,
        'Contact: ' || s.contact_person || ', Email: ' || s.email as description,
        '/supplier-management' as path,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, false, NULL, NULL
    FROM
        public.suppliers s
    WHERE
        s.company_name ILIKE '%' || search_term || '%' OR
        s.contact_person ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;