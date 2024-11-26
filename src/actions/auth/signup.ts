'use server';

import { createUser } from '@/db/query/User';
import { z } from 'zod';

// =============================== signUp ===============================
const signUpSchema = z.object({
  name: z.string().min(2, { message: 'Must be 2 or more characters long' }),
  username: z.string().min(3, { message: 'Must be 3 or more characters long' }),
  email: z.string().email('Please enter valid email address.').min(5),
  password: z.string().min(8, { message: 'Must be 8 or more characters long' }),
  password2: z.string(),
});

export async function signUp(prevState: any, formData: FormData) {
  const validatedFields = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    username: formData.get('username'),
    password: formData.get('password'),
    password2: formData.get('password2'),
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields!!',
      resetKey: '',
    };
  }

  // check for password match
  if (validatedFields.data.password !== validatedFields.data.password2) {
    return {
      type: 'error',
      errors: {
        name: undefined,
        username: undefined,
        email: undefined,
        password: undefined,
        password2: undefined,
      },
      message: 'Passwords do not match.',
      resetKey: '',
    };
  }

  try {
    let user = await createUser(
      validatedFields.data.name,
      validatedFields.data.email,
      validatedFields.data.username,
      validatedFields.data.password,
      false, // default to non-admin user
    );

    if (user.length === 0) {
      return {
        type: 'error',
        errors: {
          name: undefined,
          username: undefined,
          email: undefined,
          password: undefined,
          password2: undefined,
        },
        message: 'Failed to signUp. Please try again.',
        resetKey: '',
      };
    }

    return {
      type: 'success',
      errors: null,
      message: 'Successfully signed up.',
      resetKey: Date.now().toString(),
    };
  } catch (error: any) {
    console.error('Failed to signUp', error);
    return {
      type: 'error',
      errors: {
        name: undefined,
        username: undefined,
        email: undefined,
        password: undefined,
        password2: undefined,
      },
      message: error.message || 'Failed to signUp.',
      resetKey: '',
    };
  }
}
