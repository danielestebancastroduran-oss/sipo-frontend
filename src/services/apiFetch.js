const BASE_URL = "http://localhost:3000/api";

export const authFetch = async (endpoint, options = {}) => {
  // 1. Recuperamos el token
  const token = localStorage.getItem("token");
  
  // DEPURACIÓN: Ver qué estamos enviando y a dónde
  console.log("🔍 [DEBUG API] Endpoint solicitado:", endpoint);
  console.log("🔍 [DEBUG API] Token recuperado de localStorage:", token);
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // 2. Inyectamos el token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("🔍 [DEBUG API] Authorization header establecido.");
  } else {
    console.warn("⚠️ [DEBUG API] ¡Cuidado! No se encontró token en localStorage.");
  }

  // 3. Hacemos la petición
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 4. Depuración de respuesta
  console.log("🔍 [DEBUG API] Estado de respuesta:", response.status);

  const data = await response.json();

  // 5. Manejo de error
  if (!response.ok) {
    console.error(`❌ [DEBUG API] La petición falló con status: ${response.status}`, data);
    // Lanzamos un objeto con el mensaje del backend si existe
    const error = new Error(data.message || `Error ${response.status}`);
    error.data = data;
    throw error;
  }

  return data;
};