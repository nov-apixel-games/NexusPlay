const fs = require('fs');

let content = fs.readFileSync('src/components/views/LegalViews.tsx', 'utf8');

// Replace ContactView texts
content = content.replace("Contacto NexusPlay", "{t('contact.title')}");
content = content.replace("Estamos aquí para ayudarte. Completa el formulario y te responderemos lo antes posible.", "{t('contact.subtitle')}");

content = content.replace("Mensaje enviado", "{t('contact.success.title')}");
content = content.replace("Nos pondremos en contacto contigo pronto.", "{t('contact.success.desc')}");

content = content.replace("> Nombre<", "> {t('contact.form.name')}<");
content = content.replace("placeholder=\"Tu nombre\"", "placeholder={t('contact.form.namePlaceholder')}");

content = content.replace("> Correo Electrónico<", "> {t('contact.form.email')}<");
content = content.replace("placeholder=\"tu@correo.com\"", "placeholder={t('contact.form.emailPlaceholder')}");

content = content.replace("> Asunto<", "> {t('contact.form.subject')}<");
content = content.replace("placeholder=\"Asunto del mensaje\"", "placeholder={t('contact.form.subjectPlaceholder')}");

// Note: Category labels
content = content.replace("> Categoría<", "> {t('contact.form.category')}<");
content = content.replace(">Soporte Técnico</option>", ">{t('contact.cat.support')}</option>");
content = content.replace(">Problemas de cuenta</option>", ">{t('contact.cat.account')}</option>");
content = content.replace(">Desarrolladores</option>", ">{t('contact.cat.devs')}</option>");
content = content.replace(">Reportar aplicación</option>", ">{t('contact.cat.report')}</option>");
content = content.replace(">Sugerencias</option>", ">{t('contact.cat.ideas')}</option>");
content = content.replace(">Otro</option>", ">{t('contact.cat.other')}</option>");

content = content.replace("> Mensaje<", "> {t('contact.form.message')}<");
content = content.replace("placeholder=\"Describe tu consulta detalladamente...\"", "placeholder={t('contact.form.messagePlaceholder')}");

content = content.replace(">Enviando...", ">{t('contact.form.sending')}");
content = content.replace(">Enviar Mensaje ", ">{t('contact.form.send')} ");

content = content.replace("'Error enviando mensaje: '", "t('contact.form.error') + ");

// Volver
content = content.replace(/Volver/g, "{t('contact.back')}");

// LegalPage last update
content = content.replace("Última actualización: ", "{t('legal.lastUpdate')} ");

fs.writeFileSync('src/components/views/LegalViews.tsx', content);
