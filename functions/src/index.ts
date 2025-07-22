import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// --- Função para Criar um Novo Vendedor ---
export const createSeller = functions.https.onCall(
  async (
    data: { email: string; password: string; name: string },
    context: functions.https.CallableContext
  ) => {
    const { email, password, name } = data;

    if (!email || !password || !name || password.length < 6) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Dados inválidos: Verifique nome, e-mail e senha (mínimo 6 caracteres)."
      );
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
      };

      await admin.firestore().collection("sellers").doc(userRecord.uid).set(sellerData);
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        role: "seller",
        email,
        name,
      });

      return {
        result: `Utilizador ${name} (${email}) criado com sucesso.`,
      };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// --- Função para Apagar um Vendedor ---
export const deleteSeller = functions.https.onCall(
  async (
    data: { uid: string },
    context: functions.https.CallableContext
  ) => {
    const { uid } = data;

    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "O ID do utilizador (uid) é necessário."
      );
    }

    try {
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection("sellers").doc(uid).delete();
      await admin.firestore().collection("users").doc(uid).delete();

      return { result: `Utilizador ${uid} apagado com sucesso.` };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// --- Função para Alterar a Senha ---
export const changeSellerPassword = functions.https.onCall(
  async (
    data: { uid: string; newPassword: string },
    context: functions.https.CallableContext
  ) => {
    const { uid, newPassword } = data;

    if (!uid || !newPassword || newPassword.length < 6) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Dados inválidos: Verifique o ID e a nova senha."
      );
    }

    try {
      await admin.auth().updateUser(uid, { password: newPassword });
      await admin.auth().revokeRefreshTokens(uid);

      return {
        result: `Senha do utilizador ${uid} atualizada com sucesso.`,
      };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);
