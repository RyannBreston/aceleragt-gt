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

/**
 * FUNÇÃO 4: Atualizar os dados de um vendedor (nome e email).
 */
export const updateSeller = onCall(async (request) => {
  const { uid, name, email } = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Apenas administradores podem executar esta ação.');
  }

  if (!uid || !name || !email) {
    throw new HttpsError('invalid-argument', 'UID, nome e email são obrigatórios.');
  }

  try {
    await admin.auth().updateUser(uid, {
      email: email,
      displayName: name,
    });

    const batch = db.batch();
    const sellerRef = db.collection('sellers').doc(uid);
    const userRef = db.collection('users').doc(uid);

    batch.update(sellerRef, { name, email });
    batch.update(userRef, { name, email });
    
    await batch.commit();

    return { result: `Vendedor ${name} atualizado com sucesso.` };

  } catch (error: any) {
    console.error("Erro ao atualizar vendedor:", error);
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Utilizador não encontrado.');
    }
    throw new HttpsError('internal', 'Ocorreu um erro inesperado ao atualizar o vendedor.');
  }
});

/**
 * FUNÇÃO 5: Atualizar os pontos de um vendedor.
 */
export const updateSellerPoints = onCall(async (request) => {
  const { uid, points } = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Ação não autorizada.');
  }

  if (!uid || points === undefined || typeof points !== 'number' || points < 0) {
    throw new HttpsError('invalid-argument', 'UID do vendedor e um valor de pontos válido (número >= 0) são obrigatórios.');
  }

  try {
    const sellerRef = db.collection('sellers').doc(uid);
    
    await sellerRef.update({
      points: Math.floor(points)
    });

    return { result: `Pontos do vendedor ${uid} atualizados para ${Math.floor(points)}.` };

  } catch (error: any) {
    console.error("Erro ao atualizar pontos:", error);
    if (error.code === 5) { // Código de erro 'NOT_FOUND' do Firestore
       throw new HttpsError('not-found', 'Vendedor não encontrado na base de dados.');
    }
    throw new HttpsError('internal', 'Ocorreu um erro inesperado ao atualizar os pontos.');
  }
});