'use client';

import ActionButton from '@/components/shared/action-button';
import { markOrderAsPaid, markOrderAsDelivered } from '@/lib/actions/order-client-actions';
import { CardFooter } from '@/components/ui/card';

interface OrderActionsProps {
  orderId: string;
  isPaid: boolean;
  isDelivered: boolean;
}

export default function OrderActions({ orderId, isPaid, isDelivered }: OrderActionsProps) {
  return (
    <CardFooter className="flex flex-col gap-2">
      {!isPaid && (
        <ActionButton
          caption="Mark as Paid"
          action={() => markOrderAsPaid(orderId)}
          className="w-full"
        />
      )}
      {isPaid && !isDelivered && (
        <ActionButton
          caption="Mark as Delivered"
          action={() => markOrderAsDelivered(orderId)}
          className="w-full"
        />
      )}
    </CardFooter>
  );
} 