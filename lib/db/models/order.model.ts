import { IOrderInput } from '@/types'
import { Document, Model, model, models, Schema } from 'mongoose'
import mongoose from 'mongoose'

export interface IOrder extends Document, IOrderInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
  {
    // Use Schema.Types.Mixed without any validation for the user field
    user: {
      type: Schema.Types.Mixed,
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        clientId: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        color: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      province: { type: String, required: true },
      phone: { type: String, required: true },
    },
    expectedDeliveryDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    paymentResult: { id: String, status: String, email_address: String },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: false
  }
)

// Middleware to ensure product IDs are always saved as ObjectIds
orderSchema.pre('save', function(next) {
  // Convert product IDs to ObjectIds if they're strings
  if (this.items && Array.isArray(this.items)) {
    this.items.forEach(item => {
      if (item.product && typeof item.product === 'string' && mongoose.Types.ObjectId.isValid(item.product)) {
        item.product = new mongoose.Types.ObjectId(item.product);
      }
    });
  }
  next();
});

const Order =
  (models.Order as Model<IOrder>) || model<IOrder>('Order', orderSchema)

export default Order
