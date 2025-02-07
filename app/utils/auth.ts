import Cookies from "js-cookie";

export type UserRole = "SUPERADMIN" | "ADMIN" | "WARGA";

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  desaId: string;
  desaNama: string;
  token: string;
}

export const setUserData = (userData: UserData) => {
  const { token, ...userDataWithoutToken } = userData;
  Cookies.set("userData", JSON.stringify(userDataWithoutToken), { expires: 7 });
  localStorage.setItem("userData", JSON.stringify(userDataWithoutToken));
  localStorage.setItem("token", token);
};

export const getUserData = (): UserData | null => {
  const cookieData = Cookies.get("userData");
  const token = localStorage.getItem("token");
  if (cookieData && token) {
    const userData = JSON.parse(cookieData);
    return { ...userData, token };
  }
  const localStorageData = localStorage.getItem("userData");
  if (localStorageData && token) {
    const userData = JSON.parse(localStorageData);
    return { ...userData, token };
  }
  return null;
};

export const clearUserData = () => {
  Cookies.remove("userData");
  localStorage.removeItem("userData");
  localStorage.removeItem("token");
};

// Add this function to handle logout
export const logout = () => {
  clearUserData();
};

export const hasPermission = (user: UserData | null, requiredRole: UserRole): boolean => {
  if (!user) return false;

  const roleHierarchy: UserRole[] = ["WARGA", "ADMIN", "SUPERADMIN"];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
};
