const { z } = require('zod');

const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date' });

const availabilityQuerySchema = z.object({
  checkIn: dateString,
  checkOut: dateString,
  guests: z.string().optional(),
});

const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

const holdSchema = z.object({
  roomTypeId: z.string().uuid(),
  roomId: z.string().uuid(),
  checkIn: dateString,
  checkOut: dateString,
  totalGuests: z.number().int().positive(),
  guest: guestSchema,
  addOns: z
    .array(
      z.object({
        addOnId: z.string().uuid(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .optional(),
});

const confirmSchema = z.object({
  depositAmount: z.number().nonnegative().optional(),
});

const cancelSchema = z.object({
  reason: z.string().optional(),
  cancelledBy: z.enum(['guest', 'admin']).optional(),
});

const modifySchema = z.object({
  checkIn: dateString.optional(),
  checkOut: dateString.optional(),
  roomId: z.string().uuid().optional(),
  totalGuests: z.number().int().positive().optional(),
});

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({ error: { message: 'Validation failed', details: result.error.flatten() } });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = {
  validate,
  availabilityQuerySchema,
  holdSchema,
  confirmSchema,
  cancelSchema,
  modifySchema,
};
