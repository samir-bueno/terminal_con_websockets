import { WebSocket } from 'ws';
import readline from 'readline';
import chalk from 'chalk';

// Conectar al servidor WebSocket en localhost:8080
const socket = new WebSocket('ws://localhost:8080');

// Crear interfaz para lectura y escritura en terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let username = '';
let waitingForUsername = true;

// Evento: conexión establecida
socket.on('open', () => {
  console.log(chalk.green('Conectado al servidor WebSocket.'));
  // Preguntar nombre de usuario por terminal
  rl.question(chalk.blue('Bienvenido al chat. Por favor, ingresa tu nombre de usuario: '), (name) => {
    username = name.trim();

    if (username) {
      // Enviar nombre al servidor para registrarse
      socket.send(username);
      console.log(chalk.green(`Conectado al chat como "${username}".\n`));

      // Configurar prompt con nombre del usuario
      rl.setPrompt(`${chalk.cyan(username)}: `);
      rl.prompt();

      waitingForUsername = false;
    } else {
      console.log(chalk.red("Por favor, ingresa un nombre válido."));
      process.exit(0);
    }
  });
});

// Evento: mensaje recibido desde servidor
socket.on('message', (data) => {
  const message = data.toString();

  // Borrar la línea donde el usuario está escribiendo para mostrar el mensaje limpio
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  // Mostrar mensajes con colores según origen
  if (message.startsWith('[Servidor]:')) {
    console.log(chalk.yellow(message)); // Mensajes del servidor en amarillo
  } else if (message.startsWith(`${username}:`)) {
    console.log(chalk.green(message)); // Mensajes propios en verde
  } else {
    console.log(chalk.white(message)); // Mensajes de otros usuarios en blanco
  }

  // Volver a mostrar el prompt para seguir escribiendo
  rl.prompt();
});

// Evento: desconexión del servidor
socket.on('close', () => {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  console.log('\n' + chalk.red('Desconectado del servidor.'));
  process.exit(0);
});

// Evento: usuario escribe una línea en terminal
rl.on('line', (line) => {
  if (!waitingForUsername) {
    const trimmed = line.trim();
    if (trimmed) {
      socket.send(trimmed); // Enviar mensaje al servidor
    }
    rl.prompt(); // Mostrar prompt nuevamente
  }
});