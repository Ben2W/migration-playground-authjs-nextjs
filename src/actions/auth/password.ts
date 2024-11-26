'use server';

import { savePassword } from '@/db/query/User';
import { z } from 'zod';

// =============================== changePassword ===============================
const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z
    .string()
    .min(8, { message: 'Must be 8 or more characters long' }),
  password2: z.string(),
});
export async function changePassword(
  email: string,
  prevState: any,
  formData: FormData,
) {
  const validatedFields = changePasswordSchema.safeParse({
    oldPassword: formData.get('oldPassword'),
    newPassword: formData.get('newPassword'),
    password2: formData.get('password2'),
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields!!',
    };
  }

  // check for password match
  if (validatedFields.data.newPassword !== validatedFields.data.password2) {
    return {
      type: 'error',
      errors: {
        oldPassword: undefined,
        newPassword: undefined,
        password2: undefined,
      },
      message: 'Passwords do not match.',
    };
  }

  try {
    let user = await savePassword(
      true,
      email,
      validatedFields.data.newPassword,
      validatedFields.data.oldPassword,
    );

    if (!user.success) {
      return {
        type: 'error',
        errors: {
          oldPassword: undefined,
          newPassword: undefined,
          password2: undefined,
        },
        message: user.message || 'Failed to change password.',
      };
    }
    return {
      type: 'success',
      errors: null,
      message: user.message || 'Password change successfully.',
    };
  } catch (error: any) {
    console.error('Failed to change password.', error);
    return {
      type: 'error',
      errors: {
        oldPassword: undefined,
        newPassword: undefined,
        password2: undefined,
      },
      message: error.message || 'Failed to change password.',
    };
  }
}
