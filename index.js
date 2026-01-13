import express from 'express';
import { exec, execSync } from 'child_process'; // 👈 AQUI
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);
const app = express();
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
        try {
            execSync(`chmod +x "${ytDlpPath}"`);
        } catch (e) {
            console.warn('chmod falhou ou já estava ok');
        }
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const output = path.join(downloadsDir, '%(title)s [%(id)s].webm');

        const command = `"${ytDlpPath}" -f bestaudio[ext=webm] -o "${output}" "${videoUrl}"`;

        console.log('▶ Executando:', command);

        await execPromise(command, {
            maxBuffer: 1024 * 1024 * 10
        });

        const files = fs
            .readdirSync(downloadsDir)
            .filter(f => f.includes(videoId));

        res.json({
            ok: true,
            platform: process.platform,
            files
        });

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
