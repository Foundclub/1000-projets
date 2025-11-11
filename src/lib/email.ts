import { Resend } from 'resend';

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY);

export interface AdminNotificationData {
  type: 'annonceur_request' | 'admin_request';
  userEmail: string;
  userName: string;
  userId: string;
  companyName?: string;
  phone?: string;
  requestDate: Date;
}

/**
 * Envoie une notification par email aux admins lorsqu'une nouvelle demande est créée
 */
export async function sendAdminNotification(data: AdminNotificationData): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      console.warn('[Email] ADMIN_EMAIL non configuré, email non envoyé');
      return false;
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY non configuré, email non envoyé');
      return false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://1000-projets.vercel.app';
    const adminPanelUrl = `${baseUrl}/admin/requests`;

    let subject = '';
    let htmlContent = '';

    if (data.type === 'annonceur_request') {
      subject = `🔔 Nouvelle demande Annonceur - ${data.userName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvelle demande Annonceur</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🔔 Nouvelle Demande Annonceur</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Une nouvelle demande de compte <strong>Annonceur</strong> a été soumise.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h2 style="margin-top: 0; color: #667eea;">Informations du demandeur</h2>
                <p><strong>Nom :</strong> ${data.userName}</p>
                <p><strong>Email :</strong> ${data.userEmail}</p>
                ${data.companyName ? `<p><strong>Entreprise :</strong> ${data.companyName}</p>` : ''}
                <p><strong>Date de la demande :</strong> ${new Date(data.requestDate).toLocaleString('fr-FR')}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${adminPanelUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Voir la demande dans l'admin
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Vous pouvez gérer cette demande depuis le <a href="${adminPanelUrl}" style="color: #667eea;">panneau d'administration</a>.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>1000 Projets - Système de notifications</p>
            </div>
          </body>
        </html>
      `;
    } else if (data.type === 'admin_request') {
      subject = `🔔 Nouvelle demande Admin - ${data.userName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvelle demande Admin</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🔔 Nouvelle Demande Admin</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 20px;">Bonjour,</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Une nouvelle demande de compte <strong>Admin</strong> a été soumise.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;">
                <h2 style="margin-top: 0; color: #f5576c;">Informations du demandeur</h2>
                <p><strong>Nom :</strong> ${data.userName}</p>
                <p><strong>Email :</strong> ${data.userEmail}</p>
                ${data.phone ? `<p><strong>Téléphone :</strong> ${data.phone}</p>` : ''}
                <p><strong>Date de la demande :</strong> ${new Date(data.requestDate).toLocaleString('fr-FR')}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${adminPanelUrl}" style="display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Voir la demande dans l'admin
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Vous pouvez gérer cette demande depuis le <a href="${adminPanelUrl}" style="color: #f5576c;">panneau d'administration</a>.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>1000 Projets - Système de notifications</p>
            </div>
          </body>
        </html>
      `;
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@1000-projets.com';
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error('[Email] Erreur lors de l\'envoi:', result.error);
      return false;
    }

    console.log('[Email] Notification envoyée avec succès:', result.data?.id);
    return true;
  } catch (error) {
    console.error('[Email] Erreur lors de l\'envoi de la notification:', error);
    return false;
  }
}

