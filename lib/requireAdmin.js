import { cookies } from "next/headers";
import { verifySession } from "./adminSession";

export const SESSION_COOKIE_NAME = "zenin_admin_session";

export function getAdminSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}
