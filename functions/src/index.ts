import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Inicializa o Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Define o caminho base para as coleções de dados para evitar repetição
const ARTIFACTS_PATH = `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id'}/public/data`;

/**
 * FUNÇÃO 1: Criar um novo vendedor.
 */
export const createSeller = onCall(async (request) => {
  const { email, password, name } = request.data;

  // Validação dos dados de entrada
  if (!email || !password || !name) {
    throw new HttpsError('invalid-argument', 'Email, senha e nome são obrigatórios.');
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'A senha deve ter no mínimo 6 caracteres.');
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
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
    batch.set(db.collection('sellers').doc(userRecord.uid), sellerData);
    batch.set(db.collection('users').doc(userRecord.uid), { role: "seller", email, name });
    
    await batch.commit();

    return { result: `Utilizador ${name} criado com sucesso.` };
  } catch (error: any) {
    console.error("Erro ao criar utilizador:", error);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Este email já está a ser utilizado.');
    }
    throw new HttpsError('internal', 'Ocorreu um erro inesperado ao criar o utilizador.');
  }
});

/**
 * FUNÇÃO 2: Atualizar os dados de um vendedor (nome e email).
 */
export const updateSeller = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Apenas administradores podem executar esta ação.');
  }
  const { uid, name, email } = request.data;
  if (!uid || !name || !email) {
    throw new HttpsError('invalid-argument', 'UID, nome e email são obrigatórios para a atualização.');
  }

  try {
    await admin.auth().updateUser(uid, { email, displayName: name });
    const batch = db.batch();
    batch.update(db.collection('sellers').doc(uid), { name, email });
    batch.update(db.collection('users').doc(uid), { name, email });
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
 * FUNÇÃO 3: Excluir um vendedor.
 */
export const deleteSeller = onCall(async (request) => {
  if (!request.auth) { throw new HttpsError('unauthenticated', 'Ação não autorizada.'); }
  const { uid } = request.data;
  if (!uid) { throw new HttpsError("invalid-argument", "O ID do utilizador é necessário."); }

  try {
    const batch = db.batch();
    batch.delete(db.collection('sellers').doc(uid));
    batch.delete(db.collection('users').doc(uid));
    await admin.auth().deleteUser(uid);
    await batch.commit();
    return { result: `Utilizador ${uid} apagado com sucesso.` };
  } catch (error: any) {
    console.error("Erro ao excluir utilizador:", error);
    throw new HttpsError("internal", "Ocorreu um erro ao excluir o utilizador.");
  }
});

/**
 * FUNÇÃO 4: Alterar a senha de um vendedor.
 */
export const changeSellerPassword = onCall(async (request) => {
  if (!request.auth) { throw new HttpsError('unauthenticated', 'Ação não autorizada.'); }
  const { uid, newPassword } = request.data;
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Dados inválidos: Verifique o ID e a nova senha.");
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    await admin.auth().revokeRefreshTokens(uid);
    return { result: `Senha do utilizador ${uid} atualizada com sucesso.` };
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    throw new HttpsError("internal", "Ocorreu um erro ao alterar a senha.");
  }
});

/**
 * FUNÇÃO 5: Atualizar os pontos de um vendedor.
 */
export const updateSellerPoints = onCall(async (request) => {
  if (!request.auth) { throw new HttpsError('unauthenticated', 'Ação não autorizada.'); }
  const { uid, points } = request.data;
  if (!uid || points === undefined || typeof points !== 'number' || points < 0) {
    throw new HttpsError('invalid-argument', 'UID e um valor de pontos válido são obrigatórios.');
  }

  try {
    await db.collection('sellers').doc(uid).update({ points: Math.floor(points) });
    return { result: `Pontos do vendedor ${uid} atualizados para ${Math.floor(points)}.` };
  } catch (error: any) {
    console.error("Erro ao atualizar pontos:", error);
    throw new HttpsError('internal', 'Ocorreu um erro ao atualizar os pontos.');
  }
});

/**
 * FUNÇÃO 6: Criar uma Corridinha Diária manualmente.
 */
export const createDailySprint = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Apenas administradores podem executar esta ação.');
  }

  const { title, sprintTiers, participantIds } = request.data;

  if (!title || !sprintTiers || !participantIds || participantIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Título, níveis de meta e pelo menos um participante são obrigatórios.');
  }

  const sprintsRef = db.collection(`${ARTIFACTS_PATH}/dailySprints`);
  
  try {
    const batch = db.batch();

    // Desativa todas as corridinhas ativas anteriores para evitar sobreposição
    const activeSprintsQuery = await sprintsRef.where('isActive', '==', true).get();
    activeSprintsQuery.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });

    // Cria a nova corridinha com os dados recebidos do painel do admin
    const newSprintData = {
      title,
      sprintTiers,
      participantIds,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const newSprintRef = sprintsRef.doc();
    batch.set(newSprintRef, newSprintData);
    
    await batch.commit();
    
    console.log(`Corridinha manual criada com sucesso: ${title}`);
    return { result: `Corridinha "${title}" criada com sucesso!` };

  } catch (error) {
    console.error("Erro ao criar a corridinha manual:", error);
    throw new HttpsError('internal', 'Ocorreu um erro inesperado ao criar a corridinha.');
  }
});