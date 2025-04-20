const resend = require('../config/resendConfig');

const sendEmail = async (req, res) => {
    // TODO: To be updated
    try {
        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide to, subject, and html content' 
            });
        }

        const data = await resend.emails.send({
            from: 'Marketplace <noreply@yourdomain.com>',
            to,
            subject,
            html
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending email',
            error: error.message
        });
    }
};

const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const data = await resend.emails.send({
            from: 'Kadeel <contact@kadeel.com>',
            to: email,
            subject: 'Demande de réinitialisation de mot de passe (Valable 10 minutes)',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
                    <div style="text-align: center; padding: 20px 0;">
                        <h1 style="color: #007bff; margin: 0; font-size: 24px;">Demande de réinitialisation de mot de passe</h1>
                    </div>
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <p style="font-size: 16px; line-height: 1.5;">Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetURL}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.3s;">Réinitialiser le mot de passe</a>
                        </div>
                        <p style="font-size: 16px; line-height: 1.5; color: #666;">Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
                        <p style="font-size: 14px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">Ce lien de réinitialisation expirera dans 10 minutes.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                        <p>Cet email a été envoyé par Kadeel. Merci de ne pas y répondre.</p>
                    </div>
                </div>
            `
        });
        return { success: true, data };
    } catch (error) {
        console.error('Password reset email error:', error);
        throw error;
    }
};

const sendNewMessageNotification = async (recipientEmail, senderName) => {
    try {
        const data = await resend.emails.send({
            from: 'Kadeel <contact@kadeel.com>',
            to: recipientEmail,
            subject: 'Nouveaux messages de ' + senderName,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
                    <div style="text-align: center; padding: 20px 0;">
                        <h1 style="color: #71A1A4; margin: 0; font-size: 24px;">Vous avez de nouveaux messages</h1>
                    </div>
                    <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <p style="font-size: 16px; line-height: 1.5;"><strong>${senderName}</strong> vous a envoyé de nouveaux messages.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/chat" style="display: inline-block; padding: 12px 24px; background-color: #71A1A4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.3s;">Voir la conversation</a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                        <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                    </div>
                </div>
            `
        });
        return { success: true, data };
    } catch (error) {
        console.error('Message notification email error:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendNewMessageNotification
}; 