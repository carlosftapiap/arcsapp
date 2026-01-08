-- Add product_id to dossiers table
ALTER TABLE dossiers 
ADD COLUMN product_id UUID REFERENCES products(id);

-- Optional: Create index
CREATE INDEX idx_dossiers_product ON dossiers(product_id);
