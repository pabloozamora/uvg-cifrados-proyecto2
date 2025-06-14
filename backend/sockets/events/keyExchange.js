import {
  generateBitsBases,
  encodePhotons,
  measurePhotons,
  compareBasesAndGenerateKey,
} from '../../utils/QKD/keyGenerator.js'

export default function registerKeyExchange(io, socket, chatData) {
  socket.on('start-key-exchange', ({ receiverId }) => {
    console.log(`Usuario "${socket.user.email}" ha iniciado un intercambio de claves con el usuario ID "${receiverId}"`);

    const receiverSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user.email === receiverId
    );

    if (!receiverSocket) {
      console.error(`El usuario con ID "${receiverId}" no está conectado`);
      socket.emit('key-exchange-error', { message: `El usuario "${receiverId}" no está conectado.` });
      return;
    }
    try {
      console.log(`Iniciando intercambio de claves entre "${socket.user.email}" y "${receiverSocket.user.email}"`);
      const { bits: senderBits, bases: senderBases } = generateBitsBases();
      const photons = encodePhotons(senderBits, senderBases);

      const chatKey = `${socket.user.email}-${receiverId}`;
      chatData[chatKey] = {
        sender: socket.user.email,
        receiver: receiverId,
        photons,
        senderBits,
        senderBases,
      };

      receiverSocket.emit('receive-photons', {
        senderId: socket.user.email,
        photons,
        length: photons.length,
      });
      console.log(`Fotones enviados a "${receiverSocket.user.email}"`);
    } catch (error) {
      console.error(`Error durante el intercambio de claves: ${error.message}`);
      socket.emit('key-exchange-error', { message: `Error durante el intercambio de claves: ${error.message}` });
    }
  });

  socket.on('measure-photons', ({ receiverBases, senderId }) => {
    try {
      console.log(`Usuario "${socket.user.email}" está midiendo fotones para el intercambio con "${senderId}"`);
      const chatKey = `${senderId}-${socket.user.email}`;
      const senderData = chatData[chatKey];

      if (!senderData) {
        console.error(`No se encontraron datos para el intercambio entre "${senderId}" y "${socket.user.email}"`);
        return;
      }

      const { photons } = senderData;
      const receiverBits = measurePhotons(photons, receiverBases);

      senderData.receiverBases = receiverBases;
      senderData.receiverBits = receiverBits;

      const senderSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user.email === senderId
      );

      senderSocket.emit('send-bases-receiver', { receiverBases, receiverBits });
      console.log(`Bases del receptor enviadas a "${senderId}"`);
    } catch (error) {
      console.error(`Error durante la medición de fotones: ${error.message}`);
      socket.emit('key-exchange-error', { message: `Error durante la medición de fotones: ${error.message}` });
    }
  });

  socket.on('compare-bases', ({ receiverBases, receiverId }) => {
    try {
      const chatKey = `${socket.user.email}-${receiverId}`;
      const senderData = chatData[chatKey];

      if (!senderData) {
        console.error(`No se encontraron datos para el intercambio entre "${socket.user.email}" y "${receiverId}"`);
        return;
      }

      const { senderBases, senderBits } = senderData;
      const key = compareBasesAndGenerateKey(senderBits, senderBases, receiverBases);

      const receiverSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user.email === receiverId
      );

      socket.emit('key-generated', { keyGenerated: key });
      receiverSocket.emit('key-generated', { keyGenerated: key });

      delete chatData[chatKey];
      console.log('Clave generada y enviada a ambos usuarios:', key.join(''));
    } catch (error) {
      console.error(`Error durante la comparación de bases: ${error.message}`);
      socket.emit('key-exchange-error', { message: `Error durante la comparación de bases: ${error.message}` });
    }
  });
};