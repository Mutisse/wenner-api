const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Wenner <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // G-EMAIL
      return nodemailer.createTransport({
        service: process.env.SERVICE,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Bem-vindo à Família Wenner!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Seu token de redefinição de senha (válido por apenas 10 minutos)'
    );
  }

  // Método estático para enviar notificação de novo pedido ao admin
  static async sendNewOrderNotification(order) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.log('ADMIN_EMAIL não configurado. Email não enviado.');
      return;
    }

    // Renderizar template com dados do pedido
    const formatPrice = (price) => {
      if (!price) return '0.00';
      return Number(price).toFixed(2);
    };

    const formatDate = (date) => {
      if (!date) return new Date().toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' });
      return new Date(date).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Preparar produtos para o template
    const productsList = (order.products || []).map(item => ({
      name: item.product?.name || item.variation?.name || 'Produto',
      quantity: item.quantity || 0,
      unitPrice: formatPrice(item.price),
      total: formatPrice((item.price || 0) * (item.quantity || 0))
    }));

    const subtotal = order.totalPrice || 0;
    const discountAmount = order.discount || 0;
    const finalTotal = subtotal - discountAmount;

    // Construir URL base do servidor para imagens
    const serverUrl = process.env.SERVER_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : `http://localhost:${process.env.PORT || 8000}`);
    
    // Logo pode ser configurado via variável de ambiente ou usar padrão
    // Opções disponíveis: logo-green-round.png, logo-green.png, logo-green-small.png, logo-white.png, wenner.jpg
    const logoFileName = process.env.EMAIL_LOGO || 'logo-green-round.png';
    const logoUrl = `${serverUrl}/img/${logoFileName}`;

    // ID abreviado do pedido (primeiros 5 caracteres)
    const orderIdShort = order._id ? order._id.toString().substring(0, 5) : 'N/A';

    const html = pug.renderFile(`${__dirname}/../views/email/newOrder.pug`, {
      orderId: order._id,
      orderIdShort: orderIdShort,
      orderDate: formatDate(order.createdAt),
      customerName: order.user?.name || 'N/A',
      customerEmail: order.user?.email || 'N/A',
      customerPhone: order.user?.phone || 'N/A',
      products: productsList,
      subtotal: formatPrice(subtotal),
      discount: formatPrice(discountAmount),
      total: formatPrice(finalTotal),
      status: order.status || 'pendente',
      totalItems: order.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      notes: order.notes || '',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
      logoUrl: logoUrl
    });

    // Criar transport
    let transport;
    if (process.env.NODE_ENV === 'production') {
      transport = nodemailer.createTransport({
        service: process.env.SERVICE,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD
        }
      });
    } else {
      transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }

    // Enviar email
    await transport.sendMail({
      from: `Wenner <${process.env.EMAIL_FROM}>`,
      to: adminEmail,
      subject: `Novo Pedido Criado - #${order._id}`,
      html,
      text: htmlToText.fromString(html)
    });
  }
};
