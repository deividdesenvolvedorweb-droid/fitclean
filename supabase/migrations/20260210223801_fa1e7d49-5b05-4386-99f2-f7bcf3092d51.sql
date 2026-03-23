
-- Unique index on customers.cpf (partial, non-null non-empty)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_cpf_unique
  ON customers (cpf)
  WHERE cpf IS NOT NULL AND cpf != '';

-- Unique index on customers.email
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_unique
  ON customers (email);
