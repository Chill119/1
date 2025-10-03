import { supabase } from '../lib/supabase';

export class WalletTransactionService {
  async saveTransaction(transactionData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const txRecord = {
        user_id: user.id,
        transaction_hash: transactionData.hash,
        chain: transactionData.chain,
        type: transactionData.type,
        from_address: transactionData.from,
        to_address: transactionData.to,
        amount: parseFloat(transactionData.amount),
        token: transactionData.token,
        status: transactionData.status || 'pending',
        gas_fee: transactionData.gasFee ? parseFloat(transactionData.gasFee) : 0,
      };

      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert([txRecord])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(transactionHash, status) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .update({ status })
        .eq('transaction_hash', transactionHash)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async getTransactionHistory(chain = null, limit = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (chain) {
        query = query.eq('chain', chain);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
      }

      return data.map(tx => ({
        id: tx.id,
        hash: tx.transaction_hash,
        chain: tx.chain,
        type: tx.type,
        from: tx.from_address,
        to: tx.to_address,
        amount: tx.amount.toString(),
        token: tx.token,
        status: tx.status,
        gasFee: tx.gas_fee?.toString(),
        timestamp: new Date(tx.created_at).getTime(),
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  async getTransactionByHash(transactionHash) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('transaction_hash', transactionHash)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch transaction: ${error.message}`);
      }

      return {
        id: data.id,
        hash: data.transaction_hash,
        chain: data.chain,
        type: data.type,
        from: data.from_address,
        to: data.to_address,
        amount: data.amount.toString(),
        token: data.token,
        status: data.status,
        gasFee: data.gas_fee?.toString(),
        timestamp: new Date(data.created_at).getTime(),
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  subscribeToTransactionUpdates(callback) {
    const { data: { user } } = supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated for subscription');
      return null;
    }

    const subscription = supabase
      .channel('wallet_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  }
}

export const walletTransactionService = new WalletTransactionService();
