// // src/hooks/useUserFromFrame.js
// import { useState, useEffect } from "react";

// export function useUserFromFrame() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     try {
//       const params = new URLSearchParams(window.location.search);
//       const userParam = params.get("user");

//       if (!userParam) {
//         setError("No se recibió el parámetro user");
//         setLoading(false);
//         return;
//       }

//       const userData = JSON.parse(decodeURIComponent(userParam));

//       setUser(userData);
//       sessionStorage.setItem("userData", JSON.stringify(userData));

//       if (userData.token) {
//         sessionStorage.setItem("authToken", userData.token);
//       }
//     } catch (err) {
//       console.error("Error al parsear el user:", err);
//       setError("Error al procesar los datos de usuario");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const getEndpoint = (domainCode) => {
//     if (!user?.domains) return null;
//     const domain = user.domains.find((d) => d.code === domainCode);
//     return domain ? domain.endPoint : null;
//   };

//   return {
//     user,
//     loading,
//     error,
//     getEndpoint,
//     token: user?.token,
//     codeProject: user?.codeProject,
//     codeUser: user?.codeUser,
//     country: user?.country,
//     uiCode: user?.uiCode,
//   };
// }