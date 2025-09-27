const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GmailApiService {
  constructor() {
    this.oauth2Client = null;
    this.gmail = null;
    this.isInitialized = false;
    this.config = {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      redirectUri: process.env.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob',
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER
    };
  }

  async initialize() {
    try {
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Gmail API credentials not configured');
      }

      // Configurar OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      // Si tenemos refresh token, configurarlo
      if (this.config.refreshToken) {
        this.oauth2Client.setCredentials({
          refresh_token: this.config.refreshToken
        });
      }

      // Crear instancia de Gmail
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      this.isInitialized = true;
      
      console.log('✅ Gmail API service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Gmail API service initialization failed:', error.message);
      return false;
    }
  }

  // Método para obtener URL de autorización (solo la primera vez)
  getAuthUrl() {
    // Crear cliente OAuth2 si no existe
    if (!this.oauth2Client) {
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Gmail API credentials not configured (clientId or clientSecret missing)');
      }
      
      this.oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );
    }

    const scopes = ['https://www.googleapis.com/auth/gmail.send'];
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Método para intercambiar código por tokens (solo la primera vez)
  async getTokensFromCode(code) {
    try {
      // Crear cliente OAuth2 si no existe
      if (!this.oauth2Client) {
        if (!this.config.clientId || !this.config.clientSecret) {
          throw new Error('Gmail API credentials not configured');
        }
        
        this.oauth2Client = new google.auth.OAuth2(
          this.config.clientId,
          this.config.clientSecret,
          this.config.redirectUri
        );
      }
      
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      console.log('✅ Tokens obtenidos exitosamente');
      console.log('🔑 Refresh Token:', tokens.refresh_token);
      console.log('📧 Guarda este refresh token en Railway como GMAIL_REFRESH_TOKEN');
      
      return tokens;
    } catch (error) {
      console.error('❌ Error obteniendo tokens:', error.message);
      throw error;
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Gmail API service not available');
        }
      }

      // Crear el mensaje en formato MIME
      const message = this.createMessage(to, subject, htmlContent, textContent);
      
      // Enviar el email
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      console.log('✅ Email enviado exitosamente via Gmail API:', result.data.id);
      return { success: true, messageId: result.data.id };
    } catch (error) {
      console.error('❌ Error enviando email via Gmail API:', error.message);
      throw error;
    }
  }

  createMessage(to, subject, htmlContent, textContent) {
    const boundary = 'boundary_' + Math.random().toString(36).substring(2);
    
    let message = [
      `From: ${this.config.fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      '',
      textContent || this.htmlToText(htmlContent),
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      '',
      htmlContent,
      '',
      `--${boundary}--`
    ].join('\n');

    // Codificar en base64url
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  htmlToText(html) {
    // Conversión simple de HTML a texto
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  isAvailable() {
    return this.isInitialized && this.gmail !== null;
  }
}

module.exports = GmailApiService;
