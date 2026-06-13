import ssl
import smtplib
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail import EmailMessage


class UnverifiedSSLEmailBackend(BaseEmailBackend):
    def __init__(self, host=None, port=None, username=None, password=None,
                 use_tls=None, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently)
        from django.conf import settings
        self.host     = host     or settings.EMAIL_HOST
        self.port     = port     or settings.EMAIL_PORT
        self.username = username or settings.EMAIL_HOST_USER
        self.password = password or settings.EMAIL_HOST_PASSWORD

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        sent = 0
        for message in email_messages:
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode    = ssl.CERT_NONE

                conn = smtplib.SMTP(self.host, self.port)
                conn.ehlo()
                conn.starttls(context=ctx)
                conn.ehlo()
                conn.login(self.username, self.password)

                from_email = message.from_email
                recipients = message.recipients()
                msg_data   = message.message().as_string()

                conn.sendmail(from_email, recipients, msg_data)
                conn.quit()
                sent += 1
            except Exception as e:
                if not self.fail_silently:
                    raise
        return sent