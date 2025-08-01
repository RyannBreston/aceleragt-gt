import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa o Firebase Admin para aceder aos serviços de backend
admin.initializeApp();
const db = admin.firestore();

/**
 * FUNÇÃO 1: Criar um novo vendedor.
 * Esta é uma Função Chamável (onCall) que resolve o problema de CORS automaticamente.
 */
export const createSeller = functions.https.onCall(async (data: any, context) => {
  // Log para ajudar na depuração, pode ser removido em produção.
  console.log("A função createSeller foi chamada com os dados:", data);
  
  const { email, password, name } = data;

  // Validação robusta dos dados recebidos
  if (!email || !password || !name) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, senha e nome são obrigatórios.');
  }
  if (password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'A senha deve ter no mínimo 6 caracteres.');
  }

  try {
    // Cria o utilizador no sistema de autenticação do Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Prepara os dados do vendedor para salvar no Firestore
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Adiciona data de criação
    };

    // Cria os documentos necessários no Firestore em um batch para garantir consistência
    const batch = db.batch();
    const sellerRef = db.collection('sellers').doc(userRecord.uid);
    const userRef = db.collection('users').doc(userRecord.uid);

    batch.set(sellerRef, sellerData);
    batch.set(userRef, { role: "seller", email, name });
    
    await batch.commit();

    // Retorna uma resposta de sucesso para o frontend
    return { result: `Utilizador ${name} (${email}) criado com sucesso.` };

  } catch (error: any) {
    // Tratamento de erros
    console.error("Erro interno ao criar utilizador:", error);
    // Retorna um erro específico se o email já estiver em uso
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'Este email já está a ser utilizado por outra conta.');
    }
    // Retorna um erro genérico para outras falhas
    throw new functions.https.HttpsError('internal', 'Ocorreu um erro inesperado ao criar o utilizador.');
  }
});

/**
 * FUNÇÃO 2: Excluir um vendedor.
 */
export const deleteSeller = functions.https.onCall(async (data: any, context) => {
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "O ID do utilizador (uid) é necessário.");
  }

  try {
    // Exclui em batch para garantir que tudo seja removido
    const batch = db.batch();
    const sellerRef = db.collection('sellers').doc(uid);
    const userRef = db.collection('users').doc(uid);

    batch.delete(sellerRef);
    batch.delete(userRef);
    
    await admin.auth().deleteUser(uid); // Apaga da autenticação por último
    await batch.commit();
    
    return { result: `Utilizador ${uid} apagado com sucesso.` };

  } catch (error: any) {
    console.error("Erro ao excluir utilizador:", error);
    if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Utilizador não encontrado.');
    }
    throw new functions.https.HttpsError("internal", "Ocorreu um erro ao excluir o utilizador.");
  }
});

/**
 * FUNÇÃO 3: Alterar a senha de um vendedor.
 */
export const changeSellerPassword = functions.https.onCall(async (data: any, context) => {
  const { uid, newPassword } = data;

  if (!uid || !newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError("invalid-argument", "Dados inválidos: Verifique o ID e a nova senha (mínimo 6 caracteres).");
  }

  try {
    // Atualiza a senha no Firebase Authentication
    await admin.auth().updateUser(uid, { password: newPassword });
    // Desconecta o utilizador de todos os dispositivos para forçar o novo login
    await admin.auth().revokeRefreshTokens(uid); 
    
    return { result: `Senha do utilizador ${uid} atualizada com sucesso.` };

  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', 'Utilizador não encontrado.');
    }
    throw new functions.https.HttpsError("internal", "Ocorreu um erro ao alterar a senha.");
  }
});