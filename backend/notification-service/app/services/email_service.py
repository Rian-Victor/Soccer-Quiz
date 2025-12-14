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
        """Envia email de recuperação de senha"""
        try:
            logger.info(f"🔍 DEBUG: to_email={to_email}, reset_link={reset_link}, user_name={user_name}")
            
            if not to_email or not reset_link:
                logger.error(f"❌ Campos obrigatórios faltando: email={to_email}, reset_link={reset_link}")
                return False
            
            html_body = EmailService._build_password_reset_html(reset_link, user_name)

            await EmailService._send_smtp(
                to_email=to_email,
                subject=settings.PASSWORD_RESET_SUBJECT,
                html_body=html_body
            )
            
            logger.info(f"✅ Email de reset enviado para {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar email para {to_email}: {e}", exc_info=True)
            return False
    
    
    @staticmethod
    async def _send_smtp(
        to_email: str,
        subject: str,
        html_body: str
    ) -> None:
        """Envia email via SMTP"""

        # Validação
        if not settings.SMTP_USER:
            raise ValueError("❌ SMTP_USER não está configurado no .env")
    
        if not settings.SMTP_PASSWORD:
            raise ValueError("❌ SMTP_PASSWORD não está configurado no .env")

        logger.info(f"📧 Enviando email de {settings.SMTP_FROM_EMAIL} para {to_email}")
        logger.info(f"🔐 SMTP User: {settings.SMTP_USER}")
        logger.info(f"🔐 SMTP Pass: {'*' * len(settings.SMTP_PASSWORD)}")
        
        # Criar mensagem
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        
        # Conectar e enviar
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            
            logger.info(f"✅ Email enviado com sucesso para {to_email}")
        
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ Erro de autenticação SMTP: {e}")
            logger.error("💡 Dica: use senha de aplicativo do Gmail")
            raise
        
        except Exception as e:
            logger.error(f"❌ Erro ao enviar email: {e}", exc_info=True)
            raise
    

    @staticmethod
    def _build_password_reset_html(reset_link: str, user_name: Optional[str] = None) -> str:
        """HTML do email de reset estilizado"""
        user_greeting = f"Olá, {user_name}" if user_name else "Olá"

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; }}
                .header {{ background-color: #2E7D32; padding: 30px 20px; text-align: center; }}
                .header h1 {{ margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 1px; }}
                .content {{ padding: 40px 30px; color: #333333; line-height: 1.6; }}
                .button {{ display: inline-block; background-color: #007bff; color: #ffffff !important; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; box-shadow: 0 2px 5px rgba(0,123,255,0.3); }}
                .button:hover {{ background-color: #0056b3; }}
                .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }}
                .link-text {{ font-size: 11px; color: #999; word-break: break-all; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚽ FutQuiz</h1>
                </div>
                
                <div class="content">
                    <h2>{user_greeting}! 👋</h2>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                    <p>Se foi você, basta clicar no botão abaixo para criar uma nova senha:</p>
                    
                    <center>
                        <a href="{reset_link}" class="button">Redefinir Minha Senha</a>
                    </center>
                    
                    <div class="link-text">
                        <p>Ou copie e cole este link no seu navegador:</p>
                        <p>{reset_link}</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Não solicitou essa alteração? Você pode ignorar este e-mail com segurança.</p>
                    <p>&copy; 2025 FutQuiz App. Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """

    @staticmethod
    async def send_welcome_email(to_email: str, user_name: str) -> bool:
        """Envia email de boas-vindas"""
        html_body = EmailService._build_welcome_html(user_name)
        return await EmailService._send_smtp(
            to_email=to_email,
            subject="Bem-vindo ao Time! ⚽",
            html_body=html_body
        )

    @staticmethod
    def _build_welcome_html(user_name: str) -> str:
        """HTML do email de boas-vindas estilizado"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; }}
                .header {{ background-color: #2E7D32; padding: 30px 20px; text-align: center; }}
                .header h1 {{ margin: 0; color: #ffffff; font-size: 28px; }}
                .content {{ padding: 40px 30px; color: #333333; line-height: 1.6; text-align: center; }}
                .button {{ display: inline-block; background-color: #28a745; color: #ffffff !important; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }}
                .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚽ FutQuiz</h1>
                </div>
                
                <div class="content">
                    <h2 style="color: #2E7D32;">Bem-vindo ao Time, {user_name}! 🏃‍♂️</h2>
                    <p>Estamos muito felizes em ter você conosco.</p>
                    <p>Prepare-se para testar seus conhecimentos sobre o mundo do futebol e desafiar seus amigos!</p>
                    
                    <br>
                    <a href="#" class="button">Começar a Jogar ⚽</a>
                </div>
                
                <div class="footer">
                    <p>&copy; 2025 FutQuiz App</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    @staticmethod
    async def send_quiz_notification_batch(title: str, difficulty: str) -> bool:
        """
        Envia notificação de novo quiz.
        """
        target_email = settings.SMTP_USER

        if not target_email:
                logger.warning("⚠️ Sem email de destino configurado para teste de notificação.")
                return False

        logger.info(f"🚀 [Batch Simulation] Iniciando envio em massa para o quiz '{title}'...")
            
        html_body = EmailService._build_new_quiz_html(title, difficulty)

        # Envia apenas 1 email representando o envio em massa
        success = await EmailService._send_smtp(
            to_email=target_email,
            subject=f"⚽ Novo Desafio: {title}",
            html_body=html_body
        )
        
        if success:
            logger.info(f"✅ [Batch Simulation] Notificação enviada com sucesso para Admin ({target_email})")
        
        return success

    @staticmethod
    def _build_new_quiz_html(title: str, difficulty: str) -> str:
        """HTML do email de NOVO QUIZ"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; }}
                .header {{ background-color: #1a237e; padding: 30px 20px; text-align: center; }} /* Cor Azul Índigo para diferenciar */
                .header h1 {{ margin: 0; color: #ffffff; font-size: 28px; }}
                .content {{ padding: 40px 30px; color: #333333; line-height: 1.6; text-align: center; }}
                .tag {{ background-color: #ffc107; color: #333; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block; margin: 10px 0; }}
                .button {{ display: inline-block; background-color: #1a237e; color: #ffffff !important; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }}
                .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚽ Novo Desafio Disponível!</h1>
                </div>
                
                <div class="content">
                    <h2>O apito inicial soou! 📢</h2>
                    <p>Um novo quiz acabou de ser adicionado à plataforma.</p>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #1a237e;">{title}</h3>
                        <br>
                        <span class="tag">Dificuldade: {difficulty}</span>
                    </div>

                    <p>Você está preparado para assumir a liderança do ranking?</p>
                    
                    <a href="#" class="button">Jogar Agora ⚽</a>
                </div>
                
                <div class="footer">
                    <p>&copy; 2025 FutQuiz App - Notificações de Gameplay</p>
                </div>
            </div>
        </body>
        </html>
        """