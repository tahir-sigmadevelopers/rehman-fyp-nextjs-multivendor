import { IUserInput } from '@/types'
import { Document, Model, model, models, Schema } from 'mongoose'

export interface IUser extends Document, IUserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'User' },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    isVendor: { type: Boolean, default: false },
    vendorDetails: {
      brandName: String,
      description: String,
      logo: String,
      banner: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
  },
  {
    timestamps: true,
  }
)

// Ensure the model is only created once
let User: Model<IUser>

try {
  User = model<IUser>('User', userSchema)
} catch (error) {
  // If the model already exists, use it
  User = models.User as Model<IUser>
}

export default User
