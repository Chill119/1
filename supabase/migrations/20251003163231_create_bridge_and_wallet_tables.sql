/*
  # Bridge and Wallet Transactions Schema

  1. New Tables
    - `bridge_transactions`: Stores cross-chain bridge operations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bridge_id` (text, unique identifier)
      - `from_chain` (text, source blockchain)
      - `to_chain` (text, destination blockchain)
      - `from_address` (text, sender address)
      - `to_address` (text, recipient address)
      - `amount` (numeric, amount being bridged)
      - `token` (text, token symbol)
      - `status` (bridge_status enum: initiated, processing, completed, error)
      - `stellar_tx_hash` (text, Stellar transaction hash)
      - `source_tx_hash` (text, source chain transaction hash)
      - `target_tx_hash` (text, target chain transaction hash)
      - `lock_amount` (numeric, locked amount on source)
      - `release_amount` (numeric, released amount on target)
      - `error_message` (text, error details if failed)
      - `completed_at` (timestamptz, completion timestamp)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `wallet_transactions`: Stores wallet send/receive operations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `transaction_hash` (text, blockchain transaction hash)
      - `chain` (text, blockchain network)
      - `type` (transaction_type enum: send, receive)
      - `from_address` (text, sender address)
      - `to_address` (text, recipient address)
      - `amount` (numeric, transaction amount)
      - `token` (text, token symbol)
      - `status` (transaction_status enum: pending, completed, failed)
      - `gas_fee` (numeric, transaction gas fee)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pos_transactions`: Stores POS payment operations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `transaction_id` (text, unique transaction identifier)
      - `payment_method` (text, payment method used)
      - `amount` (numeric, payment amount)
      - `currency` (text, currency code)
      - `processing_fee` (numeric, fee charged)
      - `total_amount` (numeric, total including fees)
      - `customer_email` (text, customer email for receipt)
      - `status` (payment_status enum: pending, processing, completed, failed, refunded)
      - `transaction_hash` (text, blockchain hash if crypto payment)
      - `qr_data` (text, QR code data if applicable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to view/insert their own data
    - Add policy for service role to manage all transactions

  3. Important Notes
    - All tables use UUID for primary keys
    - Numeric type used for amounts to handle precision
    - Timestamps include timezone for global consistency
    - Status enums provide type safety
    - Indexes added for common query patterns
*/

-- Create custom enum types
CREATE TYPE bridge_status AS ENUM ('initiated', 'processing', 'completed', 'error');
CREATE TYPE transaction_type AS ENUM ('send', 'receive');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Bridge Transactions Table
CREATE TABLE IF NOT EXISTS bridge_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  bridge_id text UNIQUE NOT NULL,
  from_chain text NOT NULL,
  to_chain text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric NOT NULL,
  token text NOT NULL,
  status bridge_status NOT NULL DEFAULT 'initiated',
  stellar_tx_hash text,
  source_tx_hash text,
  target_tx_hash text,
  lock_amount numeric,
  release_amount numeric,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bridge transactions"
  ON bridge_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bridge transactions"
  ON bridge_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bridge transactions"
  ON bridge_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for bridge transactions
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_user_id ON bridge_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_bridge_id ON bridge_transactions(bridge_id);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_status ON bridge_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bridge_transactions_created_at ON bridge_transactions(created_at DESC);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  transaction_hash text NOT NULL,
  chain text NOT NULL,
  type transaction_type NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric NOT NULL,
  token text NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  gas_fee numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet transactions"
  ON wallet_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet transactions"
  ON wallet_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for wallet transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_chain ON wallet_transactions(chain);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_hash ON wallet_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- POS Transactions Table
CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  transaction_id text UNIQUE NOT NULL,
  payment_method text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  processing_fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  customer_email text,
  status payment_status NOT NULL DEFAULT 'pending',
  transaction_hash text,
  qr_data text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own POS transactions"
  ON pos_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own POS transactions"
  ON pos_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own POS transactions"
  ON pos_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for POS transactions
CREATE INDEX IF NOT EXISTS idx_pos_transactions_user_id ON pos_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_transaction_id ON pos_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_status ON pos_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON pos_transactions(created_at DESC);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bridge_transactions_updated_at
  BEFORE UPDATE ON bridge_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_transactions_updated_at
  BEFORE UPDATE ON pos_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
