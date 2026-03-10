import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
     <GoogleOAuthProvider clientId="426506381220-6t8e61jh0ru9v7gu6rf8ssfid7sd71ke.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
