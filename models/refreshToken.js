//cite from webproject
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const refreshTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  token: String,
  expires: Date,
  created: { type: Date, default: Date.now },
  createdByIp: String,
  revoked: Date,
  revokedByIp: String,
  replacedByToken: String,
});

refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expires;
});

refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revoked && !this.isExpired;
});

export default model('RefreshToken', refreshTokenSchema);
