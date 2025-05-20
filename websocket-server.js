import { WebSocketServer } from 'ws';
import chalk from 'chalk';

// Crear servidor WebSocket escuchando en el puerto 8080
const wss = new WebSocketServer({ port: 8080 });
console.log(chalk.green('[Servidor]: Servidor WebSocket ejecutándose en ws://localhost:8080'));

// Mapa para almacenar clientes conectados y sus nombres de usuario
const clients = new Map();

// Variables para controlar mensajes y cierre automático del servidor
let isMessageSent = false; // Para enviar solo una vez el mensaje de advertencia
let isServerClosing = false; // Evita que el servidor se cierre varias veces

// Evento: nuevo cliente conectado
wss.on('connection', (ws) => {
  console.log(chalk.green('[Servidor]: Cliente conectado.'));

  let userName = '';

  // Evento: mensaje recibido desde cliente
  ws.on('message', (data) => {
    const message = data.toString();

    // Si el usuario no tiene nombre, asignarlo y notificar
    if (!userName) {
      userName = message;
      clients.set(ws, userName); // Guardar la conexión con su nombre
      sendGlobal(`[Servidor]: El usuario "${userName}" se ha unido al chat.`, ws);
      return;
    }

    // Enviar mensaje a todos menos al remitente
    sendGlobal(`${userName}: ${message}`, ws);
  });

  // Evento: cliente desconectado
  ws.on('close', () => {
    if (userName) {
      clients.delete(ws); // Eliminar cliente desconectado
      sendGlobal(`[Servidor]: El usuario "${userName}" ha salido del chat.`);
    }
  });

  // Enviar advertencia y programar cierre automático solo una vez
  if (!isMessageSent) {
    isMessageSent = true;

    // Después de 1 minuto, avisa que el chat se cerrará en 10 minutos
    setTimeout(() => {
      sendGlobal('[Servidor]: El chat se cerrará en 10 minutos.');

      // Después de 10 minutos, se cierra servidor y desconecta a los clientes
      setTimeout(() => {
        if (!isServerClosing) {
          isServerClosing = true;
          sendGlobal('[Servidor]: El servidor ha sido cerrado.');

          // Cerrar conexiones activas
          wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
              client.close();
            }
          });

          // Cerrar servidor y terminar proceso
          wss.close(() => {
            process.exit(0);
          });
        }
      }, 10 * 60 * 1000); // 10 minutos
    }, 1 * 60 * 1000); // 1 minuto
  }
});

// Función para enviar mensaje a todos clientes, excepto al que envió el mensaje (sender)
// Los mensajes del servidor se muestran en amarillo en consola, mensajes clientes en blanco
function sendGlobal(message, sender = null) {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN && client !== sender) {
      client.send(message);
    }
  }

  if (message.startsWith('[Servidor]:')) {
    console.log(chalk.yellow(message));
  } else {
    console.log(chalk.white(message));
  }
}