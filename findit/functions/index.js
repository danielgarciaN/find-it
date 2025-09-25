/* eslint-disable max-len */
const {onCall} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const vision = require("@google-cloud/vision");
const {getStorage} = require("firebase-admin/storage");

// Inicializa Admin SDK
initializeApp();

// Cliente de Vision
const client = new vision.ImageAnnotatorClient();

exports.analizarImagen = onCall(async (request) => {
  console.log("📥 Recibido en backend:", request);

  const imageUrl = request.data && request.data.imageUrl;
  if (!imageUrl) {
    throw new Error("❌ Falta la URL de la imagen");
  }

  // Extraer el bucket y el path de la URL (https://firebasestorage.googleapis.com/...)
  const match = imageUrl.match(/https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/(.*?)\/o\/(.*)\?/);
  if (!match) {
    throw new Error("❌ URL de imagen inválida");
  }

  const bucketName = match[1];
  const filePath = decodeURIComponent(match[2]);

  try {
    const [result] = await client.labelDetection(imageUrl);
    const labels = result.labelAnnotations || [];
    const etiquetas = labels.map((label) => label.description.toLowerCase());
    console.log("✅ Etiquetas:", etiquetas);

    // Borrar la imagen del Storage
    const storage = getStorage();
    await storage.bucket(bucketName).file(filePath).delete();
    console.log("🗑️ Imagen eliminada del storage");

    return {etiquetas};
  } catch (err) {
    console.error("❌ Error con Vision API:", err);
    throw new Error("Error interno al analizar la imagen");
  }
});
