import { supabase } from '../lib/supabase';

export class POSTransactionService {
  async createTransaction(transactionData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const processingFee = parseFloat(transactionData.amount) * 0.029;
      const totalAmount = parseFloat(transactionData.amount) + processingFee;

      const posRecord = {
        user_id: user.id,
        transaction_id: transactionData.transactionId,
        payment_method: transactionData.paymentMethod,
        amount: parseFloat(transactionData.amount),
        currency: transactionData.currency || 'USD',
        processing_fee: processingFee,
        total_amount: totalAmount,
        customer_email: transactionData.customerEmail || null,
        status: transactionData.status || 'pending',
        transaction_hash: transactionData.transactionHash || null,
        qr_data: transactionData.qrData || null,
      };

      const { data, error } = await supabase
        .from('pos_transactions')
        .insert([posRecord])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create POS transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating POS transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData = {
        status,
        ...additionalData,
      };

      const { data, error } = await supabase
        .from('pos_transactions')
        .update(updateData)
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update POS transaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating POS transaction:', error);
      throw error;
    }
  }

  async getTransactionHistory(limit = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch POS transactions: ${error.message}`);
      }

      return data.map(tx => ({
        id: tx.id,
        transactionId: tx.transaction_id,
        paymentMethod: tx.payment_method,
        amount: tx.amount.toString(),
        currency: tx.currency,
        processingFee: tx.processing_fee.toString(),
        totalAmount: tx.total_amount.toString(),
        customerEmail: tx.customer_email,
        status: tx.status,
        transactionHash: tx.transaction_hash,
        qrData: tx.qr_data,
        createdAt: new Date(tx.created_at).getTime(),
      }));
    } catch (error) {
      console.error('Error fetching POS transaction history:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch POS transaction: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        transactionId: data.transaction_id,
        paymentMethod: data.payment_method,
        amount: data.amount.toString(),
        currency: data.currency,
        processingFee: data.processing_fee.toString(),
        totalAmount: data.total_amount.toString(),
        customerEmail: data.customer_email,
        status: data.status,
        transactionHash: data.transaction_hash,
        qrData: data.qr_data,
        createdAt: new Date(data.created_at).getTime(),
      };
    } catch (error) {
      console.error('Error fetching POS transaction:', error);
      throw error;
    }
  }

  async getSalesAnalytics(startDate = null, endDate = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('pos_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', new Date(endDate).toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch sales analytics: ${error.message}`);
      }

      const totalRevenue = data.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const totalFees = data.reduce((sum, tx) => sum + parseFloat(tx.processing_fee), 0);
      const totalTransactions = data.length;

      const paymentMethodBreakdown = data.reduce((acc, tx) => {
        acc[tx.payment_method] = (acc[tx.payment_method] || 0) + 1;
        return acc;
      }, {});

      return {
        totalRevenue,
        totalFees,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        paymentMethodBreakdown,
      };
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
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
      .channel('pos_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pos_transactions',
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

export const posTransactionService = new POSTransactionService();
