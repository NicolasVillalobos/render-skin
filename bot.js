require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

// Crear cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Token del bot en el archivo .env
const TOKEN = process.env.DISCORD_TOKEN;

// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`Bot iniciado como ${client.user.tag}`);
});

// Evento para procesar mensajes
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!q') && message.attachments.size > 0) {
        const attachment = message.attachments.first();
        const imageUrl = attachment.url;

        try {
            // Transformar la skin y obtener la imagen resultante
            const resultPath = await transformSkin(imageUrl);

            // Enviar la imagen resultante al usuario
            await message.reply({ files: [resultPath] });

            // Eliminar el archivo temporal después de enviarlo
            fs.unlinkSync(resultPath);
        } catch (error) {
            console.error(error);
            message.reply('Hubo un error al procesar la skin. Asegúrate de que la imagen sea válida.');
        }
    }
});

// Función para transformar la skin
async function transformSkin(imageUrl) {
    const faceDetailsKeys = [
        'faceDetailsDefault',
        'faceDetailsAngry',
        'faceDetailsDiscomfort',
        'faceDetailsHappy',
        'faceDetailsSurprised',
    ];

    const canvasWidth = 256 * faceDetailsKeys.length + 20 * (faceDetailsKeys.length - 1); // Espacio entre imágenes
    const canvasHeight = 256;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    const resultPath = './result.png';

    try {
        // Cargar la imagen original desde la URL
        const originalImage = await loadImage(imageUrl);

        // Coordenadas y posiciones de cada parte
        const parts = {
        
                        whiteFootLeft: { srcX: 212, srcY: 42, width: 26, height: 13, destX: 65, destY: 111 },
            // Body
            blackBody: { srcX: 113, srcY: 12, width: 63, height: 69, destX: 64, destY: 60 },
            whiteBody: { srcX: 18, srcY: 13, width: 60, height: 65, destX: 65, destY: 60 },

            // Feet
            whiteFootRight: { srcX: 212, srcY: 42, width: 26, height: 13, destX: 90, destY: 111 },

            // Face details
            faceDetailsDefault: { srcX: 75, srcY: 105, width: 12, height: 21, destX: 95, destY: 85 },
            faceDetailsAngry: { srcX: 107, srcY: 105, width: 12, height: 20, destX: 95, destY: 85 },
            faceDetailsDiscomfort: { srcX: 136, srcY: 108, width: 15, height: 18, destX: 95, destY: 85 },
            faceDetailsHappy: { srcX: 170, srcY: 107, width: 13, height: 19, destX: 95, destY: 85 },
            faceDetailsSurprised: { srcX: 235, srcY: 104, width: 12, height: 22, destX: 95, destY: 85 },
        };

        faceDetailsKeys.forEach((key, index) => {
            const xOffset = index * (256 + 5); // Espaciado horizontal
        
            // 1. Dibujar el pie izquierdo primero
            const leftFoot = parts['whiteFootLeft'];
            const leftFootScaleFactor = 1.3; // Escala para el pie izquierdo
            ctx.drawImage(
                originalImage,
                leftFoot.srcX, leftFoot.srcY, leftFoot.width, leftFoot.height, // Recorte de la imagen original
                leftFoot.destX + xOffset, leftFoot.destY, // Posición en el lienzo
                leftFoot.width * leftFootScaleFactor, leftFoot.height * leftFootScaleFactor // Dimensiones escaladas
            );
        
            // 2. Dibujar el resto del cuerpo
            const bodyParts = ['blackBody', 'whiteBody', 'whiteFootRight', key]; // Pie derecho y cara
            bodyParts.forEach((partKey) => {
                const part = parts[partKey];
                const scaleFactor = partKey === 'whiteFootRight' ? 1.3 : 1; // Escala para el pie derecho
        
                ctx.drawImage(
                    originalImage,
                    part.srcX, part.srcY, part.width, part.height, // Recorte de la imagen original
                    part.destX + xOffset, part.destY, // Posición ajustada en el lienzo
                    part.width * scaleFactor, part.height * scaleFactor // Dimensiones escaladas
                );
        
                // Aplicar efecto espejo para las caras
                if (partKey === key) {
                    ctx.save(); // Guardar estado
                    ctx.scale(-1, 1); // Espejo horizontal
                    const mirroredDestX = -(part.destX + part.width + xOffset + 10); // Ajustar posición para el espejo
                    ctx.drawImage(
                        originalImage,
                        part.srcX, part.srcY, part.width, part.height, // Recorte de la imagen original
                        mirroredDestX, part.destY, // Espejo ajustado
                        part.width, part.height // Dimensiones
                    );
                    ctx.restore(); // Restaurar contexto
                }
            });
        });
        

        // Guardar la imagen generada
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(resultPath, buffer);

        return resultPath;
    } catch (error) {
        throw new Error('Error al transformar la skin: ' + error.message);
    }
}

// Iniciar el bot
client.login(TOKEN);
