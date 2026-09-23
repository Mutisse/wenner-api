const express = require('express');
const reportController = require('./../controllers/reportController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Proteger todas as rotas de relatório - apenas admin
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// Rotas individuais de relatórios
router.get('/total-revenue', reportController.getTotalRevenue);
router.get('/average-ticket', reportController.getAverageTicket);
router.get('/total-orders', reportController.getTotalOrders);
router.get('/delivery-rate', reportController.getDeliveryRate);
router.get('/sales-by-status', reportController.getSalesByStatus);
router.get('/top-clients', reportController.getTopClients);
router.get('/sales-by-period', reportController.getSalesByPeriod);

// Rota do dashboard completo
router.get('/dashboard', reportController.getDashboard);

module.exports = router;
