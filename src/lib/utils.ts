import * as admin from "firebase-admin";

// Inicializa o Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Define o caminho base para as coleções de dados para evitar repetição
const ARTIFACTS_PATH = `artifacts/${
  process.env.GCLOUD_PROJECT || "default-app-id"
}/public/data`;

// ##################################################
// ### FUNÇÕES DE GESTÃO DE ADMINISTRADORES ###
// ##################################################

export const createAdmin = async (request: { auth?: { token: { role: string } }; data: { email?: string; password?: string; name?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error(
        "permission-denied",
    );
  }
  const {email, password, name} = request.data;
  if (!email || !password || !name || password.length < 6) {
    throw new Error(
        "invalid-argument",
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
      throw new Error(
          "already-exists",
      );
    }
    throw new Error(
        "internal",
    );
  }
};

export const updateAdmin = async (request: { auth?: { token: { role: string } }; data: { uid?: string; name?: string; email?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {uid, name, email} = request.data;
  if (!uid || !name || !email) {
    throw new Error(
        "invalid-argument",
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
      throw new Error("not-found");
    }
    throw new Error(
        "internal",
    );
  }
};

export const changeAdminPassword = async (request: { auth?: { token: { role: string } }; data: { uid?: string; newPassword?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {uid, newPassword} = request.data;
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new Error("invalid-argument");
  }

  try {
    await admin.auth().updateUser(uid, {password: newPassword});
    await admin.auth().revokeRefreshTokens(uid);
    return {result: "Senha do administrador atualizada."};
  } catch {
    throw new Error("internal");
  }
};

// ##################################################
// ### FUNÇÕES DE GESTÃO DE VENDEDORES ###
// ##################################################

export const createSeller = async (request: { auth?: { token: { role: string } }; data: { email?: string; password?: string; name?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {email, password, name} = request.data;
  if (!email || !password || !name || password.length < 6) {
    throw new Error("invalid-argument");
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
      throw new Error("already-exists");
    }
    throw new Error("internal");
  }
};

export const updateSeller = async (request: { auth?: { token: { role: string } }; data: { uid?: string; name?: string; email?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {uid, name, email} = request.data;
  if (!uid || !name || !email) {
    throw new Error("invalid-argument");
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
      throw new Error("not-found");
    }
    throw new Error(
        "internal",
    );
  }
};

export const deleteSeller = async (request: { auth?: { token: { role: string } }; data: { uid?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {uid} = request.data;
  if (!uid) {
    throw new Error(
        "invalid-argument",
    );
  }

  try {
    const batch = db.batch();
    batch.delete(db.collection("sellers").doc(uid));
    batch.delete(db.collection("users").doc(uid));
    await batch.commit();
    await admin.auth().deleteUser(uid);
    return {result: `Utilizador ${uid} apagado com sucesso.`};
  } catch {
    throw new Error(
        "internal",
    );
  }
};

export const changeSellerPassword = async (request: { auth?: { token: { role: string } }; data: { uid?: string; newPassword?: string } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {uid, newPassword} = request.data;
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new Error("invalid-argument");
  }

  try {
    await admin.auth().updateUser(uid, {password: newPassword});
    await admin.auth().revokeRefreshTokens(uid);
    return {result: "Senha do vendedor atualizada."};
  } catch {
    throw new Error("internal");
  }
};

export const updateSellerPoints = async (request: { auth?: { token: { role: string } }; data: { uid?: string; points?: number } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {uid, points} = request.data;
  if (!uid || points === undefined || typeof points !== "number" || points < 0) {
    throw new Error("invalid-argument");
  }

  try {
    await db.collection("sellers").doc(uid).update(
        {points: Math.floor(points)}
    );
    return {result: "Pontos atualizados."};
  } catch {
    throw new Error(
        "internal",
    );
  }
};

export const createDailySprint = async (request: { auth?: { token: { role: string } }; data: { title?: string; sprintTiers?: any[]; participantIds?: string[] } }) => {
  if (request.auth?.token.role !== "admin") {
    throw new Error("permission-denied");
  }
  const {title, sprintTiers, participantIds} = request.data;
  if (!title || !sprintTiers || !participantIds || participantIds.length === 0) {
    throw new Error("invalid-argument");
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
  } catch {
    throw new Error("internal");
  }
};
