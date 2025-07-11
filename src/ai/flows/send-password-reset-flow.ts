'use server';
/**
 * @fileOverview A server action for handling admin password reset requests.
 *
 * - sendPasswordReset - A function that simulates sending a password reset email to the admin.
 */

import type { Admin, PasswordResetInput, PasswordResetOutput } from '@/lib/types';

// This is the exported function that the client-side code will call.
export async function sendPasswordReset(
  input: PasswordResetInput
): Promise<PasswordResetOutput> {
  // In a real application, this user data would come from a secure database.
  // For this prototype, we are hardcoding it on the server to avoid calling
  // a client-side store from a server action.
  const adminUser: Admin = {
    nickname: 'admin',
    email: 'admin@aceleragtsupermoda.com',
    password: 'admin',
  };

  const identifier = input.identifier.toLowerCase().trim();

  if (
    identifier === adminUser.nickname.toLowerCase() ||
    (adminUser.email && identifier === adminUser.email.toLowerCase())
  ) {
    // In a real application, you would integrate with an email service here.
    // For this prototype, we simulate a successful email dispatch.
    console.log(
      `✅ Simulating password reset email sent to admin with identifier: ${input.identifier}`
    );
    console.log(`New password would be sent from: super.moda@yahoo.com.br`);

    return {
      success: true,
      message:
        'Um e-mail de redefinição de senha foi enviado para o administrador.',
    };
  } else {
    console.warn(
      `⚠️ Password reset attempt failed for identifier: ${input.identifier}`
    );
    return {
      success: false,
      message: 'Administrador não encontrado. Verifique o login ou email informado.',
    };
  }
}
