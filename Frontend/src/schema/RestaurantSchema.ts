import { z } from "zod";

export const restaurantFromSchema = z.object({
  restaurantName: z
    .string()
    .nonempty({ message: "Restaurant name is required" }),
  city: z.string().nonempty({ message: "City is required" }),
  country: z.string().nonempty({ message: "Country is required" }),
  address: z.string().nonempty({ message: "Address is required" }),
  deliveryTime: z
    .number()
    .min(0, { message: "Delivery time can not be negative" }),
  cuisines: z.array(z.string()),
  contactNumber: z.string().nonempty({ message: "Contact number is required" }),
  imageFile: z
    .instanceof(File)
    .optional()
    .refine((file) => file?.size !== 0, { message: "Image file is required" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type RestaurantFormSchema = z.infer<typeof restaurantFromSchema>;
