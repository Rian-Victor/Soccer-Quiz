"""
Serviço de email
Responsável por enviar emails via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço para enviar emails"""
    
    @staticmethod
    async def send_password_reset_email(
        to_email: str,
        reset_link: str,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Envia email de recuperação de senha
        
        Args:
            to_email: Email do destinatário
            reset_link: Link de reset (ex: https://app.com/reset?token=...)
            user_name: Nome do usuário (opcional)
            
        Returns:
            True se sucesso, False se falha
        """
        try:
            # Construir corpo do email
            html_body = EmailService._build_password_reset_html(reset_link, user_name)
            
            # Enviar via SMTP
            await EmailService._send_smtp(
                to_email=to_email,
                subject=settings.PASSWORD_RESET_SUBJECT,
                html_body=html_body
            )
            
            logger.info(f"✅ Email de reset enviado para {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar email para {to_email}: {e}")
            return False
    
    @staticmethod
    async def _send_smtp(
        to_email: str,
        subject: str,
        html_body: str
    ) -> None:
        """
        Envia email via SMTP
        
        Args:
            to_email: Email do destinatário
            subject: Assunto do email
            html_body: Corpo em HTML
        """
        # Validar configuração
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            raise ValueError("SMTP_USER e SMTP_PASSWORD não estão configurados")
        
        # Criar mensagem
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        
        # Anexar corpo HTML
        msg.attach(MIMEText(html_body, "html"))
        
        # Conectar e enviar
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(
                settings.SMTP_FROM_EMAIL,
                to_email,
                msg.as_string()
            )
    
    @staticmethod
    def _build_password_reset_html(reset_link: str, user_name: Optional[str] = None) -> str:
        """
        Constrói o corpo HTML do email de reset de senha
        
        Args:
            reset_link: Link de reset
            user_name: Nome do usuário (opcional)
            
        Returns:
            HTML do email
        """
        user_greeting = f"Olá {user_name}" if user_name else "Olá"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .content {{ background-color: #f9f9f9; padding: 20px; border-radius: 5px; }}
                .button {{ 
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }}
                .button:hover {{ background-color: #0056b3; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #999; }}
                .warning {{ color: #d9534f; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚽ Soccer Quiz</h1>
                </div>
                
                <div class="content">
                    <h2>{user_greeting},</h2>
                    
                    <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                    
                    <center>
                        <a href="{reset_link}" class="button">Redefinir Senha</a>
                    </center>
                    
                    <p>Ou copie e cole este link no seu navegador:</p>
                    <p style="word-break: break-all; font-size: 12px; background-color: #e9ecef; padding: 10px;">{reset_link}</p>
                    
                    <div class="warning">
                        <strong>⚠️ Atenção:</strong><br>
                        Este link expira em 15 minutos.<br>
                        Se você não solicitou a redefinição de senha, ignore este email.
                    </div>
                </div>
                
                <div class="footer">
                    <p>&copy; 2025 Soccer Quiz. Todos os direitos reservados.</p>
                    <p>Este é um email automático, não responda.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
