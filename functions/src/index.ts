import * as admin from "firebase-admin";
import {onCall, HttpsError} from "firebase-functions/v2/https";

// Inicializa o Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Define o caminho base para as coleções de dados para evitar repetição
const ARTIFACTS_PATH = `artifacts/${
  process.env.GCLOUD_PROJECT || "default-app-id"
}/public/data`;

// Opções de CORS para permitir qualquer origem (seguro para onCall)
const corsOptions = {cors: true};

// ##################################################
// ### FUNÇÕES DE GESTÃO DE ADMINISTRADORES ###
// ##################################################

export const createAdmin = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Apenas outros administradores podem executar esta ação."
    );
  }
  const {email, password, name} = request.data;
  if (!email || !password || !name || password.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Email, nome e senha com no mínimo 6 caracteres são obrigatórios."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    await admin.auth().setCustomUserClaims(userRecord.uid, {role: "admin"});
    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      name,
      email,
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {result: `Administrador ${name} criado com sucesso.`};
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      throw new HttpsError(
        "already-exists",
        "Este email já está a ser utilizado."
      );
    }
    throw new HttpsError(
      "internal",
      "Ocorreu um erro inesperado ao criar o administrador."
    );
  }
});

export const updateAdmin = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {uid, name, email} = request.data;
  if (!uid || !name || !email) {
    throw new HttpsError(
      "invalid-argument",
      "UID, nome e email são obrigatórios."
    );
  }

  try {
    await admin.auth().updateUser(uid, {email, displayName: name});
    await db.collection("users").doc(uid).update({name, email});
    return {result: `Administrador ${name} atualizado com sucesso.`};
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/user-not-found"
    ) {
      throw new HttpsError("not-found", "Administrador não encontrado.");
    }
    throw new HttpsError(
      "internal",
      "Ocorreu um erro inesperado ao atualizar o administrador."
    );
  }
});

export const changeAdminPassword = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {uid, newPassword} = request.data;
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Dados inválidos.");
  }

  try {
    await admin.auth().updateUser(uid, {password: newPassword});
    await admin.auth().revokeRefreshTokens(uid);
    return {result: "Senha do administrador atualizada."};
  } catch (error) {
    throw new HttpsError("internal", "Ocorreu um erro ao alterar a senha.");
  }
});

// ##################################################
// ### FUNÇÕES DE GESTÃO DE VENDEDORES ###
// ##################################################

export const createSeller = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {email, password, name} = request.data;
  if (!email || !password || !name || password.length < 6) {
    throw new HttpsError("invalid-argument", "Argumentos inválidos.");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    await admin.auth().setCustomUserClaims(userRecord.uid, {role: "seller"});

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
    batch.set(db.collection("sellers").doc(userRecord.uid), sellerData);
    batch.set(
      db.collection("users").doc(userRecord.uid),
      {role: "seller", email, name}
    );
    await batch.commit();

    return {result: `Vendedor ${name} criado com sucesso.`};
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      throw new HttpsError("already-exists", "Este email já está em uso.");
    }
    throw new HttpsError("internal", "Ocorreu um erro ao criar o vendedor.");
  }
});

export const updateSeller = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {uid, name, email} = request.data;
  if (!uid || !name || !email) {
    throw new HttpsError("invalid-argument", "Argumentos inválidos.");
  }

  try {
    await admin.auth().updateUser(uid, {email, displayName: name});
    const batch = db.batch();
    batch.update(db.collection("sellers").doc(uid), {name, email});
    batch.update(db.collection("users").doc(uid), {name, email});
    await batch.commit();
    return {result: `Vendedor ${name} atualizado com sucesso.`};
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "auth/user-not-found"
    ) {
      throw new HttpsError("not-found", "Utilizador não encontrado.");
    }
    throw new HttpsError(
      "internal",
      "Ocorreu um erro ao atualizar o vendedor."
    );
  }
});

export const deleteSeller = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {uid} = request.data;
  if (!uid) {
    throw new HttpsError(
      "invalid-argument",
      "O ID do utilizador é necessário."
    );
  }

  try {
    const batch = db.batch();
    batch.delete(db.collection("sellers").doc(uid));
    batch.delete(db.collection("users").doc(uid));
    await batch.commit();
    await admin.auth().deleteUser(uid);
    return {result: `Utilizador ${uid} apagado com sucesso.`};
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Ocorreu um erro ao excluir o utilizador."
    );
  }
});

export const changeSellerPassword = onCall(corsOptions, async (request) => {
  const {uid, newPassword} = request.data;
  const {auth} = request;

  const isAdmin = auth?.token.role === "admin";
  const isSelf = auth?.uid === uid;

  if (!auth || (!isAdmin && !isSelf)) {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }

  if (!uid || !newPassword || newPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Dados inválidos.");
  }

  try {
    await admin.auth().updateUser(uid, {password: newPassword});
    await admin.auth().revokeRefreshTokens(uid);
    return {result: "Senha do vendedor atualizada."};
  } catch (error) {
    throw new HttpsError("internal", "Ocorreu um erro ao alterar a senha.");
  }
});

export const updateSellerPoints = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {uid, points} = request.data;
  if (
    !uid ||
    points === undefined ||
    typeof points !== "number" ||
    points < 0
  ) {
    throw new HttpsError("invalid-argument", "Argumentos inválidos.");
  }

  try {
    await db
      .collection("sellers")
      .doc(uid)
      .update({points: Math.floor(points)});
    return {result: "Pontos atualizados."};
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Ocorreu um erro ao atualizar os pontos."
    );
  }
});

export const createDailySprint = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {title, sprintTiers, participantIds} = request.data;
  if (
    !title ||
    !sprintTiers ||
    !participantIds ||
    participantIds.length === 0
  ) {
    throw new HttpsError("invalid-argument", "Argumentos inválidos.");
  }

  const sprintsRef = db.collection(`${ARTIFACTS_PATH}/dailySprints`);
  try {
    const newSprintData = {
      title,
      sprintTiers,
      participantIds,
      isActive: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await sprintsRef.add(newSprintData);

    return {
      result: `Corridinha "${
        title
      }" criada com sucesso. Pode agora ativá-la na lista.`,
    };
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Ocorreu um erro ao criar a corridinha."
    );
  }
});

export const incrementAttendance = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Ação não autenticada.");
  }

  const sellerId = request.auth.uid;
  const sellerRef = db.collection("sellers").doc(sellerId);

  try {
    await db.runTransaction(async (transaction) => {
      const sellerDoc = await transaction.get(sellerRef);
      if (!sellerDoc.exists) {
        throw new HttpsError("not-found", "Vendedor não encontrado.");
      }

      const sellerData = sellerDoc.data();
      const lastUpdate = sellerData?.lastAttendanceUpdate?.toDate();
      const now = new Date();

      const isToday = lastUpdate?.toDateString() === now.toDateString();

      const count = sellerData?.dailyAttendanceCount || 0;
      const newCount = isToday ? count + 1 : 1;

      transaction.update(sellerRef, {
        dailyAttendanceCount: newCount,
        lastAttendanceUpdate: admin.firestore.Timestamp.now(),
      });
    });

    return {result: "Contador de atendimentos atualizado."};
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Erro ao atualizar o contador.");
  }
});

export const resetAttendance = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Ação não autenticada.");
  }

  const sellerId = request.auth.uid;
  const sellerRef = db.collection("sellers").doc(sellerId);

  try {
    await sellerRef.update({dailyAttendanceCount: 0});
    return {result: "Contador de atendimentos zerado."};
  } catch (error) {
    throw new HttpsError("internal", "Erro ao zerar o contador.");
  }
});

export const updateAttendance = onCall(corsOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Ação não autenticada.");
  }
  const {count} = request.data;
  if (typeof count !== "number" || count < 0) {
    throw new HttpsError(
      "invalid-argument",
      "O valor deve ser um número positivo."
    );
  }

  const sellerId = request.auth.uid;
  const sellerRef = db.collection("sellers").doc(sellerId);

  try {
    await sellerRef.update({dailyAttendanceCount: count});
    return {result: "Contador de atendimentos atualizado."};
  } catch (error) {
    throw new HttpsError("internal", "Erro ao atualizar o contador.");
  }
});

export const updateDailySprint = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {id, ...data} = request.data;
  if (!id || !data.title) {
    throw new HttpsError("invalid-argument", "ID e título são obrigatórios.");
  }
  const sprintRef = db.collection(`${ARTIFACTS_PATH}/dailySprints`).doc(id);
  await sprintRef.update(data);
  return {result: "Corridinha atualizada."};
});

export const deleteDailySprint = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {id} = request.data;
  if (!id) {
    throw new HttpsError("invalid-argument", "ID da corridinha é obrigatório.");
  }
  await db.collection(`${ARTIFACTS_PATH}/dailySprints`).doc(id).delete();
  return {result: "Corridinha excluída."};
});

export const toggleDailySprint = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {id, isActive} = request.data;
  if (!id) {
    throw new HttpsError("invalid-argument", "ID da corridinha é obrigatório.");
  }

  const sprintsRef = db.collection(`${ARTIFACTS_PATH}/dailySprints`);
  const batch = db.batch();

  if (isActive) {
    const otherSprints = await sprintsRef.where("isActive", "==", true).get();
    otherSprints.forEach((doc) => {
      batch.update(doc.ref, {isActive: false});
    });
  }

  const sprintRef = sprintsRef.doc(id);
  batch.update(sprintRef, {isActive});

  await batch.commit();
  return {result: `Corridinha ${isActive ? "ativada" : "desativada"}.`};
});

export const setWorkSchedule = onCall(corsOptions, async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "Ação não autorizada.");
  }
  const {weekIdentifier, schedule} = request.data;
  if (!weekIdentifier || !schedule) {
    const msg = "Identificador da semana e escala são obrigatórios.";
    throw new HttpsError("invalid-argument", msg);
  }

  const path = `${ARTIFACTS_PATH}/workSchedules/${weekIdentifier}`;
  const scheduleRef = db.doc(path);
  await scheduleRef.set(schedule, {merge: true});

  return {result: "Escala salva com sucesso."};
});

export const getWorkScheduleForWeek = onCall(corsOptions, async (request) => {
  const {weekIdentifier} = request.data;
  if (!weekIdentifier) {
    const msg = "Identificador da semana é obrigatório.";
    throw new HttpsError("invalid-argument", msg);
  }
  const path = `${ARTIFACTS_PATH}/workSchedules/${weekIdentifier}`;
  const scheduleRef = db.doc(path);
  const docSnap = await scheduleRef.get();

  if (docSnap.exists) {
    return docSnap.data();
  }
  return {};
});
