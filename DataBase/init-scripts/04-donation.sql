-- ============================================================
-- Migration: Create donation table for Wompi donations
-- ============================================================

CREATE TABLE IF NOT EXISTS donation (
  don_id                    SERIAL        PRIMARY KEY,
  don_wompi_transaction_id  VARCHAR(100)  NOT NULL UNIQUE,
  don_reference             VARCHAR(100)  NOT NULL,
  don_amount_in_cents       BIGINT        NOT NULL,
  don_currency              VARCHAR(5)    NOT NULL DEFAULT 'COP',
  don_status                VARCHAR(30)   NOT NULL,
  don_payment_method_type   VARCHAR(50),
  don_donor_email           VARCHAR(150),
  don_donor_full_name       VARCHAR(200),
  don_environment           VARCHAR(20)   NOT NULL DEFAULT 'test',
  don_wompi_created_at      TIMESTAMPTZ,
  don_created_at            TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by Wompi transaction ID
CREATE INDEX IF NOT EXISTS idx_donation_wompi_txn
  ON donation (don_wompi_transaction_id);

-- Index for listing by date
CREATE INDEX IF NOT EXISTS idx_donation_created_at
  ON donation (don_created_at DESC);
