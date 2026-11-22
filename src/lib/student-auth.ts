import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Account, Client, AppwriteException, ID } from "node-appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { getStudentByUserId } from "@/lib/students";
import type { Student } from "@/lib/students";

export const STUDENT_SESSION_COOKIE = "jg_student_session";
export const STUDENT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function publicClient(): Client {
  return new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId);
}

function publicAccount(client: Client): Account {
  return new Account(client);
}

export async function readStudentSessionSecret(): Promise<string | null> {
  const store = await cookies();
  return store.get(STUDENT_SESSION_COOKIE)?.value ?? null;
}

/** Resolve the logged-in student from the Appwrite session cookie. */
export async function getCurrentStudent(): Promise<Student | null> {
  if (!isAppwriteConfigured()) return null;

  const secret = await readStudentSessionSecret();
  if (!secret) return null;

  try {
    const account = publicAccount(publicClient().setSession(secret));
    const user = await account.get();
    return getStudentByUserId(user.$id);
  } catch {
    return null;
  }
}

/** Server-side guard for every student page and action. */
export async function requireStudent(): Promise<Student> {
  const student = await getCurrentStudent();
  if (!student) redirect("/student/login");
  return student;
}

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

export async function registerStudentAccount({
  email,
  password,
  name,
  studentId,
  fullName,
  phone,
  dateOfBirth,
  gender,
  address,
  institution,
  educationalLevel,
  courseOfStudy,
}: {
  email: string;
  password: string;
  name: string;
  studentId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  institution: string;
  educationalLevel: string;
  courseOfStudy: string;
}) {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();

  const account = publicAccount(publicClient());

  let userId: string;
  try {
    const user = await account.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });
    userId = user.$id;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 409) {
      throw new Error("An account with this email already exists.");
    }
    throw error;
  }

  const { createStudent } = await import("@/lib/students");
  await createStudent({
    userId,
    studentId,
    email,
    fullName,
    phone,
    dateOfBirth,
    gender,
    address,
    institution,
    educationalLevel,
    courseOfStudy,
    status: "active",
    emailVerified: false,
  });

  return { userId };
}

export async function createStudentSession(email: string, password: string) {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();

  const session = await publicAccount(publicClient()).createEmailPasswordSession({
    email,
    password,
  });

  const cookieValue = `${STUDENT_SESSION_COOKIE}=${session.secret}; Path=/; Max-Age=${STUDENT_SESSION_MAX_AGE}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

  return { cookieValue, session };
}

export async function logoutStudent() {
  const secret = await readStudentSessionSecret();
  if (secret) {
    try {
      await publicAccount(publicClient().setSession(secret)).deleteSession("current");
    } catch {
      // Ignore session deletion errors.
    }
  }

  const cookieValue = `${STUDENT_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  return cookieValue;
}

export type { Student };
