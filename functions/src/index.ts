import * as admin from "firebase-admin";
// Importação correta para Funções Chamáveis v2
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Inicializa o Firebase Admin
admin.initializeApp();
const db = admin.firestore();

/**
 * FUNÇÃO 1: Criar um novo vendedor.
 */
export const createSeller = onCall(async (request) => {
  const { email, password, name } = request.data;
  console.log("Função v2 createSeller chamada com os dados:", request.data);

  if (!email || !password || !name) {
    throw new HttpsError('invalid-argument', 'Email, senha e nome são obrigatórios.');
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'A senha deve ter no mínimo 6 caracteres.');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const sellerData = {
      id: userRecord.uid,
      name,
      email,
      role: "seller",
      salesValue: 0,
      ticketAverage: 0,
      pa: 0,
      points: 0,
      extraPoints: 0,
      completedCourseIds: [],
      workSchedule: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    const sellerRef = db.collection('sellers').doc(userRecord.uid);
    const userRef = db.collection('users').doc(userRecord.uid);

    batch.set(sellerRef, sellerData);
    batch.set(userRef, { role: "seller", email, name });
    
    await batch.commit();

    return { result: `Utilizador ${name} (${email}) criado com sucesso.` };

  } catch (error: any) {
    console.error("Erro interno ao criar utilizador:", error);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Este email já está a ser utilizado por outra conta.');
    }
    throw new HttpsError('internal', 'Ocorreu um erro inesperado ao criar o utilizador.');
  }
});

/**
 * FUNÇÃO 2: Excluir um vendedor.
 */
export const deleteSeller = onCall(async (request) => {
  const { uid } = request.data;

  if (!uid) {
    throw new HttpsError("invalid-argument", "O ID do utilizador (uid) é necessário.");
  }

  try {
    const batch = db.batch();
    const sellerRef = db.collection('sellers').doc(uid);
    const userRef = db.collection('users').doc(uid);

    batch.delete(sellerRef);
    batch.delete(userRef);
    
    await admin.auth().deleteUser(uid);
    await batch.commit();
    
    return { result: `Utilizador ${uid} apagado com sucesso.` };

  } catch (error: any) {
    console.error("Erro ao excluir utilizador:", error);
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Utilizador não encontrado.');
    }
    throw new HttpsError("internal", "Ocorreu um erro ao excluir o utilizador.");
  }
});

/**
 * FUNÇÃO 3: Alterar a senha de um vendedor.
 */
export const changeSellerPassword = onCall(async (request) => {
  const { uid, newPassword } = request.data;

  // ####################################################################
  // ### CORREÇÃO APLICADA AQUI ###
  // ####################################################################
  // O '!' antes de 'newPassword.length' foi removido.
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Dados inválidos: Verifique o ID e a nova senha (mínimo 6 caracteres).");
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    await admin.auth().revokeRefreshTokens(uid); 
    
    return { result: `Senha do utilizador ${uid} atualizada com sucesso.` };

  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Utilizador não encontrado.');
    }
    throw new HttpsError("internal", "Ocorreu um erro ao alterar a senha.");
  }
});