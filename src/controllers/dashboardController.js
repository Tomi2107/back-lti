import { prisma } from '../lib/prisma.js'

export async function getDashboard(req, res) {

    try {

        return res.json({
            mensaje: "Dashboard funcionando"
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "No se pudo generar el dashboard."
        });

    }

}