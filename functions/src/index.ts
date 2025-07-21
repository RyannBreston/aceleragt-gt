import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa a aplicação de administração do Firebase
admin.initializeApp();

// --- Função para Criar um Novo Vendedor ---
export const createSeller = functions.https.onCall(async (data, context) => {
  // Opcional: Verificar se o chamador é um administrador
  // if (context.auth?.token.role !== "admin") {
  //   throw new functions.https.HttpsError(
  //     "permission-denied",
  //     "Apenas administradores podem criar vendedores.",
  //   );
  // }

  const { email, password, name } = data;

  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Faltam informações essenciais (email, senha, nome).",
    );
  }

  try {
    // 1. Criar o utilizador no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // 2. Criar o documento do vendedor na coleção 'sellers'
    const sellerData = {
      id: userRecord.uid,
      name: name,
      email: email,
      role: "seller",
      salesValue: 0,
      ticketAverage: 0,
      pa: 0,
      points: 0,
      extraPoints: 0,
      completedCourseIds: [],
      workSchedule: {},
    };
    await admin.firestore().collection("sellers").doc(userRecord.uid)
      .set(sellerData);

    // 3. Criar o documento de papel na coleção 'users'
    const userData = {
      role: "seller",
      email: email,
      name: name,
    };
    await admin.firestore().collection("users").doc(userRecord.uid)
      .set(userData);

    return { result: `Utilizador ${name} (${email}) criado com sucesso.` };
  } catch (error: any) {
    // Apagar o utilizador do Auth se a criação no Firestore falhar
    if (error.uid) {
      await admin.auth().deleteUser(error.uid);
    }
    throw new functions.https.HttpsError("internal", error.message);
  }
});


// --- Função para Apagar um Vendedor ---
export const deleteSeller = functions.https.onCall(async (data, context) => {
  // Opcional: Verificar se o chamador é um administrador
  // if (context.auth?.token.role !== "admin") {
  //   throw new functions.https.HttpsError(
  //     "permission-denied",
  //     "Apenas administradores podem apagar vendedores.",
  //   );
  // }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O ID do utilizador (uid) é necessário.",
    );
  }

  try {
    // 1. Apagar o utilizador do Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 2. Apagar o documento do vendedor de 'sellers'
    await admin.firestore().collection("sellers").doc(uid).delete();

    // 3. Apagar o documento de papel de 'users'
    await admin.firestore().collection("users").doc(uid).delete();

    return { result: `Utilizador ${uid} apagado com sucesso.` };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ... (importações e a função createSeller/deleteSeller que já existem)

// --- ADICIONE ESTA NOVA FUNÇÃO ---
export const changeSellerPassword = functions.https.onCall(async (data, context) => {
  // Opcional: Verificar se o chamador é um administrador
  // if (context.auth?.token.role !== "admin") {
  //   throw new functions.https.HttpsError(
  //     "permission-denied",
  //     "Apenas administradores podem alterar senhas.",
  //   );
  // }
  
  const { uid, newPassword } = data;

  if (!uid || !newPassword) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O ID do utilizador (uid) e a nova senha são necessários.",
    );
  }

  if (newPassword.length < 6) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A nova senha deve ter no mínimo 6 caracteres.",
    );
  }

  try {
    // Atualiza a senha no Firebase Authentication
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    // Revoga os tokens de atualização para forçar o logout do utilizador
    await admin.auth().revokeRefreshTokens(uid);

    return { result: `Senha do utilizador ${uid} atualizada com sucesso.` };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});