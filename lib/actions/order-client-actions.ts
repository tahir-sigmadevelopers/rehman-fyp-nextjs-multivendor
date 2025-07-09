'use server';

import { updateOrderToPaid, deliverOrder } from './order.actions';

/**
 * Mark an order as paid - server action wrapper for client components
 */
export async function markOrderAsPaid(orderId: string) {
  return updateOrderToPaid(orderId);
}

/**
 * Mark an order as delivered - server action wrapper for client components
 */
export async function markOrderAsDelivered(orderId: string) {
  return deliverOrder(orderId);
} 