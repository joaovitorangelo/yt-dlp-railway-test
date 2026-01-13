import express from 'express';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const execPromise = promisify(exec);

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/download/:id', async (req, res) => {
    const videoId = req.params.id;

    try {
        const root = process.cwd();
        const downloadsDir = path.join(root, 'downloads');

        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir);
        }

        const ytDlpPath = path.join(root, 'yt-dlp');

        // garante permissão
        try {
            execSync(`chmod +x "${ytDlpPath}"`);
        } catch {}

        const outputTemplate = path.join(
            downloadsDir,
            '%(title)s [%(id)s].webm'
        );

        // verifica se já existe
        let file = fs
            .readdirSync(downloadsDir)
            .find(f => f.includes(videoId) && f.endsWith('.webm'));

        if (!file) {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            const command = `"${ytDlpPath}" -f bestaudio[ext=webm] -o "${outputTemplate}" "${videoUrl}"`;

            console.log('▶ Baixando:', command);

            await execPromise(command, {
                maxBuffer: 1024 * 1024 * 20
            });

            file = fs
                .readdirSync(downloadsDir)
                .find(f => f.includes(videoId) && f.endsWith('.webm'));
        }
        
        if (!file) {
            return res.status(404).send('Arquivo não encontrado');
        }

        const filePath = path.join(downloadsDir, file);

        res.setHeader('Content-Type', 'audio/webm');
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${encodeURIComponent(file)}"`
        );

        // envia o áudio
        res.sendFile(filePath);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            ok: false,
            error: err.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('🚀 yt-dlp Railway test running');
});

app.listen(PORT, () => {
    console.log(`✅ Server rodando na porta ${PORT}`);
});
