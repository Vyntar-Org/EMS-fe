import Login from "../pages/auth/Login";
import Unauthorized from "../pages/Unauthorized";

export const routesConfig = [
  {
    path: "/login",
    element: Login,
    layout: "public",
    pagename: "Login",
  },
  {
    path: "/unauthorized",
    element: Unauthorized,
    layout: "private",
    pagename: "Unauthorized",
    permission: null, // No permission required for unauthorized page
  },
];
